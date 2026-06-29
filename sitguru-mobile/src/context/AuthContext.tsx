import type { Session, SignUpWithPasswordCredentials, User } from '@supabase/supabase-js';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { normalizeRole, roleDashboardPath, roleDescription, roleIcon, roleLabel, uniqueRoles, type AppRole, type ProfileSummary, type RoleOption } from '@/types/auth';

type SignupMetadata = { first_name?: string; signup_intent?: string };
type SafeProfileRow = { id: string; email: string | null; first_name: string | null; last_name: string | null; full_name: string | null; role: string | null; avatar_url: string | null };
type FallbackProfileRow = { id: string; email: string | null; role: string | null };

type AuthContextValue = {
  session: Session | null; user: User | null; loading: boolean; isAuthenticated: boolean; isConfigured: boolean; authError: string | null;
  profile: ProfileSummary | null; roles: AppRole[]; primaryRole: AppRole | null; roleOptions: RoleOption[]; profileLoading: boolean; profileError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, metadata?: SignupMetadata) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<{ error: string | null }>;
  refreshSession: () => Promise<void>; reloadProfileAndRoles: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const safeProfileSelect = 'id, email, first_name, last_name, full_name, role, avatar_url';
const fallbackProfileSelect = 'id, email, role';
const rolesSelect = 'id, user_id, role, created_at';

