import { router, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type StatusTone =
  | 'complete'
  | 'visual'
  | 'wiring'
  | 'missing'
  | 'needed'
  | 'review'
  | 'future'
  | 'blocked';

type Action = {
  label: string;
  href?: Href;
  placeholder?: string;
};

type SummaryCard = {
  label: string;
  value: string;
  detail: string;
  tone: StatusTone;
};

type ProgressItem = {
  label: string;
  value: number;
  detail: string;
};

type ChecklistItem = {
  title: string;
  status: string;
  tone: StatusTone;
  detail: string;
  actions: Action[];
};

type RoleFlow = {
  title: string;
  status: string;
  tone: StatusTone;
  path: string;
  missing: string;
  actions: Action[];
};

type SimpleRow = {
  label: string;
  value: string;
  tone: StatusTone;
};

function appRoute(path: string): Href {
  return path as Href;
}

function showPlaceholder(title: string) {
  Alert.alert(
    `${title} placeholder`,
    'This is a visual-only release checklist. Final wiring, backend work, and app store submission will happen later.',
  );
}

const summaryCards: SummaryCard[] = [
  {
    label: 'UI screens',
    value: 'Strong progress',
    detail: 'Core mobile screens are taking shape.',
    tone: 'complete',
  },
  {
    label: 'Backend wiring',
    value: 'Pending',
    detail: 'Supabase/auth/data wiring is still future work.',
    tone: 'wiring',
  },
  {
    label: 'Payments / Stripe',
    value: 'Visual-only',
    detail: 'Checkout and Connect are not wired yet.',
    tone: 'visual',
  },
  {
    label: 'GPS / Live tracking',
    value: 'Visual-only',
    detail: 'PawReport Live needs real device GPS later.',
    tone: 'visual',
  },
  {
    label: 'Push notifications',
    value: 'Visual-only',
    detail: 'Notification center exists, native push is future work.',
    tone: 'visual',
  },
  {
    label: 'Privacy / legal',
    value: 'Needs review',
    detail: 'Policies and app store privacy details are required.',
    tone: 'needed',
  },
  {
    label: 'App store assets',
    value: 'Not started',
    detail: 'Screenshots, descriptions, and metadata are still needed.',
    tone: 'missing',
  },
  {
    label: 'QA testing',
    value: 'In progress',
    detail: 'Routes and flows need device testing.',
    tone: 'review',
  },
];

const progressItems: ProgressItem[] = [
  {
    label: 'Overall readiness',
    value: 45,
    detail: 'Good visual foundation, major production wiring remains.',
  },
  {
    label: 'Visual UI completion',
    value: 80,
    detail: 'Most core screens now have mobile-first previews.',
  },
  {
    label: 'Backend completion',
    value: 10,
    detail: 'Backend integration is intentionally not wired yet.',
  },
  {
    label: 'Store readiness',
    value: 15,
    detail: 'Release assets, legal docs, and native builds are future work.',
  },
];

const featureChecklist: ChecklistItem[] = [
  {
    title: 'Home / Welcome',
    status: 'Complete UI',
    tone: 'complete',
    detail: 'Welcome flow and public entry are visually established.',
    actions: [{ label: 'Open Home', href: appRoute('/') }],
  },
  {
    title: 'Find Care',
    status: 'Complete UI',
    tone: 'complete',
    detail: 'Open visitor search and care discovery are visually available.',
    actions: [{ label: 'Open Find Care', href: appRoute('/find-care') }],
  },
  {
    title: 'Guru Profile',
    status: 'Complete UI',
    tone: 'complete',
    detail: 'Public Guru profile preview supports search-to-booking flow.',
    actions: [{ label: 'Open Guru Profile', href: appRoute('/guru-profile') }],
  },
  {
    title: 'Pet Passports',
    status: 'Complete UI',
    tone: 'complete',
    detail: 'Pet care profile hub exists for Pet Parents and Guru prep.',
    actions: [{ label: 'Open Pet Passports', href: appRoute('/pet-passports') }],
  },
  {
    title: 'Request Booking',
    status: 'Complete UI',
    tone: 'complete',
    detail: 'Pet Parent booking request flow is visual and route-safe.',
    actions: [{ label: 'Open Request Booking', href: appRoute('/request-booking') }],
  },
  {
    title: 'Booking Details',
    status: 'Complete UI',
    tone: 'complete',
    detail: 'Central booking hub connects care notes, status, and live updates.',
    actions: [{ label: 'Open Booking Details', href: appRoute('/booking-details') }],
  },
  {
    title: 'PawReport Live',
    status: 'Visual-only',
    tone: 'visual',
    detail: 'Pet Parent live care view exists without real GPS wiring.',
    actions: [{ label: 'Open PawReport Live', href: appRoute('/pawreport-live') }],
  },
  {
    title: 'Guru Live Walk',
    status: 'Visual-only',
    tone: 'visual',
    detail: 'Guru live walk controls exist without real GPS/camera wiring.',
    actions: [{ label: 'Open Live Walk', href: appRoute('/guru-live-walk') }],
  },
  {
    title: 'Messages',
    status: 'Complete UI',
    tone: 'complete',
    detail: 'Conversation screen links booking, profile, and PawReport context.',
    actions: [{ label: 'Open Conversation', href: appRoute('/conversation') }],
  },
  {
    title: 'Notifications',
    status: 'Complete UI',
    tone: 'complete',
    detail: 'Visual notification center exists; native push is future work.',
    actions: [{ label: 'Open Notifications', href: appRoute('/notifications') }],
  },
  {
    title: 'Payments & Payouts',
    status: 'Visual-only',
    tone: 'visual',
    detail: 'Payment options and payout readiness exist without Stripe wiring.',
    actions: [{ label: 'Open Payments', href: appRoute('/payments') }],
  },
  {
    title: 'Guru Pricing',
    status: 'Complete UI',
    tone: 'complete',
    detail: 'Guru pricing, discounts, and calendar pricing are visually established.',
    actions: [{ label: 'Open Guru Pricing', href: appRoute('/guru-pricing') }],
  },
  {
    title: 'Guru Requests',
    status: 'Needs wiring',
    tone: 'wiring',
    detail: 'Visual request inbox can be added or expanded for Guru operations.',
    actions: [{ label: 'Review Requests', href: appRoute('/booking-details') }],
  },
  {
    title: 'Reviews & Ratings',
    status: 'Visual-only',
    tone: 'visual',
    detail: 'Trust and feedback flow is planned for completed bookings.',
    actions: [{ label: 'Open Reviews', href: appRoute('/reviews') }],
  },
  {
    title: 'Help & Support',
    status: 'Complete UI',
    tone: 'complete',
    detail: 'Support center visually covers booking, safety, account, and payments help.',
    actions: [{ label: 'Open Support', href: appRoute('/support') }],
  },
  {
    title: 'Account & Settings',
    status: 'Complete UI',
    tone: 'complete',
    detail: 'Central account, roles, privacy, support, and app settings hub exists.',
    actions: [{ label: 'Open Account', href: appRoute('/account') }],
  },
  {
    title: 'Admin Operations',
    status: 'Visual-only',
    tone: 'visual',
    detail: 'Internal operations dashboard preview exists without permissions/data wiring.',
    actions: [{ label: 'Open Operations', href: appRoute('/admin-operations') }],
  },
];

const roleFlows: RoleFlow[] = [
  {
    title: 'Pet Parent flow',
    status: 'Strong visual path',
    tone: 'complete',
    path: 'Find Care → Guru Profile → Message → Request Booking → Booking Details → PawReport Live → Reviews',
    missing:
      'Needs auth, real profiles, booking saves, payments, notifications, GPS, and reviews backend.',
    actions: [
      { label: 'Find Care', href: appRoute('/find-care') },
      { label: 'Booking Details', href: appRoute('/booking-details') },
      { label: 'PawReport Live', href: appRoute('/pawreport-live') },
    ],
  },
  {
    title: 'Guru flow',
    status: 'Strong visual path',
    tone: 'complete',
    path: 'Guru Dashboard → Pricing Calendar → Requests → Booking Details → Live Walk Controls → Earnings/Payouts',
    missing:
      'Needs Guru profile data, availability saves, request queue, Stripe Connect, visit sessions, and payout logic.',
    actions: [
      { label: 'Guru Dashboard', href: appRoute('/guru-dashboard') },
      { label: 'Guru Pricing', href: appRoute('/guru-pricing') },
      { label: 'Live Walk', href: appRoute('/guru-live-walk') },
    ],
  },
  {
    title: 'Ambassador flow',
    status: 'Visual preview',
    tone: 'visual',
    path: 'Ambassador Dashboard → Referrals → Training → Rewards → Notifications',
    missing:
      'Needs referral tracking, reward rules, training progress, approval workflow, and payout/reward wiring.',
    actions: [
      { label: 'Ambassador Dashboard', href: appRoute('/ambassador-dashboard') },
      { label: 'Payments', href: appRoute('/payments') },
      { label: 'Notifications', href: appRoute('/notifications') },
    ],
  },
  {
    title: 'Admin flow',
    status: 'Visual preview',
    tone: 'visual',
    path: 'Operations → Support Queue → Active Care → Payments/Payouts → Safety Flags',
    missing:
      'Needs real admin permissions, support queue, user management, reporting, safety review, and audit logging.',
    actions: [
      { label: 'Admin Operations', href: appRoute('/admin-operations') },
      { label: 'Support', href: appRoute('/support') },
      { label: 'Payments', href: appRoute('/payments') },
    ],
  },
];

const backendRows: SimpleRow[] = [
  { label: 'Auth / secure login', value: 'Future Supabase', tone: 'future' },
  { label: 'Role-based access', value: 'Not wired', tone: 'wiring' },
  { label: 'User roles', value: 'Future Supabase', tone: 'future' },
  { label: 'Profiles', value: 'Visual-only', tone: 'visual' },
  { label: 'Pet Passports', value: 'Future Supabase + Storage', tone: 'future' },
  { label: 'Guru profiles', value: 'Future Supabase', tone: 'future' },
  { label: 'Ambassador profiles', value: 'Future Supabase', tone: 'future' },
  { label: 'Conversations / messages', value: 'Future realtime', tone: 'future' },
  { label: 'Booking requests', value: 'Future database', tone: 'future' },
  { label: 'Bookings', value: 'Future database', tone: 'future' },
  { label: 'PawReport sessions', value: 'Future realtime', tone: 'future' },
  { label: 'Live location points', value: 'Future GPS + realtime', tone: 'future' },
  { label: 'Visit updates', value: 'Future Supabase', tone: 'future' },
  { label: 'Guru pricing', value: 'Visual-only', tone: 'visual' },
  { label: 'Guru availability', value: 'Visual-only', tone: 'visual' },
  { label: 'Notifications', value: 'Future push', tone: 'future' },
  { label: 'Payments', value: 'Future Stripe Checkout', tone: 'future' },
  { label: 'Payouts', value: 'Future Stripe Connect', tone: 'future' },
  { label: 'Referrals / PawPerks', value: 'Future rules engine', tone: 'future' },
  { label: 'Reviews', value: 'Future database', tone: 'future' },
  { label: 'Admin operations', value: 'Future permissions', tone: 'future' },
];

const privacyRows: SimpleRow[] = [
  { label: 'Privacy policy', value: 'Needed', tone: 'needed' },
  { label: 'Terms of service', value: 'Needed', tone: 'needed' },
  { label: 'Data Safety / app privacy labels', value: 'Review', tone: 'review' },
  { label: 'Location permission wording', value: 'Needed', tone: 'needed' },
  { label: 'Camera/photo permission wording', value: 'Needed', tone: 'needed' },
  { label: 'Notification permission wording', value: 'Needed', tone: 'needed' },
  { label: 'Payment security copy', value: 'Draft', tone: 'review' },
  { label: 'Support/safety reporting', value: 'Visual-only', tone: 'visual' },
  { label: 'Live tracking only during active booked care', value: 'Required', tone: 'needed' },
  { label: 'Off-platform payment warning', value: 'Required', tone: 'needed' },
  { label: 'Account deletion / data request', value: 'Future', tone: 'future' },
  { label: 'Child safety / age policy review', value: 'Review', tone: 'review' },
];

const assetRows: SimpleRow[] = [
  { label: 'App icon', value: 'Not started', tone: 'missing' },
  { label: 'Splash screen', value: 'Not started', tone: 'missing' },
  { label: 'App name', value: 'Draft', tone: 'review' },
  { label: 'Subtitle / tagline', value: 'Draft', tone: 'review' },
  { label: 'Short description', value: 'Needed', tone: 'needed' },
  { label: 'Long description', value: 'Needed', tone: 'needed' },
  { label: 'Keywords', value: 'Needed', tone: 'needed' },
  { label: 'Screenshots', value: 'Not started', tone: 'missing' },
  { label: 'Preview video', value: 'Optional', tone: 'future' },
  { label: 'Support URL', value: 'Needed', tone: 'needed' },
  { label: 'Marketing URL', value: 'Needed', tone: 'needed' },
  { label: 'Privacy policy URL', value: 'Needed', tone: 'needed' },
  { label: 'Contact email', value: 'Needed', tone: 'needed' },
  { label: 'Category', value: 'Review', tone: 'review' },
  { label: 'Age rating', value: 'Review', tone: 'review' },
  { label: 'Test account instructions', value: 'Needed', tone: 'needed' },
  { label: 'Review notes', value: 'Needed', tone: 'needed' },
  { label: 'App content declarations', value: 'Needed', tone: 'needed' },
  { label: 'Data safety / privacy labels', value: 'Needed', tone: 'needed' },
];

const technicalRows: SimpleRow[] = [
  { label: 'TypeScript passes', value: 'Required before each merge', tone: 'review' },
  { label: 'Route audit passes', value: 'In progress', tone: 'review' },
  { label: 'Expo web preview', value: 'Working preview', tone: 'complete' },
  { label: 'Device testing', value: 'Needed', tone: 'needed' },
  { label: 'iOS simulator', value: 'Needed', tone: 'needed' },
  { label: 'Android emulator', value: 'Needed', tone: 'needed' },
  { label: 'Real phone testing', value: 'Needed', tone: 'needed' },
  { label: 'Offline behavior review', value: 'Future', tone: 'future' },
  { label: 'Performance review', value: 'Needed', tone: 'needed' },
  { label: 'Accessibility review', value: 'Needed', tone: 'needed' },
  { label: 'Crash/error tracking', value: 'Future', tone: 'future' },
  { label: 'EAS build setup', value: 'Future', tone: 'future' },
  { label: 'App signing', value: 'Future', tone: 'future' },
];

const releaseBlockers: SimpleRow[] = [
  { label: 'Backend not wired', value: 'Blocker', tone: 'blocked' },
  { label: 'Backend readiness plan', value: 'Needs review', tone: 'review' },
  { label: 'Auth & Role Session Plan', value: 'Needs review', tone: 'review' },
  { label: 'Auth not wired', value: 'Blocker', tone: 'blocked' },
  { label: 'Real payments not wired', value: 'Blocker', tone: 'blocked' },
  { label: 'Real payouts not wired', value: 'Blocker', tone: 'blocked' },
  { label: 'Real GPS not wired', value: 'Blocker', tone: 'blocked' },
  { label: 'Real push notifications not wired', value: 'Blocker', tone: 'blocked' },
  { label: 'Real image upload not wired', value: 'Blocker', tone: 'blocked' },
  { label: 'App store metadata not prepared', value: 'Blocker', tone: 'blocked' },
  { label: 'Privacy/legal docs not finalized', value: 'Blocker', tone: 'blocked' },
  { label: 'Production QA not complete', value: 'Blocker', tone: 'blocked' },
];

const quickActions: Action[] = [
  { label: 'Real Wiring Start Plan', href: appRoute('/wiring-start-plan') },
  { label: 'Supabase Schema Readiness', href: appRoute('/schema-readiness') },   { label: 'Auth & Role Session Plan', href: appRoute('/auth-readiness') },
  { label: 'Backend Readiness', href: appRoute('/backend-readiness') }, { label: 'QA Test Center', href: appRoute('/qa-test-center') },
  { label: 'Admin Operations', href: appRoute('/admin-operations') },
  { label: 'Help & Support', href: appRoute('/support') },
  { label: 'Account', href: appRoute('/account') },
  { label: 'Notifications', href: appRoute('/notifications') },
  { label: 'Payments', href: appRoute('/payments') },
  { label: 'Booking Details', href: appRoute('/booking-details') },
  { label: 'Guru Pricing', href: appRoute('/guru-pricing') },
];

export default function ReleaseReadinessScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={980}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <ActionButton
            action={{ label: '‹ Account', href: appRoute('/account') }}
          />

          <Text style={styles.topPill}>Internal Preview</Text>
        </View>

        <View style={styles.heroPanel}>
          <View style={styles.heroCopy}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Release Readiness</Text>
            </View>

            <Text style={styles.title}>Track SitGuru app launch readiness.</Text>

            <Text style={styles.subtitle}>
              Review feature coverage, privacy needs, testing status, backend
              wiring, app store assets, and release blockers before public launch.
            </Text>

            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>Internal visual checklist only</Text>
              <Text style={styles.noticeText}>
                Final App Store, Google Play, privacy, legal, security, and
                production requirements must be reviewed before public release.
              </Text>
            </View>
          </View>

          <View style={styles.heroVisual}>
            <Text style={styles.heroIcon}>🚀</Text>
            <Text style={styles.heroVisualTitle}>Launch readiness</Text>
            <Text style={styles.heroVisualText}>
              Visual UI is strong. Backend, real payments, GPS, push, uploads,
              privacy, and store assets remain release blockers.
            </Text>
          </View>
        </View>

        <Section title="Overall readiness summary" eyebrow="Snapshot">
          <View style={styles.summaryGrid}>
            {summaryCards.map((card) => (
              <MetricCard key={card.label} card={card} />
            ))}
          </View>
        </Section>

        <Section title="Completion progress" eyebrow="Readiness">
          <View style={styles.progressList}>
            {progressItems.map((item) => (
              <ProgressRow key={item.label} item={item} />
            ))}
          </View>
        </Section>

        <Section title="Core feature checklist" eyebrow="Screens and routes">
          <View style={styles.checklist}>
            {featureChecklist.map((item) => (
              <ChecklistRow key={item.title} item={item} />
            ))}
          </View>
        </Section>

        <Section title="Role flow checklist" eyebrow="End-to-end previews">
          <View style={styles.roleFlowGrid}>
            {roleFlows.map((flow) => (
              <RoleFlowCard key={flow.title} flow={flow} />
            ))}
          </View>
        </Section>

        <Section title="Backend and data wiring checklist" eyebrow="Production wiring">
          <View style={styles.rowList}>
            {backendRows.map((row) => (
              <SimpleStatusRow key={row.label} row={row} />
            ))}
          </View>
        </Section>

        <Section title="Privacy, safety, and permissions" eyebrow="Required review">
          <View style={styles.rowList}>
            {privacyRows.map((row) => (
              <SimpleStatusRow key={row.label} row={row} />
            ))}
          </View>
        </Section>

        <Section title="App store asset checklist" eyebrow="Store materials">
          <View style={styles.rowList}>
            {assetRows.map((row) => (
              <SimpleStatusRow key={row.label} row={row} />
            ))}
          </View>
        </Section>

        <Section title="Technical release checklist" eyebrow="QA and builds">
          <View style={styles.rowList}>
            {technicalRows.map((row) => (
              <SimpleStatusRow key={row.label} row={row} />
            ))}
          </View>
        </Section>

        <Section title="Release blockers" eyebrow="Not ready for public launch">
          <View style={styles.blockerCard}>
            <Text style={styles.blockerTitle}>Do not submit publicly yet.</Text>
            <Text style={styles.blockerText}>
              SitGuru mobile has a strong visual foundation, but production
              release still requires real backend, auth, payments, GPS, push,
              uploads, legal, store metadata, and QA completion.
            </Text>
          </View>

          <View style={styles.rowList}>
            {releaseBlockers.map((row) => (
              <SimpleStatusRow key={row.label} row={row} />
            ))}
          </View>
        </Section>

        <Section title="Quick actions" eyebrow="Open related previews">
          <View style={styles.actionGrid}>
            {quickActions.map((action) => (
              <ActionButton key={action.label} action={action} primary />
            ))}
          </View>
        </Section>

        <View style={styles.bottomDock}>
          <ActionButton action={{ label: 'Account', href: appRoute('/account') }} />
          <ActionButton
            action={{ label: 'Operations', href: appRoute('/admin-operations') }}
            primary
          />
          <ActionButton
            action={{ label: 'Alerts', href: appRoute('/notifications') }}
          />
          <ActionButton action={{ label: 'Support', href: appRoute('/support') }} />
        </View>
      </View>
    </SitGuruScreen>
  );
}

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MetricCard({ card }: { card: SummaryCard }) {
  return (
    <View style={styles.metricCard}>
      <StatusBadge label={card.value} tone={card.tone} />
      <Text style={styles.metricLabel}>{card.label}</Text>
      <Text style={styles.metricDetail}>{card.detail}</Text>
    </View>
  );
}

