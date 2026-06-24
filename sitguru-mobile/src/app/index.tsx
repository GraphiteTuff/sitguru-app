import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type AppRoute = '/find-care' | '/signup' | '/login';

type MediaCard = {
  label: string;
  title: string;
  subtitle: string;
  route: AppRoute;
};

type RoleCard = {
  title: string;
  eyebrow: string;
  description: string;
  route: AppRoute;
};

const services = ['Walks', 'Sitting', 'Boarding', 'Drop-ins', 'Day Care'];

const mediaCards: MediaCard[] = [
  {
    label: 'Pet Parents',
    title: 'Find care nearby',
    subtitle: 'Search trusted local Gurus by service and ZIP code.',
    route: '/find-care',
  },
  {
    label: 'Pet Gurus',
    title: 'Earn locally',
    subtitle: 'Offer pet care services independently in your area.',
    route: '/signup',
  },
  {
    label: 'PawReport™',
    title: 'Stay connected',
    subtitle: 'Photos, care notes, food, water, potty updates, and visit timing.',
    route: '/find-care',
  },
];

const roleCards: RoleCard[] = [
  {
    title: 'Pet Parents',
    eyebrow: 'Find Care',
    description:
      'Search local Gurus, message, request care, and keep pet details organized.',
    route: '/find-care',
  },
  {
    title: 'Pet Gurus',
    eyebrow: 'Offer Care',
    description:
      'Create a profile, set your service area, manage bookings, and view earnings.',
    route: '/signup',
  },
  {
    title: 'Ambassadors',
    eyebrow: 'Grow Community',
    description:
      'Share SitGuru, track referrals, complete training, and support local growth.',
    route: '/signup',
  },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  return (
    <SitGuruScreen scroll center={false} maxWidth={820}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <SitGuruLogo size="medium" variant="horizontal" />
        </View>

        <View style={[styles.hero, isWide && styles.heroWide]}>
          <View style={styles.heroCopy}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Local trusted marketplace</Text>
            </View>

            <Text style={styles.title}>Trusted pet care. Made simple.</Text>

            <Text style={styles.subtitle}>
              SitGuru connects Pet Parents with trusted independent local Gurus
              for walks, sitting, boarding, training, drop-in visits, and more.
            </Text>

            <View style={[styles.heroActions, isWide && styles.heroActionsWide]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/find-care')}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Find Care</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/login')}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Log In</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.heroMediaStack}>
            <View style={styles.mainPhotoCard}>
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderIcon}>🐾</Text>
                <Text style={styles.photoPlaceholderTitle}>Hero Photo Area</Text>
                <Text style={styles.photoPlaceholderText}>
                  Add a real Pet Parent, Guru, or pet lifestyle photo here.
                </Text>
              </View>

              <View style={styles.photoOverlay}>
                <Text style={styles.photoOverlayTitle}>Care nearby</Text>
                <Text style={styles.photoOverlayText}>
                  Search by service and ZIP code.
                </Text>
              </View>
            </View>

            <View style={styles.floatingStatCard}>
              <Text style={styles.floatingStatValue}>PawReport™</Text>
              <Text style={styles.floatingStatText}>
                Photos, notes, timing, and care updates.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSearchPanel}>
          <Text style={styles.searchEyebrow}>Start here</Text>
          <Text style={styles.searchTitle}>What service do you need?</Text>

          <View style={styles.serviceRow}>
            {services.map((service) => (
              <Pressable
                key={service}
                accessibilityRole="button"
                onPress={() => router.push('/find-care')}
                style={styles.servicePill}
              >
                <Text style={styles.servicePillText}>{service}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/find-care')}
            style={styles.zipSearchButton}
          >
            <View style={styles.zipIconCircle}>
              <Text style={styles.zipIcon}>⌖</Text>
            </View>

            <View style={styles.zipSearchCopy}>
              <Text style={styles.zipSearchTitle}>Search Gurus by ZIP code</Text>
              <Text style={styles.zipSearchText}>
                Find trusted local care near you.
              </Text>
            </View>

            <Text style={styles.zipArrow}>→</Text>
          </Pressable>
        </View>

        <View style={styles.mediaSection}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionEyebrow}>Built around real care</Text>
            <Text style={styles.sectionTitle}>People, pets, and local trust.</Text>
          </View>

          <View style={[styles.mediaGrid, isWide && styles.mediaGridWide]}>
            {mediaCards.map((card) => (
              <Pressable
                key={card.label}
                accessibilityRole="button"
                onPress={() => router.push(card.route)}
                style={styles.mediaCard}
              >
                <View style={styles.mediaImageFrame}>
                  <View style={styles.mediaImagePlaceholder}>
                    <Text style={styles.mediaImageIcon}>＋</Text>
                    <Text style={styles.mediaImageText}>Photo</Text>
                  </View>

                  <View style={styles.mediaLabel}>
                    <Text style={styles.mediaLabelText}>{card.label}</Text>
                  </View>
                </View>

                <Text style={styles.mediaTitle}>{card.title}</Text>
                <Text style={styles.mediaSubtitle}>{card.subtitle}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.roleSection}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionEyebrow}>SitGuru One Access</Text>
            <Text style={styles.sectionTitle}>
              One account. All your dashboards.
            </Text>
            <Text style={styles.sectionText}>
              Create an account once and choose the role that fits you best.
              Multiple roles can live under one SitGuru login.
            </Text>
          </View>

          <View style={[styles.roleGrid, isWide && styles.roleGridWide]}>
            {roleCards.map((role, index) => (
              <Pressable
                key={role.title}
                accessibilityRole="button"
                onPress={() => router.push(role.route)}
                style={styles.roleCard}
              >
                <View style={styles.roleTopRow}>
                  <Text style={styles.roleEyebrow}>{role.eyebrow}</Text>
                  <View style={styles.roleNumber}>
                    <Text style={styles.roleNumberText}>{index + 1}</Text>
                  </View>
                </View>

                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
                <Text style={styles.roleLink}>
                  {role.route === '/find-care' ? 'Find care →' : 'Get started →'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.pawReportPanel, isWide && styles.pawReportPanelWide]}>
          <View style={styles.pawReportVisual}>
            <View style={styles.pawReportPhotoSlot}>
              <Text style={styles.pawReportPhotoIcon}>🐶</Text>
              <Text style={styles.pawReportPhotoText}>Visit photo area</Text>
            </View>

            <View style={styles.pawReportFloatingNote}>
              <Text style={styles.pawReportFloatingTitle}>Visit complete</Text>
              <Text style={styles.pawReportFloatingText}>
                Food, water, potty, notes, and photos updated.
              </Text>
            </View>
          </View>

          <View style={styles.pawReportCopy}>
            <Text style={styles.pawReportEyebrow}>Exclusive SitGuru Feature</Text>
            <Text style={styles.pawReportTitle}>
              Stay connected with every visit.
            </Text>
            <Text style={styles.pawReportText}>
              Every booking includes a SitGuru PawReport™ with photos, potty
              updates, food and water confirmations, care notes, visit timing,
              and a complete summary from your Guru.
            </Text>
          </View>
        </View>

        <View style={styles.stepsPanel}>
          <Text style={styles.sectionEyebrow}>How SitGuru works</Text>
          <Text style={styles.sectionTitle}>Simple from the first tap.</Text>

          <View style={styles.stepList}>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>01</Text>
              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>Find a Guru</Text>
                <Text style={styles.stepText}>
                  Search local care by service and location.
                </Text>
              </View>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>02</Text>
              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>Message or request care</Text>
                <Text style={styles.stepText}>
                  Choose the right care for your pet and keep details organized.
                </Text>
              </View>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>03</Text>
              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>Book on-platform</Text>
                <Text style={styles.stepText}>
                  Keep booking details, care notes, updates, and support in one
                  place.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.localPanel}>
          <Text style={styles.localTitle}>
            Built for Pet Parents, Pet Gurus, and local communities.
          </Text>

          <Text style={styles.localText}>
            Pet Parents can find local care, Pet Gurus can apply to offer
            services independently, and Ambassadors can help spread the word.
            SitGuru keeps the experience simple, welcoming, and easy to start.
          </Text>

          <View style={[styles.localActions, isWide && styles.localActionsWide]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/find-care')}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Find Care Near Me</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/signup')}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Become a Guru</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.bottomDockSpacer} />
      </View>

      <View style={styles.bottomDock}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/find-care')}
          style={styles.dockPrimaryAction}
        >
          <Text style={styles.dockPrimaryText}>Find Care</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/signup')}
          style={styles.dockIconButton}
        >
          <Text style={styles.dockIconText}>Guru</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/login')}
          style={styles.dockIconButton}
        >
          <Text style={styles.dockIconText}>Login</Text>
        </Pressable>
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 22,
    paddingBottom: 18,
    paddingTop: 2,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  hero: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 38,
    borderWidth: 1,
    elevation: 5,
    gap: 18,
    overflow: 'hidden',
    padding: 18,
  },
  heroWide: {
    flexDirection: 'row',
  },
  heroCopy: {
    flex: 1,
    gap: 18,
    justifyContent: 'center',
    padding: 4,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: SitGuruColors.text,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.7,
    lineHeight: 46,
  },
  subtitle: {
    color: SitGuruColors.textMuted,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 27,
    maxWidth: 540,
  },
  heroActions: {
    gap: 12,
  },
  heroActionsWide: {
    flexDirection: 'row',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 22,
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 22,
    paddingVertical: 15,
  },
  secondaryButtonText: {
    color: SitGuruColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  heroMediaStack: {
    flex: 1,
    gap: 12,
    minHeight: 360,
  },
  mainPhotoCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 34,
    borderWidth: 1,
    flex: 1,
    minHeight: 330,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPlaceholder: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    padding: 22,
  },
  photoPlaceholderIcon: {
    fontSize: 46,
  },
  photoPlaceholderTitle: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  photoPlaceholderText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    maxWidth: 240,
    textAlign: 'center',
  },
  photoOverlay: {
    backgroundColor: 'rgba(16, 21, 19, 0.32)',
    borderRadius: 24,
    bottom: 14,
    left: 14,
    padding: 14,
    position: 'absolute',
    right: 14,
  },
  photoOverlayTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  photoOverlayText: {
    color: '#E8F4EC',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 3,
  },
  floatingStatCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 3,
    gap: 4,
    padding: 16,
  },
  floatingStatValue: {
    color: SitGuruColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  floatingStatText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  bottomSearchPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 32,
    borderWidth: 1,
    elevation: 4,
    gap: 14,
    padding: 18,
  },
  searchEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  searchTitle: {
    color: SitGuruColors.text,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  serviceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servicePill: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  servicePillText: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  zipSearchButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 26,
    flexDirection: 'row',
    gap: 12,
    minHeight: 72,
    padding: 14,
  },
  zipIconCircle: {
    alignItems: 'center',
    backgroundColor: '#C9F26D',
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  zipIcon: {
    color: SitGuruColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  zipSearchCopy: {
    flex: 1,
    gap: 3,
  },
  zipSearchTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  zipSearchText: {
    color: '#DCEFE2',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  zipArrow: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  mediaSection: {
    gap: 14,
  },
  sectionHeading: {
    gap: 8,
    paddingHorizontal: 2,
  },
  sectionEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: SitGuruColors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 35,
  },
  sectionText: {
    color: SitGuruColors.textMuted,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    maxWidth: 620,
  },
  mediaGrid: {
    gap: 12,
  },
  mediaGridWide: {
    flexDirection: 'row',
  },
  mediaCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    flex: 1,
    gap: 10,
    overflow: 'hidden',
    padding: 12,
  },
  mediaImageFrame: {
    backgroundColor: SitGuruColors.background,
    borderRadius: 24,
    height: 220,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImagePlaceholder: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  mediaImageIcon: {
    color: SitGuruColors.primary,
    fontSize: 30,
    fontWeight: '900',
  },
  mediaImageText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  mediaLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
    top: 12,
  },
  mediaLabelText: {
    color: SitGuruColors.text,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  mediaTitle: {
    color: SitGuruColors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    paddingHorizontal: 4,
  },
  mediaSubtitle: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
    paddingBottom: 4,
    paddingHorizontal: 4,
  },
  roleSection: {
    gap: 14,
  },
  roleGrid: {
    gap: 12,
  },
  roleGridWide: {
    flexDirection: 'row',
  },
  roleCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    flex: 1,
    gap: 12,
    minHeight: 190,
    padding: 18,
  },
  roleTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  roleNumber: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  roleNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  roleTitle: {
    color: SitGuruColors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  roleDescription: {
    color: SitGuruColors.textMuted,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  roleLink: {
    color: SitGuruColors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  pawReportPanel: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 38,
    gap: 18,
    overflow: 'hidden',
    padding: 18,
  },
  pawReportPanelWide: {
    flexDirection: 'row',
  },
  pawReportVisual: {
    flex: 1,
    minHeight: 300,
    position: 'relative',
  },
  pawReportPhotoSlot: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 30,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    minHeight: 300,
    padding: 20,
  },
  pawReportPhotoIcon: {
    fontSize: 46,
  },
  pawReportPhotoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  pawReportFloatingNote: {
    backgroundColor: '#C9F26D',
    borderRadius: 22,
    bottom: 14,
    gap: 4,
    left: 14,
    padding: 14,
    position: 'absolute',
    right: 14,
  },
  pawReportFloatingTitle: {
    color: SitGuruColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  pawReportFloatingText: {
    color: '#263229',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  pawReportCopy: {
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 4,
  },
  pawReportEyebrow: {
    color: '#C9F26D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  pawReportTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 37,
  },
  pawReportText: {
    color: '#DCEFE2',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  stepsPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 32,
    borderWidth: 1,
    gap: 16,
    padding: 20,
  },
  stepList: {
    gap: 0,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
  },
  stepNumber: {
    color: SitGuruColors.primary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    width: 38,
  },
  stepCopy: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  stepText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  stepDivider: {
    backgroundColor: SitGuruColors.border,
    height: 1,
    marginLeft: 54,
  },
  localPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 36,
    borderWidth: 1,
    gap: 14,
    padding: 22,
  },
  localTitle: {
    color: SitGuruColors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 35,
  },
  localText: {
    color: SitGuruColors.textMuted,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  localActions: {
    gap: 12,
    marginTop: 4,
  },
  localActionsWide: {
    flexDirection: 'row',
  },
  bottomDockSpacer: {
    height: 86,
  },
  bottomDock: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    bottom: 16,
    elevation: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    left: 16,
    padding: 8,
    position: 'absolute',
    right: 16,
  },
  dockPrimaryAction: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
  },
  dockPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  dockIconButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    minWidth: 74,
    paddingHorizontal: 14,
  },
  dockIconText: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
});