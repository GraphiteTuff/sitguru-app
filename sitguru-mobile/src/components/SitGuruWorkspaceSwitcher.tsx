import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    router,
    type Href,
} from 'expo-router';
import {
    BriefcaseBusiness,
    Check,
    ChevronRight,
    LogOut,
    PawPrint,
    Settings,
    ShieldCheck,
    Sparkles,
    UserRound,
    X,
} from 'lucide-react-native';
import {
    useMemo,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/fonts';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import type { AppRole } from '@/types/auth';

const LAST_WORKSPACE_KEY =
  'sitguru-last-workspace';

const WORKSPACE_ORDER: AppRole[] = [
  'pet_parent',
  'guru',
  'ambassador',
  'admin',
];

const DASHBOARD_PATHS:
  Record<AppRole, Href> = {
    pet_parent:
      '/pet-parent-dashboard',
    guru:
      '/guru-dashboard',
    ambassador:
      '/ambassador-dashboard',
    admin:
      '/admin-dashboard',
  };

type SitGuruWorkspaceSwitcherProps = {
  currentRole: AppRole;
  visible: boolean;
  onClose: () => void;
  profileHref?: Href;
  profileLabel?: string;
};

export default function SitGuruWorkspaceSwitcher({
  currentRole,
  visible,
  onClose,
  profileHref = '/account',
  profileLabel = 'Manage profile',
}: SitGuruWorkspaceSwitcherProps) {
  const insets =
    useSafeAreaInsets();

  const themeMode =
    useThemeMode();

  const isDark =
    themeMode === 'dark';

  const palette =
    getPalette(isDark);

  const styles =
    createStyles(isDark);

  const {
    user,
    profile,
    roles,
    signOut,
  } = useAuth();

  const [
    signingOut,
    setSigningOut,
  ] = useState(false);

  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  const metadata =
    (user?.user_metadata ??
      {}) as Record<
        string,
        unknown
      >;

  const profileName =
    profile?.full_name ||
    [
      profile?.first_name,
      profile?.last_name,
    ]
      .filter(Boolean)
      .join(' ') ||
    stringValue(
      metadata.full_name,
    ) ||
    stringValue(
      metadata.name,
    ) ||
    stringValue(
      metadata.first_name,
    ) ||
    user?.email?.split('@')[0] ||
    'SitGuru member';

  const providerAvatar =
    stringValue(
      metadata.avatar_url,
    ) ||
    stringValue(
      metadata.picture,
    );

  const avatarUrl =
    resolveSupabaseStorageUrl(
      profile?.avatar_url ||
        providerAvatar ||
        null,
    );

  const availableRoles =
    useMemo(() => {
      const roleSet =
        new Set<AppRole>([
          ...roles,
          currentRole,
        ]);

      return WORKSPACE_ORDER.filter(
        (role) =>
          roleSet.has(role),
      );
    }, [
      currentRole,
      roles,
    ]);

  async function openWorkspace(
    role: AppRole,
  ) {
    onClose();

    try {
      await AsyncStorage.setItem(
        LAST_WORKSPACE_KEY,
        role,
      );
    } catch {
      // Navigation can continue even if
      // local preference storage fails.
    }

    router.replace(
      DASHBOARD_PATHS[role],
    );
  }

  function openDestination(
    href: Href,
  ) {
    onClose();
    router.push(href);
  }

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);

    const result =
      await signOut();

    setSigningOut(false);

    if (!result.error) {
      onClose();
      router.replace('/login');
    }
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="Close workspace menu"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />

        <View
          style={[
            styles.sheetWrapper,
            {
              paddingBottom:
                Math.max(
                  insets.bottom,
                  12,
                ),
            },
          ]}
        >
          <View style={styles.sheet}>
            <View
              style={styles.handle}
            />

            <View
              style={styles.header}
            >
              <View
                style={
                  styles.identityRow
                }
              >
                <Avatar
                  fallback={initials(
                    profileName,
                  )}
                  imageFailed={
                    imageFailed
                  }
                  imageUrl={avatarUrl}
                  onImageError={() =>
                    setImageFailed(
                      true,
                    )
                  }
                  palette={palette}
                  size={46}
                />

                <View
                  style={
                    styles.identityCopy
                  }
                >
                  <Text
                    style={
                      styles.title
                    }
                  >
                    Switch workspace
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={
                      styles.subtitle
                    }
                  >
                    {profileName}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityLabel="Close workspace menu"
                accessibilityRole="button"
                onPress={onClose}
                style={({
                  pressed,
                }) => [
                  styles.closeButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <X
                  color={
                    palette.muted
                  }
                  size={18}
                  strokeWidth={2.3}
                />
              </Pressable>
            </View>

            <View
              style={
                styles.workspaceList
              }
            >
              {availableRoles.map(
                (role) => {
                  const active =
                    role ===
                    currentRole;

                  return (
                    <Pressable
                      key={role}
                      accessibilityLabel={`Open ${workspaceLabel(
                        role,
                      )}`}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected:
                          active,
                      }}
                      onPress={() =>
                        void openWorkspace(
                          role,
                        )
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.workspaceRow,
                        active &&
                          styles.workspaceRowActive,
                        pressed &&
                          styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.workspaceIcon,
                          active &&
                            styles.workspaceIconActive,
                        ]}
                      >
                        <WorkspaceIcon
                          color={
                            active
                              ? palette.primary
                              : palette.text
                          }
                          role={role}
                        />
                      </View>

                      <View
                        style={
                          styles.workspaceCopy
                        }
                      >
                        <Text
                          style={
                            styles.workspaceTitle
                          }
                        >
                          {workspaceLabel(
                            role,
                          )}
                        </Text>

                        <Text
                          style={
                            styles.workspaceText
                          }
                        >
                          {active
                            ? 'Current workspace'
                            : workspaceHelper(
                                role,
                              )}
                        </Text>
                      </View>

                      {active ? (
                        <View
                          style={
                            styles.activeCheck
                          }
                        >
                          <Check
                            color={
                              palette.primary
                            }
                            size={17}
                            strokeWidth={
                              2.7
                            }
                          />
                        </View>
                      ) : (
                        <ChevronRight
                          color={
                            palette.muted
                          }
                          size={18}
                          strokeWidth={2.3}
                        />
                      )}
                    </Pressable>
                  );
                },
              )}
            </View>

            <View
              style={styles.divider}
            />

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                openDestination(
                  profileHref,
                )
              }
              style={({ pressed }) => [
                styles.actionRow,
                pressed &&
                  styles.pressed,
              ]}
            >
              <View
                style={
                  styles.actionIcon
                }
              >
                <UserRound
                  color={
                    palette.primary
                  }
                  size={19}
                  strokeWidth={2.3}
                />
              </View>

              <View
                style={
                  styles.actionCopy
                }
              >
                <Text
                  style={
                    styles.actionTitle
                  }
                >
                  {profileLabel}
                </Text>

                <Text
                  style={
                    styles.actionText
                  }
                >
                  Update your workspace
                  profile and availability.
                </Text>
              </View>

              <ChevronRight
                color={palette.muted}
                size={18}
                strokeWidth={2.3}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                openDestination(
                  '/account',
                )
              }
              style={({ pressed }) => [
                styles.actionRow,
                pressed &&
                  styles.pressed,
              ]}
            >
              <View
                style={
                  styles.actionIcon
                }
              >
                <Settings
                  color={
                    palette.primary
                  }
                  size={19}
                  strokeWidth={2.3}
                />
              </View>

              <View
                style={
                  styles.actionCopy
                }
              >
                <Text
                  style={
                    styles.actionTitle
                  }
                >
                  Manage account
                </Text>

                <Text
                  style={
                    styles.actionText
                  }
                >
                  Security, phone,
                  payments, roles, and
                  account settings.
                </Text>
              </View>

              <ChevronRight
                color={palette.muted}
                size={18}
                strokeWidth={2.3}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onClose();
                router.push(
                  '/role-selection',
                );
              }}
              style={({ pressed }) => [
                styles.actionRow,
                pressed &&
                  styles.pressed,
              ]}
            >
              <View
                style={
                  styles.actionIcon
                }
              >
                <Sparkles
                  color={
                    palette.primary
                  }
                  size={19}
                  strokeWidth={2.3}
                />
              </View>

              <View
                style={
                  styles.actionCopy
                }
              >
                <Text
                  style={
                    styles.actionTitle
                  }
                >
                  Manage roles
                </Text>

                <Text
                  style={
                    styles.actionText
                  }
                >
                  View active workspaces
                  or begin setting up
                  another role.
                </Text>
              </View>

              <ChevronRight
                color={palette.muted}
                size={18}
                strokeWidth={2.3}
              />
            </Pressable>

            <View
              style={styles.divider}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled:
                  signingOut,
                busy: signingOut,
              }}
              disabled={signingOut}
              onPress={() =>
                void handleSignOut()
              }
              style={({ pressed }) => [
                styles.signOutButton,
                signingOut &&
                  styles.disabled,
                pressed &&
                  !signingOut &&
                  styles.pressed,
              ]}
            >
              {signingOut ? (
                <ActivityIndicator
                  color={
                    palette.muted
                  }
                  size="small"
                />
              ) : (
                <LogOut
                  color={
                    palette.muted
                  }
                  size={18}
                  strokeWidth={2.3}
                />
              )}

              <Text
                style={
                  styles.signOutText
                }
              >
                {signingOut
                  ? 'Signing out…'
                  : 'Sign out of SitGuru'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function WorkspaceIcon({
  color,
  role,
}: {
  color: string;
  role: AppRole;
}) {
  if (role === 'pet_parent') {
    return (
      <PawPrint
        color={color}
        size={21}
        strokeWidth={2.4}
      />
    );
  }

  if (role === 'guru') {
    return (
      <BriefcaseBusiness
        color={color}
        size={21}
        strokeWidth={2.4}
      />
    );
  }

  if (role === 'ambassador') {
    return (
      <Sparkles
        color={color}
        size={21}
        strokeWidth={2.4}
      />
    );
  }

  return (
    <ShieldCheck
      color={color}
      size={21}
      strokeWidth={2.4}
    />
  );
}

function Avatar({
  fallback,
  imageFailed,
  imageUrl,
  onImageError,
  palette,
  size,
}: {
  fallback: string;
  imageFailed: boolean;
  imageUrl: string | null;
  onImageError: () => void;
  palette: ReturnType<
    typeof getPalette
  >;
  size: number;
}) {
  const showImage =
    Boolean(imageUrl) &&
    !imageFailed;

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor:
          palette.avatarBackground,
        borderColor:
          palette.avatarBorder,
        borderRadius: size / 2,
        borderWidth: 2,
        height: size,
        justifyContent:
          'center',
        overflow: 'hidden',
        width: size,
      }}
    >
      {showImage ? (
        <Image
          onError={onImageError}
          resizeMode="cover"
          source={{
            uri:
              imageUrl as string,
          }}
          style={{
            height: '100%',
            width: '100%',
          }}
        />
      ) : (
        <Text
          style={{
            color:
              palette.primary,
            fontFamily:
              AppFonts.extraBold,
            fontSize:
              Math.max(
                11,
                size * 0.27,
              ),
          }}
        >
          {fallback}
        </Text>
      )}
    </View>
  );
}

