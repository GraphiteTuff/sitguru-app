import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruBottomNav from '@/components/SitGuruBottomNav';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type WalkStatus = 'Not started' | 'Walking' | 'Paused' | 'Completed';
type TimelineItem = { id: string; emoji: string; label: string; meta: string; text: string };

const statuses: WalkStatus[] = ['Not started', 'Walking', 'Paused', 'Completed'];
const quickUpdates = [
  ['💩', 'Potty'], ['💧', 'Water'], ['🥣', 'Food'], ['📸', 'Photo'], ['📝', 'Note'],
];

export default function GuruLiveWalkScreen() {
  const [status, setStatus] = useState<WalkStatus>('Not started');
  const [timeline, setTimeline] = useState<TimelineItem[]>([
    { id: 'ready', emoji: '⏱️', label: 'Ready to start', meta: 'Preview', text: 'Start the walk when active booked care begins.' },
    { id: 'notes', emoji: '🐶', label: 'Care notes reviewed', meta: 'Scout', text: 'Friendly dog. Offer water after the walk and send SitGuru updates.' },
  ]);

  const actions = useMemo(() => {
    if (status === 'Not started') return ['Start Walk'];
    if (status === 'Walking') return ['Pause Walk', 'End Walk'];
    if (status === 'Paused') return ['Resume Walk', 'End Walk'];
    return ['Walk Completed'];
  }, [status]);

  function setWalkFromAction(action: string) {
    if (status === 'Completed') return;
    const next: WalkStatus = action === 'Start Walk' || action === 'Resume Walk' ? 'Walking' : action === 'Pause Walk' ? 'Paused' : action === 'End Walk' ? 'Completed' : status;
    setStatus(next);
    setTimeline((current) => [{ id: `${next}-${Date.now()}`, emoji: next === 'Completed' ? '✅' : '📍', label: next, meta: 'Status', text: next === 'Completed' ? 'Walk completed. Final PawReport can be reviewed.' : `Walk status changed to ${next}.` }, ...current]);
  }

  function addUpdate(label: string, emoji: string) {
    const text = label === 'Photo' ? 'Photo placeholder added for a future PawReport image.' : label === 'Note' ? 'Care note placeholder added to the PawReport timeline.' : `${label} update added to the PawReport timeline.`;
    setTimeline((current) => [{ id: `${label}-${Date.now()}`, emoji, label, meta: status === 'Not started' ? 'Preview' : 'Now', text }, ...current]);
  }

  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.hero}>
          <View style={styles.heroActions}><Pressable onPress={() => router.push('/guru-dashboard')} style={styles.backButton} accessibilityRole="button"><Text style={styles.backButtonText}>← Dashboard</Text></Pressable><Pressable onPress={() => router.push('/notifications')} style={styles.backButton} accessibilityRole="button"><Text style={styles.backButtonText}>Notifications</Text></Pressable><Pressable onPress={() => router.push('/support')} style={styles.backButton} accessibilityRole="button"><Text style={styles.backButtonText}>Help & Support</Text></Pressable><Pressable onPress={() => router.push('/guru-requests')} style={styles.backButton} accessibilityRole="button"><Text style={styles.backButtonText}>Back to Requests</Text></Pressable></View>
          <Text style={styles.eyebrow}>Guru workspace</Text>
          <Text style={styles.title}>Live Walk Controls</Text>
          <Text style={styles.subtitle}>Visual-only PawReport controls for active booked care.</Text>
        </View>

        <View style={styles.summaryCard}><Text style={styles.summaryPet}>Scout</Text><Text style={styles.summaryMeta}>Dog Walking • Today • 12:30 PM</Text></View>
        <View style={styles.card}><Text style={styles.sectionTitle}>Pet Parent</Text><Text style={styles.profileName}>Taylor M.</Text><Text style={styles.body}>Safe placeholder name • Use SitGuru messages for care communication.</Text></View>
        <MapCard />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusRow}>{statuses.map((item) => <View key={item} style={[styles.statusPill, status === item ? styles.statusPillActive : null]}><Text style={[styles.statusText, status === item ? styles.statusTextActive : null]}>{item}</Text></View>)}</View>
          <View style={styles.actionGrid}>{actions.map((action) => <Pressable key={action} onPress={() => setWalkFromAction(action)} style={[styles.bigButton, action === 'End Walk' ? styles.dangerButton : null, action === 'Walk Completed' ? styles.disabledButton : null]} accessibilityRole="button"><Text style={[styles.bigButtonText, action === 'End Walk' ? styles.dangerButtonText : null]}>{action}</Text></Pressable>)}</View>
        </View>

        <View style={styles.card}><Text style={styles.sectionTitle}>Quick updates</Text><View style={styles.quickGrid}>{quickUpdates.map(([emoji, label]) => <Pressable key={label} onPress={() => addUpdate(label, emoji)} style={styles.quickButton}><Text style={styles.quickEmoji}>{emoji}</Text><Text style={styles.quickText}>{label}</Text></Pressable>)}</View></View>

        <View style={styles.card}><Text style={styles.sectionTitle}>PawReport update timeline</Text>{timeline.map((item) => <View key={item.id} style={styles.timelineItem}><Text style={styles.timelineEmoji}>{item.emoji}</Text><View style={styles.timelineCopy}><View style={styles.timelineHeader}><Text style={styles.timelineTitle}>{item.label}</Text><Text style={styles.timelineMeta}>{item.meta}</Text></View><Text style={styles.body}>{item.text}</Text></View></View>)}</View>

        <View style={styles.card}><Text style={styles.sectionTitle}>Care notes preview</Text><Text style={styles.body}>Scout enjoys steady walks, calm greetings, fresh water, and updates through SitGuru.</Text></View>
        <View style={styles.safetyCard}><Text style={styles.sectionTitle}>Safety reminder</Text><Text style={styles.body}>Only track location during active booked care.</Text><Text style={styles.body}>End walk when care is complete.</Text></View>

        <View style={styles.actions}><Button label="Back to Requests" onPress={() => router.push('/guru-requests')} /><Button label="Message Pet Parent" onPress={() => router.push('/conversation')} primary /><Button label="Send Final PawReport" onPress={() => Alert.alert('Final PawReport placeholder', 'This visual-only action is not wired to backend messaging.')} /><Button label="Help & Support" onPress={() => router.push('/support')} /><Button label="Dashboard" onPress={() => router.push('/guru-dashboard')} /></View>
        <SitGuruBottomNav activeIndex={2} items={[{ icon: 'home', label: 'Home' }, { icon: 'message', label: 'Message' }, { icon: 'visit', label: 'Updates' }, { icon: 'checklist', label: 'End Walk' }]} />
      </View>
    </SitGuruScreen>
  );
}

