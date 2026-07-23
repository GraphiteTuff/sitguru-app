import { router, type Href } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  BellRing,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  HelpCircle,
  LockKeyhole,
  LogOut,
  MapPin,
  MessageCircle,
  PawPrint,
  RefreshCw,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  UsersRound,
  WalletCards,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruWorkspaceSwitcher from '@/components/SitGuruWorkspaceSwitcher';
import { AppFonts } from '@/constants/fonts';
import {
  setThemePreference,
  useThemePreference,
  type SitGuruThemePreference,
} from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import { roleLabel, type AppRole } from '@/types/auth';

type RecordRow = Record<string, unknown>;

type ThemeOption = {
  icon: 'sun' | 'moon';
  label: string;
  value: SitGuruThemePreference;
};

type Action = {
  href?: Href;
  label: string;
  note?: string;
};

type AccountSectionKey =
  | 'profile'
  | 'roles'
  | 'notifications'
  | 'security'
  | 'payments'
  | 'support'
  | 'app';

type NotificationPreference = {
  enabled: boolean;
  key: string;
  label: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    icon: 'sun',
    label: 'Light',
    value: 'light',
  },
  {
    icon: 'moon',
    label: 'Dark',
    value: 'dark',
  },
];

const INITIAL_NOTIFICATION_PREFERENCES: NotificationPreference[] = [
  {
    enabled: true,
    key: 'bookings',
    label: 'Booking alerts',
  },
  {
    enabled: true,
    key: 'messages',
    label: 'Message alerts',
  },
  {
    enabled: true,
    key: 'pawreport',
    label: 'PawReport Live alerts',
  },
  {
    enabled: false,
    key: 'payments',
    label: 'Payment and payout alerts',
  },
  {
    enabled: true,
    key: 'rewards',
    label: 'PawPoints and referral alerts',
  },
];

