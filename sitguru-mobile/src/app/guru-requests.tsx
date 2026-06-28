import { router, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruButton from '@/components/SitGuruButton';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruStatCard from '@/components/SitGuruStatCard';
import { SitGuruColors } from '@/constants/colors';

const filters = ['All', 'New', 'Pending', 'Accepted', 'Active', 'Completed'];

const summaryCards = [
  { label: 'New requests', value: '2', detail: 'Ready to review' },
  { label: 'Pending review', value: '1', detail: 'Needs Guru decision' },
  { label: 'Accepted', value: '1', detail: 'Prepared care' },
  { label: 'Active care', value: '0', detail: 'Live now' },
];

const requests = [
  {
    id: 'scout',
    emoji: '🐶',
    pet: 'Scout',
    service: 'Dog Walking',
    date: 'Today',
    time: '12:30 PM',
    parent: 'Taylor M.',
    price: '$34',
    status: 'Pending Guru Review',
    notes: 'Friendly dog. Calm greeting preferred, neighborhood loop, fresh water after the walk.',
  },
  {
    id: 'luna',
    emoji: '🐱',
    pet: 'Luna',
    service: 'Drop-In Visit',
    date: 'Tomorrow',
    time: 'Evening',
    parent: 'Morgan R.',
    price: '$22',
    status: 'New Request',
    notes: 'Refresh water, check food, tidy the feeding area, and send a quick PawReport note.',
  },
  {
    id: 'weekend',
    emoji: '🐾',
    pet: 'Weekend Multi-Day Care',
    service: 'Boarding Preview',
    date: 'Fri–Sun',
    time: 'Flexible',
    parent: 'Avery K.',
    price: '$135',
    status: 'Needs review',
    notes: 'Review routines, sleep setup, drop-off timing, and notes before confirming care.',
  },
];

type DockRoute = '/guru-dashboard' | '/conversation' | '/guru-requests' | '/guru-pricing';

function showRequestAlert(action: 'Accept' | 'Decline', pet: string) {
  Alert.alert(
    'Visual-only preview',
    `${action} request for ${pet} is a safe placeholder. No booking status, payment, messages, or backend records were changed.`,
  );
}

function DockButton({ label, route }: { label: string; route: DockRoute }) {
  const isActive = route === '/guru-requests';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(route)}
      style={[styles.dockItem, isActive ? styles.dockItemActive : null]}
    >
      <Text style={[styles.dockLabel, isActive ? styles.dockLabelActive : null]}>{label}</Text>
    </Pressable>
  );
}

function RouteButton({ label, route, variant = 'secondary' }: { label: string; route: Href; variant?: 'primary' | 'secondary' | 'ghost' }) {
  return <SitGuruButton label={label} onPress={() => router.push(route)} size="compact" variant={variant === 'primary' ? undefined : variant} />;
}

function RequestActions({ pet }: { pet: string }) {
  return (
    <View style={styles.buttonGrid}>
      <RouteButton label="View Details" route="/booking-details" variant="primary" />
      <RouteButton label="Message" route="/conversation" />
      <SitGuruButton label="Accept" onPress={() => showRequestAlert('Accept', pet)} size="compact" variant="secondary" />
      <SitGuruButton label="Decline" onPress={() => showRequestAlert('Decline', pet)} size="compact" variant="ghost" />
    </View>
  );
}

function RequestCard({ request }: { request: (typeof requests)[number] }) {
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View accessibilityLabel={`${request.pet} avatar placeholder`} style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{request.emoji}</Text>
        </View>
        <View style={styles.requestCopy}>
          <Text style={styles.petName}>{request.pet}</Text>
          <Text style={styles.serviceLine}>{request.service} • {request.date} • {request.time}</Text>
          <Text style={styles.parentLine}>Pet Parent: {request.parent}</Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Estimated</Text>
          <Text style={styles.priceValue}>{request.price}</Text>
        </View>
      </View>

      <View style={styles.badge}><Text style={styles.badgeText}>{request.status}</Text></View>
      <Text style={styles.notes}>Care notes preview: {request.notes}</Text>
      <RequestActions pet={request.pet} />
    </View>
  );
}