function ProgressRow({ item }: { item: ProgressItem }) {
  const safeValue = Math.max(0, Math.min(100, item.value));
  const progressWidth = `${safeValue}%` as `${number}%`;

  return (
    <View style={styles.progressRow}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{item.label}</Text>
        <Text style={styles.progressValue}>{safeValue}%</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <Text style={styles.progressDetail}>{item.detail}</Text>
    </View>
  );
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  return (
    <View style={styles.checklistRow}>
      <View style={styles.checklistCopy}>
        <StatusBadge label={item.status} tone={item.tone} />
        <Text style={styles.checklistTitle}>{item.title}</Text>
        <Text style={styles.checklistDetail}>{item.detail}</Text>
      </View>

      <View style={styles.rowActions}>
        {item.actions.map((action) => (
          <ActionButton key={action.label} action={action} />
        ))}
      </View>
    </View>
  );
}

function RoleFlowCard({ flow }: { flow: RoleFlow }) {
  return (
    <View style={styles.roleFlowCard}>
      <StatusBadge label={flow.status} tone={flow.tone} />
      <Text style={styles.roleFlowTitle}>{flow.title}</Text>
      <Text style={styles.roleFlowPath}>{flow.path}</Text>
      <Text style={styles.roleFlowMissing}>Missing backend pieces: {flow.missing}</Text>

      <View style={styles.rowActions}>
        {flow.actions.map((action) => (
          <ActionButton key={action.label} action={action} />
        ))}
      </View>
    </View>
  );
}