export default function AccountScreen() {
  const { width } = useWindowDimensions();
  const {
    user,
    isAuthenticated,
    loading,
    signOut,
    profile,
    roles: authRoles,
    primaryRole,
    roleOptions,
    profileLoading,
    profileError,
    reloadProfileAndRoles,
  } = useAuth();

  const isWebPreview = Platform.OS === 'web';
  const isTablet = Platform.OS !== 'web' && width >= 768;
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark, isTablet);

  const [activeSection, setActiveSection] =
    useState<AccountSectionKey>('profile');
  const [refreshing, setRefreshing] = useState(false);
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState(
    INITIAL_NOTIFICATION_PREFERENCES,
  );

  const profileRecord = useMemo(
    () => (profile ?? {}) as RecordRow,
    [profile],
  );

  const profileName =
    firstString(profileRecord, ['full_name', 'display_name']) ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'SitGuru Member';

  const firstName =
    profileName.split(/\s+/).filter(Boolean)[0] || 'Member';

  const location = [profile?.city, profile?.state]
    .filter(Boolean)
    .join(', ');

  const rawAvatar =
    firstString(profileRecord, [
      'avatar_url',
      'photo_url',
      'profile_photo_url',
      'profile_image_url',
    ]) || null;

  const avatarUrl = rawAvatar
    ? resolveSupabaseStorageUrl(rawAvatar)
    : null;

  const rolePills: AppRole[] = authRoles.length
    ? authRoles
    : ['pet_parent', 'guru', 'ambassador'];

  const currentRole: AppRole = primaryRole ?? 'pet_parent';

  const currentDashboardRoute = useMemo<Href>(() => {
    const currentOption = roleOptions.find(
      (option) => option.role === currentRole,
    );

    if (currentOption?.dashboardPath) {
      return currentOption.dashboardPath;
    }

    if (currentRole === 'guru') return '/guru-dashboard';
    if (currentRole === 'ambassador') return '/ambassador-dashboard';
    if (currentRole === 'admin') return '/admin-operations';

    return '/pet-parent-dashboard';
  }, [currentRole, roleOptions]);

  const statusLabel = profileError
    ? 'Needs attention'
    : profile
      ? 'Account ready'
      : 'Finish setup';

  const quickActions = useMemo(
    () => [
      {
        icon: <PawPrint color={palette.primary} size={21} strokeWidth={2.4} />,
        label: 'My pets',
        onPress: () => router.push('/pet-passports'),
      },
      {
        icon: <MapPin color={palette.primary} size={21} strokeWidth={2.4} />,
        label: 'Find care',
        onPress: () => router.push('/find-care'),
      },
      {
        icon: (
          <MessageCircle
            color={palette.primary}
            size={21}
            strokeWidth={2.4}
          />
        ),
        label: 'Messages',
        onPress: () => router.push('/conversation'),
      },
      {
        icon: (
          <WalletCards
            color={palette.primary}
            size={21}
            strokeWidth={2.4}
          />
        ),
        label: 'Payments',
        onPress: () => router.push('/payments'),
      },
      {
        icon: <BellRing color={palette.primary} size={21} strokeWidth={2.4} />,
        label: 'Alerts',
        onPress: () => router.push('/notifications'),
      },
      {
        icon: (
          <HelpCircle
            color={palette.primary}
            size={21}
            strokeWidth={2.4}
          />
        ),
        label: 'Get help',
        onPress: () => router.push('/support'),
      },
    ],
    [palette.primary],
  );

  async function handleRefresh() {
    if (!isAuthenticated) {
      return;
    }

    setRefreshing(true);

    try {
      await reloadProfileAndRoles();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSignOut() {
    const result = await signOut();

    if (result.error) {
      Alert.alert('Sign out failed', result.error);
      return;
    }

    router.replace('/login');
  }

  function toggleSection(section: AccountSectionKey) {
    setActiveSection((current) =>
      current === section ? 'profile' : section,
    );
  }

  function toggleNotification(key: string) {
    setNotificationPreferences((current) =>
      current.map((preference) =>
        preference.key === key
          ? {
              ...preference,
              enabled: !preference.enabled,
            }
          : preference,
      ),
    );

    Alert.alert(
      'Preview only',
      'This change is shown in the current app preview but has not been saved to your SitGuru account yet.',
    );
  }

  function showPreviewWarning(label: string) {
    Alert.alert(
      `${label} preview`,
      'This account setting is not connected yet. No account change was saved.',
    );
  }

  return (
    <SitGuruScreen
      center={isWebPreview || isTablet}
      maxWidth={isTablet ? 920 : 620}
      scroll={false}>
      <View
        style={[
          styles.previewCanvas,
          !isWebPreview && styles.previewCanvasNative,
        ]}>
        <View
          style={[
            styles.deviceFrame,
            !isWebPreview && styles.deviceFrameNative,
          ]}>
          {isWebPreview ? <View style={styles.deviceTopSpeaker} /> : null}

          <View
            style={[
              styles.phoneShell,
              !isWebPreview && styles.phoneShellNative,
            ]}>
            <View style={styles.screen}>
              {isWebPreview ? <PhoneStatusBar styles={styles} /> : null}

              <ScrollView
                contentContainerStyle={[
                  styles.scrollContent,
                  isTablet && styles.scrollContentTablet,
                ]}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                  <RefreshControl
                    colors={[palette.primary]}
                    onRefresh={() => void handleRefresh()}
                    refreshing={refreshing}
                    tintColor={palette.primary}
                  />
                }
                showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                  <Pressable
                    accessibilityLabel="Go back"
                    accessibilityRole="button"
                    onPress={() => router.back()}
                    style={({ pressed }) => [
                      styles.headerBackButton,
                      pressed && styles.pressed,
                    ]}>
                    <ArrowLeft
                      color={palette.primary}
                      size={20}
                      strokeWidth={2.5}
                    />
                  </Pressable>

                  <View style={styles.headerCopy}>
                    <Text style={styles.headerTitle}>Account</Text>
                    <Text style={styles.headerSubtitle}>
                      Your profile, roles, and settings
                    </Text>
                  </View>

                  <View style={styles.headerActions}>
                    <Pressable
                      accessibilityLabel="Open notifications"
                      accessibilityRole="button"
                      onPress={() => router.push('/notifications')}
                      style={({ pressed }) => [
                        styles.headerIconButton,
                        pressed && styles.pressed,
                      ]}>
                      <Bell
                        color={palette.title}
                        size={18}
                        strokeWidth={2.3}
                      />
                    </Pressable>

                    <View style={styles.modeToggle}>
                      {THEME_OPTIONS.map((option) => {
                        const active =
                          themePreference === option.value;

                        return (
                          <Pressable
                            key={option.value}
                            accessibilityLabel={`Switch to ${option.label} mode`}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            onPress={() =>
                              setThemePreference(option.value)
                            }
                            style={[
                              styles.modeButton,
                              active && styles.modeButtonActive,
                            ]}>
                            <SitGuruIcon
                              color={
                                active
                                  ? option.value === 'light'
                                    ? '#F3AA1F'
                                    : isDark
                                      ? '#F0CF62'
                                      : palette.primary
                                  : palette.muted
                              }
                              name={option.icon}
                              size={15}
                              strokeWidth={2.4}
                            />
                          </Pressable>
                        );
                      })}
                    </View>

                    <Pressable
                      accessibilityLabel={
                        isAuthenticated
                          ? 'Switch workspace'
                          : 'Log in'
                      }
                      accessibilityRole="button"
                      onPress={() => {
                        if (isAuthenticated) {
                          setWorkspaceSwitcherOpen(true);
                          return;
                        }

                        router.push('/login');
                      }}
                      style={({ pressed }) => [
                        styles.profileButton,
                        pressed && styles.pressed,
                      ]}>
                      <Avatar
                        fallback={initials(profileName)}
                        imageUrl={avatarUrl}
                        palette={palette}
                        size={40}
                      />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.profileHero}>
                  <View style={styles.profileTopRow}>
                    <Avatar
                      fallback={initials(profileName)}
                      imageUrl={avatarUrl}
                      palette={palette}
                      size={66}
                    />

                    <View style={styles.profileHeroCopy}>
                      <Text style={styles.profileGreeting}>
                        Hi, {firstName}.
                      </Text>
                      <Text style={styles.profileEmail}>
                        {isAuthenticated
                          ? user?.email || 'Signed in'
                          : 'Guest preview'}
                      </Text>

                      <View style={styles.statusRow}>
                        <View style={styles.statusPill}>
                          <View style={styles.statusDot} />
                          <Text style={styles.statusPillText}>
                            {statusLabel}
                          </Text>
                        </View>

                        <View style={styles.rolePillPrimary}>
                          <Text style={styles.rolePillPrimaryText}>
                            {roleLabel(currentRole)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {location ? (
                    <View style={styles.locationRow}>
                      <MapPin
                        color={palette.primary}
                        size={14}
                        strokeWidth={2.3}
                      />
                      <Text style={styles.locationText}>{location}</Text>
                    </View>
                  ) : null}

                  {profileError ? (
                    <View style={styles.warningCard}>
                      <Text style={styles.warningTitle}>
                        Some account details need attention
                      </Text>
                      <Text style={styles.warningText}>
                        {profileError}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.profileHeroActions}>
                    {isAuthenticated ? (
                      <>
                        <ActionButton
                          icon={
                            profileLoading ? (
                              <RefreshCw
                                color="#FFFFFF"
                                size={17}
                                strokeWidth={2.4}
                              />
                            ) : (
                              <UserRound
                                color="#FFFFFF"
                                size={17}
                                strokeWidth={2.4}
                              />
                            )
                          }
                          label={
                            profileLoading
                              ? 'Refreshing...'
                              : 'Refresh profile'
                          }
                          onPress={() =>
                            void reloadProfileAndRoles()
                          }
                          primary
                          styles={styles}
                        />

                        <ActionButton
                          icon={
                            <UsersRound
                              color={palette.primary}
                              size={17}
                              strokeWidth={2.4}
                            />
                          }
                          label="Switch workspace"
                          onPress={() =>
                            setWorkspaceSwitcherOpen(true)
                          }
                          styles={styles}
                        />
                      </>
                    ) : (
                      <>
                        <ActionButton
                          icon={
                            <UserRound
                              color="#FFFFFF"
                              size={17}
                              strokeWidth={2.4}
                            />
                          }
                          label="Log in"
                          onPress={() => router.push('/login')}
                          primary
                          styles={styles}
                        />

                        <ActionButton
                          icon={
                            <UsersRound
                              color={palette.primary}
                              size={17}
                              strokeWidth={2.4}
                            />
                          }
                          label="Create account"
                          onPress={() => router.push('/signup')}
                          styles={styles}
                        />
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.quickSection}>
                  <Text style={styles.sectionEyebrow}>QUICK ACCESS</Text>
                  <Text style={styles.sectionTitle}>
                    Everything you use most
                  </Text>

                  <View style={styles.quickGrid}>
                    {quickActions.map((action) => (
                      <QuickAction
                        key={action.label}
                        icon={action.icon}
                        label={action.label}
                        onPress={action.onPress}
                        styles={styles}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.settingsSection}>
                  <Text style={styles.sectionEyebrow}>SETTINGS</Text>
                  <Text style={styles.sectionTitle}>
                    Keep it simple
                  </Text>

                  <SectionCard
                    expanded={activeSection === 'profile'}
                    icon={
                      <UserRound
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.35}
                      />
                    }
                    onPress={() => toggleSection('profile')}
                    styles={styles}
                    subtitle="Your name, email, location, and status"
                    title="Profile">
                    {isAuthenticated ? (
                      <>
                        <InfoRow
                          label="Email"
                          styles={styles}
                          value={user?.email || 'Not available'}
                        />
                        <InfoRow
                          label="Name"
                          styles={styles}
                          value={profileName}
                        />
                        <InfoRow
                          label="Location"
                          styles={styles}
                          value={location || 'Add your city and state'}
                        />
                        <InfoRow
                          label="Account status"
                          styles={styles}
                          value={statusLabel}
                        />
                      </>
                    ) : (
                      <InlineNotice
                        styles={styles}
                        text="Log in to load your SitGuru profile, roles, and account settings."
                      />
                    )}
                  </SectionCard>

                  <SectionCard
                    expanded={activeSection === 'roles'}
                    icon={
                      <UsersRound
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.35}
                      />
                    }
                    onPress={() => toggleSection('roles')}
                    styles={styles}
                    subtitle="Move between your assigned SitGuru spaces"
                    title="Workspaces and roles">
                    <View style={styles.roleChipRow}>
                      {rolePills.map((role) => (
                        <View key={role} style={styles.roleChip}>
                          <Text style={styles.roleChipText}>
                            {roleLabel(role)}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {roleOptions.length ? (
                      roleOptions.map((option) => (
                        <ActionRow
                          key={option.role}
                          icon={
                            <UsersRound
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                          }
                          label={`${option.label} dashboard`}
                          onPress={() =>
                            router.push(
                              option.dashboardPath as Href,
                            )
                          }
                          styles={styles}
                        />
                      ))
                    ) : (
                      <>
                        <ActionRow
                          icon={
                            <PawPrint
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                          }
                          label="Pet Parent dashboard"
                          onPress={() =>
                            router.push('/pet-parent-dashboard')
                          }
                          styles={styles}
                        />
                        <ActionRow
                          icon={
                            <ShieldCheck
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                          }
                          label="Guru dashboard"
                          onPress={() =>
                            router.push('/guru-dashboard')
                          }
                          styles={styles}
                        />
                        <ActionRow
                          icon={
                            <UsersRound
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                          }
                          label="Ambassador dashboard"
                          onPress={() =>
                            router.push('/ambassador-dashboard')
                          }
                          styles={styles}
                        />
                      </>
                    )}

                    <ActionRow
                      icon={
                        <SlidersHorizontal
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.3}
                        />
                      }
                      label="Manage roles"
                      onPress={() => router.push('/role-selection')}
                      styles={styles}
                    />
                  </SectionCard>

                  <SectionCard
                    expanded={activeSection === 'notifications'}
                    icon={
                      <BellRing
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.35}
                      />
                    }
                    onPress={() => toggleSection('notifications')}
                    styles={styles}
                    subtitle="Choose the updates you want to see"
                    title="Notifications">
                    {notificationPreferences.map((preference) => (
                      <ToggleRow
                        enabled={preference.enabled}
                        key={preference.key}
                        label={preference.label}
                        onPress={() =>
                          toggleNotification(preference.key)
                        }
                        styles={styles}
                      />
                    ))}

                    <ActionRow
                      icon={
                        <Bell
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.3}
                        />
                      }
                      label="Open notifications"
                      onPress={() => router.push('/notifications')}
                      styles={styles}
                    />

                    <InlineNotice
                      styles={styles}
                      text="Notification switches are preview-only until account preference saving is connected."
                      warning
                    />
                  </SectionCard>

                  <SectionCard
                    expanded={activeSection === 'security'}
                    icon={
                      <LockKeyhole
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.35}
                      />
                    }
                    onPress={() => toggleSection('security')}
                    styles={styles}
                    subtitle="Password, sessions, privacy, and safety"
                    title="Security and privacy">
                    <ActionRow
                      icon={
                        <LockKeyhole
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.3}
                        />
                      }
                      label="Password and sign-in"
                      onPress={() =>
                        showPreviewWarning('Password and sign-in')
                      }
                      styles={styles}
                    />
                    <ActionRow
                      icon={
                        <ShieldCheck
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.3}
                        />
                      }
                      label="Two-factor authentication"
                      onPress={() =>
                        showPreviewWarning(
                          'Two-factor authentication',
                        )
                      }
                      styles={styles}
                    />
                    <ActionRow
                      icon={
                        <Settings
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.3}
                        />
                      }
                      label="Devices and sessions"
                      onPress={() =>
                        showPreviewWarning('Devices and sessions')
                      }
                      styles={styles}
                    />
                    <ActionRow
                      icon={
                        <ShieldCheck
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.3}
                        />
                      }
                      label="Auth readiness"
                      onPress={() => router.push('/auth-readiness')}
                      styles={styles}
                    />

                    <InlineNotice
                      styles={styles}
                      text="Keep bookings, payments, messages, and PawReport updates inside SitGuru."
                    />
                  </SectionCard>

                  <SectionCard
                    expanded={activeSection === 'payments'}
                    icon={
                      <CreditCard
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.35}
                      />
                    }
                    onPress={() => toggleSection('payments')}
                    styles={styles}
                    subtitle="Customer payments, Guru payouts, and rewards"
                    title="Payments and payouts">
                    <ActionRow
                      icon={
                        <WalletCards
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.3}
                        />
                      }
                      label="Payments and payouts"
                      onPress={() => router.push('/payments')}
                      styles={styles}
                    />
                    <ActionRow
                      icon={
                        <CircleDollarSign
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.3}
                        />
                      }
                      label="Guru pricing"
                      onPress={() => router.push('/guru-pricing')}
                      styles={styles}
                    />
                    {authRoles.includes('ambassador') ? (
                      <ActionRow
                        icon={
                          <CreditCard
                            color={palette.primary}
                            size={18}
                            strokeWidth={2.3}
                          />
                        }
                        label="Ambassador payout setup"
                        onPress={() =>
                          router.push('/ambassador-payouts')
                        }
                        styles={styles}
                      />
                    ) : null}
                    <ActionRow
                      icon={
                        <CalendarDays
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.3}
                        />
                      }
                      label="Booking details"
                      onPress={() => router.push('/booking-details')}
                      styles={styles}
                    />
                  </SectionCard>

                  <SectionCard
                    expanded={activeSection === 'support'}
                    icon={
                      <HelpCircle
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.35}
                      />
                    }
                    onPress={() => toggleSection('support')}
                    styles={styles}
                    subtitle="Help, contact options, and safety support"
                    title="Help and support">
                    <ActionRow
                      icon={
                        <HelpCircle
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.3}
                        />
                      }
                      label="Help Center"
                      onPress={() => router.push('/support')}
                      styles={styles}
                    />
                    <ActionRow
                      icon={
                        <MessageCircle
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.3}
                        />
                      }
                      label="Contact SitGuru"
                      onPress={() => router.push('/conversation')}
                      styles={styles}
                    />
                    <ActionRow
                      icon={
                        <ShieldCheck
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.3}
                        />
                      }
                      label="Report a safety concern"
                      onPress={() =>
                        showPreviewWarning(
                          'Report a safety concern',
                        )
                      }
                      styles={styles}
                    />
                  </SectionCard>

                  <SectionCard
                    expanded={activeSection === 'app'}
                    icon={
                      <Settings
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.35}
                      />
                    }
                    onPress={() => toggleSection('app')}
                    styles={styles}
                    subtitle="Version, accessibility, and preferences"
                    title="App settings">
                    <InfoRow
                      label="App version"
                      styles={styles}
                      value="SitGuru mobile preview 1.0"
                    />
                    <InfoRow
                      label="Accessibility"
                      styles={styles}
                      value="Large touch targets and readable labels"
                    />
                    <InfoRow
                      label="Theme"
                      styles={styles}
                      value={
                        themePreference === 'dark'
                          ? 'Dark mode'
                          : 'Light mode'
                      }
                    />
                  </SectionCard>
                </View>

                {isAuthenticated ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={loading}
                    onPress={() => void handleSignOut()}
                    style={({ pressed }) => [
                      styles.signOutButton,
                      pressed && styles.pressed,
                    ]}>
                    <LogOut
                      color={palette.danger}
                      size={18}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.signOutButtonText}>
                      {loading ? 'Signing out...' : 'Sign out'}
                    </Text>
                  </Pressable>
                ) : null}
              </ScrollView>

              <View style={styles.bottomNav}>
                <BottomNavItem
                  icon={
                    <SitGuruIcon
                      color={palette.navMuted}
                      name="home"
                      size={21}
                      strokeWidth={2.4}
                    />
                  }
                  label="Home"
                  onPress={() => router.push(currentDashboardRoute)}
                  styles={styles}
                />

                <BottomNavItem
                  icon={
                    <SitGuruIcon
                      color={palette.navMuted}
                      name="explore"
                      size={21}
                      strokeWidth={2.3}
                    />
                  }
                  label="Care"
                  onPress={() => router.push('/find-care')}
                  styles={styles}
                />

                <BottomNavItem
                  icon={
                    <SitGuruIcon
                      color={palette.navMuted}
                      name="bookings"
                      size={21}
                      strokeWidth={2.3}
                    />
                  }
                  label="Bookings"
                  onPress={() => router.push('/booking-details')}
                  styles={styles}
                />

                <BottomNavItem
                  icon={
                    <SitGuruIcon
                      color={palette.navMuted}
                      name="messages"
                      size={21}
                      strokeWidth={2.3}
                    />
                  }
                  label="Messages"
                  onPress={() => router.push('/conversation')}
                  styles={styles}
                />

                <BottomNavItem
                  active
                  icon={
                    <SitGuruIcon
                      color={palette.primary}
                      name="profile"
                      size={21}
                      strokeWidth={2.4}
                    />
                  }
                  label="Account"
                  onPress={() => undefined}
                  styles={styles}
                />
              </View>

              {isAuthenticated ? (
                <SitGuruWorkspaceSwitcher
                  currentRole={currentRole}
                  onClose={() => setWorkspaceSwitcherOpen(false)}
                  visible={workspaceSwitcherOpen}
                />
              ) : null}
            </View>
          </View>

          {isWebPreview ? <View style={styles.homeIndicator} /> : null}
        </View>
      </View>
    </SitGuruScreen>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  primary = false,
  styles,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  primary?: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        primary && styles.actionButtonPrimary,
        pressed && styles.pressed,
      ]}>
      {icon}
      <Text
        style={[
          styles.actionButtonText,
          primary && styles.actionButtonTextPrimary,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  styles,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.pressed,
      ]}>
      <View style={styles.quickActionIcon}>{icon}</View>
      <Text style={styles.quickActionLabel}>{label}</Text>
      <ChevronRight
        color={styles.quickActionChevron.color}
        size={15}
        strokeWidth={2.4}
      />
    </Pressable>
  );
}