export default function GuruRequestsScreen() {
  const priority = requests[0];

  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.hero}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/guru-dashboard')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Guru Dashboard</Text>
          </Pressable>
          <Text style={styles.eyebrow}>Guru request inbox</Text>
          <Text style={styles.title}>Care Requests</Text>
          <Text style={styles.subtitle}>Review Pet Parent requests, pet details, pricing, notes, and next steps.</Text>
        </View>

        <View style={styles.statsGrid}>
          {summaryCards.map((card) => (
            <View key={card.label} style={styles.statWrap}>
              <SitGuruStatCard label={card.label} value={card.value} detail={card.detail} tone="warning" />
            </View>
          ))}
        </View>

        <View style={styles.filterRow}>
          {filters.map((filter, index) => (
            <Pressable key={filter} accessibilityRole="button" onPress={() => Alert.alert('Visual-only filter', `${filter} requests filter is a safe preview.`)} style={[styles.filterPill, index === 0 ? styles.filterPillActive : null]}>
              <Text style={[styles.filterText, index === 0 ? styles.filterTextActive : null]}>{filter}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.priorityCard}>
          <View style={styles.priorityTopRow}>
            <View>
              <Text style={styles.cardEyebrow}>Featured priority request</Text>
              <Text style={styles.priorityTitle}>Scout • Dog Walking</Text>
              <Text style={styles.priorityMeta}>Today • 12:30 PM</Text>
            </View>
            <View style={styles.priorityPriceBox}>
              <Text style={styles.priorityPriceLabel}>Estimated total</Text>
              <Text style={styles.priorityPriceValue}>$34</Text>
            </View>
          </View>
          <Text style={styles.priorityText}>Pet Parent: Taylor M.</Text>
          <View style={styles.priorityBadge}><Text style={styles.priorityBadgeText}>Pending Guru Review</Text></View>
          <Text style={styles.priorityText}>Care notes preview: Friendly dog, calm greeting preferred, fresh water after the walk.</Text>
          <Text style={styles.priorityText}>Pet Passport preview: Medium dog • 4 years old • loves brisk neighborhood walks.</Text>
          <Text style={styles.priorityText}>PawReport requested: potty, water, route note, and final summary.</Text>
          <RequestActions pet={priority.pet} />
        </View>

        <View style={styles.listStack}>
          {requests.map((request) => <RequestCard key={request.id} request={request} />)}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Final price confirmed before acceptance</Text>
          <Text style={styles.cardText}>Review service rates, custom calendar rules, busy-day adjustments, and any request notes before accepting. This screen is visual-only and does not change pricing.</Text>
          <SitGuruButton label="Pricing Calendar" onPress={() => router.push('/guru-pricing')} variant="secondary" />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Accepted care can start live updates</Text>
          <Text style={styles.cardText}>Once care is accepted and active, use Live Walk Controls to prepare PawReport updates for the Pet Parent live tracking view.</Text>
          <SitGuruButton label="Start Live Walk" onPress={() => router.push('/guru-live-walk')} />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Request alerts</Text>
          <Text style={styles.cardText}>Notifications can help you notice new booking requests, Pet Parent messages, and live walk reminders.</Text>
          <SitGuruButton label="Notifications" onPress={() => router.push('/notifications')} variant="secondary" />
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statWrap: { flexBasis: '47%', flexGrow: 1 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterPill: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  filterPillActive: { backgroundColor: SitGuruColors.primary, borderColor: SitGuruColors.primary },
  filterText: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '900' },
  filterTextActive: { color: '#FFFFFF' },
  priorityCard: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 28, gap: 12, padding: 18 },
  priorityTopRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  cardEyebrow: { color: '#BFE8CB', fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  priorityTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  priorityMeta: { color: '#D7F4DD', fontSize: 15, fontWeight: '900', marginTop: 3 },
  priorityText: { color: '#D7F4DD', fontSize: 14, fontWeight: '700', lineHeight: 21 },
  priorityPriceBox: { alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18, padding: 10 },
  priorityPriceLabel: { color: '#D7F4DD', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  priorityPriceValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  priorityBadge: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  priorityBadgeText: { color: SitGuruColors.primaryDark, fontSize: 12, fontWeight: '900' },
  listStack: { gap: 12 },
  requestCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 26, borderWidth: 1, gap: 13, padding: 16 },
  requestHeader: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  avatar: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 22, height: 58, justifyContent: 'center', width: 58 },
  avatarEmoji: { fontSize: 28 },
  requestCopy: { flex: 1, gap: 2 },
  petName: { color: SitGuruColors.text, fontSize: 20, fontWeight: '900' },
  serviceLine: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '800' },
  parentLine: { color: SitGuruColors.textSoft, fontSize: 13, fontWeight: '800' },
  priceBox: { alignItems: 'flex-end', backgroundColor: SitGuruColors.background, borderRadius: 18, padding: 10 },
  priceLabel: { color: SitGuruColors.textSoft, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  priceValue: { color: SitGuruColors.primary, fontSize: 22, fontWeight: '900' },
  badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(181, 71, 8, 0.10)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  badgeText: { color: SitGuruColors.warning, fontSize: 12, fontWeight: '900' },
  notes: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 26, borderWidth: 1, gap: 12, padding: 18 },
  safetyCard: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 26, borderWidth: 1, gap: 8, padding: 18 },
  cardTitle: { color: SitGuruColors.text, fontSize: 20, fontWeight: '900' },
  cardText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  dock: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 6, padding: 8 },
  dockItem: { alignItems: 'center', borderRadius: 18, flex: 1, justifyContent: 'center', minHeight: 54, paddingHorizontal: 4 },
  dockItemActive: { backgroundColor: SitGuruColors.surfaceSoft },
  dockLabel: { color: SitGuruColors.textSoft, fontSize: 11, fontWeight: '900' },
  dockLabelActive: { color: SitGuruColors.primary },
});
