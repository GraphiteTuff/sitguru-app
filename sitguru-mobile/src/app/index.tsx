import { router } from 'expo-router';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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

type AppRoute =
  | '/find-care'
  | '/signup'
  | '/login'
  | '/messages'
  | '/request-booking';

type ThemeOption = {
  label: string;
  value: SitGuruThemePreference;
  icon: 'sun' | 'moon';
};

type RoleCard = {
  title: string;
  subtitle: string;
  route: AppRoute;
  imageLight: ImageSourcePropType;
  imageDark: ImageSourcePropType;
};

type ServiceCard = {
  title: string;
  icon: 'walks' | 'dropIns' | 'sitting' | 'boarding';
  badgeColorLight: string;
  badgeColorDark: string;
};

const heroSceneLight =
  require('../assets/images/home-hero-scene-light.png') as ImageSourcePropType;

const heroSceneDark =
  require('../assets/images/home-hero-scene-dark.png') as ImageSourcePropType;

const sitGuruLogoLight =
  require('../assets/images/sitguru-logo-light.png') as ImageSourcePropType;

const sitGuruLogoDark =
  require('../assets/images/sitguru-logo-dark.png') as ImageSourcePropType;

const roleFindGuruLight =
  require('../assets/images/role-find-guru-light.png') as ImageSourcePropType;

const roleBecomeGuruLight =
  require('../assets/images/role-become-guru-light.png') as ImageSourcePropType;

const roleAmbassadorLight =
  require('../assets/images/role-ambassador-light.png') as ImageSourcePropType;

const roleFindGuruDark =
  require('../assets/images/role-find-guru-dark.png') as ImageSourcePropType;

const roleBecomeGuruDark =
  require('../assets/images/role-become-guru-dark.png') as ImageSourcePropType;

const roleAmbassadorDark =
  require('../assets/images/role-ambassador-dark.png') as ImageSourcePropType;

const themeOptions: ThemeOption[] = [
  { label: 'Light', value: 'light', icon: 'sun' },
  { label: 'Dark', value: 'dark', icon: 'moon' },
];

const roleCards: RoleCard[] = [
  {
    title: 'Find a Guru',
    subtitle: 'Book trusted\nlocal care',
    route: '/find-care',
    imageLight: roleFindGuruLight,
    imageDark: roleFindGuruDark,
  },
  {
    title: 'Become a Guru',
    subtitle: 'Earn doing what\nyou love',
    route: '/signup',
    imageLight: roleBecomeGuruLight,
    imageDark: roleBecomeGuruDark,
  },
  {
    title: 'Become an Ambassador',
    subtitle: 'Share SitGuru.\nEarn rewards.',
    route: '/signup',
    imageLight: roleAmbassadorLight,
    imageDark: roleAmbassadorDark,
  },
];

const services: ServiceCard[] = [
  {
    title: 'Walks',
    icon: 'walks',
    badgeColorLight: '#FFF2C7',
    badgeColorDark: '#2D452A',
  },
  {
    title: 'Drop-ins',
    icon: 'dropIns',
    badgeColorLight: '#F9EDD7',
    badgeColorDark: '#453F22',
  },
  {
    title: 'Sitting',
    icon: 'sitting',
    badgeColorLight: '#F7E8DB',
    badgeColorDark: '#493421',
  },
  {
    title: 'Boarding',
    icon: 'boarding',
    badgeColorLight: '#EEF1E6',
    badgeColorDark: '#29412F',
  },
];

