import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, type Href } from 'expo-router';
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  Compass,
  Home,
  LogOut,
  MessageCircle,
  Moon,
  PawPrint,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react-native';
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { AppFonts } from '@/constants/fonts';
import {
  setThemePreference,
  useThemePreference,
} from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import {
  normalizeRole,
  type AppRole,
} from '@/types/auth';

const LAST_WORKSPACE_KEY =
  'sitguru-last-workspace';

const DASHBOARD_PATHS: Record<AppRole, Href> = {
  pet_parent: '/pet-parent-dashboard',
  guru: '/guru-dashboard',
  ambassador: '/ambassador-dashboard',
  admin: '/admin-dashboard',
};

const SETUP_PATHS: Partial<Record<AppRole, Href>> = {
  pet_parent: '/pet-parent-setup',
  guru: '/guru-setup',
  ambassador: '/ambassador-setup',
};

const WORKSPACE_ORDER: AppRole[] = [
  'pet_parent',
  'guru',
  'ambassador',
  'admin',
];

const STANDARD_WORKSPACES: AppRole[] = [
  'pet_parent',
  'guru',
  'ambassador',
];

export default function RoleSelectionScreen() {
  const isWebPreview = Platform.OS === 'web';
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';

  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const {
    isAuthenticated,
    user,
    profile,
    roles,
    primaryRole,
    profileLoading,
    profileError,
    reloadProfileAndRoles,
    signOut,
  } = useAuth();

  const [workspaceMenuOpen, setWorkspaceMenuOpen] =
    useState(false);

  const [signingOut, setSigningOut] =
    useState(false);

  const [imageFailed, setImageFailed] =
    useState(false);

  const [lastWorkspace, setLastWorkspace] =
    useState<AppRole | null>(null);

  const userMetadata =
    (user?.user_metadata ?? {}) as Record<string, unknown>;

  const providerName =
    stringValue(userMetadata.full_name) ||
    stringValue(userMetadata.name) ||
    stringValue(userMetadata.first_name);

  const profileName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(' ') ||
    providerName ||
    user?.email?.split('@')[0] ||
    'SitGuru member';

  const firstName =
    profileName
      .split(/\s+/)
      .filter(Boolean)[0] ||
    'there';

  const providerAvatar =
    stringValue(userMetadata.avatar_url) ||
    stringValue(userMetadata.picture);

  const avatarUrl =
    resolveSupabaseStorageUrl(
      profile?.avatar_url ||
        providerAvatar ||
        null,
    );

  useEffect(() => {
    let active = true;

    async function loadLastWorkspace() {
      try {
        const storedValue =
          await AsyncStorage.getItem(
            LAST_WORKSPACE_KEY,
          );

        if (!active) {
          return;
        }

        setLastWorkspace(
          normalizeRole(storedValue),
        );
      } catch {
        if (active) {
          setLastWorkspace(null);
        }
      }
    }

    void loadLastWorkspace();

    return () => {
      active = false;
    };
  }, []);

  const activeWorkspace = useMemo(() => {
    if (
      lastWorkspace &&
      roles.includes(lastWorkspace)
    ) {
      return lastWorkspace;
    }

    if (
      primaryRole &&
      roles.includes(primaryRole)
    ) {
      return primaryRole;
    }

    return roles[0] ?? null;
  }, [
    lastWorkspace,
    primaryRole,
    roles,
  ]);

  const shownWorkspaces = useMemo(() => {
    const standardRoles =
      STANDARD_WORKSPACES;

    if (roles.includes('admin')) {
      return [
        ...standardRoles,
        'admin' as AppRole,
      ];
    }

    return standardRoles;
  }, [roles]);

  const workspaceMenuRoles = useMemo(
    () =>
      WORKSPACE_ORDER.filter((role) =>
        roles.includes(role),
      ),
    [roles],
  );

  const heroDestination =
    activeWorkspace
      ? DASHBOARD_PATHS[activeWorkspace]
      : ('/find-care' as Href);

  async function rememberWorkspace(
    role: AppRole,
  ) {
    setLastWorkspace(role);

    try {
      await AsyncStorage.setItem(
        LAST_WORKSPACE_KEY,
        role,
      );
    } catch {
      // Continue with the in-memory workspace.
    }
  }

  async function openWorkspace(
    role: AppRole,
  ) {
    setWorkspaceMenuOpen(false);

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (roles.includes(role)) {
      await rememberWorkspace(role);
      router.push(DASHBOARD_PATHS[role]);
      return;
    }

    router.push(
      SETUP_PATHS[role] ??
        DASHBOARD_PATHS[role],
    );
  }

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);

    const result =
      await signOut();

    setSigningOut(false);
    setWorkspaceMenuOpen(false);

    if (!result.error) {
      router.replace('/login');
    }
  }

  function openMessages() {
    const role =
      activeWorkspace === 'guru'
        ? 'guru'
        : activeWorkspace === 'ambassador'
          ? 'ambassador'
          : 'pet_parent';

    router.push({
      pathname: '/messages',
      params: {
        role,
      },
    });
  }

  return (
    <SitGuruScreen
      center={isWebPreview}
      maxWidth={620}
    >
      <View
        style={[
          styles.previewCanvas,
          !isWebPreview &&
            styles.previewCanvasNative,
        ]}
      >
        <View
          style={[
            styles.deviceFrame,
            !isWebPreview &&
              styles.deviceFrameNative,
          ]}
        >
          {isWebPreview ? (
            <View
              style={styles.deviceTopSpeaker}
            />
          ) : null}

          <View
            style={[
              styles.phoneShell,
              !isWebPreview &&
                styles.phoneShellNative,
            ]}
          >
            <View style={styles.screen}>
              {isWebPreview ? (
                <PhoneStatusBar
                  palette={palette}
                  styles={styles}
                />
              ) : null}

              <ScrollView
                contentContainerStyle={
                  styles.page
                }
                showsVerticalScrollIndicator={
                  false
                }
              >
                <View style={styles.header}>
                  <View style={styles.brandRow}>
                    <SitGuruLogo
                      size="small"
                      variant="symbol"
                    />

                    <Text style={styles.brandName}>
                      SitGuru
                    </Text>
                  </View>

                  <View style={styles.headerActions}>
                    <Pressable
                      accessibilityLabel="Open notifications"
                      accessibilityRole="button"
                      onPress={() =>
                        router.push('/notifications')
                      }
                      style={({ pressed }) => [
                        styles.headerIconButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Bell
                        color={palette.text}
                        size={18}
                        strokeWidth={2.3}
                      />
                    </Pressable>

                    <ThemeToggle
                      isDark={isDark}
                      palette={palette}
                      styles={styles}
                      themePreference={
                        themePreference
                      }
                    />

                    <Pressable
                      accessibilityLabel="Open workspace menu"
                      accessibilityRole="button"
                      onPress={() =>
                        setWorkspaceMenuOpen(true)
                      }
                      style={({ pressed }) => [
                        styles.profileButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <ProfileAvatar
                        avatarUrl={avatarUrl}
                        fallback={initials(
                          profileName,
                        )}
                        imageFailed={imageFailed}
                        onImageError={() =>
                          setImageFailed(true)
                        }
                        palette={palette}
                        size={40}
                      />

                      <View
                        style={styles.onlineDot}
                      />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.intro}>
                  <Text style={styles.welcomeTitle}>
                    Welcome back, {firstName}! 👋
                  </Text>

                  <Text style={styles.workspaceTitle}>
                    Choose your workspace
                  </Text>

                  <Text style={styles.workspaceSubtitle}>
                    Pick a role to get started or
                    switch anytime.
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push(heroDestination)
                  }
                  style={({ pressed }) => [
                    styles.heroCard,
                    pressed &&
                      styles.primaryPressed,
                  ]}
                >
                  <View style={styles.heroIcon}>
                    <Sparkles
                      color="#087449"
                      size={25}
                      strokeWidth={2.3}
                    />
                  </View>

                  <View style={styles.heroCopy}>
                    <Text style={styles.heroEyebrow}>
                      Your SitGuru hub
                    </Text>

                    <Text style={styles.heroTitle}>
                      All your pet care, in one place
                    </Text>

                    <Text style={styles.heroText}>
                      Manage care, bookings, messages,
                      and more across every role.
                    </Text>
                  </View>

                  <ChevronRight
                    color="#FFFFFF"
                    size={23}
                    strokeWidth={2.6}
                  />
                </Pressable>

                {profileError ? (
                  <View style={styles.errorCard}>
                    <Text style={styles.errorTitle}>
                      Account refresh needs attention
                    </Text>

                    <Text style={styles.errorText}>
                      {profileError}
                    </Text>
                  </View>
                ) : null}

                {isAuthenticated &&
                !profileLoading &&
                roles.length === 0 ? (
                  <View style={styles.setupNotice}>
                    <View
                      style={styles.setupNoticeIcon}
                    >
                      <Sparkles
                        color={palette.warning}
                        size={20}
                        strokeWidth={2.3}
                      />
                    </View>

                    <View style={styles.noticeCopy}>
                      <Text
                        style={styles.setupNoticeTitle}
                      >
                        Choose your first role
                      </Text>

                      <Text
                        style={styles.setupNoticeText}
                      >
                        Select how you want to use
                        SitGuru. You can add another
                        role later.
                      </Text>
                    </View>
                  </View>
                ) : null}

                <View style={styles.roleList}>
                  {shownWorkspaces.map((role) => (
                    <WorkspaceCard
                      key={role}
                      active={
                        activeWorkspace === role &&
                        roles.includes(role)
                      }
                      enabled={roles.includes(role)}
                      isAuthenticated={
                        isAuthenticated
                      }
                      onPress={() =>
                        void openWorkspace(role)
                      }
                      palette={palette}
                      role={role}
                      styles={styles}
                    />
                  ))}
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    setWorkspaceMenuOpen(true)
                  }
                  style={({ pressed }) => [
                    styles.switchingCard,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={styles.switchingIcon}
                  >
                    <UsersRound
                      color={palette.primary}
                      size={19}
                      strokeWidth={2.3}
                    />
                  </View>

                  <View style={styles.switchingCopy}>
                    <Text
                      style={styles.switchingTitle}
                    >
                      Seamless switching
                    </Text>

                    <Text
                      style={styles.switchingText}
                    >
                      Your data stays safe. Switch
                      roles anytime.
                    </Text>
                  </View>

                  <ChevronRight
                    color={palette.primary}
                    size={19}
                    strokeWidth={2.4}
                  />
                </Pressable>

                {!isAuthenticated ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.replace('/login')
                    }
                    style={({ pressed }) => [
                      styles.loginButton,
                      pressed &&
                        styles.primaryPressed,
                    ]}
                  >
                    <Text
                      style={styles.loginButtonText}
                    >
                      Continue to Login
                    </Text>

                    <ChevronRight
                      color="#FFFFFF"
                      size={20}
                      strokeWidth={2.5}
                    />
                  </Pressable>
                ) : null}
              </ScrollView>

              <View style={styles.bottomNav}>
                <BottomNavItem
                  active
                  icon={
                    <Home
                      color={palette.primary}
                      size={21}
                      strokeWidth={2.4}
                    />
                  }
                  label="Home"
                  onPress={() => undefined}
                  styles={styles}
                />

                <BottomNavItem
                  icon={
                    <Compass
                      color={palette.navMuted}
                      size={21}
                      strokeWidth={2.3}
                    />
                  }
                  label="Explore"
                  onPress={() =>
                    router.push('/find-care')
                  }
                  styles={styles}
                />

                <BottomNavItem
                  icon={
                    <CalendarDays
                      color={palette.navMuted}
                      size={21}
                      strokeWidth={2.3}
                    />
                  }
                  label="Bookings"
                  onPress={() => {
                    if (activeWorkspace) {
                      router.push(
                        bookingsPath(
                          activeWorkspace,
                        ),
                      );
                    }
                  }}
                  styles={styles}
                />

                <BottomNavItem
                  icon={
                    <MessageCircle
                      color={palette.navMuted}
                      size={21}
                      strokeWidth={2.3}
                    />
                  }
                  label="Messages"
                  onPress={openMessages}
                  styles={styles}
                />

                <BottomNavItem
                  icon={
                    <UserRound
                      color={palette.navMuted}
                      size={21}
                      strokeWidth={2.3}
                    />
                  }
                  label="Profile"
                  onPress={() =>
                    setWorkspaceMenuOpen(true)
                  }
                  styles={styles}
                />
              </View>

              {workspaceMenuOpen ? (
                <WorkspaceSheet
                  activeWorkspace={activeWorkspace}
                  avatarUrl={avatarUrl}
                  imageFailed={imageFailed}
                  onClose={() =>
                    setWorkspaceMenuOpen(false)
                  }
                  onImageError={() =>
                    setImageFailed(true)
                  }
                  onOpenWorkspace={(role) =>
                    void openWorkspace(role)
                  }
                  onSignOut={() =>
                    void handleSignOut()
                  }
                  palette={palette}
                  profileName={profileName}
                  roles={workspaceMenuRoles}
                  signingOut={signingOut}
                  styles={styles}
                />
              ) : null}
            </View>
          </View>

          {isWebPreview ? (
            <View style={styles.homeIndicator} />
          ) : null}
        </View>
      </View>
    </SitGuruScreen>
  );
}

