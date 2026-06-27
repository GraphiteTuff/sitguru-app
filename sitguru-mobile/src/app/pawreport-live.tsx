import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruBottomNav from '@/components/SitGuruBottomNav';
import SitGuruButton from '@/components/SitGuruButton';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

const timeline = [
  ['🚶', 'Walk started', 'Scout clipped in and headed out for a calm neighborhood loop.', '2:05 PM'],
  ['💩', 'Potty update', 'Potty break completed near the park path.', '2:14 PM'],
  ['💧', 'Water offered', 'Fresh water offered during a shady pause.', '2:22 PM'],
  ['📸', 'Photo update placeholder', 'A happy walk photo will appear here later.', '2:28 PM'],
  ['📝', 'Care note', 'Scout is walking comfortably and checking in often.', '2:31 PM'],
];

export default function PawReportLiveScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/pet-parent-dashboard')} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.eyebrow}>PawReport™</Text>
          <Text style={styles.title}>PawReport Live</Text>
          <Text style={styles.subtitle}>Uber-style care visibility with safe placeholder tracking.</Text>
        </View>

        <View style={styles.liveCard}>
          <View style={styles.livePulse} />
          <View style={styles.liveCopy}>
            <Text style={styles.liveLabel}>Live now</Text>
            <Text style={styles.liveTitle}>Scout’s walk is in progress</Text>
            <Text style={styles.liveText}>Your Guru is actively caring for Scout.</Text>
          </View>
          <Text style={styles.liveBadge}>Walking</Text>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.avatar}>🧢</Text>
          <View style={styles.profileCopy}>
            <Text style={styles.cardEyebrow}>Your Guru</Text>
            <Text style={styles.cardTitle}>Maya R.</Text>
            <Text style={styles.cardText}>Trusted neighborhood Pet Guru</Text>
          </View>
        </View>
        <View style={styles.profileCard}>
          <Text style={styles.avatar}>🐕</Text>
          <View style={styles.profileCopy}>
            <Text style={styles.cardEyebrow}>Pet</Text>
            <Text style={styles.cardTitle}>Scout</Text>
            <Text style={styles.cardText}>Golden mix · easy pace</Text>
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapToolbar}>
            <Text style={styles.mapTitle}>Live route preview</Text>
            <Text style={styles.mapPill}>Placeholder map</Text>
          </View>
          <View style={styles.mapCanvas}>
            <View style={[styles.mapDot, styles.startDot]} />
            <View style={[styles.routeSegment, styles.routeOne]} />
            <View style={[styles.routeSegment, styles.routeTwo]} />
            <View style={[styles.routeSegment, styles.routeThree]} />
            <View style={[styles.mapDot, styles.currentDot]}><Text style={styles.currentDotText}>🐾</Text></View>
            <Text style={styles.mapLabelStart}>Start</Text>
            <Text style={styles.mapLabelCurrent}>Scout + Guru</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          {[
            ['Current status', 'Walking'], ['Elapsed time', '28 min'], ['Distance', '1.2 mi'], ['Last location update', '2 min ago'], ['ETA / expected finish', '2:55 PM'],
          ].map(([label, value]) => (
            <View key={label} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{label}</Text>
              <Text style={styles.metricValue}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Timeline updates</Text>
          {timeline.map(([icon, title, detail, time]) => (
            <View key={title} style={styles.timelineRow}>
              <Text style={styles.timelineIcon}>{icon}</Text>
              <View style={styles.timelineCopy}>
                <Text style={styles.timelineTitle}>{title}</Text>
                <Text style={styles.timelineDetail}>{detail}</Text>
              </View>
              <Text style={styles.timelineTime}>{time}</Text>
            </View>
          ))}
        </View>

        <View style={styles.safetyCard}>
          <Text style={styles.safetyIcon}>🛡️</Text>
          <Text style={styles.safetyText}>Live tracking only runs during active care.</Text>
        </View>

        <View style={styles.actions}>
          <SitGuruButton label="Message Guru" onPress={() => router.push('/conversation')} />
          <SitGuruButton label="View Booking" onPress={() => Alert.alert('Booking details coming soon', 'This visual preview uses a safe placeholder because booking details are not wired yet.')} variant="secondary" />
          <SitGuruButton label="Back to Dashboard" onPress={() => router.push('/pet-parent-dashboard')} variant="ghost" />
        </View>

        <SitGuruBottomNav activeIndex={0} items={[{ icon: 'home', label: 'Dashboard' }, { icon: 'message', label: 'Message' }, { icon: 'booking', label: 'Booking' }]} tone="primary" />
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 4, paddingVertical: 4 },
  header: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 7, padding: 18 },
  backButton: { alignSelf: 'flex-start', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  backButtonText: { color: SitGuruColors.primary, fontSize: 14, fontWeight: '900' },
  eyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: SitGuruColors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: SitGuruColors.textSoft, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  liveCard: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 28, flexDirection: 'row', gap: 14, padding: 18 },
  livePulse: { backgroundColor: '#D1FADF', borderColor: '#FFFFFF', borderRadius: 999, borderWidth: 4, height: 22, width: 22 },
  liveCopy: { flex: 1, gap: 3 },
  liveLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  liveTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  liveText: { color: 'rgba(255,255,255,0.84)', fontSize: 13, fontWeight: '700' },
  liveBadge: { backgroundColor: '#FFFFFF', borderRadius: 999, color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8 },
  profileCard: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 14, padding: 16 },
  avatar: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 22, fontSize: 30, overflow: 'hidden', padding: 12 },
  profileCopy: { flex: 1, gap: 3 },
  cardEyebrow: { color: SitGuruColors.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  cardTitle: { color: SitGuruColors.text, fontSize: 19, fontWeight: '900' },
  cardText: { color: SitGuruColors.textSoft, fontSize: 13, fontWeight: '700' },
  mapCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 30, borderWidth: 1, padding: 14 },
  mapToolbar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  mapTitle: { color: SitGuruColors.text, fontSize: 16, fontWeight: '900' },
  mapPill: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, color: SitGuruColors.primary, fontSize: 11, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 },
  mapCanvas: { backgroundColor: '#EEF7F1', borderRadius: 24, height: 270, overflow: 'hidden' },
  mapDot: { position: 'absolute', zIndex: 3 },
  startDot: { backgroundColor: SitGuruColors.primary, borderColor: '#FFFFFF', borderRadius: 999, borderWidth: 4, height: 24, left: 42, top: 188, width: 24 },
  currentDot: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: SitGuruColors.primary, borderRadius: 999, borderWidth: 3, height: 54, justifyContent: 'center', right: 50, top: 48, width: 54 },
  currentDotText: { fontSize: 24 },
  routeSegment: { backgroundColor: SitGuruColors.primary, borderRadius: 999, height: 9, position: 'absolute' },
  routeOne: { left: 62, top: 197, transform: [{ rotate: '-26deg' }], width: 115 },
  routeTwo: { left: 145, top: 147, transform: [{ rotate: '-8deg' }], width: 98 },
  routeThree: { right: 80, top: 100, transform: [{ rotate: '-34deg' }], width: 95 },
  mapLabelStart: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '900', left: 30, position: 'absolute', top: 218 },
  mapLabelCurrent: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', position: 'absolute', right: 28, top: 110 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 20, borderWidth: 1, flexGrow: 1, minWidth: '47%', padding: 14 },
  metricLabel: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '800' },
  metricValue: { color: SitGuruColors.text, fontSize: 18, fontWeight: '900', marginTop: 4 },
  sectionCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 26, borderWidth: 1, gap: 12, padding: 16 },
  sectionTitle: { color: SitGuruColors.text, fontSize: 20, fontWeight: '900' },
  timelineRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  timelineIcon: { fontSize: 21, width: 28 },
  timelineCopy: { flex: 1, gap: 2 },
  timelineTitle: { color: SitGuruColors.text, fontSize: 14, fontWeight: '900' },
  timelineDetail: { color: SitGuruColors.textSoft, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  timelineTime: { color: SitGuruColors.textSoft, fontSize: 11, fontWeight: '900' },
  safetyCard: { alignItems: 'center', backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderRadius: 22, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 14 },
  safetyIcon: { fontSize: 22 },
  safetyText: { color: '#92400E', flex: 1, fontSize: 14, fontWeight: '900' },
  actions: { gap: 10 },
});
