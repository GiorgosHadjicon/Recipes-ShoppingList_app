import { supabase } from '../lib/supabase';

const NOT_CONFIGURED_MESSAGE = 'Accounts aren’t set up yet for this app.';

export interface Profile {
  id: string;
  username: string;
  avatarEmoji: string | null;
  avatarColor: string | null;
}

interface ProfileRow {
  id: string;
  username: string;
  avatar_emoji: string | null;
  avatar_color: string | null;
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    avatarEmoji: row.avatar_emoji,
    avatarColor: row.avatar_color,
  };
}

export async function getMyProfile(): Promise<Profile | null> {
  if (!supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return rowToProfile(data as ProfileRow);
}

export async function updateMyProfile(changes: {
  username?: string;
  avatarEmoji?: string;
  avatarColor?: string;
}): Promise<void> {
  if (!supabase) throw new Error(NOT_CONFIGURED_MESSAGE);
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('You must be signed in to edit your profile.');

  const { error } = await supabase
    .from('profiles')
    .update({
      ...(changes.username !== undefined && { username: changes.username.trim().toLowerCase() }),
      ...(changes.avatarEmoji !== undefined && { avatar_emoji: changes.avatarEmoji }),
      ...(changes.avatarColor !== undefined && { avatar_color: changes.avatarColor }),
    })
    .eq('id', userId);
  if (error) {
    if (error.code === '23505') throw new Error('That username is taken.');
    if (error.code === '23514')
      throw new Error('Usernames are 3–20 characters: lowercase letters, numbers, underscores.');
    throw new Error(error.message);
  }
}