function SimpleStatusRow({ row }: { row: SimpleRow }) {
  return (
    <View style={styles.simpleRow}>
      <Text style={styles.simpleRowLabel}>{row.label}</Text>
      <StatusBadge label={row.value} tone={row.tone} />
    </View>
  );
}

function ActionButton({
  action,
  primary = false,
}: {
  action: Action;
  primary?: boolean;
}) {
  function handlePress() {
    if (action.href) {
      router.push(action.href);
      return;
    }

    showPlaceholder(action.placeholder || action.label);
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      style={[styles.actionButton, primary && styles.actionButtonPrimary]}
    >
      <Text
        style={[
          styles.actionButtonText,
          primary && styles.actionButtonPrimaryText,
        ]}
      >
        {action.label}
      </Text>
    </Pressable>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <Text style={[styles.statusBadge, getStatusBadgeStyle(tone)]}>{label}</Text>
  );
}

function getStatusBadgeStyle(tone: StatusTone) {
  switch (tone) {
    case 'complete':
      return styles.statusComplete;
    case 'visual':
      return styles.statusVisual;
    case 'wiring':
      return styles.statusWiring;
    case 'missing':
      return styles.statusMissing;
    case 'needed':
      return styles.statusNeeded;
    case 'review':
      return styles.statusReview;
    case 'future':
      return styles.statusFuture;
    case 'blocked':
      return styles.statusBlocked;
    default:
      return styles.statusFuture;
  }
}