function ThemeToggle({
  isDark,
  palette,
  styles,
  themePreference,
}: {
  isDark: boolean;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
  themePreference: 'light' | 'dark';
}) {
  return (
    <View style={styles.themeToggle}>
      <Pressable
        accessibilityLabel="Use light mode"
        accessibilityRole="button"
        accessibilityState={{
          selected: themePreference === 'light',
        }}
        onPress={() =>
          setThemePreference('light')
        }
        style={[
          styles.themeOption,
          themePreference === 'light' &&
            styles.themeOptionActive,
        ]}
      >
        <Sun
          color={
            themePreference === 'light'
              ? '#F3A51F'
              : palette.themeInactive
          }
          size={15}
          strokeWidth={2.3}
        />
      </Pressable>

      <Pressable
        accessibilityLabel="Use dark mode"
        accessibilityRole="button"
        accessibilityState={{
          selected: themePreference === 'dark',
        }}
        onPress={() =>
          setThemePreference('dark')
        }
        style={[
          styles.themeOption,
          themePreference === 'dark' &&
            styles.themeOptionActive,
        ]}
      >
        <Moon
          color={
            themePreference === 'dark'
              ? isDark
                ? '#F1D265'
                : '#765A1A'
              : palette.themeInactive
          }
          size={15}
          strokeWidth={2.3}
        />
      </Pressable>
    </View>
  );
}

