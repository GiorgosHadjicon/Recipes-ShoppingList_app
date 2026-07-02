import { supabase } from '../lib/supabase';

const NOT_CONFIGURED_MESSAGE = 'Chats aren’t set up yet for this app.';

export interface Chat {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  body: string | null;
  recipeRef: string | null;
  createdAt: string;
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
  profiles: { display_name: string | null } | null;
}

function rowToChat(row: ChatRow): Chat {
  return { id: row.id, name: row.name, createdBy: row.created_by, createdAt: row.created_at };
}

function rowToMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    senderName: row.profiles?.display_name ?? 'Unknown',
    body: row.body,
    recipeRef: row.recipe_ref,
    createdAt: row.created_at,
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

// Returns the added member's display name. Throws with a readable message when
// the email has no account or the caller isn't a member (raised by the SQL fn).
export async function addMemberByEmail(chatId: string, email: string): Promise<string> {
  if (!supabase) throw new Error(NOT_CONFIGURED_MESSAGE);
  const { data, error } = await supabase.rpc('add_chat_member_by_email', {
    p_chat_id: chatId,
    p_email: email,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

// Newest-first — feeds an inverted FlatList directly.
// ponytail: no pagination; fine until a chat has thousands of messages.
export async function getMessages(chatId: string): Promise<ChatMessage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles(display_name)')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as MessageRow[]).map(rowToMessage);
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

// Fires onInsert for every new message in the chat; caller refetches rather than
// appending payloads (authoritative — no dedup or missing-join concerns).
// Returns an unsubscribe function.
export function subscribeToMessages(chatId: string, onInsert: () => void): () => void {
  if (!supabase) return () => {};
  const client = supabase;
  const channel = client
    .channel(`messages:${chatId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      onInsert,
    )
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}
