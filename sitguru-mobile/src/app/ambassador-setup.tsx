import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

const setupItems = [
  'Confirm Ambassador profile',
  'Review referral and community expectations',
  'Prepare Pet Parent and Guru referral links',
  'Complete Ambassador Academy training',
  'Track referrals, rewards, and support needs',
];

export default function AmbassadorSetupScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <SitGuruLogo size="small" variant="symbol" />

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/role-selection')}
            style={styles.topLinkButton}
          >
            <Text style={styles.topLinkText}>Roles</Text>
          </Pressable>
        </View>

        <View style={styles.heroPanel}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Ambassador setup</Text>
          </View>

          <Text style={styles.title}>Prepare your Ambassador dashboard.</Text>

          <Text style={styles.subtitle}>
            Set up your referral tools, training path, outreach basics, and
            support access so you can help grow SitGuru locally.
          </Text>

          <View style={styles.photoCard}>
            <Text style={styles.photoIcon}>🌟</Text>
            <Text style={styles.photoTitle}>Ambassador photo area</Text>
            <Text style={styles.photoText}>
              Add a real Ambassador, community, pet event, or partner image here later.
            </Text>
          </View>
        </View>

        <View style={styles.setupPanel}>
          <Text style={styles.sectionEyebrow}>Setup checklist</Text>
          <Text style={styles.sectionTitle}>Referral, training, and rewards.</Text>

          <View style={styles.checklist}>
            {setupItems.map((item) => (
              <View key={item} style={styles.checkRow}>
                <Text style={styles.checkIcon}>•</Text>
                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.referralPanel}>
          <Text style={styles.referralEyebrow}>Referral code preview</Text>
          <Text style={styles.referralCode}>SITGURU</Text>
          <Text style={styles.referralText}>
            Your final referral code and links will appear here after Ambassador setup is connected.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </View>

      <View style={styles.bottomDock}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/role-selection')}
          style={styles.secondaryDockButton}
        >
          <Text style={styles.secondaryDockText}>Back</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/ambassador-dashboard')}
          style={styles.primaryDockButton}
        >
          <Text style={styles.primaryDockText}>Ambassador Dashboard</Text>
        </Pressable>
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 16,
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
    borderColor: 'rgba(180, 35, 24, 0.18)',
    borderRadius: 34,
    borderWidth: 1,
    elevation: 4,
    gap: 16,
    padding: 18,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1F0',
    borderColor: 'rgba(180, 35, 24, 0.18)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroBadgeText: {
    color: SitGuruColors.danger,
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
  photoCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 26,
    borderWidth: 1,
    gap: 8,
    justifyContent: 'center',
    minHeight: 210,
    padding: 22,
  },
  photoIcon: {
    fontSize: 42,
  },
  photoTitle: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  photoText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    maxWidth: 280,
    textAlign: 'center',
  },
  setupPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 12,
    padding: 18,
  },
  sectionEyebrow: {
    color: SitGuruColors.danger,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: SitGuruColors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 31,
  },
  checklist: {
    gap: 10,
  },
  checkRow: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  checkIcon: {
    color: SitGuruColors.danger,
    fontSize: 18,
    fontWeight: '900',
    width: 18,
  },
  checkText: {
    color: SitGuruColors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  referralPanel: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 28,
    gap: 8,
    padding: 18,
  },
  referralEyebrow: {
    color: '#DCEFE2',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  referralCode: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1.6,
    lineHeight: 39,
  },
  referralText: {
    color: '#DCEFE2',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  bottomSpacer: {
    height: 88,
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
  primaryDockButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 16,
  },
  primaryDockText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryDockButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    minWidth: 92,
    paddingHorizontal: 14,
  },
  secondaryDockText: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
});