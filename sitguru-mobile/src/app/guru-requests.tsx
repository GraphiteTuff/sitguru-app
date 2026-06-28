import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruButton from '@/components/SitGuruButton';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

const filters = ['New', 'Pending', 'Accepted', 'Active', 'Completed'];

const requests = [
  {
    id: 'scout',
    emoji: '🐶',
    pet: 'Scout',
    service: 'Dog Walking',
    dateTime: 'Today • 12:30 PM',
    parent: 'Taylor M.',
    price: '$34',
    status: 'Pending Guru Review',
    notes: 'Friendly walker. Fresh water before and after the walk. Calm greeting preferred.',
  },
  {
    id: 'luna',
    emoji: '🐱',
    pet: 'Luna',
    service: 'Drop-In Visit',
    dateTime: 'Tomorrow • Evening',
    parent: 'Morgan R.',
    price: '$22',
    status: 'New Request',
    notes: 'Check food, refresh water, tidy the feeding area, and send a quick PawReport note.',
  },
  {
    id: 'weekend',
    emoji: '🐾',
    pet: 'Multi-Day Care',
    service: 'Weekend',
    dateTime: 'Fri–Sun • Flexible',
    parent: 'Avery K.',
    price: '$135',
    status: 'Needs review',
    notes: 'Review routines, sleep setup, access notes, and timing before accepting care.',
  },
];

function showRequestAlert(action: string, pet: string) {
  Alert.alert('Visual-only preview', `${action} for ${pet} is a safe placeholder. No booking status changes were made.`);
}

function DockButton({ label, route }: { label: string; route: '/guru-dashboard' | '/conversation' | '/guru-requests' | '/guru-pricing' }) {
  const isActive = route === '/guru-requests';

  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(route)} style={[styles.dockItem, isActive ? styles.dockItemActive : null]}>
      <Text style={[styles.dockLabel, isActive ? styles.dockLabelActive : null]}>{label}</Text>
    </Pressable>
  );
}

