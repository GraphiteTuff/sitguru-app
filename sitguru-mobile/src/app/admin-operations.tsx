import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import RoleGate from '@/components/RoleGate';
import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type Action = { label: string; href?: Href; alert?: string };
type CardProps = { title: string; eyebrow?: string; children: ReactNode };

const summaryCards = [
  ['Active bookings', '—'],
  ['Live walks', '—'],
  ['Pending Guru requests', '—'],
  ['New Pet Parents', '—'],
  ['Support queue', '—'],
  ['Payment alerts', '—'],
  ['Ambassador leads', '—'],
  ['Safety flags', '—'],
] as const;

const filters = [
  'Overview',
  'Bookings',
  'Live Walks',
  'Messages',
  'Payments',
  'Gurus',
  'Pet Parents',
  'Ambassadors',
  'Support',
  'Safety',
];

function previewAlert(label: string) {
  Alert.alert(
    'Admin operations preview',
    `${label} is a safe visual-only placeholder. Real admin permissions and data access will be wired later.`,
  );
}

function go(action: Action) {
  if (action.href) {
    router.push(action.href);
    return;
  }

  previewAlert(action.alert ?? action.label);
}

function Card({ title, eyebrow, children }: CardProps) {
  return (
    <View style={styles.card}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Button({ action, primary = false }: { action: Action; primary?: boolean }) {
  return (
    <BubblePressable
      accessibilityRole="button"
      onPress={() => go(action)}
      style={[styles.button, primary && styles.primaryButton]}>
      <Text style={[styles.buttonText, primary && styles.primaryButtonText]}>{action.label}</Text>
    </BubblePressable>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function ActionRow({ actions }: { actions: Action[] }) {
  return (
    <View style={styles.actionRow}>
      {actions.map((action, index) => (
        <Button key={action.label} action={action} primary={index === 0} />
      ))}
    </View>
  );
}

function Bullet({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{label}</Text>
      {value ? <Text style={styles.bulletValue}>{value}</Text> : null}
    </View>
  );
}

export default function AdminOperationsScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={820}>
      <RoleGate requiredRole="admin">
        <View style={styles.page}>
          <View style={styles.topBar}>
            <BubblePressable
              accessibilityRole="button"
              onPress={() => router.push('/account')}
              scaleTo={0.88}
              style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back to Account</Text>
            </BubblePressable>
            <SitGuruLogo size="small" variant="symbol" />
          </View>

          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>Internal preview</Text>
            <Text style={styles.title}>Admin Operations</Text>
            <Text style={styles.subtitle}>
              Monitor active care, booking requests, live walks, messages, payments, support, and
              local growth from one operations view.
            </Text>
            <Text style={styles.notice}>
              Live counts are not loaded. Values marked — are empty, not sample
              operations data.
            </Text>
          </View>

          <View style={styles.summaryGrid}>
            {summaryCards.map(([label, value]) => (
              <View key={label} style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{value}</Text>
                <Text style={styles.summaryLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.chips}>
            {filters.map((filter, index) => (
              <BubblePressable
                key={filter}
                accessibilityRole="button"
                onPress={() => previewAlert(`${filter} filter`)}
                scaleTo={0.88}
                style={[styles.chip, index === 0 && styles.chipActive]}>
                <Text style={[styles.chipText, index === 0 && styles.chipTextActive]}>{filter}</Text>
              </BubblePressable>
            ))}
          </View>

          <Card title="Active Care">
            <Text style={styles.emptyText}>
              No live care sessions are loaded. This view does not show sample pets
              or placeholder visits.
            </Text>

            <ActionRow
              actions={[
                { label: 'Bookings', href: '/bookings' },
                { label: 'PawReport Live', href: '/pawreport-live' },
                { label: 'Message', href: '/conversation' },
              ]}
            />
          </Card>

          <Card title="Live Walk Monitor">
            <Text style={styles.emptyText}>
              No live walk is loaded. Elapsed time, distance, Guru, and Pet Parent
              details stay empty until real walk data is connected.
            </Text>

            <ActionRow
              actions={[
                { label: 'View PawReport Live', href: '/pawreport-live' },
                { label: 'Guru Live Walk Preview', href: '/guru-live-walk' },
                { label: 'Message Thread', href: '/conversation' },
              ]}
            />
          </Card>

          <Card title="Booking Requests">
            <View style={styles.metricGrid}>
              {[
                ['New requests', '—'],
                ['Pending Guru review', '—'],
                ['Accepted', '—'],
                ['Active', '—'],
                ['Completed', '—'],
              ].map(([label, value]) => (
                <StatRow key={label} label={label} value={value} />
              ))}
            </View>

            <ActionRow
              actions={[
                { label: 'Guru Requests', href: '/guru-requests' },
                { label: 'Assign support' },
                { label: 'Escalate' },
                { label: 'Archive' },
              ]}
            />
          </Card>

          <Card title="Messages & Support">
            {['Visitor support', 'Pet Parent message', 'Guru message', 'Ambassador support'].map((label) => (
              <Bullet key={label} label={label} value="Needs review" />
            ))}

            <ActionRow
              actions={[
                { label: 'Conversation', href: '/conversation' },
                { label: 'Support Center', href: '/support' },
                { label: 'Notifications', href: '/notifications' },
                { label: 'Archive thread' },
                { label: 'Mark urgent' },
                { label: 'Assign owner' },
              ]}
            />
          </Card>

          <Card title="Payments & Payouts">
            {[
              'Payment waiting for Guru acceptance',
              'Guru payout setup needed',
              'Ambassador reward pending',
              'PawPerks credit ready',
            ].map((label) => (
              <Bullet key={label} label={label} />
            ))}

            <ActionRow
              actions={[
                { label: 'Payments & Payouts', href: '/payments' },
                { label: 'Bookings', href: '/bookings' },
                { label: 'Guru Pricing', href: '/guru-pricing' },
                { label: 'Review payout' },
                { label: 'Flag payment issue' },
              ]}
            />
          </Card>

          <Card title="Local Growth">
            {[
              'New Pet Parents',
              'New Gurus',
              'New Ambassadors',
              'Incomplete profiles',
              'Missing location / ZIP',
              'Missing profile photo',
            ].map((label) => (
              <Bullet key={label} label={label} />
            ))}

            <ActionRow
              actions={[
                { label: 'Pet Parent Dashboard', href: '/pet-parent-dashboard' },
                { label: 'Guru Dashboard', href: '/guru-dashboard' },
                { label: 'Ambassador Dashboard', href: '/ambassador-dashboard' },
                { label: 'Account', href: '/account' },
              ]}
            />
          </Card>

          <Card title="Ambassador Activity">
            {['Leads: —', 'Referral clicks: —', 'Training reminders: —', 'Reward status: not loaded'].map(
              (label) => (
                <Bullet key={label} label={label} />
              ),
            )}

            <ActionRow
              actions={[
                { label: 'Ambassador Dashboard', href: '/ambassador-dashboard' },
                { label: 'Notifications', href: '/notifications' },
                { label: 'Payments', href: '/payments' },
              ]}
            />
          </Card>

          <Card title="Trust & Safety">
            {[
              'Safety flags: 0',
              'Live tracking privacy check',
              'Off-platform payment warning',
              'Booking communication policy',
            ].map((label) => (
              <Bullet key={label} label={label} />
            ))}

            <ActionRow
              actions={[
                { label: 'Help & Support', href: '/support' },
                { label: 'Bookings', href: '/bookings' },
                { label: 'PawReport Live', href: '/pawreport-live' },
                { label: 'Open safety review' },
                { label: 'Add internal note' },
              ]}
            />
          </Card>

          <Card title="App Health Preview">
            {[
              'App routes: OK',
              'TypeScript: expected pass',
              'Realtime: not wired',
              'Payments: visual-only',
              'GPS: visual-only',
              'Push notifications: visual-only',
            ].map((label) => (
              <Bullet key={label} label={label} />
            ))}

            <Text style={styles.note}>
              This is an operations preview. Backend, auth, permissions, realtime, and analytics will
              be wired later.
            </Text>

            <ActionRow
              actions={[{ label: 'Notifications', href: '/notifications' }]}
            />
          </Card>

          <View style={styles.bottomDockSpacer} />
        </View>
      </RoleGate>

      <View style={styles.bottomDock}>
        {[
          ['Dashboard', '/account'],
          ['Bookings', '/bookings'],
          ['Alerts', '/notifications'],
          ['Support', '/support'],
        ].map(([label, href]) => (
          <BubblePressable
            key={label}
            accessibilityRole="button"
            onPress={() => router.push(href as Href)}
            style={styles.dockButton}>
            <Text style={styles.dockButtonText}>{label}</Text>
          </BubblePressable>
        ))}
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 16,
    paddingBottom: 8,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: {
    color: SitGuruColors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  hero: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 30,
    gap: 10,
    padding: 22,
  },
  heroEyebrow: {
    color: '#C9F26D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 40,
  },
  subtitle: {
    color: '#DCEFE2',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  notice: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 18,
    borderWidth: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 19,
    padding: 12,
  },
  emptyText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexBasis: 150,
    flexGrow: 1,
    gap: 4,
    padding: 15,
  },
  summaryValue: {
    color: SitGuruColors.primary,
    fontSize: 28,
    fontWeight: '900',
  },
  summaryLabel: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: SitGuruColors.primary,
  },
  chipText: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  eyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: SitGuruColors.text,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  careItem: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 13,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  avatarText: {
    fontSize: 25,
  },
  careCopy: {
    gap: 5,
  },
  itemTitle: {
    color: SitGuruColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  itemMeta: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 999,
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statRow: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: 210,
    flexGrow: 1,
    gap: 4,
    padding: 13,
  },
  statLabel: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  statValue: {
    color: SitGuruColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  bullet: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  bulletDot: {
    color: SitGuruColors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  bulletText: {
    color: SitGuruColors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  bulletValue: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
  },
  primaryButton: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  buttonText: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  note: {
    backgroundColor: '#FFF8ED',
    borderColor: '#F8DEC8',
    borderRadius: 18,
    borderWidth: 1,
    color: SitGuruColors.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    padding: 14,
  },
  bottomDockSpacer: {
    height: 88,
  },
  bottomDock: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    bottom: 16,
    elevation: 8,
    flexDirection: 'row',
    gap: 6,
    left: 16,
    padding: 8,
    position: 'absolute',
    right: 16,
  },
  dockButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 8,
  },
  dockButtonText: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
});