function friendlyAuthError(message?: string) { if (!message) return 'Something went wrong. Please try again.'; const lower = message.toLowerCase(); if (lower.includes('invalid login')) return 'Email or password does not match our records.'; if (lower.includes('email not confirmed')) return 'Please confirm your email before logging in.'; if (lower.includes('failed to fetch') || lower.includes('network')) return 'Network connection issue. Please try again.'; return message; }
function friendlyProfileError(message?: string) { if (!message) return 'SitGuru could not load your account profile yet.'; const lower = message.toLowerCase(); if (lower.includes('does not exist') || lower.includes('schema cache')) return 'SitGuru could not find the expected profile or role fields yet.'; if (lower.includes('permission') || lower.includes('policy')) return 'Your account is signed in, but profile access needs setup.'; return friendlyAuthError(message); }
function makeRoleOptions(roles: AppRole[]): RoleOption[] { return roles.map((role) => ({ role, label: roleLabel(role), description: roleDescription(role), icon: roleIcon(role), dashboardPath: roleDashboardPath(role) })); }
function fallbackName(user: User) { const meta = user.user_metadata as Record<string, unknown>; const full = typeof meta.full_name === 'string' ? meta.full_name : undefined; const first = typeof meta.first_name === 'string' ? meta.first_name : undefined; return full?.trim() || first?.trim() || user.email?.split('@')[0] || null; }
function signupIntentRole(user: User) { return normalizeRole((user.user_metadata as Record<string, unknown>).signup_intent) ?? undefined; }
function profileFromSafeRow(row: SafeProfileRow): ProfileSummary { return { id: row.id, email: row.email, first_name: row.first_name, last_name: row.last_name, full_name: row.full_name, role: row.role, avatar_url: row.avatar_url }; }
function profileFromFallbackRow(row: FallbackProfileRow, user: User): ProfileSummary { return { id: row.id, email: row.email ?? user.email ?? null, first_name: null, last_name: null, full_name: fallbackName(user), role: row.role, avatar_url: null }; }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null); const [loading, setLoading] = useState(true); const [authError, setAuthError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null); const [roles, setRoles] = useState<AppRole[]>([]); const [profileLoading, setProfileLoading] = useState(false); const [profileError, setProfileError] = useState<string | null>(null);
  const clearProfile = useCallback(() => { setProfile(null); setRoles([]); setProfileError(null); setProfileLoading(false); }, []);

  const loadProfileAndRoles = useCallback(async (user: User) => {
    if (!isSupabaseConfigured) { clearProfile(); return; }
    setProfileLoading(true); setProfileError(null);

    let nextProfile: ProfileSummary | null = null;
    let nextError: string | null = null;
    let firstProfileError: string | null = null;

    try {
      const { data, error } = await supabase.from('profiles').select(safeProfileSelect).eq('id', user.id).maybeSingle();
      if (error) firstProfileError = error.message;
      else if (data) nextProfile = profileFromSafeRow(data as SafeProfileRow);
    } catch (error) {
      firstProfileError = error instanceof Error ? error.message : null;
    }

    if (!nextProfile && firstProfileError) {
      try {
        const { data, error } = await supabase.from('profiles').select(fallbackProfileSelect).eq('id', user.id).maybeSingle();
        if (error) nextError = friendlyProfileError(error.message);
        else if (data) nextProfile = profileFromFallbackRow(data as FallbackProfileRow, user);
      } catch (error) {
        nextError = friendlyProfileError(error instanceof Error ? error.message : firstProfileError);
      }
    }

    if (!nextProfile && !nextError) nextError = 'Profile row was not found for this signed-in SitGuru account.';

    let roleValues: unknown[] = [];
    try {
      const { data, error } = await supabase.from('user_roles').select(rolesSelect).eq('user_id', user.id).order('created_at', { ascending: true });
      if (!error && Array.isArray(data)) roleValues = data.map((row) => (row as { role?: unknown }).role);
    } catch {
      roleValues = [];
    }

    const nextRoles = uniqueRoles([...roleValues, nextProfile?.role, signupIntentRole(user)]);
    setProfile(nextProfile); setRoles(nextRoles); setProfileError(nextError); setProfileLoading(false);
  }, [clearProfile]);

  const refreshSession = useCallback(async () => { if (!isSupabaseConfigured) { setSession(null); setAuthError(null); setLoading(false); clearProfile(); return; } setLoading(true); const { data, error } = await supabase.auth.getSession(); setSession(data.session ?? null); setAuthError(error ? friendlyAuthError(error.message) : null); setLoading(false); if (data.session?.user) void loadProfileAndRoles(data.session.user); else clearProfile(); }, [clearProfile, loadProfileAndRoles]);
  useEffect(() => { void refreshSession(); if (!isSupabaseConfigured) return undefined; const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setAuthError(null); setLoading(false); if (nextSession?.user) void loadProfileAndRoles(nextSession.user); else clearProfile(); }); return () => data.subscription.unsubscribe(); }, [clearProfile, loadProfileAndRoles, refreshSession]);
  const signIn = useCallback(async (email: string, password: string) => { if (!isSupabaseConfigured) { const message = 'Supabase is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'; setAuthError(message); return { error: message }; } setLoading(true); setAuthError(null); const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); const message = error ? friendlyAuthError(error.message) : null; setAuthError(message); setLoading(false); return { error: message }; }, []);
  const signUp = useCallback(async (email: string, password: string, metadata?: SignupMetadata) => { if (!isSupabaseConfigured) { const message = 'Supabase is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'; setAuthError(message); return { error: message, needsEmailConfirmation: false }; } setLoading(true); setAuthError(null); const options: SignUpWithPasswordCredentials['options'] = { data: { ...(metadata?.first_name ? { first_name: metadata.first_name.trim() } : {}), ...(metadata?.signup_intent ? { signup_intent: metadata.signup_intent } : {}) } }; const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options }); const message = error ? friendlyAuthError(error.message) : null; setSession(data.session ?? null); setAuthError(message); setLoading(false); if (data.session?.user) void loadProfileAndRoles(data.session.user); return { error: message, needsEmailConfirmation: !data.session && Boolean(data.user) }; }, [loadProfileAndRoles]);
  const signOut = useCallback(async () => { if (!isSupabaseConfigured) return { error: null }; setLoading(true); const { error } = await supabase.auth.signOut(); const message = error ? friendlyAuthError(error.message) : null; if (!error) { setSession(null); clearProfile(); } setAuthError(message); setLoading(false); return { error: message }; }, [clearProfile]);
  const reloadProfileAndRoles = useCallback(async () => { if (session?.user) await loadProfileAndRoles(session.user); else clearProfile(); }, [clearProfile, loadProfileAndRoles, session]);
  const primaryRole = roles[0] ?? null; const roleOptions = useMemo(() => makeRoleOptions(roles), [roles]);
  const value = useMemo<AuthContextValue>(() => ({ session, user: session?.user ?? null, loading, isAuthenticated: Boolean(session?.user), isConfigured: isSupabaseConfigured, authError, profile, roles, primaryRole, roleOptions, profileLoading, profileError, signIn, signUp, signOut, refreshSession, reloadProfileAndRoles }), [authError, loading, primaryRole, profile, profileError, profileLoading, refreshSession, reloadProfileAndRoles, roleOptions, roles, session, signIn, signOut, signUp]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
