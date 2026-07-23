import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
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
import type { ComponentProps, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ImageSourcePropType,
  Linking,
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

type SocialIconName = ComponentProps<typeof FontAwesome6>['name'];

type SocialLink = {
  icon: SocialIconName;
  label: string;
  url: string;
};

const heroCareVideoAsset = require(
  '../assets/videos/sitguru-homepage-care.mp4'
);

const heroAppVideoAsset = require(
  '../assets/videos/sitguru-homepage-app.mp4'
);

const heroCarePosterAsset = require(
  '../assets/images/sitguru-homepage-care-poster.jpg'
) as ImageSourcePropType;

const heroAppPosterAsset = require(
  '../assets/images/sitguru-homepage-app-poster.jpg'
) as ImageSourcePropType;

const sitGuruLogoLight =
  require('../assets/images/sitguru-logo-light.png') as ImageSourcePropType;

const sitGuruLogoDark =
  require('../assets/images/sitguru-logo-dark.png') as ImageSourcePropType;

const pawBackgroundAsset =
  require('../assets/images/paw-background-mark.png') as ImageSourcePropType;

const walksIconAsset =
  require('../assets/images/sitguru-walks-icon.png') as ImageSourcePropType;

const themeOptions: ThemeOption[] = [
  { label: 'Light', value: 'light', icon: 'sun' },
  { label: 'Dark', value: 'dark', icon: 'moon' },
];

const socialLinks: SocialLink[] = [
  {
    icon: 'facebook-f',
    label: 'Facebook',
    url: 'https://www.facebook.com/SitGuruOfficial',
  },
  {
    icon: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/sitguruofficial/',
  },
  {
    icon: 'tiktok',
    label: 'TikTok',
    url: 'https://www.tiktok.com/@sitguruofficial',
  },
  {
    icon: 'x-twitter',
    label: 'X',
    url: 'https://x.com/SitGuruOfficial',
  },
  {
    icon: 'youtube',
    label: 'YouTube',
    url: 'https://www.youtube.com/@SitGuruOfficial',
  },
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
  const logoImage = isDark ? sitGuruLogoDark : sitGuruLogoLight;

  const [selectedService, setSelectedService] = useState('All services');
  const [zipCode, setZipCode] = useState('');
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);

  const carePlayer = useVideoPlayer(heroCareVideoAsset, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const appPlayer = useVideoPlayer(heroAppVideoAsset, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  useEffect(() => {
    const startVideos = () => {
      carePlayer.loop = true;
      carePlayer.muted = true;
      appPlayer.loop = true;
      appPlayer.muted = true;

      carePlayer.play();
      appPlayer.play();
    };

    startVideos();

    const retryTimer = setTimeout(startVideos, 500);

    return () => {
      clearTimeout(retryTimer);
    };
  }, [appPlayer, carePlayer]);

  function resumeHeroVideos() {
    carePlayer.muted = true;
    appPlayer.muted = true;
    carePlayer.play();
    appPlayer.play();
  }

  const roleCards = useMemo<RoleCard[]>(
    () => [
      {
        title: 'Find a Guru',
        subtitle: 'Book trusted local pet care',
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
        subtitle: 'Set your schedule. Earn with pets.',
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
        subtitle: 'Share SitGuru. Track. Earn.',
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

  async function openSocialProfile(link: SocialLink) {
    try {
      const supported = await Linking.canOpenURL(link.url);

      if (!supported) {
        throw new Error('Unsupported social profile URL');
      }

      await Linking.openURL(link.url);
    } catch {
      Alert.alert(
        `${link.label} could not open`,
        'Please search for @SitGuruOfficial in the social app.',
      );
    }
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
              <View style={styles.scrollCanvas}>
                <View
                  pointerEvents="none"
                  style={styles.backgroundPawLayer}
                >
                  {[
                    { positionStyle: styles.backgroundPawOne, size: 46 },
                    { positionStyle: styles.backgroundPawTwo, size: 29 },
                    { positionStyle: styles.backgroundPawThree, size: 38 },
                    { positionStyle: styles.backgroundPawFour, size: 25 },
                    { positionStyle: styles.backgroundPawFive, size: 43 },
                    { positionStyle: styles.backgroundPawSix, size: 30 },
                    { positionStyle: styles.backgroundPawSeven, size: 36 },
                    { positionStyle: styles.backgroundPawEight, size: 27 },
                    { positionStyle: styles.backgroundPawNine, size: 35 },
                  ].map(({ positionStyle, size }, index) => (
                    <Image
                      key={`background-paw-${index}`}
                      resizeMode="contain"
                      source={pawBackgroundAsset}
                      style={[
                        styles.backgroundPaw,
                        positionStyle,
                        {
                          height: size,
                          width: size,
                        },
                      ]}
                    />
                  ))}
                </View>

                <View style={styles.contentLayer}>
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
              <Text style={styles.heroEyebrow}>LOCAL CARE • EASY BOOKING</Text>

              <Text style={styles.heroTitle}>
                Real care.{'\n'}Right from{' '}
                <Text style={styles.heroTitleAccent}>your phone.</Text>
              </Text>

              <Text style={styles.heroSubtitle}>
                Meet caring local Gurus who’ll treat your pet like family,
                book with ease, and stay connected through every visit.
              </Text>

              <View style={styles.heroButtonRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openFindCare()}
                  style={({ pressed }) => [
                    styles.heroPrimaryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.heroPrimaryButtonText}>
                  Find a Guru Near You
                </Text>
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
            </View>

            <View style={styles.heroMediaStage}>
              <Pressable
                accessibilityHint="Starts the homepage videos if autoplay is paused"
                accessibilityLabel="Play SitGuru care videos"
                accessibilityRole="button"
                onPress={resumeHeroVideos}
                style={styles.heroCareVideoCard}
              >
                <Image
                  source={heroCarePosterAsset}
                  resizeMode="cover"
                  style={styles.heroPoster}
                />

                <VideoView
                  contentFit="cover"
                  nativeControls={false}
                  player={carePlayer}
                  playsInline
                  pointerEvents="none"
                  style={styles.heroVideo}
                  surfaceType={
                    Platform.OS === 'android' ? 'textureView' : undefined
                  }
                  useExoShutter={false}
                />

                <View pointerEvents="none" style={styles.heroVideoShade} />

                <View style={styles.heroVideoLabel}>
                  <View style={styles.heroVideoLabelDot} />
                  <Text style={styles.heroVideoLabelText}>Local Dog Walking</Text>
                </View>

                <View style={styles.trustBadge}>
                  <View style={styles.trustBadgeIcon}>
                    <ShieldCheck
                      color={styles.trustBadgeIconText.color}
                      size={20}
                      strokeWidth={2.4}
                    />
                  </View>

                  <Text style={styles.trustBadgeText}>
                    Trusted Local Pet Care{'\n'}Providers Near You
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityHint="Starts the homepage videos if autoplay is paused"
                accessibilityLabel="Play SitGuru app video"
                accessibilityRole="button"
                onPress={resumeHeroVideos}
                style={styles.heroAppVideoCard}
              >
                <Image
                  source={heroAppPosterAsset}
                  resizeMode="cover"
                  style={styles.heroPoster}
                />

                <VideoView
                  contentFit="cover"
                  nativeControls={false}
                  player={appPlayer}
                  playsInline
                  pointerEvents="none"
                  style={styles.heroVideo}
                  surfaceType={
                    Platform.OS === 'android' ? 'textureView' : undefined
                  }
                  useExoShutter={false}
                />

                <View pointerEvents="none" style={styles.heroAppVideoShade} />

                <View style={styles.heroAppLabel}>
                  <Search color="#FFFFFF" size={13} strokeWidth={2.5} />
                  <Text style={styles.heroAppLabelText}>Easily Book a Drop-in Visit</Text>
                </View>
              </Pressable>
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

          <Pressable
            accessibilityHint="Opens PawReport Live"
            accessibilityLabel="Learn about PawReport Live"
            accessibilityRole="button"
            onPress={() => router.push('/pawreport-live' as never)}
            style={({ pressed }) => [
              styles.pawReportCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.pawReportIconWrap}>
              <PawPrint
                color={styles.pawReportIconText.color}
                size={23}
                strokeWidth={2.4}
              />
              <View style={styles.pawReportLiveDot} />
            </View>

            <View style={styles.pawReportCopy}>
              <View style={styles.pawReportBadge}>
                <Text style={styles.pawReportBadgeText}>
                  EXCLUSIVE SITGURU FEATURE
                </Text>
              </View>

              <Text style={styles.pawReportTitle}>
                Follow care in real time with PawReport Live.
              </Text>

              <Text style={styles.pawReportBody}>
                Live walks, visit updates, photos, and final care summaries in
                one trusted report.
              </Text>
            </View>

            <ArrowRight
              color={styles.pawReportArrow.color}
              size={18}
              strokeWidth={2.5}
            />
          </Pressable>

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

          <View style={styles.socialSection}>
            <View style={styles.socialHeadingRow}>
              <Text style={styles.socialTitle}>Follow SitGuru</Text>

              <View style={styles.socialIdentityRow}>
                <Text style={styles.socialHandle}>@SitGuruOfficial</Text>
                <Text style={styles.socialIdentityDot}>•</Text>
                <Text style={styles.socialHashtag}>#SitGuruOfficial</Text>
              </View>
            </View>

            <View style={styles.socialIconRow}>
              {socialLinks.map((link) => (
                <Pressable
                  key={link.label}
                  accessibilityHint={`Opens SitGuru on ${link.label}`}
                  accessibilityLabel={`Follow SitGuru on ${link.label}`}
                  accessibilityRole="link"
                  onPress={() => void openSocialProfile(link)}
                  style={({ pressed }) => [
                    styles.socialIconButton,
                    pressed && styles.pressed,
                  ]}>
                  <FontAwesome6
                    color={styles.socialGlyph.color}
                    name={link.icon}
                    size={19}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.bottomSpacer} />
                </View>
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
      position: 'relative',
      width: '100%',
    },
    scrollCanvas: {
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
    },
    backgroundPawLayer: {
      bottom: 0,
      left: 0,
      overflow: 'hidden',
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 0,
    },
    backgroundPaw: {
      opacity: isDark ? 0.2 : 0.12,
      position: 'absolute',
      tintColor: isDark ? '#48C77B' : '#6A9D78',
    },
    backgroundPawOne: {
      right: 25,
      top: 72,
      transform: [{ rotate: '18deg' }],
    },
    backgroundPawTwo: {
      left: 15,
      top: 248,
      transform: [{ rotate: '-16deg' }],
    },
    backgroundPawThree: {
      right: 14,
      top: 456,
      transform: [{ rotate: '25deg' }],
    },
    backgroundPawFour: {
      left: 28,
      top: 638,
      transform: [{ rotate: '-10deg' }],
    },
    backgroundPawFive: {
      right: 29,
      top: 813,
      transform: [{ rotate: '17deg' }],
    },
    backgroundPawSix: {
      left: 11,
      top: 994,
      transform: [{ rotate: '-22deg' }],
    },
    backgroundPawSeven: {
      right: 18,
      top: 1085,
      transform: [{ rotate: '12deg' }],
    },
    backgroundPawEight: {
      left: 44,
      top: 1240,
      transform: [{ rotate: '-14deg' }],
    },
    backgroundPawNine: {
      right: 34,
      top: 1390,
      transform: [{ rotate: '24deg' }],
    },
    contentLayer: {
      position: 'relative',
      zIndex: 1,
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
      gap: 16,
      paddingBottom: 2,
    },
    heroCopy: {
      paddingHorizontal: 22,
      paddingTop: 8,
    },
    heroEyebrow: {
      color: isDark ? '#58D58A' : BrandColors.greenDark,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
      letterSpacing: 1.1,
      marginBottom: 8,
    },
    heroTitle: {
      color: title,
      fontFamily: AppFonts.extraBold,
      fontSize: isTablet ? 44 : 37,
      letterSpacing: -1.25,
      lineHeight: isTablet ? 50 : 42,
    },
    heroTitleAccent: {
      color: isDark ? '#58D58A' : '#0A9B62',
    },
    heroSubtitle: {
      color: body,
      fontFamily: AppFonts.medium,
      fontSize: isTablet ? 16 : 14,
      lineHeight: isTablet ? 23 : 20,
      marginTop: 12,
      maxWidth: isTablet ? 620 : 360,
    },
    heroButtonRow: {
      flexDirection: isTablet ? 'row' : 'column',
      gap: 10,
      marginTop: 17,
    },
    heroPrimaryButton: {
      alignItems: 'center',
      backgroundColor: isDark ? '#159A61' : '#0A9B62',
      borderRadius: 13,
      flex: isTablet ? 1 : undefined,
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'center',
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
      flex: isTablet ? 1 : undefined,
      justifyContent: 'center',
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
    heroMediaStage: {
      height: isTablet ? 330 : 272,
      marginHorizontal: 18,
      position: 'relative',
    },
    heroCareVideoCard: {
      backgroundColor: isDark ? '#10251C' : '#EAF3EC',
      borderColor: border,
      borderRadius: 28,
      borderWidth: 1,
      bottom: isTablet ? 0 : 34,
      left: 0,
      overflow: 'hidden',
      position: 'absolute',
      right: isTablet ? '34%' : 0,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.24 : 0.11,
      shadowRadius: 18,
      top: 0,
    },
    heroAppVideoCard: {
      backgroundColor: isDark ? '#151F1A' : '#F7F2E9',
      borderColor: isDark ? '#3A6650' : '#FFFFFF',
      borderRadius: 21,
      borderWidth: 3,
      bottom: 0,
      height: isTablet ? '100%' : 124,
      overflow: 'hidden',
      position: 'absolute',
      right: 0,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 9 },
      shadowOpacity: isDark ? 0.32 : 0.2,
      shadowRadius: 16,
      width: isTablet ? '38%' : '46%',
    },
    heroPoster: {
      bottom: 0,
      height: '100%',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      width: '100%',
    },
    heroVideo: {
      bottom: 0,
      height: '100%',
      left: 0,
      opacity: 1,
      position: 'absolute',
      right: 0,
      top: 0,
      width: '100%',
    },
    heroVideoShade: {
      backgroundColor: isDark
        ? 'rgba(6,20,15,0.16)'
        : 'rgba(10,48,34,0.05)',
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    heroAppVideoShade: {
      backgroundColor: isDark
        ? 'rgba(6,20,15,0.12)'
        : 'rgba(11,39,29,0.08)',
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    heroVideoLabel: {
      alignItems: 'center',
      backgroundColor: 'rgba(6,20,15,0.76)',
      borderRadius: 999,
      flexDirection: 'row',
      gap: 6,
      left: 12,
      paddingHorizontal: 10,
      paddingVertical: 7,
      position: 'absolute',
      top: 12,
    },
    heroVideoLabelDot: {
      backgroundColor: '#58D58A',
      borderRadius: 999,
      height: 7,
      width: 7,
    },
    heroVideoLabelText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    heroAppLabel: {
      alignItems: 'center',
      backgroundColor: 'rgba(6,20,15,0.82)',
      borderRadius: 999,
      bottom: 9,
      flexDirection: 'row',
      gap: 5,
      left: 9,
      paddingHorizontal: 9,
      paddingVertical: 7,
      position: 'absolute',
      right: 9,
    },
    heroAppLabelText: {
      color: '#FFFFFF',
      flex: 1,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    trustBadge: {
      alignItems: 'center',
      backgroundColor: surface,
      borderColor: border,
      borderRadius: 13,
      borderWidth: 1,
      bottom: isTablet ? 12 : 10,
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
      marginTop: 14,
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

    pawReportCard: {
      alignItems: 'center',
      backgroundColor: isDark ? '#0D2B20' : '#EFF9F2',
      borderColor: isDark ? '#2D6548' : '#CFE8D5',
      borderRadius: 19,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      marginHorizontal: 18,
      marginTop: 15,
      minHeight: 118,
      paddingHorizontal: 13,
      paddingVertical: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: isDark ? 0.18 : 0.06,
      shadowRadius: 14,
    },
    pawReportIconWrap: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: isDark ? '#123E2A' : '#DFF2E5',
      borderRadius: 14,
      height: 44,
      justifyContent: 'center',
      marginTop: 2,
      position: 'relative',
      width: 44,
    },
    pawReportIconText: {
      color: isDark ? '#58D58A' : BrandColors.greenDark,
    },
    pawReportLiveDot: {
      backgroundColor: '#39D982',
      borderColor: isDark ? '#123E2A' : '#DFF2E5',
      borderRadius: 999,
      borderWidth: 2,
      height: 10,
      position: 'absolute',
      right: 3,
      top: 3,
      width: 10,
    },
    pawReportCopy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    pawReportBadge: {
      alignSelf: 'flex-start',
      backgroundColor: isDark ? 'rgba(88,213,138,0.12)' : '#FFFFFF',
      borderColor: isDark ? '#2D6548' : '#BFE3CB',
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    pawReportBadgeText: {
      color: isDark ? '#58D58A' : BrandColors.greenDark,
      fontFamily: AppFonts.extraBold,
      fontSize: 7,
      letterSpacing: 0.7,
    },
    pawReportTitle: {
      color: title,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
      letterSpacing: -0.2,
      lineHeight: 17,
    },
    pawReportBody: {
      color: body,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    pawReportArrow: {
      color: isDark ? '#58D58A' : BrandColors.greenDark,
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

    socialGlyph: {
      color: isDark ? '#58D58A' : BrandColors.greenDark,
    },
    socialSection: {
      gap: 10,
      marginHorizontal: 18,
      marginTop: 13,
      paddingHorizontal: 2,
      paddingVertical: 2,
    },
    socialHeadingRow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: 'space-between',
    },
    socialTitle: {
      color: title,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    socialIdentityRow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    socialHandle: {
      color: isDark ? '#58D58A' : BrandColors.greenDark,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    socialIdentityDot: {
      color: muted,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    socialHashtag: {
      color: isDark ? '#58D58A' : BrandColors.greenDark,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    socialIconRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
    },
    socialIconButton: {
      alignItems: 'center',
      backgroundColor: isDark ? '#123E2A' : '#E7F7EC',
      borderColor: isDark ? '#2E6C4B' : '#CDEBD7',
      borderRadius: 999,
      borderWidth: 1,
      flex: 1,
      height: 46,
      justifyContent: 'center',
      maxWidth: 54,
      minWidth: 46,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.16 : 0.05,
      shadowRadius: 7,
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
      zIndex: 3,
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