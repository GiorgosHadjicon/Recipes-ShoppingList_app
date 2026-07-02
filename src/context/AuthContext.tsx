import type { Session, User } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'apple';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signInWithProvider: (provider: OAuthProvider) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const NOT_CONFIGURED_MESSAGE = 'Accounts aren’t set up yet for this app.';

const Context = createContext<(AuthState & AuthActions) | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      // Forward the JWT to the realtime socket — without this, RLS silently
      // filters out every postgres_changes event (subscriptions look fine but never fire).
      client.realtime.setAuth(data.session?.access_token);
      setLoading(false);
    });
    const { data: subscription } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      client.realtime.setAuth(newSession?.access_token);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return NOT_CONFIGURED_MESSAGE;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return NOT_CONFIGURED_MESSAGE;
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message ?? null;
  }, []);

  // Opens the provider's login page in a system browser tab, then hands the tokens it
  // redirects back with to Supabase — the only OAuth flow that works from Expo Go (no
  // native Google/Apple SDK, so no dev-client rebuild required).
  const signInWithProvider = useCallback(async (provider: OAuthProvider) => {
    if (!supabase) return NOT_CONFIGURED_MESSAGE;
    const redirectTo = AuthSession.makeRedirectUri();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) return error.message;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return 'Sign-in was cancelled.';

    const params = new URLSearchParams(result.url.split('#')[1] ?? result.url.split('?')[1] ?? '');
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) return params.get('error_description') ?? 'Sign-in was cancelled.';

    const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
    return sessionError?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  return (
    <Context.Provider
      value={{ session, user: session?.user ?? null, loading, signIn, signUp, signInWithProvider, signOut }}
    >
      {children}
    </Context.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
