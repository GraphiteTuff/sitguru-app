import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruBottomNav from '@/components/SitGuruBottomNav';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

const updates = [
  ['🚶', 'Walk started', '12:30 PM', 'Scout’s walk started with the assigned Guru.'],
  ['💩', 'Potty update', '12:38 PM', 'Potty break completed during the walk.'],
  ['💧', 'Water offered', '12:44 PM', 'Water was offered after a shady rest.'],
  ['📸', 'Photo update placeholder', '12:48 PM', 'Photo preview will appear here once wired.'],
  ['📝', 'Care note', 'Now', 'Scout is walking calmly and doing well.'],
];

export default function PawReportLiveScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.hero}>
          <Pressable onPress={() => router.push('/pet-parent-dashboard')} style={styles.backButton} accessibilityRole="button">
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.eyebrow}>PawReport Live</Text>
          <Text style={styles.title}>PawReport Live</Text>
          <Text style={styles.subtitle}>Scout’s walk is in progress</Text>
        </View>

        <View style={styles.liveCard}>
          <View>
            <Text style={styles.cardLabel}>Current status</Text>
            <Text style={styles.cardTitle}>Walking</Text>
          </View>
          <Text style={styles.liveBadge}>LIVE</Text>
        </View>

        <View style={styles.row}>
          <Profile emoji="🧢" label="Guru" title="Jordan P." detail="Assigned Guru • Walking now" />
          <Profile emoji="🐶" label="Pet" title="Scout" detail="Dog • 30-minute walk" />
        </View>

        <MapCard />

        <View style={styles.statsGrid}>
          <Stat label="Elapsed time" value="18 min" />
          <Stat label="Distance" value="0.7 mi" />
          <Stat label="ETA" value="12 min" />
          <Stat label="Last updated" value="Now" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Timeline updates</Text>
          {updates.map(([emoji, title, time, text]) => (
            <View key={title} style={styles.timelineItem}>
              <Text style={styles.timelineEmoji}>{emoji}</Text>
              <View style={styles.timelineCopy}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineTitle}>{title}</Text>
                  <Text style={styles.timelineTime}>{time}</Text>
                </View>
                <Text style={styles.body}>{text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.safetyCard}>
          <Text style={styles.sectionTitle}>Safety and privacy</Text>
          <Text style={styles.body}>Live tracking only runs during active care.</Text>
          <Text style={styles.body}>Only Pet Parent, assigned Guru, and SitGuru support should view active visit tracking once wired.</Text>
        </View>

        <View style={styles.actions}>
          <Button label="Message Guru" onPress={() => router.push('/conversation')} primary />
          <Button label="View Booking" onPress={() => router.push('/booking-details')} />
          <Button label="Back to Dashboard" onPress={() => router.push('/pet-parent-dashboard')} />
        </View>

        <SitGuruBottomNav activeIndex={0} items={[{ icon: 'home', label: 'Dashboard' }, { icon: 'message', label: 'Message' }, { icon: 'booking', label: 'Booking' }]} />
      </View>
    </SitGuruScreen>
  );
}

function Profile({ emoji, label, title, detail }: { emoji: string; label: string; title: string; detail: string }) {
  return <View style={styles.profileCard}><Text style={styles.avatar}>{emoji}</Text><Text style={styles.cardLabel}>{label}</Text><Text style={styles.profileTitle}>{title}</Text><Text style={styles.profileDetail}>{detail}</Text></View>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <View style={styles.statCard}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function Button({ label, onPress, primary = false }: { label: string; onPress: () => void; primary?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.button, primary ? styles.primaryButton : null]}><Text style={[styles.buttonText, primary ? styles.primaryButtonText : null]}>{label}</Text></Pressable>;
}