function SectionCard({
  children,
  expanded,
  icon,
  onPress,
  styles,
  subtitle,
  title,
}: {
  children: ReactNode;
  expanded: boolean;
  icon: ReactNode;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  subtitle: string;
  title: string;
}) {
  return (
    <View style={styles.sectionCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.sectionCardHeader,
          pressed && styles.pressed,
        ]}>
        <View style={styles.sectionCardIcon}>{icon}</View>

        <View style={styles.sectionCardCopy}>
          <Text style={styles.sectionCardTitle}>{title}</Text>
          <Text style={styles.sectionCardSubtitle}>{subtitle}</Text>
        </View>

        <ChevronDown
          color={styles.sectionChevron.color}
          size={19}
          strokeWidth={2.4}
          style={{
            transform: [{ rotate: expanded ? '180deg' : '0deg' }],
          }}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.sectionCardBody}>{children}</View>
      ) : null}
    </View>
  );
}

function InfoRow({
  label,
  styles,
  value,
}: {
  label: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  styles,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        pressed && styles.pressed,
      ]}>
      <View style={styles.actionRowIcon}>{icon}</View>
      <Text style={styles.actionRowLabel}>{label}</Text>
      <ChevronRight
        color={styles.actionRowChevron.color}
        size={17}
        strokeWidth={2.35}
      />
    </Pressable>
  );
}