export default function GuruRequestsScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.hero}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/guru-dashboard')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Guru Dashboard</Text>
          </Pressable>
          <Text style={styles.eyebrow}>Guru inbox</Text>
          <Text style={styles.title}>Care Requests</Text>
          <Text style={styles.subtitle}>Review Pet Parent requests, pet details, pricing, notes, and next steps.</Text>
        </View>

        <View style={styles.filterRow}>
          {filters.map((filter, index) => (
            <View key={filter} style={[styles.filterPill, index === 1 ? styles.filterPillActive : null]}>
              <Text style={[styles.filterText, index === 1 ? styles.filterTextActive : null]}>{filter}</Text>
            </View>
          ))}
        </View>

        {requests.map((request) => (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.avatar}><Text style={styles.avatarEmoji}>{request.emoji}</Text></View>
              <View style={styles.requestCopy}>
                <Text style={styles.petName}>{request.pet}</Text>
                <Text style={styles.serviceLine}>{request.service} • {request.dateTime}</Text>
                <Text style={styles.parentLine}>Pet Parent: {request.parent}</Text>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>Estimated total</Text>
                <Text style={styles.priceValue}>{request.price}</Text>
              </View>
            </View>

            <View style={styles.badge}><Text style={styles.badgeText}>{request.status}</Text></View>
            <Text style={styles.notes}>{request.notes}</Text>

            <View style={styles.buttonGrid}>
              <SitGuruButton label="View Details" size="compact" onPress={() => router.push('/booking-details')} />
              <SitGuruButton label="Message" size="compact" variant="secondary" onPress={() => router.push('/conversation')} />
              <SitGuruButton label="Accept" size="compact" variant="secondary" onPress={() => showRequestAlert('Accept', request.pet)} />
              <SitGuruButton label="Decline" size="compact" variant="ghost" onPress={() => showRequestAlert('Decline', request.pet)} />
            </View>
          </View>
        ))}

        <View style={styles.priorityCard}>
          <Text style={styles.cardEyebrow}>Review before accepting</Text>
          <Text style={styles.priorityTitle}>Scout request checklist</Text>
          <Text style={styles.priorityText}>Pet notes: friendly dog, prefers calm greetings, water after the walk.</Text>
          <Text style={styles.priorityText}>Access notes: keep handoff details inside SitGuru messages.</Text>
          <Text style={styles.priorityText}>PawReport preferences: potty, water, route note, and final summary.</Text>
          <Text style={styles.priorityText}>Estimated pricing: $34 before final Guru acceptance.</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Final price confirmed before acceptance</Text>
          <Text style={styles.cardText}>Review service rates, busy-day adjustments, and calendar rules before confirming a request.</Text>
          <SitGuruButton label="Pricing Calendar" variant="secondary" onPress={() => router.push('/guru-pricing')} />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Accepted care can start live updates</Text>
          <Text style={styles.cardText}>Use Guru live walk controls only when booked care is active.</Text>
          <SitGuruButton label="Start Live Walk" onPress={() => router.push('/guru-live-walk')} />
        </View>

        <View style={styles.safetyCard}>
          <Text style={styles.cardTitle}>Safety & support</Text>
          <Text style={styles.cardText}>Keep booking decisions, messages, and care updates inside SitGuru.</Text>
        </View>

        <View style={styles.dock}>
          <DockButton label="Dashboard" route="/guru-dashboard" />
          <DockButton label="Messages" route="/conversation" />
          <DockButton label="Requests" route="/guru-requests" />
          <DockButton label="Pricing" route="/guru-pricing" />
        </View>
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 18 },
  hero: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 8, padding: 20 },
  backButton: { alignSelf: 'flex-start', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  backButtonText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900' },
  eyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: SitGuruColors.text, fontSize: 36, fontWeight: '900', lineHeight: 40 },
  subtitle: { color: SitGuruColors.textMuted, fontSize: 16, fontWeight: '700', lineHeight: 23 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterPill: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  filterPillActive: { backgroundColor: SitGuruColors.primary, borderColor: SitGuruColors.primary },
  filterText: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '900' },
  filterTextActive: { color: '#FFFFFF' },
  requestCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 26, borderWidth: 1, gap: 13, padding: 16 },
  requestHeader: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  avatar: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 22, height: 58, justifyContent: 'center', width: 58 },
  avatarEmoji: { fontSize: 28 },
  requestCopy: { flex: 1, gap: 2 },
  petName: { color: SitGuruColors.text, fontSize: 21, fontWeight: '900' },
  serviceLine: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '800' },
  parentLine: { color: SitGuruColors.textSoft, fontSize: 13, fontWeight: '800' },
  priceBox: { alignItems: 'flex-end', backgroundColor: SitGuruColors.background, borderRadius: 18, padding: 10 },
  priceLabel: { color: SitGuruColors.textSoft, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  priceValue: { color: SitGuruColors.primary, fontSize: 22, fontWeight: '900' },
  badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(181, 71, 8, 0.10)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  badgeText: { color: SitGuruColors.warning, fontSize: 12, fontWeight: '900' },
  notes: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  priorityCard: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 26, gap: 8, padding: 18 },
  infoCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 26, borderWidth: 1, gap: 12, padding: 18 },
  safetyCard: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 26, borderWidth: 1, gap: 8, padding: 18 },
  cardEyebrow: { color: '#BFE8CB', fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  cardTitle: { color: SitGuruColors.text, fontSize: 20, fontWeight: '900' },
  cardText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  priorityTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  priorityText: { color: '#D7F4DD', fontSize: 14, fontWeight: '700', lineHeight: 21 },
  dock: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 6, padding: 8 },
  dockItem: { alignItems: 'center', borderRadius: 18, flex: 1, minHeight: 54, justifyContent: 'center', paddingHorizontal: 4 },
  dockItemActive: { backgroundColor: SitGuruColors.surfaceSoft },
  dockLabel: { color: SitGuruColors.textSoft, fontSize: 11, fontWeight: '900' },
  dockLabelActive: { color: SitGuruColors.primary },
});
