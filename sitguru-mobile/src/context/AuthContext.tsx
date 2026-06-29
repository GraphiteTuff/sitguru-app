import type { Session, SignUpWithPasswordCredentials, User } from '@supabase/supabase-js';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type SignupMetadata = {
  first_name?: string;
  signup_intent?: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    metadata?: SignupMetadata,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<{ error: string | null }>;
  refreshSession: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function friendlyAuthError(message?: string) {
  if (!message) return 'Something went wrong. Please try again.';
  if (message.toLowerCase().includes('invalid login')) return 'Email or password does not match our records.';
  if (message.toLowerCase().includes('email not confirmed')) return 'Please confirm your email before logging in.';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setSession(null);
      setAuthError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.getSession();
    setSession(data.session ?? null);
    setAuthError(error ? friendlyAuthError(error.message) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshSession();

    if (!isSupabaseConfigured) return undefined;

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthError(null);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, [refreshSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      const message = 'Supabase is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.';
      setAuthError(message);
      return { error: message };
    }

    setLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    const message = error ? friendlyAuthError(error.message) : null;
    setAuthError(message);
    setLoading(false);
    return { error: message };
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: SignupMetadata) => {
    if (!isSupabaseConfigured) {
      const message = 'Supabase is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.';
      setAuthError(message);
      return { error: message, needsEmailConfirmation: false };
    }

    setLoading(true);
    setAuthError(null);

    const options: SignUpWithPasswordCredentials['options'] = {
      data: {
        ...(metadata?.first_name ? { first_name: metadata.first_name.trim() } : {}),
        ...(metadata?.signup_intent ? { signup_intent: metadata.signup_intent } : {}),
      },
    };

    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options });
    const message = error ? friendlyAuthError(error.message) : null;
    setSession(data.session ?? null);
    setAuthError(message);
    setLoading(false);

    return { error: message, needsEmailConfirmation: !data.session && Boolean(data.user) };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return { error: null };

    setLoading(true);
    const { error } = await supabase.auth.signOut();
    const message = error ? friendlyAuthError(error.message) : null;
    if (!error) setSession(null);
    setAuthError(message);
    setLoading(false);
    return { error: message };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    isAuthenticated: Boolean(session?.user),
    isConfigured: isSupabaseConfigured,
    authError,
    signIn,
    signUp,
    signOut,
    refreshSession,
  }), [authError, loading, refreshSession, session, signIn, signOut, signUp]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