function ToggleRow({
  enabled,
  label,
  onPress,
  styles,
}: {
  enabled: boolean;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.toggleRow,
        pressed && styles.pressed,
      ]}>
      <Text style={styles.toggleRowLabel}>{label}</Text>

      <View
        style={[
          styles.toggleTrack,
          enabled && styles.toggleTrackOn,
        ]}>
        <View
          style={[
            styles.toggleThumb,
            enabled && styles.toggleThumbOn,
          ]}
        />
      </View>
    </Pressable>
  );
}

function InlineNotice({
  styles,
  text,
  warning = false,
}: {
  styles: ReturnType<typeof createStyles>;
  text: string;
  warning?: boolean;
}) {
  return (
    <View
      style={[
        styles.inlineNotice,
        warning && styles.inlineNoticeWarning,
      ]}>
      <ShieldCheck
        color={
          warning
            ? styles.inlineNoticeWarningIcon.color
            : styles.inlineNoticeIcon.color
        }
        size={17}
        strokeWidth={2.35}
      />
      <Text
        style={[
          styles.inlineNoticeText,
          warning && styles.inlineNoticeTextWarning,
        ]}>
        {text}
      </Text>
    </View>
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
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.navItem}>
      {icon}
      <Text
        style={active ? styles.navLabelActive : styles.navLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function Avatar({
  fallback,
  imageUrl,
  palette,
  size,
}: {
  fallback: string;
  imageUrl: string | null;
  palette: ReturnType<typeof getPalette>;
  size: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: palette.avatarBackground,
        borderColor: palette.avatarBorder,
        borderRadius: size / 2,
        borderWidth: 2,
        height: size,
        justifyContent: 'center',
        overflow: 'hidden',
        width: size,
      }}>
      {showImage ? (
        <Image
          onError={() => setImageFailed(true)}
          resizeMode="cover"
          source={{ uri: imageUrl as string }}
          style={{
            height: '100%',
            width: '100%',
          }}
        />
      ) : (
        <Text
          style={{
            color: palette.primary,
            fontFamily: AppFonts.extraBold,
            fontSize: Math.max(11, size * 0.28),
          }}>
          {fallback}
        </Text>
      )}
    </View>
  );
}

