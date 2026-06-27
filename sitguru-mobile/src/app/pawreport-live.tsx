import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruBottomNav from '@/components/SitGuruBottomNav';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

const liveUpdates = [
  {
    id: 'started',
    emoji: '🚶',
    label: 'Walk started',
    meta: '12:30 PM',
    text: 'Your Guru started Scout’s walk.',
  },
  {
    id: 'potty',
    emoji: '💩',
    label: 'Potty update',
    meta: '12:38 PM',
    text: 'Potty break completed during the walk.',
  },
  {
    id: 'water',
    emoji: '💧',
    label: 'Water offered',
    meta: '12:44 PM',
    text: 'Water was offered after a short rest.',
  },
  {
    id: 'photo',
    emoji: '📸',
    label: 'Photo update',
    meta: '12:48 PM',
    text: 'Photo placeholder for a future PawReport image.',
  },
  {
    id: 'note',
    emoji: '📝',
    label: 'Care note',
    meta: 'Now',
    text: 'Scout is walking at an easy pace and doing well.',
  },
];

function showBookingPlaceholder() {
  Alert.alert(
    'Booking details placeholder',
    'The booking details screen is not created yet. This will open the active booking once wired.',
  );
}

export default function PawReportLiveScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/pet-parent-dashboard')}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>‹ Back</Text>
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>PawReport Live</Text>
            <Text style={styles.title}>Scout’s walk is in progress.</Text>
            <Text style={styles.subtitle}>
              Follow live care status, route preview, distance, timing, and
              updates while your Guru is caring for your pet.
            </Text>
          </View>
        </View>

        <View style={styles.liveStatusCard}>
          <View>
            <Text style={styles.liveStatusLabel}>Current status</Text>
            <Text style={styles.liveStatusTitle}>Walking</Text>
            <Text style={styles.liveStatusText}>
              Last updated just now. Tracking is visual-only in this preview.
            </Text>
          </View>

          <View style={styles.livePulse}>
            <Text style={styles.livePulseText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.profileRow}>
          <View style={styles.profileCard}>
            <Text style={styles.profileAvatar}>🏡</Text>
            <Text style={styles.profileLabel}>Guru</Text>
            <Text style={styles.profileName}>Local Guru</Text>
            <Text style={styles.profileText}>Certified Guru • Walking now</Text>
          </View>

          <View style={styles.profileCard}>
            <Text style={styles.profileAvatar}>🐶</Text>
            <Text style={styles.profileLabel}>Pet</Text>
            <Text style={styles.profileName}>Scout</Text>
            <Text style={styles.profileText}>Dog • 30-minute walk</Text>
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Live route preview</Text>
            <Text style={styles.mapBadge}>No GPS yet</Text>
          </View>

          <View style={styles.mapCanvas}>
            <View style={styles.mapBlockOne} />
            <View style={styles.mapBlockTwo} />
            <View style={styles.mapPark} />
            <View style={[styles.routeLine, styles.routeOne]} />
            <View style={[styles.routeLine, styles.routeTwo]} />
            <View style={[styles.routeLine, styles.routeThree]} />
            <View style={[styles.routeNode, styles.nodeStart]} />
            <View style={[styles.routeNode, styles.nodeEnd]} />
            <View style={styles.currentPin}>
              <Text style={styles.currentPinText}>🐾</Text>
            </View>
            <Text style={styles.mapLabel}>Route preview placeholder</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Elapsed" value="18 min" />
          <StatCard label="Distance" value="0.7 mi" />
          <StatCard label="ETA" value="12 min" />
          <StatCard label="Updated" value="Now" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live PawReport timeline</Text>

          <View style={styles.timelineList}>
            {liveUpdates.map((item) => (
              <View key={item.id} style={styles.timelineItem}>
                <Text style={styles.timelineEmoji}>{item.emoji}</Text>

                <View style={styles.timelineCopy}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineTitle}>{item.label}</Text>
                    <Text style={styles.timelineMeta}>{item.meta}</Text>
                  </View>

                  <Text style={styles.timelineText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Safety and privacy</Text>
          <Text style={styles.safetyText}>
            Live tracking only runs during active care.
          </Text>
          <Text style={styles.safetyText}>
            Only the Pet Parent, assigned Guru, and SitGuru support should be
            able to view active visit tracking once wired.
          </Text>
        </View>

        <View style={styles.actionStack}>
          <PrimaryButton
            label="Message Guru"
            onPress={() => router.push('/conversation')}
          />

          <SecondaryButton
            label="View Booking"
            onPress={showBookingPlaceholder}
          />

          <SecondaryButton
            label="Back to Dashboard"
            onPress={() => router.push('/pet-parent-dashboard')}
          />
        </View>

        <SitGuruBottomNav
          items={[
            { icon: 'home', label: 'Dashboard' },
            { icon: 'message', label: 'Message' },
            { icon: 'booking', label: 'Booking' },
          ]}
          tone="primary"
        />
      </View>
    </SitGuruScreen>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.primaryButton}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.secondaryButton}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 16,
    paddingBottom: 4,
    paddingVertical: 4,
  },
  header: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 28,
    gap: 14,
    padding: 18,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  headerCopy: {
    gap: 6,
  },
  eyebrow: {
    color: '#C9F26D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
  },
  subtitle: {
    color: '#DDEDE2',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  liveStatusCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 26,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    padding: 16,
  },
  liveStatusLabel: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  liveStatusTitle: {
    color: SitGuruColors.text,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 31,
  },
  liveStatusText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  livePulse: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  livePulseText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  profileRow: {
    flexDirection: 'row',
    gap: 10,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    padding: 14,
  },
  profileAvatar: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 999,
    fontSize: 34,
    overflow: 'hidden',
    padding: 12,
  },
  profileLabel: {
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  profileName: {
    color: SitGuruColors.text,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  profileText: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
  },
  mapCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 30,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  mapHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mapTitle: {
    color: SitGuruColors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  mapBadge: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 999,
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  mapCanvas: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderRadius: 24,
    borderWidth: 1,
    height: 270,
    overflow: 'hidden',
    position: 'relative',
  },
  mapBlockOne: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    height: 72,
    left: 24,
    position: 'absolute',
    top: 24,
    width: 112,
  },
  mapBlockTwo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    bottom: 28,
    height: 92,
    position: 'absolute',
    right: 28,
    width: 128,
  },
  mapPark: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    height: 116,
    position: 'absolute',
    right: 34,
    top: 34,
    width: 116,
  },
  routeLine: {
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    height: 10,
    position: 'absolute',
  },
  routeOne: {
    left: 48,
    top: 82,
    transform: [{ rotate: '14deg' }],
    width: 120,
  },
  routeTwo: {
    left: 148,
    top: 122,
    transform: [{ rotate: '45deg' }],
    width: 105,
  },
  routeThree: {
    right: 50,
    top: 178,
    transform: [{ rotate: '7deg' }],
    width: 112,
  },
  routeNode: {
    backgroundColor: SitGuruColors.primary,
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 4,
    height: 28,
    position: 'absolute',
    width: 28,
    zIndex: 2,
  },
  nodeStart: {
    left: 34,
    top: 70,
  },
  nodeEnd: {
    right: 38,
    top: 176,
  },
  currentPin: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: SitGuruColors.primary,
    borderRadius: 999,
    borderWidth: 3,
    height: 54,
    justifyContent: 'center',
    left: '50%',
    position: 'absolute',
    top: 118,
    width: 54,
    zIndex: 3,
  },
  currentPinText: {
    fontSize: 25,
  },
  mapLabel: {
    bottom: 18,
    color: SitGuruColors.textSoft,
    fontSize: 12,
    fontWeight: '900',
    left: 22,
    position: 'absolute',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    minWidth: 145,
    padding: 14,
  },
  statValue: {
    color: SitGuruColors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 26,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  sectionTitle: {
    color: SitGuruColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  timelineList: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineEmoji: {
    fontSize: 24,
    width: 34,
  },
  timelineCopy: {
    flex: 1,
    gap: 4,
  },
  timelineHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineTitle: {
    color: SitGuruColors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  timelineMeta: {
    color: SitGuruColors.textSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  timelineText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  safetyCard: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  safetyTitle: {
    color: SitGuruColors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  safetyText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  actionStack: {
    gap: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 56,
    padding: 16,
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
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    padding: 15,
  },
  secondaryButtonText: {
    color: SitGuruColors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
});