export default function HomeScreen() {
  const theme = useTheme();
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';

  const styles = createStyles(theme, isDark);
  const heroImage = isDark ? heroSceneDark : heroSceneLight;
  const logoImage = isDark ? sitGuruLogoDark : sitGuruLogoLight;

  return (
    <SitGuruScreen scroll={false} center maxWidth={430}>
      <View style={styles.phoneShell}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
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

          <View style={styles.header}>
            <Image source={logoImage} resizeMode="contain" style={styles.logoImage} />

            <View style={styles.modeToggle}>
              {themeOptions.map((option) => {
                const active = themePreference === option.value;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityLabel={`Switch to ${option.label} mode`}
                    onPress={() => setThemePreference(option.value)}
                    style={[styles.modeButton, active && styles.modeButtonActive]}
                  >
                    <SitGuruIcon
                      name={option.icon}
                      size={18}
                      color={
                        active
                          ? isDark
                            ? '#0E1D16'
                            : '#F3AA1F'
                          : styles.toggleInactive.color
                      }
                      strokeWidth={2.4}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>
              Local pet care{'\n'}that feels{'\n'}personal.
            </Text>

            <Text style={styles.heroSubtitle}>
              Book trusted Gurus for walks,{'\n'}drop-ins, sitting, and more.
            </Text>
          </View>

          <View style={styles.heroScene}>
            <Image source={heroImage} resizeMode="cover" style={styles.heroImage} />

            <View pointerEvents="none" style={styles.heroFadeTopStrong} />
            <View pointerEvents="none" style={styles.heroFadeTopMedium} />
            <View pointerEvents="none" style={styles.heroFadeTopSoft} />
          </View>

          <View style={styles.contentShelf}>
            <View style={styles.roleGroup}>
              <View style={styles.roleCardRow}>
                {roleCards.map((card) => (
                  <Pressable
                    key={card.title}
                    accessibilityRole="button"
                    onPress={() => router.push(card.route)}
                    style={styles.roleCard}
                  >
                    <View style={styles.roleImageWrap}>
                      <Image
                        source={isDark ? card.imageDark : card.imageLight}
                        resizeMode="contain"
                        style={styles.roleImage}
                      />
                    </View>

                    <Text style={styles.roleTitle}>{card.title}</Text>
                    <Text style={styles.roleSubtitle}>{card.subtitle}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.servicesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Popular Services</Text>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/find-care')}
                >
                  <Text style={styles.viewAll}>View all</Text>
                </Pressable>
              </View>

              <View style={styles.servicesRow}>
                {services.map((service) => (
                  <Pressable
                    key={service.title}
                    accessibilityRole="button"
                    onPress={() => router.push('/find-care')}
                    style={styles.serviceCard}
                  >
                    <View
                      style={[
                        styles.serviceIconBubble,
                        {
                          backgroundColor: isDark
                            ? service.badgeColorDark
                            : service.badgeColorLight,
                        },
                      ]}
                    >
                      <SitGuruIcon
                        name={service.icon}
                        size={22}
                        color={isDark ? '#F1D36A' : BrandColors.greenDark}
                        strokeWidth={2.35}
                      />
                    </View>

                    <Text style={styles.serviceText}>{service.title}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </View>
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
      </View>
    </SitGuruScreen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isDark: boolean) {
  const colors = 'colors' in theme ? theme.colors : theme;

  const bg = isDark ? '#06140F' : '#FFF9F2';
  const shell = isDark ? '#081C14' : '#FFFBF7';

  const roleGroupBackground = isDark ? '#0D241A' : '#FFF7ED';
  const roleCardBackground = isDark ? '#102C20' : '#FFF9F3';

  const serviceCardBackground = isDark ? '#0B241A' : '#FFFDF8';

  const border = isDark ? '#244A39' : '#E9DDCD';
  const roleBorder = isDark ? '#315D45' : '#EEE2D2';
  const serviceBorder = isDark ? '#2C5B42' : '#EFDEC9';

  const title = isDark ? '#FFF4E2' : BrandColors.greenDark;
  const body = isDark ? '#DED8C9' : '#5F665E';
  const muted = isDark ? '#AEB9B0' : '#77827A';
  const accentOutline = isDark ? '#C58A1D' : '#F2822E';
  const primary = colors.primary ?? BrandColors.green;
  const textSecondary = colors.textSecondary ?? muted;
  const heroFadeColor = bg;

  return StyleSheet.create({
    toggleInactive: {
      color: textSecondary,
    },
    navActive: {
      color: isDark ? '#58D58A' : primary,
    },
    navMuted: {
      color: textSecondary,
    },

    phoneShell: {
      backgroundColor: bg,
      borderColor: border,
      borderRadius: 34,
      borderWidth: 1,
      maxWidth: 430,
      minHeight: '100%',
      overflow: 'hidden',
      width: '100%',
    },
    scrollContent: {
      paddingBottom: 100,
      paddingTop: 14,
    },

    statusBar: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
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
      marginBottom: 24,
      minHeight: 44,
      paddingHorizontal: 22,
    },
    logoImage: {
      height: isDark ? 43 : 41,
      width: isDark ? 154 : 152,
    },

    modeToggle: {
      alignItems: 'center',
      backgroundColor: shell,
      borderColor: accentOutline,
      borderRadius: 14,
      borderWidth: 1.6,
      flexDirection: 'row',
      gap: 4,
      padding: 4,
    },
    modeButton: {
      alignItems: 'center',
      borderRadius: 11,
      height: 30,
      justifyContent: 'center',
      width: 42,
    },
    modeButtonActive: {
      backgroundColor: isDark ? 'rgba(226, 170, 45, 0.18)' : '#FFF4D8',
    },

    heroCopy: {
      paddingHorizontal: isDark ? 28 : 32,
      zIndex: 10,
    },
    heroTitle: {
      color: title,
      fontFamily: AppFonts.extraBold,
      fontSize: isDark ? 32 : 33,
      letterSpacing: -1.1,
      lineHeight: isDark ? 37 : 38,
      marginBottom: 10,
    },
    heroSubtitle: {
      color: body,
      fontFamily: AppFonts.medium,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 8,
    },

    heroScene: {
      height: isDark ? 334 : 348,
      marginTop: isDark ? -24 : -34,
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
    },
    heroImage: {
      height: isDark ? 356 : 370,
      marginTop: isDark ? -18 : -20,
      width: '100%',
    },

    heroFadeTopStrong: {
      backgroundColor: heroFadeColor,
      height: isDark ? 18 : 20,
      left: 0,
      opacity: isDark ? 0.34 : 0.22,
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 4,
    },
    heroFadeTopMedium: {
      backgroundColor: heroFadeColor,
      height: isDark ? 20 : 22,
      left: 0,
      opacity: isDark ? 0.18 : 0.12,
      position: 'absolute',
      right: 0,
      top: isDark ? 16 : 18,
      zIndex: 4,
    },
    heroFadeTopSoft: {
      backgroundColor: heroFadeColor,
      height: isDark ? 22 : 24,
      left: 0,
      opacity: isDark ? 0.08 : 0.06,
      position: 'absolute',
      right: 0,
      top: isDark ? 34 : 38,
      zIndex: 4,
    },

    contentShelf: {
      backgroundColor: bg,
      marginTop: isDark ? -44 : -48,
      paddingHorizontal: 14,
      paddingTop: 12,
      zIndex: 20,
    },

    roleGroup: {
      backgroundColor: roleGroupBackground,
      borderColor: roleBorder,
      borderRadius: 24,
      borderWidth: 1,
      padding: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.24 : 0.08,
      shadowRadius: 18,
    },
    roleCardRow: {
      flexDirection: 'row',
      gap: 10,
    },
    roleCard: {
      alignItems: 'center',
      backgroundColor: roleCardBackground,
      borderColor: roleBorder,
      borderRadius: 20,
      borderWidth: 1,
      flex: 1,
      minHeight: isDark ? 154 : 158,
      overflow: 'hidden',
      paddingBottom: 11,
      paddingHorizontal: 6,
      paddingTop: 8,
    },
    roleImageWrap: {
      alignItems: 'center',
      backgroundColor: 'transparent',
      height: 74,
      justifyContent: 'center',
      marginBottom: 5,
      overflow: 'visible',
      width: '100%',
    },
    roleImage: {
      backgroundColor: 'transparent',
      height: 78,
      width: '118%',
    },
    roleTitle: {
      color: title,
      fontFamily: AppFonts.bold,
      fontSize: 13,
      lineHeight: 16,
      marginBottom: 4,
      textAlign: 'center',
    },
    roleSubtitle: {
      color: body,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      lineHeight: 14,
      textAlign: 'center',
    },

    servicesSection: {
      backgroundColor: 'transparent',
      paddingBottom: 0,
      paddingHorizontal: 8,
      paddingTop: 16,
    },
    sectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: {
      color: title,
      fontFamily: AppFonts.bold,
      fontSize: 16,
      lineHeight: 20,
    },
    viewAll: {
      color: isDark ? '#39B96D' : BrandColors.greenDark,
      fontFamily: AppFonts.bold,
      fontSize: 12,
    },
    servicesRow: {
      flexDirection: 'row',
      gap: 12,
    },
    serviceCard: {
      alignItems: 'center',
      backgroundColor: serviceCardBackground,
      borderColor: serviceBorder,
      borderRadius: 18,
      borderWidth: 1,
      flex: 1,
      justifyContent: 'center',
      minHeight: 82,
      paddingHorizontal: 4,
      paddingVertical: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: isDark ? 0.18 : 0.05,
      shadowRadius: 13,
    },
    serviceIconBubble: {
      alignItems: 'center',
      borderRadius: 12,
      height: 34,
      justifyContent: 'center',
      marginBottom: 8,
      width: 34,
    },
    serviceText: {
      color: title,
      fontFamily: AppFonts.semiBold,
      fontSize: 12,
      lineHeight: 14,
      textAlign: 'center',
    },

    bottomSpacer: {
      backgroundColor: 'transparent',
      height: 20,
    },

    bottomNav: {
      alignItems: 'center',
      backgroundColor: isDark ? '#071A12' : '#FFFDF8',
      borderColor: isDark ? '#224D38' : '#EEDFCC',
      borderRadius: 24,
      borderWidth: 1,
      bottom: 8,
      flexDirection: 'row',
      height: 76,
      justifyContent: 'space-around',
      left: 10,
      paddingBottom: 8,
      paddingHorizontal: 8,
      paddingTop: 8,
      position: 'absolute',
      right: 10,
      shadowColor: '#000',
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