function PhoneStatusBar({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.statusBar}>
      <Text style={styles.statusTime}>9:41</Text>

      <View style={styles.statusIcons}>
        <View style={styles.signalBars}>
          <View style={[styles.signalBar, { height: 5 }]} />
          <View style={[styles.signalBar, { height: 7 }]} />
          <View style={[styles.signalBar, { height: 9 }]} />
        </View>

        <Text style={styles.wifiText}>⌁</Text>

        <View style={styles.batteryWrap}>
          <View style={styles.batteryBody}>
            <View style={styles.batteryFill} />
          </View>
          <View style={styles.batteryCap} />
        </View>
      </View>
    </View>
  );
}

function firstString(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);

  if (!parts.length) return 'SG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getPalette(isDark: boolean) {
  return {
    avatarBackground: isDark ? '#173527' : '#EEF5EE',
    avatarBorder: isDark ? '#2E6C4B' : '#FFFFFF',
    background: isDark ? '#06140F' : '#FFF9F1',
    border: isDark ? '#234B38' : '#EADDCB',
    danger: isDark ? '#FF8F7A' : '#B43D2F',
    muted: isDark ? '#9DB0A5' : '#738078',
    navMuted: isDark ? '#9BAAA1' : '#748079',
    primary: isDark ? '#39D982' : '#087449',
    primaryDark: isDark ? '#1C9F5E' : '#075D3B',
    primarySoft: isDark ? '#123E2A' : '#E4F5E9',
    surface: isDark ? '#0B2118' : '#FFFEFA',
    surfaceSoft: isDark ? '#102D21' : '#FFF6E9',
    text: isDark ? '#E8EEE9' : '#27483E',
    title: isDark ? '#FFF5E8' : '#123F31',
    warning: isDark ? '#F4C76A' : '#A86900',
    warningBackground: isDark ? '#3B2D12' : '#FFF5DF',
  };
}

