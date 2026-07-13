import type {
  Provider,
  Session,
  SignUpWithPasswordCredentials,
  User,
} from '@supabase/supabase-js';
import {
  makeRedirectUri,
} from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  Platform,
} from 'react-native';

import {
  isSupabaseConfigured,
  supabase,
} from '@/lib/supabase';
import {
  normalizeRole,
  roleDashboardPath,
  roleDescription,
  roleIcon,
  roleLabel,
  uniqueRoles,
  type AppRole,
  type ProfileSummary,
  type RoleOption,
  type UserRoleRecord,
} from '@/types/auth';

WebBrowser.maybeCompleteAuthSession();

type SignupMetadata = {
  first_name?: string;
  signup_intent?: string;
};

type SocialProvider =
  | 'google'
  | 'apple';

type SocialAuthResult = {
  error: string | null;
  cancelled: boolean;
};

type SafeProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
};

type FallbackProfileRow = {
  id: string;
  email: string | null;
  role: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  socialLoading:
    SocialProvider | null;
  isAuthenticated: boolean;
  isConfigured: boolean;
  authError: string | null;
  profile:
    ProfileSummary | null;
  roles: AppRole[];
  primaryRole:
    AppRole | null;
  roleOptions: RoleOption[];
  profileLoading: boolean;
  profileError: string | null;

  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    error: string | null;
  }>;

  sendLoginCode: (
    email: string,
  ) => Promise<{
    error: string | null;
  }>;

  verifyLoginCode: (
    email: string,
    token: string,
  ) => Promise<{
    error: string | null;
  }>;

  sendSmsLoginCode: (
    phone: string,
  ) => Promise<{
    error: string | null;
  }>;

  verifySmsLoginCode: (
    phone: string,
    token: string,
  ) => Promise<{
    error: string | null;
  }>;

  signInWithGoogle:
    () => Promise<SocialAuthResult>;

  signInWithApple:
    () => Promise<SocialAuthResult>;

  completeOAuthCallback: (
    url: string,
  ) => Promise<SocialAuthResult>;

  signUp: (
    email: string,
    password: string,
    metadata?: SignupMetadata,
  ) => Promise<{
    error: string | null;
    needsEmailConfirmation:
      boolean;
  }>;

  signOut: () => Promise<{
    error: string | null;
  }>;

  refreshSession:
    () => Promise<void>;

  reloadProfileAndRoles:
    () => Promise<void>;
};

export const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined);

const safeProfileSelect =
  'id, email, first_name, last_name, full_name, role, avatar_url';

const fallbackProfileSelect =
  'id, email, role';

const rolesSelect =
  'id, user_id, role, created_at';

function friendlyAuthError(
  message?: string,
) {
  if (!message) {
    return 'Something went wrong. Please try again.';
  }

  const normalized =
    message.toLowerCase();

  if (
    normalized.includes(
      'invalid login',
    )
  ) {
    return 'Email or password does not match our records.';
  }

  if (
    normalized.includes(
      'email not confirmed',
    )
  ) {
    return 'Please confirm your email before logging in.';
  }

  if (
    normalized.includes(
      'provider is not enabled',
    )
  ) {
    return 'This sign-in option is not enabled yet.';
  }

  if (
    normalized.includes(
      'token has expired',
    ) ||
    normalized.includes(
      'otp expired',
    ) ||
    normalized.includes(
      'expired otp',
    )
  ) {
    return 'That six-digit code has expired. Request a new code and try again.';
  }

  if (
    normalized.includes(
      'invalid token',
    ) ||
    normalized.includes(
      'invalid otp',
    ) ||
    normalized.includes(
      'token is invalid',
    )
  ) {
    return 'That six-digit code is not valid. Check the newest email or text message and try again.';
  }

  if (
    normalized.includes(
      'signups not allowed',
    ) ||
    normalized.includes(
      'user not found',
    )
  ) {
    return 'No existing SitGuru account could use that login code. Check the email address or phone number, or create an account.';
  }

  if (
    normalized.includes(
      'failed to fetch',
    ) ||
    normalized.includes(
      'network',
    )
  ) {
    return 'Network connection issue. Please try again.';
  }

  return message;
}

