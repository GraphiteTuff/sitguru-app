import { router } from 'expo-router';
import {
    ArrowRight,
    CalendarCheck2,
    ChevronDown,
    LockKeyhole,
    MapPin,
    Megaphone,
    PawPrint,
    Search,
    ShieldCheck,
    UsersRound,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
    Image,
    ImageSourcePropType,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from 'react-native';

import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruScreen from '@/components/SitGuruScreen';
import { AppFonts } from '@/constants/fonts';
import { BrandColors } from '@/constants/theme';
import {
    setThemePreference,
    SitGuruThemePreference,
    useThemePreference,
} from '@/hooks/use-color-scheme';
import { useTheme, useThemeMode } from '@/hooks/use-theme';

type ThemeOption = {
  label: string;
  value: SitGuruThemePreference;
  icon: 'sun' | 'moon';
};

type RoleCard = {
  title: string;
  subtitle: string;
  tint: 'green' | 'gold' | 'lavender';
  icon: ReactNode;
  action: 'find' | 'guru' | 'ambassador';
};

type ServiceCard = {
  title: string;
  value: string;
  icon: 'walks' | 'dropIns' | 'sitting' | 'boarding';
};

const heroSceneLight =
  require('../assets/images/home-hero-scene-light.png') as ImageSourcePropType;

const heroSceneDark =
  require('../assets/images/home-hero-scene-dark.png') as ImageSourcePropType;

const sitGuruLogoLight =
  require('../assets/images/sitguru-logo-light.png') as ImageSourcePropType;

const sitGuruLogoDark =
  require('../assets/images/sitguru-logo-dark.png') as ImageSourcePropType;

const walksIconAsset =
  require('../assets/images/sitguru-walks-icon.png') as ImageSourcePropType;

const themeOptions: ThemeOption[] = [
  { label: 'Light', value: 'light', icon: 'sun' },
  { label: 'Dark', value: 'dark', icon: 'moon' },
];

const serviceOptions = [
  'All services',
  'Dog walking',
  'Drop-in visits',
  'Pet sitting',
  'Boarding',
  'Training',
];

const services: ServiceCard[] = [
  {
    title: 'Walks',
    value: 'Dog walking',
    icon: 'walks',
  },
  {
    title: 'Drop-ins',
    value: 'Drop-in visits',
    icon: 'dropIns',
  },
  {
    title: 'Sitting',
    value: 'Pet sitting',
    icon: 'sitting',
  },
  {
    title: 'Boarding',
    value: 'Boarding',
    icon: 'boarding',
  },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();

  const isDark = themeMode === 'dark';
  const isWebPreview = Platform.OS === 'web';
  const isTablet = Platform.OS !== 'web' && width >= 768;

  const styles = createStyles(theme, isDark, isTablet);
  const heroImage = isDark ? heroSceneDark : heroSceneLight;
  const logoImage = isDark ? sitGuruLogoDark : sitGuruLogoLight;

  const [selectedService, setSelectedService] = useState('All services');
  const [zipCode, setZipCode] = useState('');
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);

  const roleCards = useMemo<RoleCard[]>(
    () => [
      {
        title: 'Find a Guru',
        subtitle: 'Book trusted care for your pet',
        tint: 'green',
        action: 'find',
        icon: (
          <View style={styles.roleIconGreen}>
            <MapPin color={styles.roleIconGreenText.color} size={31} strokeWidth={2.35} />
            <PawPrint
              color={styles.roleIconGreenText.color}
              size={15}
              strokeWidth={2.5}
              style={styles.roleIconAccent}
            />
          </View>
        ),
      },
      {
        title: 'Become a Guru',
        subtitle: 'Turn your love for pets into opportunity',
        tint: 'gold',
        action: 'guru',
        icon: (
          <View style={styles.roleIconGold}>
            <ShieldCheck color={styles.roleIconGoldText.color} size={34} strokeWidth={2.25} />
            <PawPrint
              color={styles.roleIconGoldText.color}
              size={14}
              strokeWidth={2.5}
              style={styles.roleIconAccent}
            />
          </View>
        ),
      },
      {
        title: 'Become an Ambassador',
        subtitle: 'Share SitGuru and earn rewards',
        tint: 'lavender',
        action: 'ambassador',
        icon: (
          <View style={styles.roleIconLavender}>
            <Megaphone
              color={styles.roleIconLavenderText.color}
              size={34}
              strokeWidth={2.25}
            />
          </View>
        ),
      },
    ],
    [styles],
  );

  function openRole(action: RoleCard['action']) {
    if (action === 'find') {
      router.push('/find-care');
      return;
    }

    router.push({
      pathname: '/signup',
      params: { role: action },
    } as never);
  }

  function openFindCare(service = selectedService) {
    const params: Record<string, string> = {};

    if (service && service !== 'All services') {
      params.service = service;
    }

    if (zipCode.trim()) {
      params.zip = zipCode.trim();
    }

    router.push({
      pathname: '/find-care',
      params,
    } as never);
  }

  return (
    <SitGuruScreen
      scroll={false}
      center={isWebPreview || isTablet}
      maxWidth={isTablet ? 920 : 620}
    >
      <View
        style={[
          styles.previewCanvas,
          !isWebPreview && styles.previewCanvasNative,
        ]}
      >
        <View
          style={[
            styles.deviceFrame,
            !isWebPreview && styles.deviceFrameNative,
          ]}
        >
          {isWebPreview ? <View style={styles.deviceTopSpeaker} /> : null}

          <View
            style={[
              styles.phoneShell,
              !isWebPreview && styles.phoneShellNative,
            ]}
          >
            <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isWebPreview ? (
            <View style={styles.statusBar}>
              <Text style={styles.statusTime}>9:41</Text>

              <View style={styles.statusIcons}>
                <View style={styles.signalBars}>
                  <View style={[styles.signalBar, { height: 6 }]} />
                  <View style={[styles.signalBar, { height: 8 }]} />
                  <View style={[styles.signalBar, { height: 10 }]} />
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
          ) : null}

          <View style={styles.header}>
            <Image
              source={logoImage}
              resizeMode="contain"
              style={styles.logoImage}
            />

            <View style={styles.modeToggle}>
              {themeOptions.map((option) => {
                const active = themePreference === option.value;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityLabel={`Switch to ${option.label} mode`}
                    accessibilityState={{ selected: active }}
                    onPress={() => setThemePreference(option.value)}
                    style={[
                      styles.modeButton,
                      active && styles.modeButtonActive,
                    ]}
                  >
                    <SitGuruIcon
                      name={option.icon}
                      size={17}
                      color={
                        active
                          ? option.value === 'light'
                            ? '#F3AA1F'
                            : isDark
                              ? '#F0CF62'
                              : BrandColors.greenDark
                          : styles.toggleInactive.color
                      }
                      strokeWidth={2.4}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.heroSection}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>
                Trusted pet care.{'\n'}Made{' '}
                <Text style={styles.heroTitleAccent}>simple.</Text>
              </Text>

              <Text style={styles.heroSubtitle}>
                Book trusted local Gurus for walks, sitting, boarding, training,
                and more—tailored for your pet.
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={() => openFindCare()}
                style={({ pressed }) => [
                  styles.heroPrimaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.heroPrimaryButtonText}>Find a Guru</Text>
                <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/login')}
                style={({ pressed }) => [
                  styles.heroLoginButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.heroLoginButtonText}>Log in</Text>
              </Pressable>
            </View>

            <View style={styles.heroVisual}>
              <Image
                source={heroImage}
                resizeMode="cover"
                style={styles.heroImage}
              />

              <View pointerEvents="none" style={styles.heroImageShade} />

              <View style={styles.trustBadge}>
                <View style={styles.trustBadgeIcon}>
                  <ShieldCheck
                    color={styles.trustBadgeIconText.color}
                    size={21}
                    strokeWidth={2.4}
                  />
                </View>

                <Text style={styles.trustBadgeText}>
                  Trusted by pet parents{'\n'}in your community
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.searchCard}>
            <Text style={styles.searchLabel}>What service do you need?</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: serviceMenuOpen }}
              onPress={() => setServiceMenuOpen((current) => !current)}
              style={styles.selectField}
            >
              <View style={styles.fieldIcon}>
                <PawPrint
                  color={styles.fieldIconText.color}
                  size={18}
                  strokeWidth={2.4}
                />
              </View>

              <Text style={styles.selectFieldText}>{selectedService}</Text>

              <ChevronDown
                color={styles.fieldChevron.color}
                size={19}
                strokeWidth={2.35}
              />
            </Pressable>

            {serviceMenuOpen ? (
              <View style={styles.serviceMenu}>
                {serviceOptions.map((service, index) => {
                  const selected = selectedService === service;

                  return (
                    <Pressable
                      key={service}
                      accessibilityRole="button"
                      onPress={() => {
                        setSelectedService(service);
                        setServiceMenuOpen(false);
                      }}
                      style={[
                        styles.serviceMenuItem,
                        index === serviceOptions.length - 1 &&
                          styles.serviceMenuItemLast,
                        selected && styles.serviceMenuItemSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.serviceMenuText,
                          selected && styles.serviceMenuTextSelected,
                        ]}
                      >
                        {service}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.searchBottomRow}>
              <View style={styles.zipFieldWrap}>
                <Text style={styles.searchLabel}>ZIP code</Text>

                <View style={styles.zipField}>
                  <View style={styles.fieldIcon}>
                    <MapPin
                      color={styles.fieldIconText.color}
                      size={18}
                      strokeWidth={2.4}
                    />
                  </View>

                  <TextInput
                    accessibilityLabel="ZIP code"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                    onChangeText={setZipCode}
                    onSubmitEditing={() => openFindCare()}
                    placeholder="Enter ZIP"
                    placeholderTextColor={styles.inputPlaceholder.color}
                    returnKeyType="search"
                    style={styles.zipInput}
                    value={zipCode}
                  />
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => openFindCare()}
                style={({ pressed }) => [
                  styles.searchButton,
                  pressed && styles.pressed,
                ]}
              >
                <Search color="#FFFFFF" size={19} strokeWidth={2.5} />
                <Text style={styles.searchButtonText}>Search Gurus</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.roleGrid}>
            {roleCards.map((card) => (
              <Pressable
                key={card.title}
                accessibilityRole="button"
                onPress={() => openRole(card.action)}
                style={({ pressed }) => [
                  styles.roleCard,
                  card.tint === 'green' && styles.roleCardGreen,
                  card.tint === 'gold' && styles.roleCardGold,
                  card.tint === 'lavender' && styles.roleCardLavender,
                  pressed && styles.pressed,
                ]}
              >
                {card.icon}

                <Text style={styles.roleTitle}>{card.title}</Text>
                <Text style={styles.roleSubtitle}>{card.subtitle}</Text>

                <View style={styles.roleArrowRow}>
                  <ArrowRight
                    color={
                      card.tint === 'lavender'
                        ? styles.roleArrowLavender.color
                        : card.tint === 'gold'
                          ? styles.roleArrowGold.color
                          : styles.roleArrowGreen.color
                    }
                    size={18}
                    strokeWidth={2.5}
                  />
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.servicesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular services</Text>

              <Pressable
                accessibilityRole="button"
                onPress={() => openFindCare('All services')}
              >
                <Text style={styles.viewAll}>View all</Text>
              </Pressable>
            </View>

            <View style={styles.servicesRow}>
              {services.map((service) => (
                <Pressable
                  key={service.title}
                  accessibilityRole="button"
                  onPress={() => openFindCare(service.value)}
                  style={({ pressed }) => [
                    styles.serviceCard,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.serviceIconBubble}>
                    {service.title === 'Walks' ? (
                      <Image
                        source={walksIconAsset}
                        resizeMode="contain"
                        style={[
                          styles.walksIconImage,
                          { tintColor: styles.serviceIconText.color },
                        ]}
                      />
                    ) : (
                      <SitGuruIcon
                        name={service.icon}
                        size={22}
                        color={styles.serviceIconText.color}
                        strokeWidth={2.35}
                      />
                    )}
                  </View>

                  <Text style={styles.serviceText}>{service.title}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.trustStrip}>
            <TrustItem
              icon={
                <CalendarCheck2
                  color={styles.trustStripIconText.color}
                  size={22}
                  strokeWidth={2.3}
                />
              }
              title="Easy booking"
              styles={styles}
            />

            <View style={styles.trustDivider} />

            <TrustItem
              icon={
                <UsersRound
                  color={styles.trustStripIconText.color}
                  size={22}
                  strokeWidth={2.3}
                />
              }
              title="Trusted local Gurus"
              styles={styles}
            />

            <View style={styles.trustDivider} />

            <TrustItem
              icon={
                <LockKeyhole
                  color={styles.trustStripIconText.color}
                  size={22}
                  strokeWidth={2.3}
                />
              }
              title="Secure checkout"
              styles={styles}
            />
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.bottomNav}>
          <Pressable accessibilityRole="button" style={styles.navItem}>
            <SitGuruIcon
              name="home"
              size={22}
              color={styles.navActive.color}
              strokeWidth={2.6}
            />
            <Text style={styles.navLabelActive}>Home</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/find-care')}
            style={styles.navItem}
          >
            <SitGuruIcon
              name="explore"
              size={22}
              color={styles.navMuted.color}
              strokeWidth={2.25}
            />
            <Text style={styles.navLabel}>Explore</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/request-booking')}
            style={styles.navItem}
          >
            <SitGuruIcon
              name="bookings"
              size={22}
              color={styles.navMuted.color}
              strokeWidth={2.25}
            />
            <Text style={styles.navLabel}>Bookings</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/messages')}
            style={styles.navItem}
          >
            <SitGuruIcon
              name="messages"
              size={22}
              color={styles.navMuted.color}
              strokeWidth={2.25}
            />
            <Text style={styles.navLabel}>Messages</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/login')}
            style={styles.navItem}
          >
            <SitGuruIcon
              name="profile"
              size={22}
              color={styles.navMuted.color}
              strokeWidth={2.25}
            />
            <Text style={styles.navLabel}>Profile</Text>
          </Pressable>
            </View>

            {isWebPreview ? <View style={styles.homeIndicator} /> : null}
          </View>
        </View>
      </View>
    </SitGuruScreen>
  );
}

function TrustItem({
  icon,
  styles,
  title,
}: {
  icon: ReactNode;
  styles: ReturnType<typeof createStyles>;
  title: string;
}) {
  return (
    <View style={styles.trustItem}>
      <View style={styles.trustItemIcon}>{icon}</View>
      <Text style={styles.trustItemTitle}>{title}</Text>
    </View>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>,
  isDark: boolean,
  isTablet: boolean,
) {
  const colors = 'colors' in theme ? theme.colors : theme;

  const background = isDark ? '#06140F' : '#FFF9F2';
  const shell = isDark ? '#081C14' : '#FFFBF7';
  const surface = isDark ? '#0B2118' : '#FFFFFF';
  const surfaceSoft = isDark ? '#102D21' : '#FFF8EF';
  const border = isDark ? '#244A39' : '#E9DDCD';
  const title = isDark ? '#FFF4E2' : '#102C41';
  const body = isDark ? '#D8E1DB' : '#334153';
  const muted = isDark ? '#AEB9B0' : '#6C756E';
  const primary = colors.primary ?? BrandColors.green;
  const textSecondary = colors.textSecondary ?? muted;

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
      shadowOffset: { width: 0, height: 20 },
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
    homeIndicator: {
      alignSelf: 'center',
      backgroundColor: '#F3F1EA',
      borderRadius: 999,
      height: 5,
      marginTop: 9,
      opacity: 0.95,
      width: 116,
    },

    toggleInactive: {
      color: textSecondary,
    },
    navActive: {
      color: isDark ? '#58D58A' : primary,
    },
    navMuted: {
      color: textSecondary,
    },
    fieldIconText: {
      color: isDark ? '#58D58A' : BrandColors.greenDark,
    },
    fieldChevron: {
      color: muted,
    },
    inputPlaceholder: {
      color: isDark ? '#809087' : '#929991',
    },
    roleIconGreenText: {
      color: isDark ? '#68E199' : '#0A7B4E',
    },
    roleIconGoldText: {
      color: isDark ? '#F2C86B' : '#836116',
    },
    roleIconLavenderText: {
      color: isDark ? '#C8B6FF' : '#6D55A8',
    },
    roleArrowGreen: {
      color: isDark ? '#68E199' : '#0A7B4E',
    },
    roleArrowGold: {
      color: isDark ? '#F2C86B' : '#A56D00',
    },
    roleArrowLavender: {
      color: isDark ? '#C8B6FF' : '#4F3D85',
    },
    serviceIconText: {
      color: isDark ? '#58D58A' : BrandColors.greenDark,
    },
    trustBadgeIconText: {
      color: isDark ? '#58D58A' : BrandColors.greenDark,
    },
    trustStripIconText: {
      color: isDark ? '#58D58A' : BrandColors.greenDark,
    },

    phoneShell: {
      backgroundColor: background,
      borderColor: border,
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
      overflow: 'hidden',
    },
    scrollContent: {
      paddingBottom: 104,
      paddingHorizontal: isTablet ? 24 : 0,
      paddingTop: Platform.OS === 'web' ? 12 : 6,
    },

    statusBar: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
      paddingHorizontal: 22,
    },
    statusTime: {
      color: title,
      fontFamily: AppFonts.bold,
      fontSize: 14,
    },
    statusIcons: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 7,
    },
    signalBars: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: 2,
    },
    signalBar: {
      backgroundColor: title,
      borderRadius: 2,
      width: 3,
    },
    wifiText: {
      color: title,
      fontFamily: AppFonts.bold,
      fontSize: 12,
      lineHeight: 13,
    },
    batteryWrap: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 2,
    },
    batteryBody: {
      borderColor: title,
      borderRadius: 3,
      borderWidth: 1.2,
      height: 10,
      padding: 1,
      width: 18,
    },
    batteryFill: {
      backgroundColor: title,
      borderRadius: 2,
      flex: 1,
    },
    batteryCap: {
      backgroundColor: title,
      borderRadius: 1,
      height: 5,
      width: 2,
    },

    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
      minHeight: 48,
      paddingHorizontal: 22,
    },
    logoImage: {
      height: isDark ? 43 : 41,
      width: isDark ? 154 : 152,
    },
    modeToggle: {
      alignItems: 'center',
      backgroundColor: shell,
      borderColor: isDark ? '#B9831B' : '#F2822E',
      borderRadius: 14,
      borderWidth: 1.4,
      flexDirection: 'row',
      gap: 3,
      padding: 3,
    },
    modeButton: {
      alignItems: 'center',
      borderRadius: 11,
      height: 30,
      justifyContent: 'center',
      width: 40,
    },
    modeButtonActive: {
      backgroundColor: isDark ? 'rgba(226,170,45,0.18)' : '#FFF4D8',
    },

    heroSection: {
      minHeight: isTablet ? 470 : 452,
      position: 'relative',
    },
    heroCopy: {
      maxWidth: isTablet ? 370 : 265,
      paddingLeft: 22,
      paddingRight: 10,
      paddingTop: 12,
      zIndex: 5,
    },
    heroTitle: {
      color: title,
      fontFamily: AppFonts.extraBold,
      fontSize: isTablet ? 45 : 38,
      letterSpacing: -1.35,
      lineHeight: isTablet ? 51 : 43,
    },
    heroTitleAccent: {
      color: isDark ? '#58D58A' : '#0A9B62',
    },
    heroSubtitle: {
      color: body,
      fontFamily: AppFonts.medium,
      fontSize: isTablet ? 16 : 14,
      lineHeight: isTablet ? 23 : 20,
      marginTop: 14,
    },
    heroPrimaryButton: {
      alignItems: 'center',
      backgroundColor: isDark ? '#159A61' : '#0A9B62',
      borderRadius: 13,
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'center',
      marginTop: 18,
      minHeight: 54,
      paddingHorizontal: 18,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: isDark ? 0.24 : 0.14,
      shadowRadius: 13,
    },
    heroPrimaryButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.bold,
      fontSize: 15,
    },
    heroLoginButton: {
      alignItems: 'center',
      backgroundColor: surface,
      borderColor: border,
      borderRadius: 13,
      borderWidth: 1,
      justifyContent: 'center',
      marginTop: 10,
      minHeight: 52,
      paddingHorizontal: 18,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: isDark ? 0.15 : 0.07,
      shadowRadius: 10,
    },
    heroLoginButtonText: {
      color: isDark ? '#58D58A' : BrandColors.greenDark,
      fontFamily: AppFonts.bold,
      fontSize: 15,
    },
    heroVisual: {
      borderBottomLeftRadius: 130,
      borderTopLeftRadius: 130,
      bottom: 0,
      height: isTablet ? 410 : 385,
      overflow: 'hidden',
      position: 'absolute',
      right: 0,
      width: isTablet ? '58%' : '58%',
    },
    heroImage: {
      height: '100%',
      width: '100%',
    },
    heroImageShade: {
      backgroundColor: isDark ? 'rgba(6,20,15,0.08)' : 'rgba(255,249,242,0.03)',
      ...StyleSheet.absoluteFillObject,
    },
    trustBadge: {
      alignItems: 'center',
      backgroundColor: surface,
      borderColor: border,
      borderRadius: 13,
      borderWidth: 1,
      bottom: 18,
      flexDirection: 'row',
      gap: 8,
      left: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
      position: 'absolute',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: isDark ? 0.18 : 0.1,
      shadowRadius: 10,
    },
    trustBadgeIcon: {
      alignItems: 'center',
      backgroundColor: isDark ? '#123E2A' : '#E4F5E9',
      borderRadius: 10,
      height: 35,
      justifyContent: 'center',
      width: 35,
    },
    trustBadgeText: {
      color: title,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },

    searchCard: {
      backgroundColor: surface,
      borderColor: border,
      borderRadius: 22,
      borderWidth: 1,
      gap: 9,
      marginHorizontal: 18,
      marginTop: -1,
      padding: 14,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.22 : 0.1,
      shadowRadius: 19,
      zIndex: 8,
    },
    searchLabel: {
      color: title,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    selectField: {
      alignItems: 'center',
      backgroundColor: surfaceSoft,
      borderColor: border,
      borderRadius: 13,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 9,
      minHeight: 54,
      paddingHorizontal: 11,
    },
    fieldIcon: {
      alignItems: 'center',
      backgroundColor: isDark ? '#123E2A' : '#E8F5EC',
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    selectFieldText: {
      color: title,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 14,
    },
    serviceMenu: {
      backgroundColor: surface,
      borderColor: border,
      borderRadius: 13,
      borderWidth: 1,
      overflow: 'hidden',
    },
    serviceMenuItem: {
      borderBottomColor: border,
      borderBottomWidth: 1,
      justifyContent: 'center',
      minHeight: 45,
      paddingHorizontal: 13,
    },
    serviceMenuItemLast: {
      borderBottomWidth: 0,
    },
    serviceMenuItemSelected: {
      backgroundColor: isDark ? '#123E2A' : '#E8F5EC',
    },
    serviceMenuText: {
      color: body,
      fontFamily: AppFonts.medium,
      fontSize: 13,
    },
    serviceMenuTextSelected: {
      color: isDark ? '#58D58A' : BrandColors.greenDark,
      fontFamily: AppFonts.bold,
    },
    searchBottomRow: {
      alignItems: 'flex-end',
      flexDirection: isTablet ? 'row' : 'row',
      gap: 10,
    },
    zipFieldWrap: {
      flex: 1,
      gap: 7,
    },
    zipField: {
      alignItems: 'center',
      backgroundColor: surfaceSoft,
      borderColor: border,
      borderRadius: 13,
      borderWidth: 1,
      flexDirection: 'row',
      minHeight: 54,
      paddingHorizontal: 10,
    },
    zipInput: {
      color: title,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 14,
      minHeight: 52,
      paddingHorizontal: 9,
      paddingVertical: 0,
    },
    searchButton: {
      alignItems: 'center',
      backgroundColor: isDark ? '#159A61' : '#0A9B62',
      borderRadius: 13,
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      minHeight: 54,
      paddingHorizontal: isTablet ? 20 : 14,
    },
    searchButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.bold,
      fontSize: 12,
    },

    roleGrid: {
      flexDirection: 'row',
      gap: 10,
      marginHorizontal: 18,
      marginTop: 18,
    },
    roleCard: {
      borderColor: border,
      borderRadius: 20,
      borderWidth: 1,
      flex: 1,
      minHeight: 232,
      overflow: 'hidden',
      padding: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: isDark ? 0.17 : 0.06,
      shadowRadius: 13,
    },
    roleCardGreen: {
      backgroundColor: isDark ? '#0F2B20' : '#F1F8F2',
    },
    roleCardGold: {
      backgroundColor: isDark ? '#2D2616' : '#FFF8EB',
    },
    roleCardLavender: {
      backgroundColor: isDark ? '#251F37' : '#F7F3FF',
    },
    roleIconGreen: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: isDark ? '#123E2A' : '#DFF2E5',
      borderRadius: 999,
      height: 72,
      justifyContent: 'center',
      marginBottom: 13,
      position: 'relative',
      width: 72,
    },
    roleIconGold: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: isDark ? '#45391E' : '#F9EBC8',
      borderRadius: 999,
      height: 72,
      justifyContent: 'center',
      marginBottom: 13,
      position: 'relative',
      width: 72,
    },
    roleIconLavender: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: isDark ? '#3A3154' : '#E9E0FF',
      borderRadius: 999,
      height: 72,
      justifyContent: 'center',
      marginBottom: 13,
      width: 72,
    },
    roleIconAccent: {
      bottom: 14,
      position: 'absolute',
      right: 16,
    },
    roleTitle: {
      color: title,
      fontFamily: AppFonts.extraBold,
      fontSize: isTablet ? 17 : 14,
      lineHeight: isTablet ? 21 : 17,
    },
    roleSubtitle: {
      color: body,
      fontFamily: AppFonts.medium,
      fontSize: isTablet ? 12 : 10,
      lineHeight: isTablet ? 17 : 14,
      marginTop: 6,
    },
    roleArrowRow: {
      alignItems: 'flex-end',
      flex: 1,
      justifyContent: 'flex-end',
      marginTop: 10,
    },

    servicesSection: {
      marginTop: 20,
      paddingHorizontal: 18,
    },
    sectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 11,
    },
    sectionTitle: {
      color: title,
      fontFamily: AppFonts.extraBold,
      fontSize: 17,
    },
    viewAll: {
      color: isDark ? '#58D58A' : BrandColors.greenDark,
      fontFamily: AppFonts.bold,
      fontSize: 12,
    },
    servicesRow: {
      flexDirection: 'row',
      gap: 9,
    },
    serviceCard: {
      alignItems: 'center',
      backgroundColor: surface,
      borderColor: border,
      borderRadius: 17,
      borderWidth: 1,
      flex: 1,
      justifyContent: 'center',
      minHeight: 94,
      paddingHorizontal: 5,
      paddingVertical: 11,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.16 : 0.05,
      shadowRadius: 12,
    },
    serviceIconBubble: {
      alignItems: 'center',
      backgroundColor: isDark ? '#123E2A' : '#EEF5EE',
      borderRadius: 12,
      height: 38,
      justifyContent: 'center',
      marginBottom: 8,
      width: 38,
    },
    walksIconImage: {
      height: 24,
      width: 24,
    },
    serviceText: {
      color: title,
      fontFamily: AppFonts.semiBold,
      fontSize: 11,
      textAlign: 'center',
    },

    trustStrip: {
      alignItems: 'center',
      backgroundColor: isDark ? '#0D2A1E' : '#EDF6EE',
      borderColor: isDark ? '#244A39' : '#DCE9D4',
      borderRadius: 19,
      borderWidth: 1,
      flexDirection: 'row',
      marginHorizontal: 18,
      marginTop: 18,
      minHeight: 88,
      paddingHorizontal: 11,
      paddingVertical: 12,
    },
    trustItem: {
      alignItems: 'center',
      flex: 1,
      gap: 6,
      justifyContent: 'center',
    },
    trustItemIcon: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    trustItemTitle: {
      color: title,
      fontFamily: AppFonts.bold,
      fontSize: 9,
      lineHeight: 12,
      textAlign: 'center',
    },
    trustDivider: {
      backgroundColor: border,
      height: 48,
      width: 1,
    },

    pressed: {
      opacity: 0.76,
      transform: [{ scale: 0.985 }],
    },
    bottomSpacer: {
      height: 22,
    },

    bottomNav: {
      alignItems: 'center',
      backgroundColor: isDark ? '#071A12' : '#FFFDF8',
      borderColor: isDark ? '#224D38' : '#EEDFCC',
      borderRadius: Platform.OS === 'web' ? 24 : 0,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      bottom: Platform.OS === 'web' ? 8 : 0,
      flexDirection: 'row',
      height: 76,
      justifyContent: 'space-around',
      left: Platform.OS === 'web' ? 10 : 0,
      paddingBottom: 8,
      paddingHorizontal: 8,
      paddingTop: 8,
      position: 'absolute',
      right: Platform.OS === 'web' ? 10 : 0,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: isDark ? 0.28 : 0.08,
      shadowRadius: 18,
    },
    navItem: {
      alignItems: 'center',
      flex: 1,
      gap: 4,
      justifyContent: 'center',
    },
    navLabelActive: {
      color: isDark ? '#58D58A' : BrandColors.greenDark,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    navLabel: {
      color: muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
    },
  });
}