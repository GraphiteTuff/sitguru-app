import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruBottomNav from '@/components/SitGuruBottomNav';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

const updates = [
  { emoji: '⏱️', label: 'Ready to start', meta: 'Preview', text: 'Start the walk when booked care begins.' },
  { emoji: '💩', label: 'Potty', meta: 'Quick update', text: 'Tap to add a visual-only potty update placeholder.' },
  { emoji: '💧', label: 'Water', meta: 'Quick update', text: 'Tap to show that water was offered.' },
  { emoji: '📸', label: 'Photo', meta: 'Placeholder', text: 'Photo update slot for a future PawReport image.' },
];

function showPlaceholder(label: string) {
  Alert.alert(`${label} placeholder`, 'This visual foundation is not connected to backend, GPS, camera, or booking data yet.');
}

export default function GuruLiveWalkScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/guru-dashboard')} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Guru tools</Text>
            <Text style={styles.title}>Live Walk Controls</Text>
            <Text style={styles.subtitle}>Visual-only controls for active booked pet care.</Text>
          </View>
        </View>

        <View style={styles.bookingCard}>
          <Text style={styles.petAvatar}>🐕</Text>
          <View style={styles.bookingCopy}>
            <Text style={styles.cardLabel}>Today’s booking</Text>
            <Text style={styles.cardTitle}>Scout • 30-minute walk</Text>
            <Text style={styles.cardText}>12:30 PM–1:00 PM • Neighborhood route preview</Text>
          </View>
        </View>

        <View style={styles.parentCard}>
          <Text style={styles.parentAvatar}>🐶</Text>
          <View style={styles.bookingCopy}>
            <Text style={styles.cardLabel}>Pet Parent</Text>
            <Text style={styles.cardTitle}>Jordan P.</Text>
            <Text style={styles.cardText}>Prefers PawReport updates during the walk.</Text>
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Active walk map preview</Text>
            <Text style={styles.mapBadge}>No GPS yet</Text>
          </View>
          <View style={styles.mapCanvas}>
            <View style={[styles.routeLine, styles.routeOne]} />
            <View style={[styles.routeLine, styles.routeTwo]} />
            <View style={[styles.routeLine, styles.routeThree]} />
            <View style={[styles.routeNode, styles.nodeStart]} />
            <View style={[styles.routeNode, styles.nodeEnd]} />
            <View style={styles.walkerPin}><Text style={styles.walkerPinText}>🚶‍♀️</Text></View>
          </View>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.statusTitle}>Not started / Walking / Paused / Completed</Text>
          <Text style={styles.statusText}>Use these visual states when live walk wiring is added.</Text>
        </View>

        <View style={styles.primaryActions}>
          <Pressable accessibilityRole="button" onPress={() => showPlaceholder('Start Walk')} style={styles.mainAction}>
            <Text style={styles.mainActionText}>Start Walk</Text>
          </Pressable>
          <View style={styles.actionRow}>
            <SmallAction label="Pause Walk" />
            <SmallAction label="Resume Walk" />
            <SmallAction label="End Walk" danger />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick updates</Text>
          <View style={styles.quickGrid}>
            {['Potty', 'Water', 'Food', 'Photo', 'Note'].map((label) => (
              <Pressable key={label} accessibilityRole="button" onPress={() => showPlaceholder(label)} style={styles.quickButton}>
                <Text style={styles.quickButtonText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PawReport update timeline</Text>
          {updates.map((item) => (
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

        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Care notes preview</Text>
          <Text style={styles.notesText}>Scout walks best on the right side, likes calm greetings, and should avoid crowded dog meetups.</Text>
        </View>

        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Safety reminder</Text>
          <Text style={styles.safetyText}>Only track location during active booked care.</Text>
          <Text style={styles.safetyText}>End walk when care is complete.</Text>
        </View>

        <View style={styles.actionStack}>
          <PrimaryButton label="Message Pet Parent" onPress={() => router.push('/conversation')} />
          <SecondaryButton label="Send Final PawReport" onPress={() => showPlaceholder('Final PawReport')} />
          <SecondaryButton label="Dashboard" onPress={() => router.push('/guru-dashboard')} />
        </View>

        <SitGuruBottomNav activeIndex={2} items={[{ icon: 'home', label: 'Home' }, { icon: 'message', label: 'Message' }, { icon: 'checklist', label: 'Updates' }, { icon: 'booking', label: 'End Walk' }]} tone="warning" />
      </View>
    </SitGuruScreen>
  );
}

function SmallAction({ label, danger = false }: { label: string; danger?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={() => showPlaceholder(label)} style={[styles.smallAction, danger ? styles.dangerAction : null]}><Text style={[styles.smallActionText, danger ? styles.dangerActionText : null]}>{label}</Text></Pressable>;
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{label}</Text></Pressable>;
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 4, paddingVertical: 4 },
  header: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 28, gap: 14, padding: 18 },
  backButton: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  backButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  headerCopy: { gap: 6 },
  eyebrow: { color: '#FCD34D', fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', lineHeight: 38 },
  subtitle: { color: '#DDEDE2', fontSize: 15, fontWeight: '700', lineHeight: 22 },
  bookingCard: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 14, padding: 16 },
  parentCard: { alignItems: 'center', backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 14, padding: 16 },
  petAvatar: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 22, fontSize: 34, overflow: 'hidden', padding: 12 },
  parentAvatar: { backgroundColor: '#FEF3C7', borderRadius: 22, fontSize: 34, overflow: 'hidden', padding: 12 },
  bookingCopy: { flex: 1, gap: 3 },
  cardLabel: { color: SitGuruColors.warning, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  cardTitle: { color: SitGuruColors.text, fontSize: 20, fontWeight: '900' },
  cardText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700' },
  mapCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 30, borderWidth: 1, gap: 14, padding: 16 },
  mapHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  mapTitle: { color: SitGuruColors.text, flex: 1, fontSize: 18, fontWeight: '900' },
  mapBadge: { backgroundColor: '#FEF3C7', borderRadius: 999, color: SitGuruColors.warning, fontSize: 11, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 6 },
  mapCanvas: { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE', borderRadius: 24, borderWidth: 1, height: 250, overflow: 'hidden' },
  routeLine: { backgroundColor: SitGuruColors.warning, borderRadius: 999, height: 10, position: 'absolute' },
  routeOne: { left: 48, top: 70, transform: [{ rotate: '14deg' }], width: 120 },
  routeTwo: { left: 148, top: 108, transform: [{ rotate: '45deg' }], width: 105 },
  routeThree: { right: 50, top: 168, transform: [{ rotate: '7deg' }], width: 112 },
  routeNode: { backgroundColor: SitGuruColors.warning, borderColor: '#FFFFFF', borderRadius: 999, borderWidth: 4, height: 28, position: 'absolute', width: 28, zIndex: 2 },
  nodeStart: { left: 34, top: 58 },
  nodeEnd: { right: 38, top: 166 },
  walkerPin: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: SitGuruColors.warning, borderRadius: 999, borderWidth: 3, height: 50, justifyContent: 'center', left: '50%', position: 'absolute', top: 105, width: 50, zIndex: 3 },
  walkerPinText: { fontSize: 23 },
  statusCard: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA', borderRadius: 24, borderWidth: 1, gap: 6, padding: 16 },
  statusLabel: { color: SitGuruColors.warning, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  statusTitle: { color: SitGuruColors.text, fontSize: 22, fontWeight: '900' },
  statusText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700' },
  primaryActions: { gap: 10 },
  mainAction: { alignItems: 'center', backgroundColor: SitGuruColors.warning, borderRadius: 22, minHeight: 68, justifyContent: 'center', padding: 18 },
  mainActionText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  smallAction: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, flexGrow: 1, minHeight: 54, minWidth: 100, justifyContent: 'center', padding: 12 },
  smallActionText: { color: SitGuruColors.warning, fontSize: 14, fontWeight: '900' },
  dangerAction: { borderColor: '#FECACA' },
  dangerActionText: { color: SitGuruColors.danger },
  section: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 26, borderWidth: 1, gap: 12, padding: 16 },
  sectionTitle: { color: SitGuruColors.text, fontSize: 20, fontWeight: '900' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickButton: { alignItems: 'center', backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderRadius: 18, borderWidth: 1, flexGrow: 1, minHeight: 54, minWidth: 96, justifyContent: 'center', padding: 12 },
  quickButtonText: { color: SitGuruColors.warning, fontSize: 15, fontWeight: '900' },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineEmoji: { fontSize: 24, width: 34 },
  timelineCopy: { flex: 1, gap: 4 },
  timelineHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  timelineTitle: { color: SitGuruColors.text, flex: 1, fontSize: 15, fontWeight: '900' },
  timelineMeta: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '800' },
  timelineText: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  notesCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 22, borderWidth: 1, gap: 6, padding: 16 },
  notesTitle: { color: SitGuruColors.text, fontSize: 17, fontWeight: '900' },
  notesText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  safetyCard: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderRadius: 22, borderWidth: 1, gap: 6, padding: 16 },
  safetyTitle: { color: SitGuruColors.danger, fontSize: 14, fontWeight: '900' },
  safetyText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '800' },
  actionStack: { gap: 10 },
  primaryButton: { alignItems: 'center', backgroundColor: SitGuruColors.primaryDark, borderRadius: 18, minHeight: 56, justifyContent: 'center', padding: 16 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, minHeight: 54, justifyContent: 'center', padding: 15 },
  secondaryButtonText: { color: SitGuruColors.warning, fontSize: 15, fontWeight: '900' },
});
