import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruBottomNav from '@/components/SitGuruBottomNav';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

const timelineUpdates = [
  { emoji: '🚶', label: 'Walk started', meta: '12:30 PM', text: 'Scout and Maya headed out for a neighborhood walk.' },
  { emoji: '💩', label: 'Potty update', meta: '12:38 PM', text: 'Potty break recorded during the route.' },
  { emoji: '💧', label: 'Water offered', meta: '12:47 PM', text: 'Fresh water offered at the shaded rest stop.' },
  { emoji: '📸', label: 'Photo update placeholder', meta: '12:52 PM', text: 'A walk photo will appear here when photo updates are connected.' },
  { emoji: '📝', label: 'Care note', meta: '12:56 PM', text: 'Scout is walking calmly and enjoying the sunny route.' },
];

function showBookingPlaceholder() {
  Alert.alert(
    'Booking details coming soon',
    'This visual preview is not wired to a booking route yet. You can return to the dashboard safely.',
  );
}

export default function PawReportLiveScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/pet-parent-dashboard')} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>PawReport™</Text>
            <Text style={styles.title}>PawReport Live</Text>
            <Text style={styles.subtitle}>Follow active care with visual-only live tracking placeholders.</Text>
          </View>
        </View>

        <View style={styles.liveCard}>
          <View style={styles.pulseDot} />
          <View style={styles.liveCopy}>
            <Text style={styles.liveTitle}>Scout’s walk is in progress</Text>
            <Text style={styles.liveText}>Live tracking only runs during active care.</Text>
          </View>
          <Text style={styles.liveBadge}>LIVE</Text>
        </View>

        <View style={styles.profileGrid}>
          <View style={styles.profileCard}>
            <Text style={styles.avatar}>👩🏽‍🦱</Text>
            <View style={styles.profileCopy}>
              <Text style={styles.cardLabel}>Your Guru</Text>
              <Text style={styles.cardTitle}>Maya R.</Text>
              <Text style={styles.cardText}>Certified SitGuru • Dog walking</Text>
            </View>
          </View>
          <View style={styles.profileCard}>
            <Text style={styles.avatar}>🐕</Text>
            <View style={styles.profileCopy}>
              <Text style={styles.cardLabel}>Pet</Text>
              <Text style={styles.cardTitle}>Scout</Text>
              <Text style={styles.cardText}>Medium dog • Loves steady walks</Text>
            </View>
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Neighborhood route preview</Text>
            <Text style={styles.mapBadge}>Map placeholder</Text>
          </View>
          <View style={styles.mapCanvas}>
            <View style={[styles.routeDot, styles.routeStart]} />
            <View style={[styles.routeDot, styles.routeEnd]} />
            <View style={[styles.routeSegment, styles.segmentOne]} />
            <View style={[styles.routeSegment, styles.segmentTwo]} />
            <View style={[styles.routeSegment, styles.segmentThree]} />
            <View style={styles.guruPin}><Text style={styles.pinText}>🐾</Text></View>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <Metric label="Current status" value="Walking" />
          <Metric label="Elapsed time" value="26 min" />
          <Metric label="Distance" value="1.2 mi" />
          <Metric label="Last location update" value="12:56 PM" />
          <Metric label="ETA" value="1:10 PM finish" wide />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline updates</Text>
          {timelineUpdates.map((item) => (
            <View key={item.label} style={styles.timelineItem}>
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

        <View style={styles.safetyNote}>
          <Text style={styles.safetyTitle}>Safety note</Text>
          <Text style={styles.safetyText}>Live tracking only runs during active care.</Text>
        </View>

        <View style={styles.actionStack}>
          <PrimaryButton label="Message Guru" onPress={() => router.push('/conversation')} />
          <SecondaryButton label="View Booking" onPress={showBookingPlaceholder} />
          <SecondaryButton label="Back to Dashboard" onPress={() => router.push('/pet-parent-dashboard')} />
        </View>

        <SitGuruBottomNav activeIndex={0} items={[{ icon: 'home', label: 'Dashboard' }, { icon: 'message', label: 'Message' }, { icon: 'booking', label: 'Booking' }]} tone="primary" />
      </View>
    </SitGuruScreen>
  );
}

function Metric({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <View style={[styles.metricCard, wide ? styles.metricWide : null]}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{label}</Text></Pressable>;
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 4, paddingVertical: 4 },
  header: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 14, padding: 18 },
  backButton: { alignSelf: 'flex-start', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  backButtonText: { color: SitGuruColors.primary, fontSize: 14, fontWeight: '900' },
  headerCopy: { gap: 6 },
  eyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: SitGuruColors.text, fontSize: 34, fontWeight: '900', lineHeight: 38 },
  subtitle: { color: SitGuruColors.textMuted, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  liveCard: { alignItems: 'center', backgroundColor: '#ECFDF3', borderColor: '#B7E4C7', borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 16 },
  pulseDot: { backgroundColor: '#16A34A', borderRadius: 999, height: 14, width: 14 },
  liveCopy: { flex: 1, gap: 3 },
  liveTitle: { color: SitGuruColors.text, fontSize: 18, fontWeight: '900' },
  liveText: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '700' },
  liveBadge: { backgroundColor: SitGuruColors.primary, borderRadius: 999, color: '#FFFFFF', fontSize: 11, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 },
  profileGrid: { gap: 12 },
  profileCard: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 14, padding: 16 },
  avatar: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 22, fontSize: 34, overflow: 'hidden', padding: 12 },
  profileCopy: { flex: 1, gap: 3 },
  cardLabel: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  cardTitle: { color: SitGuruColors.text, fontSize: 20, fontWeight: '900' },
  cardText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700' },
  mapCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 30, borderWidth: 1, gap: 14, padding: 16 },
  mapHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  mapTitle: { color: SitGuruColors.text, flex: 1, fontSize: 18, fontWeight: '900' },
  mapBadge: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, color: SitGuruColors.primary, fontSize: 11, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 6 },
  mapCanvas: { backgroundColor: '#EAF7EF', borderColor: '#D0E8D8', borderRadius: 24, borderWidth: 1, height: 250, overflow: 'hidden' },
  routeDot: { backgroundColor: SitGuruColors.primary, borderColor: '#FFFFFF', borderRadius: 999, borderWidth: 4, height: 28, position: 'absolute', width: 28, zIndex: 2 },
  routeStart: { left: 34, top: 168 },
  routeEnd: { right: 44, top: 52 },
  routeSegment: { backgroundColor: SitGuruColors.primary, borderRadius: 999, height: 10, position: 'absolute' },
  segmentOne: { left: 58, top: 178, transform: [{ rotate: '-18deg' }], width: 118 },
  segmentTwo: { left: 148, top: 130, transform: [{ rotate: '-44deg' }], width: 108 },
  segmentThree: { right: 62, top: 86, transform: [{ rotate: '-14deg' }], width: 92 },
  guruPin: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: SitGuruColors.primary, borderRadius: 999, borderWidth: 3, height: 48, justifyContent: 'center', left: '48%', position: 'absolute', top: 105, width: 48, zIndex: 3 },
  pinText: { fontSize: 22 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 20, borderWidth: 1, flexBasis: '48%', flexGrow: 1, gap: 6, padding: 14 },
  metricWide: { flexBasis: '100%' },
  metricLabel: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  metricValue: { color: SitGuruColors.text, fontSize: 20, fontWeight: '900' },
  section: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 26, borderWidth: 1, gap: 12, padding: 16 },
  sectionTitle: { color: SitGuruColors.text, fontSize: 20, fontWeight: '900' },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineEmoji: { fontSize: 24, width: 34 },
  timelineCopy: { flex: 1, gap: 4 },
  timelineHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  timelineTitle: { color: SitGuruColors.text, flex: 1, fontSize: 15, fontWeight: '900' },
  timelineMeta: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '800' },
  timelineText: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  safetyNote: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA', borderRadius: 22, borderWidth: 1, gap: 5, padding: 16 },
  safetyTitle: { color: SitGuruColors.warning, fontSize: 14, fontWeight: '900' },
  safetyText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '800' },
  actionStack: { gap: 10 },
  primaryButton: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 18, minHeight: 56, justifyContent: 'center', padding: 16 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, minHeight: 54, justifyContent: 'center', padding: 15 },
  secondaryButtonText: { color: SitGuruColors.primary, fontSize: 15, fontWeight: '900' },
});
