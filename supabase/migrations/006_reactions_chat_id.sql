-- Realtime can't evaluate RLS policies that join other tables, so reaction events
-- were never delivered. Denormalize chat_id onto message_reactions and use the same
-- policy + subscription-filter shape as messages (which provably works).

alter table message_reactions add column if not exists chat_id uuid references chats(id) on delete cascade;
update message_reactions r set chat_id = m.chat_id from messages m where m.id = r.message_id and r.chat_id is null;
alter table message_reactions alter column chat_id set not null;

drop policy if exists "members read reactions" on message_reactions;
create policy "members read reactions" on message_reactions for select to authenticated
  using (is_chat_member(chat_id, auth.uid()));

drop policy if exists "members add their own reactions" on message_reactions;
create policy "members add their own reactions" on message_reactions for insert to authenticated
  with check (
    user_id = auth.uid()
    and is_chat_member(chat_id, auth.uid())
    -- chat_id must actually be the message's chat, or the member check is spoofable
    and exists (select 1 from messages m where m.id = message_id and m.chat_id = chat_id)
  );

-- "users remove their own reactions" delete policy from 005 is unchanged.
