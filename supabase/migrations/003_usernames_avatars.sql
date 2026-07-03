-- Usernames replace display_name; emoji + color avatars; invite by username or email.
-- Run once in the Supabase SQL editor.

alter table profiles rename column display_name to username;
alter table profiles add column if not exists avatar_emoji text;
alter table profiles add column if not exists avatar_color text;

-- Backfill existing rows: sanitize to allowed charset, pad to >=3 / trim to <=20,
-- dedupe with a numeric suffix.
-- ponytail: truncation-after-dedupe could re-collide in theory; DB has 1-2 rows today.
update profiles set username =
  left(rpad(coalesce(nullif(regexp_replace(lower(username), '[^a-z0-9_]', '', 'g'), ''), 'user'), 3, '0'), 20);
with d as (
  select id, row_number() over (partition by username order by created_at) as rn
  from profiles
)
update profiles p set username = left(p.username, 20 - length(d.rn::text)) || d.rn
from d where d.id = p.id and d.rn > 1;

alter table profiles alter column username set not null;
alter table profiles drop constraint if exists profiles_username_format;
alter table profiles add constraint profiles_username_format
  check (username ~ '^[a-z0-9_]{3,20}$');
alter table profiles drop constraint if exists profiles_username_unique;
alter table profiles add constraint profiles_username_unique unique (username);

-- New-user trigger: unique username from sanitized email local-part,
-- numeric suffix on collision. Lowercase-only storage means the plain unique
-- constraint doubles as case-insensitive uniqueness.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base text := left(rpad(coalesce(nullif(regexp_replace(
    lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'), ''), 'user'), 3, '0'), 20);
  candidate text := base;
  n int := 0;
begin
  while exists (select 1 from profiles where username = candidate) loop
    n := n + 1;
    candidate := left(base, 20 - length(n::text)) || n::text;
  end loop;
  insert into public.profiles (id, username) values (new.id, candidate);
  return new;
end;
$$;
-- Trigger on_auth_user_created already executes handle_new_user(); no re-create needed.

-- Invite by username OR email. Replaces add_chat_member_by_email (sole caller updated in-app).
drop function if exists add_chat_member_by_email(uuid, text);

create or replace function add_chat_member(p_chat_id uuid, p_identifier text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_ident text := lower(trim(p_identifier));
  v_user_id uuid;
  v_name text;
begin
  if not is_chat_member(p_chat_id, auth.uid()) then
    raise exception 'You are not a member of this chat.';
  end if;
  -- '@' past the first character means email; otherwise treat as a username
  -- (with an optional leading '@' as in "@george").
  if position('@' in v_ident) > 1 then
    select id into v_user_id from auth.users where lower(email) = v_ident;
  else
    select id into v_user_id from profiles where username = ltrim(v_ident, '@');
  end if;
  if v_user_id is null then
    raise exception 'No account found for %', p_identifier;
  end if;
  insert into chat_members (chat_id, user_id) values (p_chat_id, v_user_id)
  on conflict do nothing;
  select username into v_name from profiles where id = v_user_id;
  return coalesce(v_name, p_identifier);
end;
$$;