function createStyles(isDark: boolean, isTablet: boolean) {
  const palette = getPalette(isDark);

  return StyleSheet.create({
    previewCanvas: {
      alignItems: 'center',
      justifyContent: 'flex-start',
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
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 20,
      },
      shadowOpacity: 0.27,
      shadowRadius: 28,
      width: '100%',
    },
    deviceFrameNative: {
      backgroundColor: 'transparent',
      borderRadius: 0,
      borderWidth: 0,
      flex: 1,
      maxWidth: '100%',
      overflow: 'visible',
      paddingBottom: 0,
      paddingHorizontal: 0,
      paddingTop: 0,
      shadowOpacity: 0,
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
      backgroundColor: palette.background,
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
      backgroundColor: palette.background,
      flex: 1,
      width: '100%',
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
      justifyContent: 'space-between',
      minHeight: 31,
      paddingHorizontal: 16,
      paddingTop: 7,
    },
    statusTime: {
      color: palette.title,
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
      backgroundColor: palette.title,
      borderRadius: 2,
      width: 3,
    },
    wifiText: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    batteryWrap: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 2,
    },
    batteryBody: {
      borderColor: palette.title,
      borderRadius: 3,
      borderWidth: 1,
      height: 9,
      padding: 1,
      width: 17,
    },
    batteryFill: {
      backgroundColor: palette.title,
      borderRadius: 2,
      flex: 1,
    },
    batteryCap: {
      backgroundColor: palette.title,
      height: 4,
      width: 2,
    },

    scrollContent: {
      gap: 14,
      paddingBottom: 112,
      paddingHorizontal: 15,
      paddingTop: 9,
    },
    scrollContentTablet: {
      alignSelf: 'center',
      maxWidth: 860,
      paddingHorizontal: 24,
      width: '100%',
    },

    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 9,
      minHeight: 52,
    },
    headerBackButton: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    headerCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    headerTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 19,
      letterSpacing: -0.35,
    },
    headerSubtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 5,
    },
    headerIconButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    modeToggle: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: isDark ? '#B9831B' : '#F2822E',
      borderRadius: 13,
      borderWidth: 1.2,
      flexDirection: 'row',
      gap: 2,
      padding: 2,
    },
    modeButton: {
      alignItems: 'center',
      borderRadius: 10,
      height: 27,
      justifyContent: 'center',
      width: 29,
    },
    modeButtonActive: {
      backgroundColor: isDark
        ? 'rgba(226,170,45,0.18)'
        : '#FFF4D8',
    },
    profileButton: {
      borderRadius: 999,
    },

    profileHero: {
      backgroundColor: isDark ? '#0D2B20' : '#ECF8EE',
      borderColor: isDark ? '#2D6548' : '#CFE8D5',
      borderRadius: 24,
      borderWidth: 1,
      gap: 12,
      padding: 15,
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: isDark ? 0.2 : 0.07,
      shadowRadius: 16,
    },
    profileTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
    },
    profileHeroCopy: {
      flex: 1,
      gap: 3,
      minWidth: 0,
    },
    profileGreeting: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 23,
      letterSpacing: -0.55,
    },
    profileEmail: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 10,
    },
    statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 3,
    },
    statusPill: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    statusDot: {
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: 6,
      width: 6,
    },
    statusPillText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 7,
    },
    rolePillPrimary: {
      backgroundColor: palette.primary,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    rolePillPrimaryText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 7,
    },
    locationRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 5,
    },
    locationText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
    },
    warningCard: {
      backgroundColor: palette.warningBackground,
      borderColor: palette.warning,
      borderRadius: 14,
      borderWidth: 1,
      gap: 3,
      padding: 10,
    },
    warningTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    warningText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    profileHeroActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 14,
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: 46,
      paddingHorizontal: 10,
    },
    actionButtonPrimary: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    actionButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    actionButtonTextPrimary: {
      color: '#FFFFFF',
    },

    quickSection: {
      gap: 9,
    },
    sectionEyebrow: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 7,
      letterSpacing: 0.85,
    },
    sectionTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 17,
      letterSpacing: -0.35,
    },
    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    quickAction: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 17,
      borderWidth: 1,
      flexBasis: isTablet ? '31%' : '47%',
      flexGrow: 1,
      flexDirection: 'row',
      gap: 8,
      minHeight: 62,
      paddingHorizontal: 10,
      paddingVertical: 9,
    },
    quickActionIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 12,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    quickActionLabel: {
      color: palette.title,
      flex: 1,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    quickActionChevron: {
      color: palette.muted,
    },

    settingsSection: {
      gap: 9,
    },
    sectionCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      overflow: 'hidden',
    },
    sectionCardHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      minHeight: 68,
      paddingHorizontal: 11,
      paddingVertical: 10,
    },
    sectionCardIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 12,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    sectionCardCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    sectionCardTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    sectionCardSubtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    sectionChevron: {
      color: palette.muted,
    },
    sectionCardBody: {
      borderTopColor: palette.border,
      borderTopWidth: 1,
      gap: 8,
      padding: 10,
    },

    infoRow: {
      alignItems: 'flex-start',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 13,
      borderWidth: 1,
      gap: 3,
      padding: 10,
    },
    infoLabel: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 7,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    infoValue: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 10,
      lineHeight: 14,
    },
    roleChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    roleChip: {
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    roleChipText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    actionRow: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 13,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 9,
      minHeight: 50,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    actionRowIcon: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderRadius: 10,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    actionRowLabel: {
      color: palette.title,
      flex: 1,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    actionRowChevron: {
      color: palette.muted,
    },

    toggleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 44,
      paddingHorizontal: 2,
    },
    toggleRowLabel: {
      color: palette.title,
      flex: 1,
      fontFamily: AppFonts.bold,
      fontSize: 9,
      paddingRight: 10,
    },
    toggleTrack: {
      backgroundColor: palette.border,
      borderRadius: 999,
      height: 25,
      justifyContent: 'center',
      padding: 3,
      width: 45,
    },
    toggleTrackOn: {
      backgroundColor: palette.primarySoft,
    },
    toggleThumb: {
      backgroundColor: palette.surface,
      borderRadius: 999,
      height: 19,
      width: 19,
    },
    toggleThumbOn: {
      alignSelf: 'flex-end',
      backgroundColor: palette.primary,
    },

    inlineNotice: {
      alignItems: 'flex-start',
      backgroundColor: palette.primarySoft,
      borderColor: palette.border,
      borderRadius: 13,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      padding: 10,
    },
    inlineNoticeWarning: {
      backgroundColor: palette.warningBackground,
      borderColor: palette.warning,
    },
    inlineNoticeIcon: {
      color: palette.primary,
    },
    inlineNoticeWarningIcon: {
      color: palette.warning,
    },
    inlineNoticeText: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 13,
    },
    inlineNoticeTextWarning: {
      color: palette.title,
    },

    signOutButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.danger,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      minHeight: 50,
      paddingHorizontal: 14,
    },
    signOutButtonText: {
      color: palette.danger,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },

    pressed: {
      opacity: 0.72,
      transform: [{ scale: 0.985 }],
    },

    bottomNav: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 23,
      borderWidth: 1,
      bottom: 8,
      flexDirection: 'row',
      height: 72,
      justifyContent: 'space-around',
      left: 9,
      paddingBottom: 7,
      paddingHorizontal: 5,
      paddingTop: 7,
      position: 'absolute',
      right: 9,
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: -7,
      },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 15,
    },
    navItem: {
      alignItems: 'center',
      flex: 1,
      gap: 3,
      justifyContent: 'center',
    },
    navLabelActive: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    navLabel: {
      color: palette.navMuted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
  });
}