import { supabase } from '../lib/supabase';

const NOT_CONFIGURED_MESSAGE = 'Chats aren’t set up yet for this app.';

export interface Chat {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  mine: boolean;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatarEmoji: string | null;
  senderAvatarColor: string | null;
  body: string | null;
  recipeRef: string | null;
  createdAt: string;
  reactions: MessageReaction[];
}

interface ChatRow {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface MessageRow {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string | null;
  recipe_ref: string | null;
  created_at: string;
  profiles: { username: string | null; avatar_emoji: string | null; avatar_color: string | null } | null;
  message_reactions: Array<{ emoji: string; user_id: string }>;
}

function aggregateReactions(rows: Array<{ emoji: string; user_id: string }>, myId: string | null): MessageReaction[] {
  const byEmoji = new Map<string, MessageReaction>();
  for (const { emoji, user_id } of rows) {
    const entry = byEmoji.get(emoji) ?? { emoji, count: 0, mine: false };
    entry.count++;
    if (user_id === myId) entry.mine = true;
    byEmoji.set(emoji, entry);
  }
  return [...byEmoji.values()].sort((a, b) => b.count - a.count);
}

function rowToChat(row: ChatRow): Chat {
  return { id: row.id, name: row.name, createdBy: row.created_by, createdAt: row.created_at };
}

function rowToMessage(row: MessageRow, myId: string | null): ChatMessage {
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    senderName: row.profiles?.username ?? 'Unknown',
    senderAvatarEmoji: row.profiles?.avatar_emoji ?? null,
    senderAvatarColor: row.profiles?.avatar_color ?? null,
    body: row.body,
    recipeRef: row.recipe_ref,
    createdAt: row.created_at,
    reactions: aggregateReactions(row.message_reactions ?? [], myId),
  };
}

export async function getChats(): Promise<Chat[]> {
  if (!supabase) return [];
  // RLS scopes this to chats the current user belongs to.
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ChatRow[]).map(rowToChat);
}

export async function createChat(name: string): Promise<Chat> {
  if (!supabase) throw new Error(NOT_CONFIGURED_MESSAGE);
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('You must be signed in to create a chat.');

  const { data, error } = await supabase
    .from('chats')
    .insert({ name, created_by: userId })
    .select()
    .single();
  if (error) throw error;
  const chat = rowToChat(data as ChatRow);

  const { error: memberError } = await supabase
    .from('chat_members')
    .insert({ chat_id: chat.id, user_id: userId });
  if (memberError) throw memberError;

  return chat;
}

// Accepts a username (with or without leading @) or an email address.
// Returns the added member's username. Throws with a readable message when
// no account matches or the caller isn't a member (raised by the SQL fn).
export async function addMember(chatId: string, identifier: string): Promise<string> {
  if (!supabase) throw new Error(NOT_CONFIGURED_MESSAGE);
  const { data, error } = await supabase.rpc('add_chat_member', {
    p_chat_id: chatId,
    p_identifier: identifier,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

// Newest-first — feeds an inverted FlatList directly.
// ponytail: no pagination; fine until a chat has thousands of messages.
export async function getMessages(chatId: string): Promise<ChatMessage[]> {
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  const myId = userData.user?.id ?? null;
  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles(username, avatar_emoji, avatar_color), message_reactions(emoji, user_id)')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as MessageRow[]).map((row) => rowToMessage(row, myId));
}

export async function sendMessage(
  chatId: string,
  content: { body?: string; recipeRef?: string },
): Promise<void> {
  if (!supabase) throw new Error(NOT_CONFIGURED_MESSAGE);
  const { data: userData } = await supabase.auth.getUser();
  const senderId = userData.user?.id;
  if (!senderId) throw new Error('You must be signed in to send messages.');

  const { error } = await supabase.from('messages').insert({
    chat_id: chatId,
    sender_id: senderId,
    body: content.body ?? null,
    recipe_ref: content.recipeRef ?? null,
  });
  if (error) throw error;
}

export async function addReaction(chatId: string, messageId: string, emoji: string): Promise<void> {
  if (!supabase) throw new Error(NOT_CONFIGURED_MESSAGE);
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('You must be signed in to react.');
  const { error } = await supabase
    .from('message_reactions')
    .insert({ chat_id: chatId, message_id: messageId, user_id: userId, emoji });
  // 23505 = already reacted with this emoji (double-tap race) — treat as success.
  if (error && error.code !== '23505') throw error;
}

export async function removeReaction(messageId: string, emoji: string): Promise<void> {
  if (!supabase) throw new Error(NOT_CONFIGURED_MESSAGE);
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;
  const { error } = await supabase
    .from('message_reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji);
  if (error) throw error;
}

// Fires onEvent for every new message in the chat and any visible reaction change;
// caller refetches rather than appending payloads (authoritative — no dedup or
// missing-join concerns). Returns an unsubscribe function.
export function subscribeToMessages(chatId: string, onEvent: () => void): () => void {
  if (!supabase) return () => {};
  const client = supabase;
  const channel = client
    .channel(`messages:${chatId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      onEvent,
    )
    // chat_id is denormalized onto reactions (006) — realtime can't evaluate RLS
    // policies that join other tables, so the policy/filter must be single-table.
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'message_reactions', filter: `chat_id=eq.${chatId}` },
      onEvent,
    )
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}
