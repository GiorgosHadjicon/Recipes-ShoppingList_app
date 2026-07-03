-- Emoji reactions on chat messages.
-- Run once in the Supabase SQL editor. The final "alter publication" line
-- errors harmlessly if re-run.

create table if not exists message_reactions (
  message_id uuid not null references messages(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  -- one reaction per user per emoji per message; toggling = insert/delete this row
  primary key (message_id, user_id, emoji)
);

alter table message_reactions enable row level security;

drop policy if exists "members read reactions" on message_reactions;
create policy "members read reactions" on message_reactions for select to authenticated
  using (exists (
    select 1 from messages m
    where m.id = message_id and is_chat_member(m.chat_id, auth.uid())
  ));

drop policy if exists "members add their own reactions" on message_reactions;
create policy "members add their own reactions" on message_reactions for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from messages m
    where m.id = message_id and is_chat_member(m.chat_id, auth.uid())
  ));

drop policy if exists "users remove their own reactions" on message_reactions;
create policy "users remove their own reactions" on message_reactions for delete to authenticated
  using (user_id = auth.uid());

alter publication supabase_realtime add table message_reactions;
