import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import SitGuruBottomNav from '@/components/SitGuruBottomNav';
import SitGuruButton from '@/components/SitGuruButton';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type WalkStatus = 'Not started' | 'Walking' | 'Paused' | 'Completed';

const quickUpdates = ['Potty', 'Water', 'Food', 'Photo', 'Note'];
const timeline = ['Booking reviewed', 'Ready to start walk', 'Updates will appear in PawReport Live'];

export default function GuruLiveWalkScreen() {
  const [status, setStatus] = useState<WalkStatus>('Not started');

  const primaryActions = useMemo(() => {
    if (status === 'Not started') return [{ label: 'Start Walk', next: 'Walking' as WalkStatus }];
    if (status === 'Walking') return [{ label: 'Pause Walk', next: 'Paused' as WalkStatus }, { label: 'End Walk', next: 'Completed' as WalkStatus }];
    if (status === 'Paused') return [{ label: 'Resume Walk', next: 'Walking' as WalkStatus }, { label: 'End Walk', next: 'Completed' as WalkStatus }];
    return [{ label: 'Walk Completed', next: 'Completed' as WalkStatus }];
  }, [status]);

  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/guru-dashboard')} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.eyebrow}>Guru tools</Text>
          <Text style={styles.title}>Live Walk Controls</Text>
          <Text style={styles.subtitle}>Visual-only controls for active booked care.</Text>
        </View>

        <View style={styles.bookingCard}>
          <Text style={styles.cardIcon}>🐕</Text>
          <View style={styles.cardCopy}>
            <Text style={styles.cardEyebrow}>Today’s booking</Text>
            <Text style={styles.cardTitle}>Scout · 30-minute walk</Text>
            <Text style={styles.cardText}>Easy pace, avoid busy streets, offer water after walk.</Text>
          </View>
        </View>

        <View style={styles.bookingCard}>
          <Text style={styles.cardIcon}>👤</Text>
          <View style={styles.cardCopy}>
            <Text style={styles.cardEyebrow}>Pet Parent</Text>
            <Text style={styles.cardTitle}>Jordan P.</Text>
            <Text style={styles.cardText}>Safe placeholder profile · message through SitGuru.</Text>
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapToolbar}>
            <Text style={styles.mapTitle}>Walk map preview</Text>
            <Text style={styles.mapPill}>No GPS wired</Text>
          </View>
          <View style={styles.mapCanvas}>
            <View style={styles.blockOne} />
            <View style={styles.blockTwo} />
            <View style={styles.park} />
            <View style={[styles.routeSegment, styles.routeOne]} />
            <View style={[styles.routeSegment, styles.routeTwo]} />
            <View style={[styles.routeSegment, styles.routeThree]} />
            <View style={styles.guruPin}><Text style={styles.guruPinText}>🐾</Text></View>
            <Text style={styles.mapLabel}>Placeholder route line</Text>
          </View>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.statusValue}>{status}</Text>
          <Text style={styles.statusHint}>Not started / Walking / Paused / Completed</Text>
        </View>

        <View style={styles.primaryActions}>
          {primaryActions.map((action) => (
            <Pressable
              accessibilityRole="button"
              disabled={status === 'Completed'}
              key={action.label}
              onPress={() => setStatus(action.next)}
              style={({ pressed }) => [
                styles.bigAction,
                action.label === 'End Walk' ? styles.endAction : null,
                status === 'Completed' ? styles.disabledAction : null,
                pressed && status !== 'Completed' ? styles.pressedAction : null,
              ]}
            >
              <Text style={styles.bigActionText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick updates</Text>
          <View style={styles.quickGrid}>
            {quickUpdates.map((item) => (
              <Pressable key={item} accessibilityRole="button" onPress={() => Alert.alert(`${item} update`, 'Placeholder only — no PawReport has been sent yet.')} style={styles.quickButton}>
                <Text style={styles.quickButtonText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>PawReport update timeline</Text>
          {timeline.map((item, index) => (
            <View key={item} style={styles.timelineRow}>
              <Text style={styles.timelineDot}>{index + 1}</Text>
              <Text style={styles.timelineText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.notesCard}>
          <Text style={styles.sectionTitle}>Care notes preview</Text>
          <Text style={styles.notesText}>Scout likes a steady pace and responds well to cheerful check-ins. Keep leash short near crosswalks.</Text>
        </View>

        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Safety reminder</Text>
          <Text style={styles.safetyText}>Only track location during active booked care.</Text>
          <Text style={styles.safetyText}>End walk when care is complete.</Text>
        </View>

        <View style={styles.actions}>
          <SitGuruButton label="Message Pet Parent" onPress={() => router.push('/conversation')} />
          <SitGuruButton label="Send Final PawReport placeholder" onPress={() => Alert.alert('Final PawReport placeholder', 'Final reports are not wired yet.')} variant="secondary" />
          <SitGuruButton label="Dashboard" onPress={() => router.push('/guru-dashboard')} variant="ghost" />
        </View>

        <SitGuruBottomNav activeIndex={2} items={[{ icon: 'home', label: 'Home' }, { icon: 'message', label: 'Message' }, { icon: 'checklist', label: 'Updates' }, { icon: 'booking', label: 'End Walk' }]} tone="warning" />
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 4, paddingVertical: 4 },
  header: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 7, padding: 18 },
  backButton: { alignSelf: 'flex-start', backgroundColor: 'rgba(181, 71, 8, 0.10)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  backButtonText: { color: SitGuruColors.warning, fontSize: 14, fontWeight: '900' },
  eyebrow: { color: SitGuruColors.warning, fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: SitGuruColors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: SitGuruColors.textSoft, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  bookingCard: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 14, padding: 16 },
  cardIcon: { backgroundColor: '#FFF7ED', borderRadius: 22, fontSize: 30, overflow: 'hidden', padding: 12 },
  cardCopy: { flex: 1, gap: 3 },
  cardEyebrow: { color: SitGuruColors.warning, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  cardTitle: { color: SitGuruColors.text, fontSize: 19, fontWeight: '900' },
  cardText: { color: SitGuruColors.textSoft, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  mapCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 30, borderWidth: 1, padding: 14 },
  mapToolbar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  mapTitle: { color: SitGuruColors.text, fontSize: 16, fontWeight: '900' },
  mapPill: { backgroundColor: '#FFF7ED', borderRadius: 999, color: SitGuruColors.warning, fontSize: 11, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 },
  mapCanvas: { backgroundColor: '#F7F3EA', borderRadius: 24, height: 270, overflow: 'hidden' },
  blockOne: { backgroundColor: '#FFFFFF', borderRadius: 18, height: 78, left: 24, position: 'absolute', top: 24, width: 112 },
  blockTwo: { backgroundColor: '#FFFFFF', borderRadius: 18, bottom: 28, height: 92, position: 'absolute', right: 28, width: 128 },
  park: { backgroundColor: '#DCFCE7', borderRadius: 999, height: 116, position: 'absolute', right: 34, top: 34, width: 116 },
  routeSegment: { backgroundColor: SitGuruColors.warning, borderRadius: 999, height: 10, position: 'absolute' },
  routeOne: { left: 56, top: 190, transform: [{ rotate: '-18deg' }], width: 120 },
  routeTwo: { left: 148, top: 150, transform: [{ rotate: '-38deg' }], width: 112 },
  routeThree: { right: 76, top: 104, transform: [{ rotate: '12deg' }], width: 92 },
  guruPin: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: SitGuruColors.warning, borderRadius: 999, borderWidth: 3, height: 58, justifyContent: 'center', position: 'absolute', right: 54, top: 76, width: 58 },
  guruPinText: { fontSize: 25 },
  mapLabel: { bottom: 22, color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '900', left: 24, position: 'absolute' },
  statusCard: { backgroundColor: SitGuruColors.text, borderRadius: 26, gap: 4, padding: 18 },
  statusLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  statusValue: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' },
  statusHint: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '700' },
  primaryActions: { gap: 10 },
  bigAction: { alignItems: 'center', backgroundColor: SitGuruColors.warning, borderRadius: 24, justifyContent: 'center', minHeight: 72, padding: 18 },
  endAction: { backgroundColor: SitGuruColors.danger },
  disabledAction: { opacity: 0.55 },
  pressedAction: { opacity: 0.86, transform: [{ translateY: 1 }] },
  bigActionText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  sectionCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 26, borderWidth: 1, gap: 12, padding: 16 },
  sectionTitle: { color: SitGuruColors.text, fontSize: 20, fontWeight: '900' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickButton: { alignItems: 'center', backgroundColor: '#FFF7ED', borderColor: '#FED7AA', borderRadius: 18, borderWidth: 1, flexGrow: 1, minHeight: 54, minWidth: '30%', justifyContent: 'center', paddingHorizontal: 14 },
  quickButtonText: { color: SitGuruColors.warning, fontSize: 14, fontWeight: '900' },
  timelineRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  timelineDot: { backgroundColor: '#FFF7ED', borderRadius: 999, color: SitGuruColors.warning, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 },
  timelineText: { color: SitGuruColors.textSoft, flex: 1, fontSize: 14, fontWeight: '800' },
  notesCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 26, borderWidth: 1, gap: 8, padding: 16 },
  notesText: { color: SitGuruColors.textSoft, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  safetyCard: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderRadius: 22, borderWidth: 1, gap: 4, padding: 14 },
  safetyTitle: { color: '#92400E', fontSize: 15, fontWeight: '900' },
  safetyText: { color: '#92400E', fontSize: 14, fontWeight: '800', lineHeight: 20 },
  actions: { gap: 10 },
});
