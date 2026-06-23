import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import SitGuruIconBadge from '@/components/SitGuruIconBadge';
import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type RoleRoute =
  | '/pet-parent-dashboard'
  | '/guru-dashboard'
  | '/ambassador-dashboard';

type RoleOption = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  route: RoleRoute;
  icon: 'care' | 'service' | 'community';
  tone: 'primary' | 'warning' | 'danger';
  photoLabel: string;
};

const roleOptions: RoleOption[] = [
  {
    id: 'pet-parent',
    eyebrow: 'Find Care',
    title: 'Pet Parent',
    description:
      'Search trusted local Gurus, organize pet details, message before booking, and request care.',
    actionLabel: 'Open Pet Parent',
    route: '/pet-parent-dashboard',
    icon: 'care',
    tone: 'primary',
    photoLabel: 'Pet Parent + pet photo',
  },
  {
    id: 'guru',
    eyebrow: 'Offer Care',
    title: 'Pet Guru',
    description:
      'Manage your profile, service area, requests, bookings, visit updates, earnings, and availability.',
    actionLabel: 'Open Guru',
    route: '/guru-dashboard',
    icon: 'service',
    tone: 'warning',
    photoLabel: 'Guru care photo',
  },
  {
    id: 'ambassador',
    eyebrow: 'Grow Community',
    title: 'Ambassador',
    description:
      'Share SitGuru, track referrals, complete training, view rewards, and support local growth.',
    actionLabel: 'Open Ambassador',
    route: '/ambassador-dashboard',
    icon: 'community',
    tone: 'danger',
    photoLabel: 'Community photo',
  },
];

const quickActions = [
  {
    label: 'Messages',
    description: 'Start with a conversation before care is booked.',
  },
  {
    label: 'Bookings',
    description: 'Keep care requests, notes, and updates organized.',
  },
  {
    label: 'Profiles',
    description: 'Manage role details from one SitGuru account.',
  },
];