function MapCard() {
  return <View style={styles.card}><View style={styles.mapHeader}><Text style={styles.sectionTitle}>Live route preview</Text><Text style={styles.mapBadge}>Placeholder map</Text></View><View style={styles.mapCanvas}><View style={styles.mapBlockOne} /><View style={styles.mapBlockTwo} /><View style={styles.mapPark} /><View style={[styles.route, styles.routeOne]} /><View style={[styles.route, styles.routeTwo]} /><View style={[styles.node, styles.startNode]} /><View style={[styles.node, styles.endNode]} /><View style={styles.pin}><Text>🐾</Text></View></View></View>;
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 18 }, hero: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 8, padding: 20 }, backButton: { alignSelf: 'flex-start', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }, backButtonText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900' }, eyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' }, title: { color: SitGuruColors.text, fontSize: 34, fontWeight: '900' }, subtitle: { color: SitGuruColors.textMuted, fontSize: 16, fontWeight: '800' }, card: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 24, borderWidth: 1, gap: 12, padding: 16 }, liveCard: { alignItems: 'center', backgroundColor: SitGuruColors.primaryDark, borderRadius: 28, flexDirection: 'row', justifyContent: 'space-between', padding: 18 }, cardLabel: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }, cardTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' }, liveBadge: { backgroundColor: '#FFFFFF', borderRadius: 999, color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', paddingHorizontal: 12, paddingVertical: 8 }, row: { flexDirection: 'row', gap: 12 }, profileCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 24, borderWidth: 1, flex: 1, gap: 5, padding: 16 }, avatar: { fontSize: 34 }, profileTitle: { color: SitGuruColors.text, fontSize: 18, fontWeight: '900' }, profileDetail: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '700' }, sectionTitle: { color: SitGuruColors.text, fontSize: 18, fontWeight: '900' }, body: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 21 }, statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, statCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 20, borderWidth: 1, flexBasis: '48%', flexGrow: 1, padding: 14 }, statValue: { color: SitGuruColors.primary, fontSize: 22, fontWeight: '900' }, statLabel: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '900' }, timelineItem: { flexDirection: 'row', gap: 12, paddingVertical: 8 }, timelineEmoji: { fontSize: 24 }, timelineCopy: { flex: 1 }, timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, timelineTitle: { color: SitGuruColors.text, fontSize: 15, fontWeight: '900' }, timelineTime: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '800' }, safetyCard: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 24, borderWidth: 1, gap: 8, padding: 16 }, actions: { gap: 10 }, button: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, minHeight: 52, justifyContent: 'center', padding: 14 }, primaryButton: { backgroundColor: SitGuruColors.primary, borderColor: SitGuruColors.primary }, buttonText: { color: SitGuruColors.primary, fontSize: 15, fontWeight: '900' }, primaryButtonText: { color: '#FFFFFF' }, mapHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, mapBadge: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '900' }, mapCanvas: { backgroundColor: '#EDF7F0', borderRadius: 22, height: 230, overflow: 'hidden' }, mapBlockOne: { backgroundColor: '#FFFFFF', borderRadius: 18, height: 84, left: 20, position: 'absolute', top: 24, width: 130 }, mapBlockTwo: { backgroundColor: '#FFFFFF', borderRadius: 18, bottom: 24, height: 76, position: 'absolute', right: 22, width: 150 }, mapPark: { backgroundColor: '#CFE6D5', borderRadius: 999, height: 96, position: 'absolute', right: 40, top: 28, width: 96 }, route: { backgroundColor: SitGuruColors.primary, borderRadius: 999, height: 8, position: 'absolute' }, routeOne: { left: 62, top: 126, transform: [{ rotate: '18deg' }], width: 190 }, routeTwo: { left: 178, top: 104, transform: [{ rotate: '-28deg' }], width: 116 }, node: { backgroundColor: '#FFFFFF', borderColor: SitGuruColors.primary, borderRadius: 999, borderWidth: 4, height: 24, position: 'absolute', width: 24 }, startNode: { left: 54, top: 116 }, endNode: { right: 70, top: 70 }, pin: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 999, height: 44, justifyContent: 'center', left: 174, position: 'absolute', top: 95, width: 44 },
});