function workspaceLabel(
  role: AppRole,
) {
  if (role === 'pet_parent') {
    return 'Pet Parent';
  }

  if (role === 'guru') {
    return 'Pet Guru';
  }

  if (role === 'ambassador') {
    return 'Ambassador';
  }

  return 'SitGuru Admin';
}

function workspaceHelper(
  role: AppRole,
) {
  if (role === 'pet_parent') {
    return 'Pets, care, bookings, and payments';
  }

  if (role === 'guru') {
    return 'Requests, clients, earnings, and PawReports';
  }

  if (role === 'ambassador') {
    return 'Referrals, rewards, outreach, and training';
  }

  return 'Operations, accounts, payouts, and platform tools';
}

function initials(
  name: string,
) {
  const parts =
    name
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length === 0) {
    return 'SG';
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function stringValue(
  value: unknown,
) {
  return typeof value ===
    'string'
    ? value.trim()
    : '';
}

function getPalette(
  isDark: boolean,
) {
  return {
    surface: isDark
      ? '#15271F'
      : '#FFFFFF',
    surfaceSoft: isDark
      ? '#1C3529'
      : '#F3F8F4',
    border: isDark
      ? '#315442'
      : '#E4D8C7',
    text: isDark
      ? '#FFF6E9'
      : '#123F31',
    muted: isDark
      ? '#A5B5AC'
      : '#718078',
    primary: isDark
      ? '#39D982'
      : '#087449',
    primarySoft: isDark
      ? '#123E2A'
      : '#E4F5E9',
    avatarBackground:
      isDark
        ? '#173527'
        : '#EEF5EE',
    avatarBorder: isDark
      ? '#3E7558'
      : '#FFFFFF',
  };
}

function createStyles(
  isDark: boolean,
) {
  const palette =
    getPalette(isDark);

  return StyleSheet.create({
    modalRoot: {
      flex: 1,
      justifyContent:
        'flex-end',
    },
    backdrop: {
      backgroundColor:
        'rgba(0, 0, 0, 0.52)',
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    sheetWrapper: {
      alignItems: 'center',
      paddingHorizontal:
        Platform.OS === 'web'
          ? 16
          : 0,
      width: '100%',
    },
    sheet: {
      backgroundColor:
        palette.surface,
      borderColor:
        palette.border,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      gap: 8,
      maxWidth: 430,
      paddingBottom: 14,
      paddingHorizontal: 15,
      paddingTop: 9,
      width: '100%',
    },
    handle: {
      alignSelf: 'center',
      backgroundColor: isDark
        ? '#6E8277'
        : '#CBD3CE',
      borderRadius: 999,
      height: 4,
      marginBottom: 4,
      width: 48,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent:
        'space-between',
      paddingVertical: 4,
    },
    identityRow: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: 10,
    },
    identityCopy: {
      flex: 1,
      gap: 1,
    },
    title: {
      color: palette.text,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 18,
    },
    subtitle: {
      color: palette.muted,
      fontFamily:
        AppFonts.medium,
      fontSize: 10,
    },
    closeButton: {
      alignItems: 'center',
      backgroundColor:
        palette.surfaceSoft,
      borderRadius: 999,
      height: 35,
      justifyContent:
        'center',
      width: 35,
    },
    workspaceList: {
      gap: 3,
      marginTop: 3,
    },
    workspaceRow: {
      alignItems: 'center',
      borderColor:
        'transparent',
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      minHeight: 60,
      paddingHorizontal: 8,
      paddingVertical: 7,
    },
    workspaceRowActive: {
      backgroundColor:
        palette.primarySoft,
      borderColor:
        palette.primary,
    },
    workspaceIcon: {
      alignItems: 'center',
      backgroundColor:
        palette.surfaceSoft,
      borderRadius: 999,
      height: 40,
      justifyContent:
        'center',
      width: 40,
    },
    workspaceIconActive: {
      backgroundColor:
        isDark
          ? '#184A32'
          : '#D7F0E0',
    },
    workspaceCopy: {
      flex: 1,
      gap: 2,
    },
    workspaceTitle: {
      color: palette.text,
      fontFamily:
        AppFonts.bold,
      fontSize: 13,
    },
    workspaceText: {
      color: palette.muted,
      fontFamily:
        AppFonts.medium,
      fontSize: 9,
    },
    activeCheck: {
      alignItems: 'center',
      backgroundColor:
        palette.surface,
      borderRadius: 999,
      height: 30,
      justifyContent:
        'center',
      width: 30,
    },
    divider: {
      backgroundColor:
        palette.border,
      height: 1,
      marginVertical: 3,
    },
    actionRow: {
      alignItems: 'center',
      borderRadius: 15,
      flexDirection: 'row',
      gap: 10,
      minHeight: 58,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    actionIcon: {
      alignItems: 'center',
      backgroundColor:
        palette.primarySoft,
      borderRadius: 999,
      height: 38,
      justifyContent:
        'center',
      width: 38,
    },
    actionCopy: {
      flex: 1,
      gap: 2,
    },
    actionTitle: {
      color: palette.text,
      fontFamily:
        AppFonts.bold,
      fontSize: 12,
    },
    actionText: {
      color: palette.muted,
      fontFamily:
        AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    signOutButton: {
      alignItems: 'center',
      alignSelf: 'center',
      flexDirection: 'row',
      gap: 7,
      minHeight: 42,
      paddingHorizontal: 14,
    },
    signOutText: {
      color: palette.muted,
      fontFamily:
        AppFonts.bold,
      fontSize: 10,
    },
    pressed: {
      opacity: 0.72,
      transform: [
        {
          scale: 0.99,
        },
      ],
    },
    disabled: {
      opacity: 0.5,
    },
  });
}