export default function RoleSelectionScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  return (
    <SitGuruScreen scroll center={false} maxWidth={820}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <SitGuruLogo size="small" variant="symbol" />

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/')}
            style={styles.topLinkButton}
          >
            <Text style={styles.topLinkText}>Home</Text>
          </Pressable>
        </View>

        <View style={[styles.heroPanel, isWide && styles.heroPanelWide]}>
          <View style={styles.heroCopy}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>SitGuru One Access</Text>
            </View>

            <Text style={styles.title}>Choose your SitGuru dashboard.</Text>

            <Text style={styles.subtitle}>
              One account can support Pet Parent, Pet Guru, and Ambassador
              access. Choose where you want to go today.
            </Text>

            <View style={styles.pathPreview}>
              <View style={styles.pathStep}>
                <SitGuruIconBadge name="care" size="small" tone="primary" />
                <Text style={styles.pathText}>Book</Text>
              </View>

              <View style={styles.pathLine} />

              <View style={styles.pathStep}>
                <SitGuruIconBadge name="service" size="small" tone="warning" />
                <Text style={styles.pathText}>Offer</Text>
              </View>

              <View style={styles.pathLine} />

              <View style={styles.pathStep}>
                <SitGuruIconBadge name="community" size="small" tone="danger" />
                <Text style={styles.pathText}>Grow</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroPhotoCard}>
            <View style={styles.heroPhotoPlaceholder}>
              <Text style={styles.heroPhotoIcon}>🐾</Text>
              <Text style={styles.heroPhotoTitle}>Role photo area</Text>
              <Text style={styles.heroPhotoText}>
                Add Pet Parent, Guru, Ambassador, or pet lifestyle photos here
                later.
              </Text>
            </View>

            <View style={styles.heroFloatingCard}>
              <Text style={styles.heroFloatingTitle}>One login</Text>
              <Text style={styles.heroFloatingText}>
                Switch between registered roles.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>Your roles</Text>
          <Text style={styles.sectionTitle}>Pick a dashboard.</Text>
        </View>

        <View style={[styles.roleGrid, isWide && styles.roleGridWide]}>
          {roleOptions.map((role) => (
            <Pressable
              key={role.id}
              accessibilityRole="button"
              onPress={() => router.push(role.route)}
              style={styles.roleCard}
            >
              <View style={styles.rolePhotoSlot}>
                <Text style={styles.rolePhotoIcon}>＋</Text>
                <Text style={styles.rolePhotoText}>{role.photoLabel}</Text>
              </View>

              <View style={styles.roleContent}>
                <View style={styles.roleTopRow}>
                  <Text style={styles.roleEyebrow}>{role.eyebrow}</Text>
                  <SitGuruIconBadge
                    name={role.icon}
                    size="small"
                    tone={role.tone}
                  />
                </View>

                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>

                <View style={styles.roleAction}>
                  <Text style={styles.roleActionText}>{role.actionLabel}</Text>
                  <Text style={styles.roleArrow}>→</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.quickPanel}>
          <Text style={styles.quickEyebrow}>Built for daily use</Text>
          <Text style={styles.quickTitle}>Keep everything close to your thumb.</Text>

          <View style={styles.quickGrid}>
            {quickActions.map((item) => (
              <View key={item.label} style={styles.quickCard}>
                <Text style={styles.quickCardTitle}>{item.label}</Text>
                <Text style={styles.quickCardText}>{item.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </View>

      <View style={styles.bottomDock}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/pet-parent-dashboard')}
          style={styles.dockPrimaryAction}
        >
          <Text style={styles.dockPrimaryText}>Find Care</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/guru-dashboard')}
          style={styles.dockButton}
        >
          <Text style={styles.dockButtonText}>Guru</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/ambassador-dashboard')}
          style={styles.dockButton}
        >
          <Text style={styles.dockButtonText}>Ambassador</Text>
        </Pressable>
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 18,
    paddingBottom: 14,
    paddingVertical: 4,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topLinkButton: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  topLinkText: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heroPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 34,
    borderWidth: 1,
    elevation: 4,
    gap: 18,
    overflow: 'hidden',
    padding: 18,
  },
  heroPanelWide: {
    flexDirection: 'row',
  },
  heroCopy: {
    flex: 1,
    gap: 16,
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
    paddingVertical: 7,
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
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.1,
    lineHeight: 45,
  },
  subtitle: {
    color: SitGuruColors.textMuted,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 25,
  },
  pathPreview: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 12,
  },
  pathStep: {
    alignItems: 'center',
    flex: 1,
    gap: 5,
  },
  pathText: {
    color: SitGuruColors.text,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pathLine: {
    backgroundColor: SitGuruColors.border,
    height: 1,
    width: 24,
  },
  heroPhotoCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 30,
    borderWidth: 1,
    flex: 1,
    minHeight: 300,
    overflow: 'hidden',
    position: 'relative',
  },
  heroPhotoPlaceholder: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    padding: 22,
  },
  heroPhotoIcon: {
    fontSize: 44,
  },
  heroPhotoTitle: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroPhotoText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    maxWidth: 250,
    textAlign: 'center',
  },
  heroFloatingCard: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 22,
    bottom: 14,
    gap: 3,
    left: 14,
    padding: 14,
    position: 'absolute',
    right: 14,
  },
  heroFloatingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  heroFloatingText: {
    color: '#DCEFE2',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  sectionHeader: {
    gap: 6,
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
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.7,
    lineHeight: 34,
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
    overflow: 'hidden',
    padding: 12,
  },
  rolePhotoSlot: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderRadius: 24,
    gap: 6,
    height: 160,
    justifyContent: 'center',
    padding: 16,
  },
  rolePhotoIcon: {
    color: SitGuruColors.primary,
    fontSize: 26,
    fontWeight: '900',
  },
  rolePhotoText: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  roleContent: {
    gap: 10,
    padding: 6,
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
  roleTitle: {
    color: SitGuruColors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  roleDescription: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  roleAction: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  roleActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  roleArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  quickPanel: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 32,
    gap: 14,
    padding: 20,
  },
  quickEyebrow: {
    color: '#DCEFE2',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  quickTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 31,
  },
  quickGrid: {
    gap: 10,
  },
  quickCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 22,
    borderWidth: 1,
    gap: 5,
    padding: 14,
  },
  quickCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  quickCardText: {
    color: '#DCEFE2',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  bottomSpacer: {
    height: 88,
  },
  bottomDock: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    paddingHorizontal: 16,
  },
  dockPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  dockButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    minWidth: 78,
    paddingHorizontal: 12,
  },
  dockButtonText: {
    color: SitGuruColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
});