function Button({ label, onPress, primary = false }: { label: string; onPress: () => void; primary?: boolean }) { return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.button, primary ? styles.primaryButton : null]}><Text style={[styles.buttonText, primary ? styles.primaryButtonText : null]}>{label}</Text></Pressable>; }
function MapCard() { return <View style={styles.card}><View style={styles.mapHeader}><Text style={styles.sectionTitle}>Route preview</Text><Text style={styles.mapBadge}>No GPS wiring</Text></View><View style={styles.mapCanvas}><View style={styles.mapPark} /><View style={styles.mapBlockOne} /><View style={styles.mapBlockTwo} /><View style={[styles.route, styles.routeOne]} /><View style={[styles.route, styles.routeTwo]} /><View style={[styles.node, styles.startNode]} /><View style={[styles.node, styles.endNode]} /><View style={styles.pin}><Text>🐾</Text></View></View></View>; }

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 18 }, heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, hero: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 8, padding: 20 }, backButton: { alignSelf: 'flex-start', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }, backButtonText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900' }, eyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' }, title: { color: SitGuruColors.text, fontSize: 34, fontWeight: '900' }, subtitle: { color: SitGuruColors.textMuted, fontSize: 16, fontWeight: '800' }, summaryCard: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 28, padding: 20 }, summaryPet: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' }, summaryMeta: { color: '#D7F4DD', fontSize: 15, fontWeight: '800', marginTop: 4 }, card: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 24, borderWidth: 1, gap: 12, padding: 16 }, sectionTitle: { color: SitGuruColors.text, fontSize: 18, fontWeight: '900' }, profileName: { color: SitGuruColors.text, fontSize: 20, fontWeight: '900' }, body: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 21 }, statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, statusPill: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 }, statusPillActive: { backgroundColor: SitGuruColors.primary, borderColor: SitGuruColors.primary }, statusText: { color: SitGuruColors.textMuted, fontSize: 12, fontWeight: '900' }, statusTextActive: { color: '#FFFFFF' }, actionGrid: { gap: 10 }, bigButton: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 20, minHeight: 58, justifyContent: 'center', padding: 16 }, bigButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' }, dangerButton: { backgroundColor: '#FDECEC', borderColor: SitGuruColors.danger, borderWidth: 1 }, dangerButtonText: { color: SitGuruColors.danger }, disabledButton: { backgroundColor: SitGuruColors.textSoft }, quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, quickButton: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 18, minWidth: 92, padding: 14 }, quickEmoji: { fontSize: 24 }, quickText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900' }, timelineItem: { flexDirection: 'row', gap: 12, paddingVertical: 8 }, timelineEmoji: { fontSize: 24 }, timelineCopy: { flex: 1 }, timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, timelineTitle: { color: SitGuruColors.text, fontSize: 15, fontWeight: '900' }, timelineMeta: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '800' }, safetyCard: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 24, borderWidth: 1, gap: 8, padding: 16 }, actions: { gap: 10 }, button: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, minHeight: 52, justifyContent: 'center', padding: 14 }, primaryButton: { backgroundColor: SitGuruColors.primary, borderColor: SitGuruColors.primary }, buttonText: { color: SitGuruColors.primary, fontSize: 15, fontWeight: '900' }, primaryButtonText: { color: '#FFFFFF' }, mapHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, mapBadge: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '900' }, mapCanvas: { backgroundColor: '#EDF7F0', borderRadius: 22, height: 230, overflow: 'hidden' }, mapBlockOne: { backgroundColor: '#FFFFFF', borderRadius: 18, height: 84, left: 20, position: 'absolute', top: 24, width: 130 }, mapBlockTwo: { backgroundColor: '#FFFFFF', borderRadius: 18, bottom: 24, height: 76, position: 'absolute', right: 22, width: 150 }, mapPark: { backgroundColor: '#CFE6D5', borderRadius: 999, height: 96, position: 'absolute', right: 40, top: 28, width: 96 }, route: { backgroundColor: SitGuruColors.primary, borderRadius: 999, height: 8, position: 'absolute' }, routeOne: { left: 62, top: 126, transform: [{ rotate: '18deg' }], width: 190 }, routeTwo: { left: 178, top: 104, transform: [{ rotate: '-28deg' }], width: 116 }, node: { backgroundColor: '#FFFFFF', borderColor: SitGuruColors.primary, borderRadius: 999, borderWidth: 4, height: 24, position: 'absolute', width: 24 }, startNode: { left: 54, top: 116 }, endNode: { right: 70, top: 70 }, pin: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 999, height: 44, justifyContent: 'center', left: 174, position: 'absolute', top: 95, width: 44 },
});