function WorkspaceCard({
  active,
  enabled,
  isAuthenticated,
  onPress,
  palette,
  role,
  styles,
}: {
  active: boolean;
  enabled: boolean;
  isAuthenticated: boolean;
  onPress: () => void;
  palette: ReturnType<typeof getPalette>;
  role: AppRole;
  styles: ReturnType<typeof createStyles>;
}) {
  const tone =
    workspaceTone(role, palette);

  const status =
    !isAuthenticated
      ? 'Sign in'
      : active
        ? 'Active'
        : enabled
          ? 'Ready'
          : 'Not started';

  const action =
    !isAuthenticated
      ? 'Sign in'
      : enabled
        ? 'Open dashboard'
        : 'Continue setup';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.roleCard,
        active && styles.roleCardActive,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.roleIconWrap,
          {
            backgroundColor:
              tone.background,
          },
        ]}
      >
        <WorkspaceIcon
          color={tone.icon}
          role={role}
        />
      </View>

      <View style={styles.roleCopy}>
        <Text style={styles.roleTitle}>
          {workspaceLabel(role)}
        </Text>

        <Text style={styles.roleDescription}>
          {workspaceDescription(role)}
        </Text>
      </View>

      <View style={styles.roleActions}>
        <View style={styles.roleActionButton}>
          <Text
            style={styles.roleActionButtonText}
          >
            {action}
          </Text>
        </View>

        <View
          style={[
            styles.statusPill,
            active && styles.statusPillActive,
            !enabled &&
              isAuthenticated &&
              styles.statusPillPending,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              active && styles.statusDotActive,
              !enabled &&
                isAuthenticated &&
                styles.statusDotPending,
            ]}
          />

          <Text
            style={[
              styles.statusText,
              active && styles.statusTextActive,
              !enabled &&
                isAuthenticated &&
                styles.statusTextPending,
            ]}
          >
            {status}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function WorkspaceSheet({
  activeWorkspace,
  avatarUrl,
  imageFailed,
  onClose,
  onImageError,
  onOpenWorkspace,
  onSignOut,
  palette,
  profileName,
  roles,
  signingOut,
  styles,
}: {
  activeWorkspace: AppRole | null;
  avatarUrl: string | null;
  imageFailed: boolean;
  onClose: () => void;
  onImageError: () => void;
  onOpenWorkspace: (role: AppRole) => void;
  onSignOut: () => void;
  palette: ReturnType<typeof getPalette>;
  profileName: string;
  roles: AppRole[];
  signingOut: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <>
      <Pressable
        accessibilityLabel="Close workspace menu"
        accessibilityRole="button"
        onPress={onClose}
        style={styles.sheetBackdrop}
      />

      <View style={styles.workspaceSheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <View style={styles.sheetIdentity}>
            <ProfileAvatar
              avatarUrl={avatarUrl}
              fallback={initials(profileName)}
              imageFailed={imageFailed}
              onImageError={onImageError}
              palette={palette}
              size={42}
            />

            <View style={styles.sheetHeaderCopy}>
              <Text style={styles.sheetTitle}>
                Switch workspace
              </Text>

              <Text style={styles.sheetSubtitle}>
                {profileName}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityLabel="Close workspace menu"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.sheetCloseButton,
              pressed && styles.pressed,
            ]}
          >
            <X
              color={palette.textMuted}
              size={18}
              strokeWidth={2.3}
            />
          </Pressable>
        </View>

        <View style={styles.sheetRoleList}>
          {roles.map((role) => {
            const active =
              activeWorkspace === role;

            return (
              <Pressable
                key={role}
                accessibilityRole="button"
                onPress={() =>
                  onOpenWorkspace(role)
                }
                style={({ pressed }) => [
                  styles.sheetRoleRow,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={styles.sheetRoleIcon}
                >
                  <WorkspaceIcon
                    color={palette.primary}
                    role={role}
                  />
                </View>

                <View style={styles.sheetRoleCopy}>
                  <Text
                    style={styles.sheetRoleTitle}
                  >
                    {workspaceLabel(role)}
                  </Text>

                  <Text
                    style={styles.sheetRoleText}
                  >
                    {active
                      ? 'Active workspace'
                      : 'Switch to this workspace'}
                  </Text>
                </View>

                {active ? (
                  <Check
                    color={palette.primary}
                    size={21}
                    strokeWidth={2.6}
                  />
                ) : (
                  <ChevronRight
                    color={palette.textMuted}
                    size={18}
                    strokeWidth={2.3}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sheetDivider} />

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onClose();
            router.push('/account');
          }}
          style={({ pressed }) => [
            styles.sheetAccountRow,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.sheetRoleIcon}>
            <Settings
              color={palette.text}
              size={20}
              strokeWidth={2.3}
            />
          </View>

          <View style={styles.sheetRoleCopy}>
            <Text style={styles.sheetRoleTitle}>
              Manage account
            </Text>

            <Text style={styles.sheetRoleText}>
              Profile, security, roles, billing,
              and more
            </Text>
          </View>

          <ChevronRight
            color={palette.textMuted}
            size={18}
            strokeWidth={2.3}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={signingOut}
          onPress={onSignOut}
          style={({ pressed }) => [
            styles.sheetSignOutRow,
            signingOut && styles.disabled,
            pressed &&
              !signingOut &&
              styles.pressed,
          ]}
        >
          {signingOut ? (
            <ActivityIndicator
              color={palette.textMuted}
              size="small"
            />
          ) : (
            <LogOut
              color={palette.textMuted}
              size={18}
              strokeWidth={2.3}
            />
          )}

          <Text style={styles.sheetSignOutText}>
            {signingOut
              ? 'Signing out…'
              : 'Sign out of SitGuru'}
          </Text>
        </Pressable>
      </View>
    </>
  );
}

function BottomNavItem({
  active = false,
  icon,
  label,
  onPress,
  styles,
}: {
  active?: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        selected: active,
      }}
      onPress={onPress}
      style={styles.navItem}
    >
      {icon}

      <Text
        style={
          active
            ? styles.navLabelActive
            : styles.navLabel
        }
      >
        {label}
      </Text>
    </Pressable>
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
        size={22}
        strokeWidth={2.4}
      />
    );
  }

  if (role === 'guru') {
    return (
      <BriefcaseBusiness
        color={color}
        size={22}
        strokeWidth={2.4}
      />
    );
  }

  if (role === 'ambassador') {
    return (
      <Sparkles
        color={color}
        size={22}
        strokeWidth={2.4}
      />
    );
  }

  return (
    <ShieldCheck
      color={color}
      size={22}
      strokeWidth={2.4}
    />
  );
}

function ProfileAvatar({
  avatarUrl,
  fallback,
  imageFailed,
  onImageError,
  palette,
  size,
}: {
  avatarUrl: string | null;
  fallback: string;
  imageFailed: boolean;
  onImageError: () => void;
  palette: ReturnType<typeof getPalette>;
  size: number;
}) {
  const showImage =
    Boolean(avatarUrl) &&
    !imageFailed;

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor:
          palette.primarySoft,
        borderColor:
          palette.avatarBorder,
        borderRadius: size / 2,
        borderWidth: 2,
        height: size,
        justifyContent: 'center',
        overflow: 'hidden',
        width: size,
      }}
    >
      {showImage ? (
        <Image
          onError={onImageError}
          resizeMode="cover"
          source={{
            uri: avatarUrl as string,
          }}
          style={{
            height: '100%',
            width: '100%',
          }}
        />
      ) : (
        <Text
          style={{
            color: palette.primary,
            fontFamily:
              AppFonts.extraBold,
            fontSize: Math.max(
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

function PhoneStatusBar({
  palette,
  styles,
}: {
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.statusBar}>
      <Text style={styles.statusTime}>
        9:41
      </Text>

      <View style={styles.statusIcons}>
        <View style={styles.signalBars}>
          <View
            style={[
              styles.signalBar,
              {
                height: 5,
              },
            ]}
          />

          <View
            style={[
              styles.signalBar,
              {
                height: 7,
              },
            ]}
          />

          <View
            style={[
              styles.signalBar,
              {
                height: 9,
              },
            ]}
          />
        </View>

        <Text style={styles.wifiText}>
          ⌁
        </Text>

        <View
          style={[
            styles.batteryBody,
            {
              borderColor: palette.text,
            },
          ]}
        >
          <View
            style={[
              styles.batteryFill,
              {
                backgroundColor:
                  palette.text,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

function workspaceLabel(role: AppRole) {
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

function workspaceDescription(role: AppRole) {
  if (role === 'pet_parent') {
    return 'Book care, manage pets, and stay connected.';
  }

  if (role === 'guru') {
    return 'Offer services, manage clients, and grow your business.';
  }

  if (role === 'ambassador') {
    return 'Promote SitGuru and earn rewards.';
  }

  return 'Manage operations, accounts, payouts, and platform activity.';
}

function workspaceTone(
  role: AppRole,
  palette: ReturnType<typeof getPalette>,
) {
  if (role === 'pet_parent') {
    return {
      background:
        palette.petParentSoft,
      icon: palette.petParent,
    };
  }

  if (role === 'guru') {
    return {
      background:
        palette.primarySoft,
      icon: palette.primary,
    };
  }

  if (role === 'ambassador') {
    return {
      background:
        palette.ambassadorSoft,
      icon: palette.ambassador,
    };
  }

  return {
    background: palette.adminSoft,
    icon: palette.admin,
  };
}

function bookingsPath(
  role: AppRole,
): Href {
  if (role === 'guru') {
    return '/guru-requests';
  }

  return DASHBOARD_PATHS[role];
}

function initials(name: string) {
  const parts = name
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

function stringValue(value: unknown) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function getPalette(isDark: boolean) {
  return {
    background: isDark
      ? '#03130D'
      : '#FFF9F1',
    surface: isDark
      ? '#092219'
      : '#FFFFFF',
    surfaceSoft: isDark
      ? '#0E2E22'
      : '#F5FAF6',
    border: isDark
      ? '#24543D'
      : '#E7DCCB',
    text: isDark
      ? '#FFF8EC'
      : '#123F31',
    textMuted: isDark
      ? '#A6B8AD'
      : '#64766D',
    primary: isDark
      ? '#35DB82'
      : '#087449',
    primarySoft: isDark
      ? '#123E2A'
      : '#E7F7ED',
    petParent: isDark
      ? '#59D89B'
      : '#087449',
    petParentSoft: isDark
      ? '#103827'
      : '#E4F5EA',
    ambassador: isDark
      ? '#F2CA5F'
      : '#C98608',
    ambassadorSoft: isDark
      ? '#3A3017'
      : '#FFF4D9',
    admin: isDark
      ? '#B6C9C0'
      : '#52665C',
    adminSoft: isDark
      ? '#263A31'
      : '#EDF3EF',
    warning: isDark
      ? '#F2CA5F'
      : '#D48B0B',
    warningSoft: isDark
      ? '#382E16'
      : '#FFF8E8',
    danger: isDark
      ? '#FFB5A8'
      : '#B42318',
    dangerSoft: isDark
      ? '#3A211D'
      : '#FFF0ED',
    navMuted: isDark
      ? '#91A69B'
      : '#78867F',
    avatarBorder: isDark
      ? '#4F8068'
      : '#FFFFFF',
    themeInactive: isDark
      ? '#9BAAA2'
      : '#68766F',
  };
}

function createStyles(isDark: boolean) {
  const palette =
    getPalette(isDark);

  return StyleSheet.create({
    previewCanvas: {
      alignItems: 'center',
      minHeight: 930,
      paddingHorizontal: 16,
      paddingVertical: 22,
      width: '100%',
    },
    previewCanvasNative: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    deviceFrame: {
      backgroundColor: '#111713',
      borderColor: '#2E3631',
      borderRadius: 42,
      borderWidth: 2,
      maxWidth: 430,
      overflow: 'hidden',
      paddingBottom: 15,
      paddingHorizontal: 8,
      paddingTop: 10,
      width: '100%',
    },
    deviceFrameNative: {
      backgroundColor: 'transparent',
      borderRadius: 0,
      borderWidth: 0,
      flex: 1,
      maxWidth: '100%',
      paddingBottom: 0,
      paddingHorizontal: 0,
      paddingTop: 0,
    },
    deviceTopSpeaker: {
      alignSelf: 'center',
      backgroundColor: '#303832',
      borderRadius: 999,
      height: 6,
      marginBottom: 9,
      width: 86,
    },
    phoneShell: {
      backgroundColor:
        palette.background,
      borderColor: palette.border,
      borderRadius: 34,
      borderWidth: 1,
      height: 844,
      overflow: 'hidden',
      width: '100%',
    },
    phoneShellNative: {
      borderRadius: 0,
      borderWidth: 0,
      flex: 1,
      height: '100%',
    },
    screen: {
      backgroundColor:
        palette.background,
      flex: 1,
      position: 'relative',
    },
    homeIndicator: {
      alignSelf: 'center',
      backgroundColor: '#F3F1EA',
      borderRadius: 999,
      height: 5,
      marginTop: 9,
      width: 116,
    },
    statusBar: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent:
        'space-between',
      minHeight: 31,
      paddingHorizontal: 16,
      paddingTop: 7,
    },
    statusTime: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 12,
    },
    statusIcons: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    signalBars: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: 2,
    },
    signalBar: {
      backgroundColor:
        palette.text,
      borderRadius: 2,
      width: 3,
    },
    wifiText: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    batteryBody: {
      borderRadius: 3,
      borderWidth: 1,
      height: 9,
      padding: 1,
      width: 17,
    },
    batteryFill: {
      borderRadius: 2,
      flex: 1,
    },
    page: {
      gap: 14,
      paddingBottom: 104,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent:
        'space-between',
    },
    brandRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    brandName: {
      color: palette.primary,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 20,
      letterSpacing: -0.4,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 7,
    },
    headerIconButton: {
      alignItems: 'center',
      backgroundColor:
        palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    themeToggle: {
      alignItems: 'center',
      backgroundColor:
        palette.surface,
      borderColor: '#F27A24',
      borderRadius: 12,
      borderWidth: 1.2,
      flexDirection: 'row',
      gap: 1,
      padding: 2,
    },
    themeOption: {
      alignItems: 'center',
      borderRadius: 9,
      height: 28,
      justifyContent: 'center',
      width: 30,
    },
    themeOptionActive: {
      backgroundColor: isDark
        ? '#3A3117'
        : '#FFF2D5',
    },
    profileButton: {
      borderRadius: 999,
      position: 'relative',
    },
    onlineDot: {
      backgroundColor:
        palette.primary,
      borderColor:
        palette.background,
      borderRadius: 999,
      borderWidth: 2,
      bottom: -1,
      height: 10,
      position: 'absolute',
      right: -1,
      width: 10,
    },
    intro: {
      gap: 4,
      paddingHorizontal: 1,
    },
    welcomeTitle: {
      color: palette.text,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 22,
      letterSpacing: -0.45,
      lineHeight: 27,
    },
    workspaceTitle: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 15,
      marginTop: 4,
    },
    workspaceSubtitle: {
      color: palette.textMuted,
      fontFamily:
        AppFonts.medium,
      fontSize: 12,
      lineHeight: 18,
    },
    heroCard: {
      alignItems: 'center',
      backgroundColor: isDark
        ? '#087A4C'
        : '#079158',
      borderRadius: 22,
      flexDirection: 'row',
      gap: 11,
      minHeight: 120,
      padding: 16,
    },
    heroIcon: {
      alignItems: 'center',
      backgroundColor:
        'rgba(255,255,255,0.88)',
      borderRadius: 15,
      height: 53,
      justifyContent: 'center',
      width: 53,
    },
    heroCopy: {
      flex: 1,
      gap: 3,
    },
    heroEyebrow: {
      color:
        'rgba(255,255,255,0.76)',
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    heroTitle: {
      color: '#FFFFFF',
      fontFamily:
        AppFonts.extraBold,
      fontSize: 16,
      lineHeight: 21,
    },
    heroText: {
      color:
        'rgba(255,255,255,0.85)',
      fontFamily:
        AppFonts.medium,
      fontSize: 10,
      lineHeight: 15,
    },
    errorCard: {
      backgroundColor:
        palette.dangerSoft,
      borderColor: palette.danger,
      borderRadius: 17,
      borderWidth: 1,
      gap: 3,
      padding: 12,
    },
    errorTitle: {
      color: palette.danger,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 12,
    },
    errorText: {
      color: palette.danger,
      fontFamily:
        AppFonts.medium,
      fontSize: 10,
      lineHeight: 15,
    },
    setupNotice: {
      alignItems: 'center',
      backgroundColor:
        palette.warningSoft,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 12,
    },
    setupNoticeIcon: {
      alignItems: 'center',
      backgroundColor:
        palette.ambassadorSoft,
      borderRadius: 12,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    noticeCopy: {
      flex: 1,
      gap: 3,
    },
    setupNoticeTitle: {
      color: palette.text,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 12,
    },
    setupNoticeText: {
      color: palette.textMuted,
      fontFamily:
        AppFonts.medium,
      fontSize: 10,
      lineHeight: 15,
    },
    roleList: {
      gap: 10,
    },
    roleCard: {
      alignItems: 'center',
      backgroundColor:
        palette.surface,
      borderColor: palette.border,
      borderRadius: 21,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 11,
      minHeight: 108,
      padding: 12,
    },
    roleCardActive: {
      borderColor:
        palette.primary,
      borderWidth: 1.5,
    },
    roleIconWrap: {
      alignItems: 'center',
      borderRadius: 999,
      height: 52,
      justifyContent: 'center',
      width: 52,
    },
    roleCopy: {
      flex: 1,
      gap: 4,
    },
    roleTitle: {
      color: palette.text,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 15,
    },
    roleDescription: {
      color: palette.textMuted,
      fontFamily:
        AppFonts.medium,
      fontSize: 9,
      lineHeight: 14,
    },
    roleActions: {
      alignItems: 'flex-end',
      gap: 7,
    },
    roleActionButton: {
      alignItems: 'center',
      borderColor:
        palette.primary,
      borderRadius: 999,
      borderWidth: 1,
      minWidth: 103,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    roleActionButtonText: {
      color: palette.primary,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 8,
    },
    statusPill: {
      alignItems: 'center',
      backgroundColor: isDark
        ? '#26372F'
        : '#EFF3F0',
      borderRadius: 999,
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    statusPillActive: {
      backgroundColor:
        palette.primarySoft,
    },
    statusPillPending: {
      backgroundColor:
        palette.warningSoft,
    },
    statusDot: {
      backgroundColor:
        palette.navMuted,
      borderRadius: 999,
      height: 6,
      width: 6,
    },
    statusDotActive: {
      backgroundColor:
        palette.primary,
    },
    statusDotPending: {
      backgroundColor:
        palette.warning,
    },
    statusText: {
      color: palette.textMuted,
      fontFamily: AppFonts.bold,
      fontSize: 7,
    },
    statusTextActive: {
      color: palette.primary,
    },
    statusTextPending: {
      color: palette.warning,
    },
    switchingCard: {
      alignItems: 'center',
      backgroundColor:
        palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      minHeight: 64,
      padding: 11,
    },
    switchingIcon: {
      alignItems: 'center',
      backgroundColor:
        palette.primarySoft,
      borderRadius: 999,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    switchingCopy: {
      flex: 1,
      gap: 2,
    },
    switchingTitle: {
      color: palette.primary,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 11,
    },
    switchingText: {
      color: palette.textMuted,
      fontFamily:
        AppFonts.medium,
      fontSize: 9,
    },
    loginButton: {
      alignItems: 'center',
      backgroundColor:
        palette.primary,
      borderRadius: 999,
      flexDirection: 'row',
      justifyContent:
        'space-between',
      minHeight: 52,
      paddingHorizontal: 18,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontFamily:
        AppFonts.extraBold,
      fontSize: 13,
    },
    bottomNav: {
      alignItems: 'center',
      backgroundColor:
        palette.surface,
      borderColor: palette.border,
      borderRadius: 22,
      borderWidth: 1,
      bottom: 8,
      flexDirection: 'row',
      height: 72,
      justifyContent:
        'space-around',
      left: 9,
      paddingBottom: 7,
      paddingHorizontal: 4,
      paddingTop: 7,
      position: 'absolute',
      right: 9,
    },
    navItem: {
      alignItems: 'center',
      flex: 1,
      gap: 3,
      justifyContent: 'center',
    },
    navLabelActive: {
      color: palette.primary,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 8,
    },
    navLabel: {
      color: palette.navMuted,
      fontFamily:
        AppFonts.medium,
      fontSize: 8,
    },
    sheetBackdrop: {
      backgroundColor:
        'rgba(0,0,0,0.48)',
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    workspaceSheet: {
      backgroundColor: isDark
        ? '#192720'
        : '#FFFFFF',
      borderColor: palette.border,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      bottom: 0,
      gap: 10,
      left: 0,
      paddingBottom: 22,
      paddingHorizontal: 16,
      paddingTop: 10,
      position: 'absolute',
      right: 0,
    },
    sheetHandle: {
      alignSelf: 'center',
      backgroundColor: isDark
        ? '#75877E'
        : '#C7D0CB',
      borderRadius: 999,
      height: 4,
      marginBottom: 5,
      width: 48,
    },
    sheetHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent:
        'space-between',
    },
    sheetIdentity: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    sheetHeaderCopy: {
      gap: 2,
    },
    sheetTitle: {
      color: palette.text,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 18,
    },
    sheetSubtitle: {
      color: palette.textMuted,
      fontFamily:
        AppFonts.medium,
      fontSize: 10,
    },
    sheetCloseButton: {
      alignItems: 'center',
      backgroundColor:
        palette.surfaceSoft,
      borderRadius: 999,
      height: 35,
      justifyContent: 'center',
      width: 35,
    },
    sheetRoleList: {
      gap: 2,
    },
    sheetRoleRow: {
      alignItems: 'center',
      borderRadius: 15,
      flexDirection: 'row',
      gap: 10,
      minHeight: 58,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    sheetRoleIcon: {
      alignItems: 'center',
      backgroundColor:
        palette.primarySoft,
      borderRadius: 999,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    sheetRoleCopy: {
      flex: 1,
      gap: 2,
    },
    sheetRoleTitle: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 13,
    },
    sheetRoleText: {
      color: palette.textMuted,
      fontFamily:
        AppFonts.medium,
      fontSize: 9,
    },
    sheetDivider: {
      backgroundColor:
        palette.border,
      height: 1,
    },
    sheetAccountRow: {
      alignItems: 'center',
      borderRadius: 15,
      flexDirection: 'row',
      gap: 10,
      minHeight: 58,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    sheetSignOutRow: {
      alignItems: 'center',
      alignSelf: 'center',
      flexDirection: 'row',
      gap: 7,
      minHeight: 40,
      paddingHorizontal: 14,
    },
    sheetSignOutText: {
      color: palette.textMuted,
      fontFamily: AppFonts.bold,
      fontSize: 10,
    },
    pressed: {
      opacity: 0.76,
      transform: [
        {
          scale: 0.99,
        },
      ],
    },
    primaryPressed: {
      opacity: 0.87,
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