function friendlyProfileError(
  message?: string,
) {
  if (!message) {
    return 'SitGuru could not load your account profile yet.';
  }

  const normalized =
    message.toLowerCase();

  if (
    normalized.includes(
      'does not exist',
    ) ||
    normalized.includes(
      'schema cache',
    )
  ) {
    return 'SitGuru could not find the expected profile fields yet.';
  }

  if (
    normalized.includes(
      'permission',
    ) ||
    normalized.includes(
      'policy',
    )
  ) {
    return 'Your account is signed in, but profile access needs setup.';
  }

  return friendlyAuthError(
    message,
  );
}

function friendlyRoleError(
  message?: string,
) {
  if (!message) {
    return 'SitGuru could not load your roles yet.';
  }

  const normalized =
    message.toLowerCase();

  if (
    normalized.includes(
      'permission',
    ) ||
    normalized.includes(
      'policy',
    ) ||
    normalized.includes('rls')
  ) {
    return 'Your profile loaded, but SitGuru could not read your roles yet.';
  }

  if (
    normalized.includes(
      'failed to fetch',
    ) ||
    normalized.includes(
      'network',
    )
  ) {
    return 'Your profile loaded, but roles could not refresh because of a network issue.';
  }

  return friendlyAuthError(
    message,
  );
}

function makeRoleOptions(
  roles: AppRole[],
): RoleOption[] {
  return roles.map(
    (role) => ({
      role,
      label: roleLabel(role),
      description:
        roleDescription(role),
      icon: roleIcon(role),
      dashboardPath:
        roleDashboardPath(role),
    }),
  );
}

function getUserMetadata(
  user: User,
) {
  return user.user_metadata as Record<
    string,
    unknown
  >;
}

function fallbackName(
  user: User,
) {
  const metadata =
    getUserMetadata(user);

  const fullName =
    typeof metadata.full_name ===
    'string'
      ? metadata.full_name
      : '';

  const name =
    typeof metadata.name ===
    'string'
      ? metadata.name
      : '';

  const firstName =
    typeof metadata.first_name ===
    'string'
      ? metadata.first_name
      : '';

  return (
    fullName.trim() ||
    name.trim() ||
    firstName.trim() ||
    user.email?.split('@')[0] ||
    null
  );
}

function fallbackAvatar(
  user: User,
) {
  const metadata =
    getUserMetadata(user);

  const avatar =
    typeof metadata.avatar_url ===
    'string'
      ? metadata.avatar_url
      : '';

  const picture =
    typeof metadata.picture ===
    'string'
      ? metadata.picture
      : '';

  return (
    avatar.trim() ||
    picture.trim() ||
    null
  );
}

function signupIntentRole(
  user: User,
) {
  return (
    normalizeRole(
      getUserMetadata(user)
        .signup_intent,
    ) ?? undefined
  );
}

function profileFromSafeRow(
  row: SafeProfileRow,
): ProfileSummary {
  return {
    id: row.id,
    email: row.email,
    first_name:
      row.first_name,
    last_name:
      row.last_name,
    full_name:
      row.full_name,
    role: row.role,
    avatar_url:
      row.avatar_url,
  };
}

function profileFromFallbackRow(
  row: FallbackProfileRow,
  user: User,
): ProfileSummary {
  return {
    id: row.id,
    email:
      row.email ??
      user.email ??
      null,
    first_name: null,
    last_name: null,
    full_name:
      fallbackName(user),
    role: row.role,
    avatar_url:
      fallbackAvatar(user),
  };
}

function profileFromAuthUser(
  user: User,
): ProfileSummary {
  const metadata =
    getUserMetadata(user);

  return {
    id: user.id,
    email:
      user.email ?? null,
    first_name:
      typeof metadata.first_name ===
      'string'
        ? metadata.first_name
        : null,
    last_name:
      typeof metadata.last_name ===
      'string'
        ? metadata.last_name
        : null,
    full_name:
      fallbackName(user),
    role:
      typeof metadata.role ===
      'string'
        ? metadata.role
        : null,
    avatar_url:
      fallbackAvatar(user),
  };
}

function oauthRedirectUrl() {
  return makeRedirectUri({
    scheme: 'sitgurumobile',
    path: 'auth/callback',
  });
}

