import { router, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type NotificationItem = {
  id: string;
  icon: string;
  category: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  actionLabel: string;
  href?: Href;
};

const filters = ['All', 'Bookings', 'Messages', 'PawReport', 'Payments', 'PawPerks', 'Guru', 'Ambassador'];

const notifications: NotificationItem[] = [
  {
    id: 'payment-status-ready',
    icon: '💳',
    category: 'Payments',
    title: 'Payment status ready to review',
    message: 'Review payment timing, ways to pay, PawPerks credits, referral credits, and booking payment status.',
    time: 'Now',
    unread: true,
    actionLabel: 'Open payments',
    href: '/payments',
  },
  {
    id: 'payout-setup-review',
    icon: '💸',
    category: 'Payments',
    title: 'Payout setup needs review',
    message: 'Guru payout readiness uses a Stripe Connect placeholder until real setup is connected.',
    time: 'Today',
    unread: true,
    actionLabel: 'Review payouts',
    href: '/payments',
  },
  {
    id: 'pawperks-referral-credit',
    icon: '🎁',
    category: 'PawPerks',
    title: 'PawPerks and referral credit available',
    message: 'Review PawPerks credit, referral credit, promo code, and gift credit placeholders.',
    time: 'Today',
    unread: false,
    actionLabel: 'View credits',
    href: '/payments',
  },
  {
    id: 'support-update',
    icon: '🛟',
    category: 'Support',
    title: 'Support request update',
    message: 'SitGuru support has a visual-only update ready for review.',
    time: 'Now',
    unread: true,
    actionLabel: 'Open support',
    href: '/support',
  },
  {
    id: 'review-completed-walk',
    icon: '⭐',
    category: 'Bookings',
    title: "Review Scout’s completed walk",
    message: 'Share feedback for Scout’s completed Dog Walking care.',
    time: 'Today',
    unread: true,
    actionLabel: 'Leave review',
    href: '/reviews',
  },
  {
    id: 'booking-review',
    icon: '📋',
    category: 'Booking',
    title: 'Booking request update',
    message: 'Scout’s dog walk is waiting for Guru review.',
    time: '8 min ago',
    unread: true,
    actionLabel: 'View booking',
    href: '/booking-details',
  },
  {
    id: 'guru-request',
    icon: '🧘',
    category: 'Guru',
    title: 'New Guru care request',
    message: 'Luna has a new drop-in request ready for Guru review.',
    time: '12 min ago',
    unread: true,
    actionLabel: 'View requests',
    href: '/guru-requests',
  },
  {
    id: 'new-message',
    icon: '💬',
    category: 'Messages',
    title: 'New message',
    message: 'Local Guru replied to your care question.',
    time: '18 min ago',
    unread: true,
    actionLabel: 'Open chat',
    href: '/conversation',
  },
  {
    id: 'pawreport-live',
    icon: '🐾',
    category: 'PawReport',
    title: 'PawReport Live',
    message: 'Scout’s walk is in progress.',
    time: 'Now',
    unread: true,
    actionLabel: 'Track live',
    href: '/pawreport-live',
  },
  {
    id: 'guru-walk',
    icon: '🐕',
    category: 'Guru',
    title: 'Guru live walk reminder',
    message: 'Start the live walk when care begins.',
    time: 'Today',
    unread: true,
    actionLabel: 'Start walk',
    href: '/guru-live-walk',
  },
  {
    id: 'pricing',
    icon: '💵',
    category: 'Guru',
    title: 'Pricing reminder',
    message: 'Review your Guru pricing calendar.',
    time: 'Yesterday',
    unread: false,
    actionLabel: 'Review pricing',
    href: '/guru-pricing',
  },
  {
    id: 'pawperks',
    icon: '🎁',
    category: 'PawPerks',
    title: 'PawPerks update',
    message: 'Referral credit is ready to use.',
    time: '2 days ago',
    unread: false,
    actionLabel: 'View credits',
    href: '/payments',
  },
  {
    id: 'ambassador',
    icon: '🌟',
    category: 'Ambassador',
    title: 'Ambassador update',
    message: 'Review referral activity.',
    time: 'This week',
    unread: false,
    actionLabel: 'Open dashboard',
    href: '/ambassador-dashboard',
  },
];

const preferenceRows = [
  ['Booking alerts', true],
  ['Message alerts', true],
  ['PawReport Live alerts', true],
  ['Payment/payout alerts', false],
  ['PawPerks/referral alerts', true],
] as const;

function showPlaceholder(label: string) {
  Alert.alert('Visual preview', `${label} will be available after notification settings are connected.`);
}

export default function NotificationsScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/pet-parent-dashboard')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <SitGuruLogo size="small" variant="symbol" />
          <Pressable accessibilityRole="button" onPress={() => router.push('/support')} style={styles.backButton}>
            <Text style={styles.backButtonText}>Help & Support</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/account')} style={styles.backButton}>
            <Text style={styles.backButtonText}>Account</Text>
          </Pressable>
        </View>

        <View style={styles.heroPanel}>
          <Text style={styles.heroEyebrow}>Notifications & Alerts</Text>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>Booking alerts, messages, PawReport updates, reminders, and account notices.</Text>
        </View>

        <View style={styles.summaryGrid}>
          {[
            ['Unread', '4'],
            ['Booking', '2'],
            ['PawReport', '1'],
            ['Messages', '1'],
          ].map(([label, value]) => (
            <View key={label} style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{value}</Text>
              <Text style={styles.summaryLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.filterWrap}>
          {filters.map((filter, index) => (
            <Pressable key={filter} accessibilityRole="button" onPress={() => showPlaceholder(`${filter} filter`)} style={[styles.filterPill, index === 0 && styles.filterPillActive]}>
              <Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>{filter}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.notificationStack}>
          {notifications.map((item) => (
            <View key={item.id} style={[styles.notificationCard, item.unread && styles.notificationCardUnread]}>
              <View style={styles.notificationTopRow}>
                <View style={styles.notificationIcon}><Text style={styles.notificationIconText}>{item.icon}</Text></View>
                <View style={styles.notificationCopy}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.categoryBadge}>{item.category}</Text>
                    <Text style={styles.timeText}>{item.time}</Text>
                    {item.unread ? <View accessibilityLabel="Unread notification" style={styles.unreadDot} /> : null}
                  </View>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationMessage}>{item.message}</Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <Pressable accessibilityRole="button" onPress={() => item.href ? router.push(item.href) : showPlaceholder(item.title)} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>{item.actionLabel}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => showPlaceholder('Dismiss notification')} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Dismiss</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.preferencesPanel}>
          <Text style={styles.sectionTitle}>Notification preferences</Text>
          {preferenceRows.map(([label, enabled]) => (
            <Pressable key={label} accessibilityRole="switch" accessibilityState={{ checked: enabled }} onPress={() => showPlaceholder(label)} style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>{label}</Text>
              <View style={[styles.toggleTrack, enabled && styles.toggleTrackOn]}><View style={[styles.toggleThumb, enabled && styles.toggleThumbOn]} /></View>
            </Pressable>
          ))}
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyTitle}>Safety & privacy note</Text>
          <Text style={styles.privacyText}>Notifications should only show care, booking, and account details to the correct signed-in role.</Text>
        </View>

        <View style={styles.bottomDockSpacer} />
      </View>

      <View style={styles.bottomDock}>
        {[
          ['Dashboard', '/pet-parent-dashboard'],
          ['Messages', '/conversation'],
          ['Live', '/pawreport-live'],
          ['Account', '/account'],
        ].map(([label, href]) => (
          <Pressable key={label} accessibilityRole="button" onPress={() => router.push(href as Href)} style={styles.dockButton}>
            <Text style={styles.dockButtonText}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 8 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  backButton: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  backButtonText: { color: SitGuruColors.text, fontSize: 14, fontWeight: '900' },
  heroPanel: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 30, gap: 8, padding: 22 },
  heroEyebrow: { color: '#C9F26D', fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', letterSpacing: -1, lineHeight: 38 },
  subtitle: { color: '#DCEFE2', fontSize: 15, fontWeight: '700', lineHeight: 22 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 22, borderWidth: 1, flexBasis: '47%', flexGrow: 1, padding: 16 },
  summaryValue: { color: SitGuruColors.primary, fontSize: 28, fontWeight: '900' },
  summaryLabel: { color: SitGuruColors.textMuted, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  filterWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterPill: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  filterPillActive: { backgroundColor: SitGuruColors.primary, borderColor: SitGuruColors.primary },
  filterText: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '900' },
  filterTextActive: { color: '#FFFFFF' },
  notificationStack: { gap: 12 },
  notificationCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 26, borderWidth: 1, gap: 14, padding: 16 },
  notificationCardUnread: { borderColor: SitGuruColors.primaryLight, shadowColor: SitGuruColors.primaryDark, shadowOpacity: 0.08, shadowRadius: 10 },
  notificationTopRow: { flexDirection: 'row', gap: 12 },
  notificationIcon: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 18, height: 52, justifyContent: 'center', width: 52 },
  notificationIconText: { fontSize: 25 },
  notificationCopy: { flex: 1, gap: 5 },
  badgeRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  categoryBadge: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, color: SitGuruColors.primary, fontSize: 11, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, textTransform: 'uppercase' },
  timeText: { color: SitGuruColors.textSoft, flex: 1, fontSize: 12, fontWeight: '800' },
  unreadDot: { backgroundColor: SitGuruColors.primary, borderRadius: 999, height: 10, width: 10 },
  notificationTitle: { color: SitGuruColors.text, fontSize: 18, fontWeight: '900', lineHeight: 23 },
  notificationMessage: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primaryButton: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 999, flexGrow: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
  secondaryButtonText: { color: SitGuruColors.primary, fontSize: 14, fontWeight: '900' },
  preferencesPanel: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 12, padding: 18 },
  sectionTitle: { color: SitGuruColors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  preferenceRow: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between', paddingVertical: 6 },
  preferenceLabel: { color: SitGuruColors.text, flex: 1, fontSize: 15, fontWeight: '800' },
  toggleTrack: { backgroundColor: SitGuruColors.border, borderRadius: 999, height: 30, justifyContent: 'center', padding: 3, width: 54 },
  toggleTrackOn: { backgroundColor: SitGuruColors.primaryLight },
  toggleThumb: { backgroundColor: '#FFFFFF', borderRadius: 999, height: 24, width: 24 },
  toggleThumbOn: { alignSelf: 'flex-end', backgroundColor: SitGuruColors.primary },
  privacyNote: { backgroundColor: '#FFF8ED', borderColor: '#F8DEC8', borderRadius: 24, borderWidth: 1, gap: 6, padding: 16 },
  privacyTitle: { color: SitGuruColors.text, fontSize: 16, fontWeight: '900' },
  privacyText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  bottomDockSpacer: { height: 86 },
  bottomDock: { alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, bottom: 16, elevation: 8, flexDirection: 'row', gap: 6, left: 16, padding: 8, position: 'absolute', right: 16 },
  dockButton: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, flex: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 8 },
  dockButtonText: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900' },
});
