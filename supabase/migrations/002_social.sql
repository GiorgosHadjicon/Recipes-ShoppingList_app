-- Social features: group chats, messages, recipe shares.
-- Run once in the Supabase SQL editor. Safe to re-run EXCEPT the final
-- "alter publication" line, which errors harmlessly if messages is already added.

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists chat_members (
  chat_id uuid not null references chats(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text,
  -- ponytail: plain text id, no FK — bundled recipes have non-uuid ids ("1".."17").
  -- Deleted community recipes render as "Recipe no longer available" client-side.
  recipe_ref text,
  created_at timestamptz not null default now(),
  check (body is not null or recipe_ref is not null)
);
create index if not exists messages_chat_created_idx on messages(chat_id, created_at);

-- Security definer helper — avoids the classic infinite-recursion pitfall when
-- chat_members RLS policies need to query chat_members.
create or replace function is_chat_member(p_chat_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from chat_members where chat_id = p_chat_id and user_id = p_user_id);
$$;

-- Invite by email without an email column on profiles and without letting anyone
-- enumerate emails: exact-match lookup, caller must already be a chat member.
create or replace function add_chat_member_by_email(p_chat_id uuid, p_email text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid;
  v_name text;
begin
  if not is_chat_member(p_chat_id, auth.uid()) then
    raise exception 'You are not a member of this chat.';
  end if;
  select id into v_user_id from auth.users where lower(email) = lower(trim(p_email));
  if v_user_id is null then
    raise exception 'No account found for %', p_email;
  end if;
  insert into chat_members (chat_id, user_id) values (p_chat_id, v_user_id)
  on conflict do nothing;
  select display_name into v_name from profiles where id = v_user_id;
  return coalesce(v_name, p_email);
end;
$$;

-- Row Level Security
alter table chats enable row level security;
alter table chat_members enable row level security;
alter table messages enable row level security;

drop policy if exists "members read their chats" on chats;
create policy "members read their chats" on chats for select to authenticated
  using (created_by = auth.uid() or is_chat_member(id, auth.uid()));

drop policy if exists "users create their own chats" on chats;
create policy "users create their own chats" on chats for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists "members read memberships" on chat_members;
create policy "members read memberships" on chat_members for select to authenticated
  using (is_chat_member(chat_id, auth.uid()));

-- Only the creator self-joins via this policy; everyone else is added by the
-- security definer RPC above, so no broad insert policy is needed.
drop policy if exists "creator adds self" on chat_members;
create policy "creator adds self" on chat_members for insert to authenticated
  with check (user_id = auth.uid()
    and exists (select 1 from chats where id = chat_id and created_by = auth.uid()));

drop policy if exists "members read messages" on messages;
create policy "members read messages" on messages for select to authenticated
  using (is_chat_member(chat_id, auth.uid()));

drop policy if exists "members send their own messages" on messages;
create policy "members send their own messages" on messages for insert to authenticated
  with check (sender_id = auth.uid() and is_chat_member(chat_id, auth.uid()));

-- Realtime: stream message inserts to subscribed clients.
alter publication supabase_realtime add table messages;