function getOAuthParameters(
  url: string,
) {
  const parsedUrl =
    new URL(url);

  const parameters =
    new URLSearchParams(
      parsedUrl.search,
    );

  const hash =
    parsedUrl.hash.startsWith('#')
      ? parsedUrl.hash.slice(1)
      : parsedUrl.hash;

  const hashParameters =
    new URLSearchParams(hash);

  hashParameters.forEach(
    (value, key) => {
      if (
        !parameters.has(key)
      ) {
        parameters.set(
          key,
          value,
        );
      }
    },
  );

  return parameters;
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] =
    useState<Session | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [
    socialLoading,
    setSocialLoading,
  ] = useState<
    SocialProvider | null
  >(null);

  const [
    authError,
    setAuthError,
  ] = useState<
    string | null
  >(null);

  const [profile, setProfile] =
    useState<
      ProfileSummary | null
    >(null);

  const [roles, setRoles] =
    useState<AppRole[]>([]);

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(false);

  const [
    profileError,
    setProfileError,
  ] = useState<
    string | null
  >(null);

  const clearProfile =
    useCallback(() => {
      setProfile(null);
      setRoles([]);
      setProfileError(null);
      setProfileLoading(false);
    }, []);

  const loadProfileAndRoles =
    useCallback(
      async (user: User) => {
        if (
          !isSupabaseConfigured
        ) {
          clearProfile();
          return;
        }

        setProfileLoading(true);
        setProfileError(null);

        let nextProfile:
          | ProfileSummary
          | null = null;

        let nextError:
          | string
          | null = null;

        let initialProfileError:
          | string
          | null = null;

        try {
          const {
            data,
            error,
          } = await supabase
            .from('profiles')
            .select(
              safeProfileSelect,
            )
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            initialProfileError =
              error.message;
          } else if (data) {
            nextProfile =
              profileFromSafeRow(
                data as SafeProfileRow,
              );
          }
        } catch (error) {
          initialProfileError =
            error instanceof Error
              ? error.message
              : null;
        }

        if (
          !nextProfile &&
          initialProfileError
        ) {
          try {
            const {
              data,
              error,
            } = await supabase
              .from('profiles')
              .select(
                fallbackProfileSelect,
              )
              .eq('id', user.id)
              .maybeSingle();

            if (error) {
              nextError =
                friendlyProfileError(
                  error.message,
                );
            } else if (data) {
              nextProfile =
                profileFromFallbackRow(
                  data as FallbackProfileRow,
                  user,
                );
            }
          } catch (error) {
            nextError =
              friendlyProfileError(
                error instanceof Error
                  ? error.message
                  : initialProfileError,
              );
          }
        }

        if (!nextProfile) {
          nextProfile =
            profileFromAuthUser(
              user,
            );
        }

        let roleRows:
          UserRoleRecord[] = [];

        try {
          const {
            data,
            error,
          } = await supabase
            .from('user_roles')
            .select(rolesSelect)
            .eq(
              'user_id',
              user.id,
            )
            .order('created_at', {
              ascending: true,
            });

          if (error) {
            nextError =
              nextError ??
              friendlyRoleError(
                error.message,
              );
          } else if (
            Array.isArray(data)
          ) {
            roleRows =
              data as UserRoleRecord[];
          }
        } catch (error) {
          nextError =
            nextError ??
            friendlyRoleError(
              error instanceof Error
                ? error.message
                : undefined,
            );
        }

        const roleValues =
          roleRows
            .map((row) =>
              normalizeRole(
                row.role,
              ),
            )
            .filter(
              (
                role,
              ): role is AppRole =>
                Boolean(role),
            );

        const nextRoles =
          roleRows.length > 0
            ? uniqueRoles(
                roleValues,
              )
            : uniqueRoles([
                nextProfile.role,
                signupIntentRole(
                  user,
                ),
              ]);

        setProfile(nextProfile);
        setRoles(nextRoles);
        setProfileError(nextError);
        setProfileLoading(false);
      },
      [clearProfile],
    );

  const completeOAuthCallback =
    useCallback(
      async (
        url: string,
      ): Promise<SocialAuthResult> => {
        if (
          !isSupabaseConfigured
        ) {
          const message =
            'Supabase is not configured yet.';

          setAuthError(message);

          return {
            error: message,
            cancelled: false,
          };
        }

        try {
          const parameters =
            getOAuthParameters(
              url,
            );

          const providerError =
            parameters.get(
              'error_description',
            ) ||
            parameters.get(
              'error',
            );

          if (providerError) {
            const message =
              friendlyAuthError(
                providerError,
              );

            setAuthError(message);

            return {
              error: message,
              cancelled: false,
            };
          }

          const code =
            parameters.get(
              'code',
            );

          const accessToken =
            parameters.get(
              'access_token',
            );

          const refreshToken =
            parameters.get(
              'refresh_token',
            );

          let nextSession:
            | Session
            | null = null;

          if (code) {
            const {
              data,
              error,
            } =
              await supabase.auth
                .exchangeCodeForSession(
                  code,
                );

            if (error) {
              throw error;
            }

            nextSession =
              data.session;
          } else if (
            accessToken &&
            refreshToken
          ) {
            const {
              data,
              error,
            } =
              await supabase.auth
                .setSession({
                  access_token:
                    accessToken,
                  refresh_token:
                    refreshToken,
                });

            if (error) {
              throw error;
            }

            nextSession =
              data.session;
          } else {
            const { data } =
              await supabase.auth
                .getSession();

            nextSession =
              data.session;
          }

          if (
            !nextSession?.user
          ) {
            throw new Error(
              'SitGuru did not receive a completed social sign-in session.',
            );
          }

          setSession(nextSession);
          setAuthError(null);

          await loadProfileAndRoles(
            nextSession.user,
          );

          return {
            error: null,
            cancelled: false,
          };
        } catch (error) {
          const message =
            friendlyAuthError(
              error instanceof Error
                ? error.message
                : undefined,
            );

          setAuthError(message);

          return {
            error: message,
            cancelled: false,
          };
        }
      },
      [loadProfileAndRoles],
    );

  const performBrowserOAuth =
    useCallback(
      async (
        provider: Provider,
      ): Promise<SocialAuthResult> => {
        const socialProvider:
          SocialProvider =
          provider === 'apple'
            ? 'apple'
            : 'google';

        if (
          !isSupabaseConfigured
        ) {
          const message =
            'Supabase is not configured yet.';

          setAuthError(message);

          return {
            error: message,
            cancelled: false,
          };
        }

        setSocialLoading(
          socialProvider,
        );

        setAuthError(null);

        try {
          const redirectTo =
            oauthRedirectUrl();

          const {
            data,
            error,
          } =
            await supabase.auth
              .signInWithOAuth({
                provider,
                options: {
                  redirectTo,
                  skipBrowserRedirect:
                    Platform.OS !==
                    'web',
                  ...(provider ===
                  'google'
                    ? {
                        scopes:
                          'openid email profile',
                        queryParams: {
                          prompt:
                            'select_account',
                        },
                      }
                    : {}),
                },
              });

          if (error) {
            throw error;
          }

          if (
            Platform.OS === 'web'
          ) {
            return {
              error: null,
              cancelled: false,
            };
          }

          if (!data.url) {
            throw new Error(
              'SitGuru could not open the secure sign-in window.',
            );
          }

          const result =
            await WebBrowser
              .openAuthSessionAsync(
                data.url,
                redirectTo,
              );

          if (
            result.type ===
              'cancel' ||
            result.type ===
              'dismiss'
          ) {
            return {
              error: null,
              cancelled: true,
            };
          }

          if (
            result.type !==
              'success' ||
            !result.url
          ) {
            throw new Error(
              'The social sign-in window did not complete.',
            );
          }

          return await completeOAuthCallback(
            result.url,
          );
        } catch (error) {
          const message =
            friendlyAuthError(
              error instanceof Error
                ? error.message
                : undefined,
            );

          setAuthError(message);

          return {
            error: message,
            cancelled: false,
          };
        } finally {
          setSocialLoading(null);
        }
      },
      [
        completeOAuthCallback,
      ],
    );

  const signInWithGoogle =
    useCallback(
      () =>
        performBrowserOAuth(
          'google',
        ),
      [performBrowserOAuth],
    );

  const signInWithApple =
    useCallback(
      async (): Promise<SocialAuthResult> => {
        if (
          Platform.OS !== 'ios'
        ) {
          return performBrowserOAuth(
            'apple',
          );
        }

        if (
          !isSupabaseConfigured
        ) {
          const message =
            'Supabase is not configured yet.';

          setAuthError(message);

          return {
            error: message,
            cancelled: false,
          };
        }

        setSocialLoading('apple');
        setAuthError(null);

        try {
          const AppleAuthentication =
            await import(
              'expo-apple-authentication'
            );

          const available =
            await AppleAuthentication
              .isAvailableAsync();

          if (!available) {
            return performBrowserOAuth(
              'apple',
            );
          }

          const rawNonce =
            Crypto.randomUUID();

          const hashedNonce =
            await Crypto
              .digestStringAsync(
                Crypto
                  .CryptoDigestAlgorithm
                  .SHA256,
                rawNonce,
              );

          const credential =
            await AppleAuthentication
              .signInAsync({
                requestedScopes: [
                  AppleAuthentication
                    .AppleAuthenticationScope
                    .FULL_NAME,
                  AppleAuthentication
                    .AppleAuthenticationScope
                    .EMAIL,
                ],
                nonce: hashedNonce,
                state:
                  Crypto.randomUUID(),
              });

          if (
            !credential.identityToken
          ) {
            throw new Error(
              'Apple did not return a secure identity token.',
            );
          }

          const {
            data,
            error,
          } =
            await supabase.auth
              .signInWithIdToken({
                provider: 'apple',
                token:
                  credential.identityToken,
                nonce: rawNonce,
              });

          if (error) {
            throw error;
          }

          const fullName = [
            credential.fullName
              ?.givenName,
            credential.fullName
              ?.familyName,
          ]
            .filter(Boolean)
            .join(' ')
            .trim();

          if (fullName) {
            await supabase.auth
              .updateUser({
                data: {
                  full_name:
                    fullName,
                  first_name:
                    credential.fullName
                      ?.givenName ??
                    undefined,
                  last_name:
                    credential.fullName
                      ?.familyName ??
                    undefined,
                },
              });
          }

          if (
            !data.session?.user
          ) {
            throw new Error(
              'SitGuru did not receive a completed Apple sign-in session.',
            );
          }

          setSession(
            data.session,
          );

          setAuthError(null);

          await loadProfileAndRoles(
            data.session.user,
          );

          return {
            error: null,
            cancelled: false,
          };
        } catch (error) {
          const errorCode =
            typeof error ===
              'object' &&
            error &&
            'code' in error
              ? String(
                  (
                    error as {
                      code?: unknown;
                    }
                  ).code,
                )
              : '';

          if (
            errorCode ===
            'ERR_REQUEST_CANCELED'
          ) {
            return {
              error: null,
              cancelled: true,
            };
          }

          const message =
            friendlyAuthError(
              error instanceof Error
                ? error.message
                : undefined,
            );

          setAuthError(message);

          return {
            error: message,
            cancelled: false,
          };
        } finally {
          setSocialLoading(null);
        }
      },
      [
        loadProfileAndRoles,
        performBrowserOAuth,
      ],
    );

  const refreshSession =
    useCallback(async () => {
      if (
        !isSupabaseConfigured
      ) {
        setSession(null);
        setAuthError(null);
        setLoading(false);
        clearProfile();
        return;
      }

      setLoading(true);

      const {
        data,
        error,
      } =
        await supabase.auth
          .getSession();

      const nextSession =
        data.session ?? null;

      setSession(nextSession);

      setAuthError(
        error
          ? friendlyAuthError(
              error.message,
            )
          : null,
      );

      setLoading(false);

      if (
        nextSession?.user
      ) {
        void loadProfileAndRoles(
          nextSession.user,
        );
      } else {
        clearProfile();
      }
    }, [
      clearProfile,
      loadProfileAndRoles,
    ]);

  useEffect(() => {
    let active = true;

    async function loadInitialSession() {
      if (
        !isSupabaseConfigured
      ) {
        if (!active) {
          return;
        }

        setSession(null);
        setAuthError(null);
        setLoading(false);
        clearProfile();
        return;
      }

      const {
        data,
        error,
      } =
        await supabase.auth
          .getSession();

      if (!active) {
        return;
      }

      const nextSession =
        data.session ?? null;

      setSession(nextSession);

      setAuthError(
        error
          ? friendlyAuthError(
              error.message,
            )
          : null,
      );

      setLoading(false);

      if (
        nextSession?.user
      ) {
        void loadProfileAndRoles(
          nextSession.user,
        );
      } else {
        clearProfile();
      }
    }

    void loadInitialSession();

    if (
      !isSupabaseConfigured
    ) {
      return () => {
        active = false;
      };
    }

    const { data } =
      supabase.auth
        .onAuthStateChange(
          (
            _event,
            nextSession,
          ) => {
            setSession(
              nextSession,
            );

            setAuthError(null);
            setLoading(false);

            if (
              nextSession?.user
            ) {
              void loadProfileAndRoles(
                nextSession.user,
              );
            } else {
              clearProfile();
            }
          },
        );

    return () => {
      active = false;

      data.subscription
        .unsubscribe();
    };
  }, [
    clearProfile,
    loadProfileAndRoles,
  ]);

  const signIn =
    useCallback(
      async (
        email: string,
        password: string,
      ) => {
        if (
          !isSupabaseConfigured
        ) {
          const message =
            'Supabase is not configured yet.';

          setAuthError(message);

          return {
            error: message,
          };
        }

        setLoading(true);
        setAuthError(null);

        const { error } =
          await supabase.auth
            .signInWithPassword({
              email:
                email.trim(),
              password,
            });

        const message = error
          ? friendlyAuthError(
              error.message,
            )
          : null;

        setAuthError(message);
        setLoading(false);

        return {
          error: message,
        };
      },
      [],
    );

  const sendLoginCode =
    useCallback(
      async (email: string) => {
        if (
          !isSupabaseConfigured
        ) {
          const message =
            'Supabase is not configured yet.';

          setAuthError(message);

          return {
            error: message,
          };
        }

        setLoading(true);
        setAuthError(null);

        try {
          const { error } =
            await supabase.auth
              .signInWithOtp({
                email:
                  email
                    .trim()
                    .toLowerCase(),
                options: {
                  shouldCreateUser:
                    false,
                },
              });

          if (error) {
            throw error;
          }

          setAuthError(null);
          setLoading(false);

          return {
            error: null,
          };
        } catch (error) {
          const message =
            friendlyAuthError(
              error instanceof Error
                ? error.message
                : undefined,
            );

          setAuthError(message);
          setLoading(false);

          return {
            error: message,
          };
        }
      },
      [],
    );

  const verifyLoginCode =
    useCallback(
      async (
        email: string,
        token: string,
      ) => {
        if (
          !isSupabaseConfigured
        ) {
          const message =
            'Supabase is not configured yet.';

          setAuthError(message);

          return {
            error: message,
          };
        }

        setLoading(true);
        setAuthError(null);

        try {
          const {
            data,
            error,
          } =
            await supabase.auth
              .verifyOtp({
                email:
                  email
                    .trim()
                    .toLowerCase(),
                token:
                  token.trim(),
                type: 'email',
              });

          if (error) {
            throw error;
          }

          if (
            !data.session?.user
          ) {
            throw new Error(
              'SitGuru did not receive a completed email-code session.',
            );
          }

          setSession(
            data.session,
          );

          await loadProfileAndRoles(
            data.session.user,
          );

          setAuthError(null);
          setLoading(false);

          return {
            error: null,
          };
        } catch (error) {
          const message =
            friendlyAuthError(
              error instanceof Error
                ? error.message
                : undefined,
            );

          setAuthError(message);
          setLoading(false);

          return {
            error: message,
          };
        }
      },
      [loadProfileAndRoles],
    );


  const sendSmsLoginCode =
    useCallback(
      async (phone: string) => {
        if (
          !isSupabaseConfigured
        ) {
          const message =
            'Supabase is not configured yet.';

          setAuthError(message);

          return {
            error: message,
          };
        }

        setLoading(true);
        setAuthError(null);

        try {
          const { error } =
            await supabase.auth
              .signInWithOtp({
                phone:
                  phone.trim(),
                options: {
                  shouldCreateUser:
                    false,
                },
              });

          if (error) {
            throw error;
          }

          setAuthError(null);
          setLoading(false);

          return {
            error: null,
          };
        } catch (error) {
          const message =
            friendlyAuthError(
              error instanceof Error
                ? error.message
                : undefined,
            );

          setAuthError(message);
          setLoading(false);

          return {
            error: message,
          };
        }
      },
      [],
    );

  const verifySmsLoginCode =
    useCallback(
      async (
        phone: string,
        token: string,
      ) => {
        if (
          !isSupabaseConfigured
        ) {
          const message =
            'Supabase is not configured yet.';

          setAuthError(message);

          return {
            error: message,
          };
        }

        setLoading(true);
        setAuthError(null);

        try {
          const {
            data,
            error,
          } =
            await supabase.auth
              .verifyOtp({
                phone:
                  phone.trim(),
                token:
                  token.trim(),
                type: 'sms',
              });

          if (error) {
            throw error;
          }

          if (
            !data.session?.user
          ) {
            throw new Error(
              'SitGuru did not receive a completed text-code session.',
            );
          }

          setSession(
            data.session,
          );

          await loadProfileAndRoles(
            data.session.user,
          );

          setAuthError(null);
          setLoading(false);

          return {
            error: null,
          };
        } catch (error) {
          const message =
            friendlyAuthError(
              error instanceof Error
                ? error.message
                : undefined,
            );

          setAuthError(message);
          setLoading(false);

          return {
            error: message,
          };
        }
      },
      [loadProfileAndRoles],
    );

  const signUp =
    useCallback(
      async (
        email: string,
        password: string,
        metadata?: SignupMetadata,
      ) => {
        if (
          !isSupabaseConfigured
        ) {
          const message =
            'Supabase is not configured yet.';

          setAuthError(message);

          return {
            error: message,
            needsEmailConfirmation:
              false,
          };
        }

        setLoading(true);
        setAuthError(null);

        const options:
          SignUpWithPasswordCredentials['options'] =
          {
            data: {
              ...(metadata?.first_name
                ? {
                    first_name:
                      metadata.first_name.trim(),
                  }
                : {}),
              ...(metadata?.signup_intent
                ? {
                    signup_intent:
                      metadata.signup_intent,
                  }
                : {}),
            },
            emailRedirectTo:
              oauthRedirectUrl(),
          };

        const {
          data,
          error,
        } =
          await supabase.auth
            .signUp({
              email:
                email.trim(),
              password,
              options,
            });

        const message = error
          ? friendlyAuthError(
              error.message,
            )
          : null;

        setSession(
          data.session ?? null,
        );

        setAuthError(message);
        setLoading(false);

        if (
          data.session?.user
        ) {
          void loadProfileAndRoles(
            data.session.user,
          );
        }

        return {
          error: message,
          needsEmailConfirmation:
            !data.session &&
            Boolean(data.user),
        };
      },
      [loadProfileAndRoles],
    );

  const signOut =
    useCallback(async () => {
      if (
        !isSupabaseConfigured
      ) {
        return {
          error: null,
        };
      }

      setLoading(true);

      const { error } =
        await supabase.auth
          .signOut();

      const message = error
        ? friendlyAuthError(
            error.message,
          )
        : null;

      if (!error) {
        setSession(null);
        clearProfile();
      }

      setAuthError(message);
      setLoading(false);

      return {
        error: message,
      };
    }, [clearProfile]);

  const reloadProfileAndRoles =
    useCallback(async () => {
      if (session?.user) {
        await loadProfileAndRoles(
          session.user,
        );
      } else {
        clearProfile();
      }
    }, [
      clearProfile,
      loadProfileAndRoles,
      session,
    ]);

  const primaryRole =
    roles[0] ?? null;

  const roleOptions =
    useMemo(
      () =>
        makeRoleOptions(
          roles,
        ),
      [roles],
    );

  const value =
    useMemo<AuthContextValue>(
      () => ({
        session,
        user:
          session?.user ??
          null,
        loading,
        socialLoading,
        isAuthenticated:
          Boolean(
            session?.user,
          ),
        isConfigured:
          isSupabaseConfigured,
        authError,
        profile,
        roles,
        primaryRole,
        roleOptions,
        profileLoading,
        profileError,
        signIn,
        sendLoginCode,
        verifyLoginCode,
        sendSmsLoginCode,
        verifySmsLoginCode,
        signInWithGoogle,
        signInWithApple,
        completeOAuthCallback,
        signUp,
        signOut,
        refreshSession,
        reloadProfileAndRoles,
      }),
      [
        authError,
        completeOAuthCallback,
        loading,
        primaryRole,
        profile,
        profileError,
        profileLoading,
        refreshSession,
        reloadProfileAndRoles,
        roleOptions,
        roles,
        session,
        signIn,
        sendLoginCode,
        sendSmsLoginCode,
        signInWithApple,
        signInWithGoogle,
        verifyLoginCode,
        verifySmsLoginCode,
        signOut,
        signUp,
        socialLoading,
      ],
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}