const styles = StyleSheet.create({
  page: {
    gap: 16,
    paddingBottom: 4,
    paddingVertical: 4,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topPill: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  heroPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 34,
    borderWidth: 1,
    elevation: 4,
    gap: 18,
    padding: 18,
  },
  heroCopy: {
    gap: 15,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroBadgeText: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: SitGuruColors.text,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 44,
  },
  subtitle: {
    color: SitGuruColors.textMuted,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  noticeCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: 22,
    borderWidth: 1,
    gap: 5,
    padding: 14,
  },
  noticeTitle: {
    color: SitGuruColors.warning,
    fontSize: 15,
    fontWeight: '900',
  },
  noticeText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
  heroVisual: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 26,
    borderWidth: 1,
    gap: 8,
    justifyContent: 'center',
    minHeight: 210,
    padding: 20,
  },
  heroIcon: {
    fontSize: 44,
  },
  heroVisualTitle: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroVisualText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 13,
    padding: 16,
  },
  sectionEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: SitGuruColors.text,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexGrow: 1,
    gap: 6,
    minWidth: 180,
    padding: 14,
  },
  metricLabel: {
    color: SitGuruColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  metricDetail: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  statusComplete: {
    backgroundColor: SitGuruColors.surfaceSoft,
    color: SitGuruColors.primary,
  },
  statusVisual: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
  },
  statusWiring: {
    backgroundColor: '#FFFBEB',
    color: '#92400E',
  },
  statusMissing: {
    backgroundColor: '#F4F4F5',
    color: '#52525B',
  },
  statusNeeded: {
    backgroundColor: '#FFF1F2',
    color: '#BE123C',
  },
  statusReview: {
    backgroundColor: '#F5F3FF',
    color: '#6D28D9',
  },
  statusFuture: {
    backgroundColor: SitGuruColors.background,
    color: SitGuruColors.textMuted,
  },
  statusBlocked: {
    backgroundColor: '#FEF2F2',
    color: SitGuruColors.danger,
  },
  progressList: {
    gap: 12,
  },
  progressRow: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 13,
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: SitGuruColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  progressValue: {
    color: SitGuruColors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  progressTrack: {
    backgroundColor: SitGuruColors.surface,
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    height: '100%',
  },
  progressDetail: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  checklist: {
    gap: 10,
  },
  checklistRow: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  checklistCopy: {
    gap: 6,
  },
  checklistTitle: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  checklistDetail: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleFlowGrid: {
    gap: 10,
  },
  roleFlowCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 9,
    padding: 14,
  },
  roleFlowTitle: {
    color: SitGuruColors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  roleFlowPath: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
  roleFlowMissing: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  rowList: {
    gap: 8,
  },
  simpleRow: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 12,
  },
  simpleRowLabel: {
    color: SitGuruColors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  blockerCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 22,
    borderWidth: 1,
    gap: 5,
    padding: 14,
  },
  blockerTitle: {
    color: SitGuruColors.danger,
    fontSize: 18,
    fontWeight: '900',
  },
  blockerText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 13,
  },
  actionButtonPrimary: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  actionButtonText: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  actionButtonPrimaryText: {
    color: '#FFFFFF',
  },
  bottomDock: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    padding: 8,
  },
});