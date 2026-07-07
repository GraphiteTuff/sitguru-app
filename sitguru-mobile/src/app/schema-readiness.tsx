import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type Action = {
  label: string;
  href?: Href;
  placeholder?: string;
};

type FutureGroup = {
  title: string;
  purpose: string;
  tables: string[];
  rls: string;
  routes: string[];
  action: Action;
};

type FutureTable = {
  name: string;
  purpose: string;
  status: string;
  route: string;
  rls: string;
  action: Action;
};

type Policy = {
  purpose: string;
  risk: string;
  route: string;
};

type Bucket = {
  name: string;
  purpose: string;
  access: string;
  visibility: string;
  signedUrl: string;
  note: string;
  route: string;
};

type RealtimePlan = {
  topic: string;
  publisher: string;
  subscriber: string;
  security: string;
  event: string;
};

type Phase = {
  title: string;
  priority: string;
  routes: string;
  risks: string;
  status: string;
};

const existingRoutes = new Set([
  '/account',
  '/admin-operations',
  '/auth-readiness',
  '/backend-readiness',
  '/booking-details',
  '/conversation',
  '/find-care',
  '/guru-live-walk',
  '/guru-pricing',
  '/guru-profile',
  '/notifications',
  '/pawreport-live',
  '/payments',
  '/pet-passports',
  '/qa-test-center',
  '/release-readiness',
  '/request-booking',
  '/reviews',
  '/support',
  '/wiring-start-plan',
]);

function href(path: string) {
  return path as Href;
}

function placeholder(label: string) {
  Alert.alert(
    'Schema readiness preview',
    `${label} is a visual-only planning item. No database, SQL, RLS, storage, or backend changes are made from this screen.`,
  );
}

function openAction(action: Action) {
  if (action.href) {
    router.push(action.href);
    return;
  }

  placeholder(action.placeholder ?? action.label);
}

const summary = [
  ['Current purpose', 'Planning only'],
  ['Production database changes', 'None'],
  ['SQL created here', 'No'],
  ['RLS written here', 'No'],
  ['Storage buckets created', 'No'],
  ['Realtime wired', 'No'],
  ['Recommended next step', 'Review migration order'],
  ['Release status', 'Not production-ready'],
] as const;

const groups: FutureGroup[] = [
  {
    title: 'Auth, profiles, and roles',
    purpose: 'Plan the shared identity layer for Pet Parents, Gurus, Ambassadors, and Admins.',
    tables: ['profiles', 'user_roles', 'pet_profiles', 'guru_profiles', 'ambassador_profiles'],
    rls: 'High',
    routes: ['/account', '/auth-readiness'],
    action: { label: 'Auth Readiness', href: href('/auth-readiness') },
  },
  {
    title: 'Guru marketplace setup',
    purpose: 'Plan Guru public visibility, service areas, pricing, and availability.',
    tables: ['guru_profiles', 'service_areas', 'guru_services', 'guru_pricing_rules', 'guru_availability'],
    rls: 'High',
    routes: ['/guru-profile', '/guru-pricing', '/find-care'],
    action: { label: 'Guru Pricing', href: href('/guru-pricing') },
  },
  {
    title: 'Pet Parent care setup',
    purpose: 'Plan Pet Passports, household details, pet care preferences, and booking readiness.',
    tables: ['pet_profiles', 'pet_passports', 'pet_care_notes'],
    rls: 'High',
    routes: ['/pet-passports', '/request-booking'],
    action: { label: 'Pet Passports', href: href('/pet-passports') },
  },
  {
    title: 'Bookings and requests',
    purpose: 'Plan booking request flow, accepted bookings, status events, and booking details.',
    tables: ['booking_requests', 'bookings', 'booking_status_events'],
    rls: 'High',
    routes: ['/request-booking', '/booking-details'],
    action: { label: 'Booking Details', href: href('/booking-details') },
  },
  {
    title: 'Messages and conversations',
    purpose: 'Plan role-scoped conversations between Pet Parents, Gurus, Ambassadors, Support, and Admins.',
    tables: ['conversations', 'messages'],
    rls: 'High',
    routes: ['/conversation'],
    action: { label: 'Conversation', href: href('/conversation') },
  },
  {
    title: 'PawReport Live and visit tracking',
    purpose: 'Plan live walk sessions, locations, timeline updates, photos, and visit summaries.',
    tables: [
      'booking_visit_sessions',
      'booking_visit_locations',
      'booking_visit_updates',
      'pawreport_photos',
    ],
    rls: 'High',
    routes: ['/pawreport-live', '/guru-live-walk'],
    action: { label: 'PawReport Live', href: href('/pawreport-live') },
  },
  {
    title: 'Payments and payouts',
    purpose: 'Plan payment records, Guru payout records, booking financial status, and marketplace fees.',
    tables: ['payment_records', 'payout_records'],
    rls: 'High',
    routes: ['/payments', '/booking-details'],
    action: { label: 'Payments', href: href('/payments') },
  },
  {
    title: 'Referrals, PawPerks, and reviews',
    purpose: 'Plan referral codes, referral events, PawPerks credits, reviews, and reputation signals.',
    tables: ['referral_codes', 'referral_events', 'pawperks_credits', 'reviews'],
    rls: 'Medium',
    routes: ['/payments', '/reviews'],
    action: { label: 'Reviews', href: href('/reviews') },
  },
  {
    title: 'Support and attachments',
    purpose: 'Plan support tickets, user attachments, and issue tracking.',
    tables: ['support_tickets', 'support-attachments'],
    rls: 'High',
    routes: ['/pet-passports', '/pawreport-live', '/support'],
    action: { label: 'Storage placeholder', placeholder: 'Storage bucket plan' },
  },
  {
    title: 'Audit and safety',
    purpose: 'Plan admin-only audit trail for critical changes.',
    tables: ['audit_logs'],
    rls: 'High',
    routes: ['/admin-operations'],
    action: { label: 'Admin Operations', href: href('/admin-operations') },
  },
];

const tableNames = [
  'profiles',
  'user_roles',
  'pet_profiles',
  'guru_profiles',
  'ambassador_profiles',
  'service_areas',
  'guru_services',
  'guru_pricing_rules',
  'guru_availability',
  'conversations',
  'messages',
  'booking_requests',
  'bookings',
  'booking_status_events',
  'booking_visit_sessions',
  'booking_visit_locations',
  'booking_visit_updates',
  'pawreport_photos',
  'notifications',
  'payment_records',
  'payout_records',
  'referral_codes',
  'referral_events',
  'pawperks_credits',
  'reviews',
  'support_tickets',
  'admin_notes',
  'audit_logs',
];

const tables: FutureTable[] = tableNames.map((name) => {
  const storage = name.includes('photo');
  const payment = name.includes('payment') || name.includes('payout');
  const admin = name.includes('admin') || name.includes('audit');
  const realtime = [
    'messages',
    'booking_status_events',
    'booking_visit_locations',
    'booking_visit_updates',
    'notifications',
  ].includes(name);

  const status: FutureTable['status'] = admin
    ? 'Admin-only'
    : payment
      ? 'Payment-linked'
      : storage
        ? 'Storage-linked'
        : realtime
          ? 'Realtime candidate'
          : name.includes('roles') || name.includes('profiles') || name.includes('book')
            ? 'Needs RLS'
            : 'Future table';

  const route = payment
    ? '/payments'
    : admin
      ? '/admin-operations'
      : storage || name.includes('visit')
        ? '/pawreport-live'
        : name.includes('message') || name.includes('conversation')
          ? '/conversation'
          : name.includes('booking')
            ? '/booking-details'
            : name.includes('guru') || name.includes('service') || name.includes('availability')
              ? '/guru-pricing'
              : name.includes('support')
                ? '/support'
                : name.includes('notification')
                  ? '/notifications'
                  : name.includes('review')
                    ? '/reviews'
                    : '/account';

  return {
    name,
    purpose: `Future visual plan for ${name.replaceAll('_', ' ')} records.`,
    status,
    route,
    rls: 'Yes',
    action: existingRoutes.has(route)
      ? { label: `Open ${route}`, href: href(route) }
      : { label: 'Review placeholder', placeholder: name },
  };
});

const relationships = [
  'auth.users → profiles',
  'profiles → user_roles',
  'profiles → pet_profiles',
  'profiles → guru_profiles',
  'profiles → ambassador_profiles',
  'guru_profiles → guru_services',
  'guru_profiles → guru_pricing_rules',
  'guru_profiles → guru_availability',
  'pet_profiles + guru_profiles → booking_requests',
  'booking_requests → bookings',
  'bookings → booking_visit_sessions',
  'booking_visit_sessions → booking_visit_locations',
  'booking_visit_sessions → booking_visit_updates',
  'bookings → payment_records',
  'guru_profiles → payout_records',
  'profiles → conversations',
  'conversations → messages',
  'referrals → pawperks_credits',
  'bookings → reviews',
  'support_tickets → admin_notes',
  'all critical changes → audit_logs',
];

const policies: Policy[] = [
  'Users can read/update their own profile',
  'Users can read their own roles',
  'Pet Parents can manage their own Pet Passports',
  'Gurus can manage their own Guru profile',
  'Ambassadors can manage their own Ambassador profile',
  'Pet Parents and assigned Gurus can view booking details',
  'Only conversation participants can read/write messages',
  'Only active booking participants can view PawReport Live',
  'Only assigned Guru can write live walk updates',
  'Only Pet Parent/Guru/Admin can view visit updates',
  'Payment records restricted to involved users/admin',
  'Payout records restricted to Guru/admin',
  'Support tickets restricted to creator/admin',
  'Admin operations require admin role',
  'Audit logs admin-only',
].map((purpose) => ({
  purpose,
  risk: 'Private or role-scoped data could be exposed or changed incorrectly.',
  route:
    purpose.includes('Payment') || purpose.includes('Payout')
      ? '/payments'
      : purpose.includes('message')
        ? '/conversation'
        : purpose.includes('Admin') || purpose.includes('Audit')
          ? '/admin-operations'
          : purpose.includes('PawReport') || purpose.includes('visit')
            ? '/pawreport-live'
            : purpose.includes('Support')
              ? '/support'
              : '/account',
}));

const buckets: Bucket[] = [
  'pet-photos',
  'guru-profile-photos',
  'pawreport-photos',
  'visit-photos',
  'avatars',
  'support-attachments',
  'verification-documents placeholder',
].map((name) => ({
  name,
  purpose: `Future ${name} storage planning only.`,
  access: 'Owner or booking participant access only.',
  visibility:
    name.includes('verification') || name.includes('support')
      ? 'Private recommended'
      : 'Private by default; public only if approved later.',
  signedUrl: 'Signed URL placeholder for future implementation.',
  note: 'Future file size limits and moderation review needed.',
  route:
    name.includes('support')
      ? '/support'
      : name.includes('guru')
        ? '/guru-profile'
        : name.includes('pawreport') || name.includes('visit')
          ? '/pawreport-live'
          : '/account',
}));

const realtime: RealtimePlan[] = [
  ['conversations/messages', 'Message sender', 'Conversation participants', 'Participant-only channel', 'messages inserts'],
  ['booking request status', 'Pet Parent or Guru', 'Booking participants', 'Status visible to involved users', 'booking_requests status'],
  ['booking status events', 'System placeholder', 'Booking participants', 'RLS before subscription', 'booking_status_events'],
  ['PawReport Live session status', 'Assigned Guru', 'Pet Parent', 'Active booking only', 'booking_visit_sessions'],
  ['visit location updates', 'Assigned Guru', 'Pet Parent', 'Active session only', 'booking_visit_locations'],
  ['visit timeline updates', 'Assigned Guru', 'Pet Parent/Guru/Admin', 'Scoped visit visibility', 'booking_visit_updates'],
  ['notifications', 'Future backend', 'Target user', 'Only recipient can read', 'notifications'],
  ['support ticket updates', 'Support/admin placeholder', 'Ticket creator/admin', 'Creator/admin only', 'support_tickets'],
  ['admin operations queues', 'Admin placeholder', 'Admin users', 'Admin role required', 'audit/admin queue'],
].map(([topic, publisher, subscriber, security, event]) => ({
  topic,
  publisher,
  subscriber,
  security,
  event,
}));

const phases: Phase[] = [
  'profiles and user_roles',
  'pet_profiles, guru_profiles, ambassador_profiles',
  'guru_services, service_areas, pricing, availability',
  'conversations and messages',
  'booking_requests, bookings, status events',
  'PawReport sessions, locations, updates, photos',
  'notifications',
  'payment_records and payout_records',
  'referrals, PawPerks, reviews',
  'support, admin notes, audit logs',
  'storage buckets and policies',
  'seed/demo data cleanup and production QA',
].map((title, index) => ({
  title: `Phase ${index + 1}: ${title}`,
  priority: index < 2 ? 'Highest' : index < 6 ? 'High' : 'Planned',
  routes:
    index === 0
      ? '/account, /auth-readiness'
      : index === 1
        ? '/pet-passports, /guru-profile'
        : index === 2
          ? '/guru-pricing, /find-care'
          : index === 3
            ? '/conversation'
            : index === 4
              ? '/request-booking, /booking-details'
              : index === 5
                ? '/pawreport-live, /guru-live-walk'
                : index === 6
                  ? '/notifications'
                  : index === 7
                    ? '/payments'
                    : index === 8
                      ? '/reviews, /payments'
                      : index === 9
                        ? '/support, /admin-operations'
                        : '/release-readiness, /qa-test-center',
  risks: 'Future design must avoid duplicate logic and must not be treated as production-ready.',
  status: 'Visual plan',
}));

const integrity = [
  'Required user_id fields',
  'Role ownership',
  'Booking participant checks',
  'Status enum consistency',
  'Created/updated timestamps',
  'Soft delete/archive fields',
  'Spam/test data cleanup plan',
  'Fake profile handling',
  'Referral code uniqueness',
  'Pricing rule validation',
  'Availability date validation',
  'PawReport session start/end validation',
  'Payment status consistency',
  'Payout status consistency',
  'Admin audit trail',
];

const blockers = [
  'Tables not finalized',
  'RLS not written',
  'Storage buckets not created',
  'Realtime not wired',
  'Auth not wired',
  'Stripe record tables not wired',
  'Admin role checks not wired',
  'Data retention/privacy not finalized',
  'Test data cleanup not complete',
  'Production QA not complete',
];

const quickActions: Action[] = [
  { label: 'Real Wiring Start Plan', href: href('/wiring-start-plan') },
  { label: 'Backend Readiness', href: href('/backend-readiness') },
  { label: 'Auth Readiness', href: href('/auth-readiness') },
  { label: 'Release Readiness', href: href('/release-readiness') },
  { label: 'QA Test Center', href: href('/qa-test-center') },
  { label: 'Admin Operations', href: href('/admin-operations') },
  { label: 'Booking Details', href: href('/booking-details') },
  { label: 'Guru Pricing', href: href('/guru-pricing') },
  { label: 'PawReport Live', href: href('/pawreport-live') },
  { label: 'Payments', href: href('/payments') },
  { label: 'Support', href: href('/support') },
  { label: 'Account', href: href('/account') },
];

export default function SchemaReadinessScreen() {
  const backHref = existingRoutes.has('/backend-readiness') ? href('/backend-readiness') : href('/account');

  return (
    <SitGuruScreen scroll center={false} maxWidth={900}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(backHref)}
            style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Backend Readiness</Text>
          </Pressable>

          <SitGuruLogo size="small" variant="symbol" />
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Internal data plan</Text>
          <Text style={styles.title}>Supabase Schema Readiness</Text>
          <Text style={styles.subtitle}>
            Plan the future tables, role access, RLS policies, storage buckets, realtime events, and
            migration order for the SitGuru mobile app.
          </Text>
          <Text style={styles.notice}>
            Internal planning screen only. No SQL, migrations, RLS policies, database code, or
            backend wiring are added here.
          </Text>
        </View>

        <Section title="Schema readiness summary" eyebrow="Visual-only status">
          <View style={styles.grid}>
            {summary.map(([label, value]) => (
              <View key={label} style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{label}</Text>
                <Text style={styles.summaryValue}>{value}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Table groups overview" eyebrow="Future schema areas">
          {groups.map((group) => (
            <View key={group.title} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{group.title}</Text>
                <Text style={styles.badge}>RLS {group.rls}</Text>
              </View>
              <Text style={styles.body}>{group.purpose}</Text>
              <Text style={styles.meta}>Key future tables: {group.tables.join(', ')}</Text>
              <Text style={styles.meta}>Related app routes: {group.routes.join(', ')}</Text>
              <Button action={group.action} />
            </View>
          ))}
        </Section>

        <Section title="Future table checklist" eyebrow="No SQL created">
          <View style={styles.grid}>
            {tables.map((table) => (
              <View key={table.name} style={styles.dataCard}>
                <Text style={styles.routeName}>{table.name}</Text>
                <Text style={styles.body}>{table.purpose}</Text>
                <Text style={styles.badgeSmall}>{table.status}</Text>
                <Text style={styles.meta}>
                  Related route/group: {table.route} • RLS needed: {table.rls}
                </Text>
                <Button action={table.action} />
              </View>
            ))}
          </View>
        </Section>

        <List title="Relationship map" eyebrow="Visual relationships" items={relationships} />

        <Section title="RLS policy planning" eyebrow="Needed later">
          {policies.map((policy) => (
            <View key={policy.purpose} style={styles.row}>
              <Text style={styles.routeName}>{policy.purpose}</Text>
              <Text style={styles.badgeSmall}>Needed</Text>
              <Text style={styles.body}>Risk if missing: {policy.risk}</Text>
              <Text style={styles.meta}>Related route: {policy.route}</Text>
            </View>
          ))}
        </Section>

        <Section title="Storage bucket plan" eyebrow="Visual buckets">
          <View style={styles.grid}>
            {buckets.map((bucket) => (
              <View key={bucket.name} style={styles.dataCard}>
                <Text style={styles.routeName}>{bucket.name}</Text>
                <Text style={styles.body}>{bucket.purpose}</Text>
                <Text style={styles.meta}>Access: {bucket.access}</Text>
                <Text style={styles.meta}>Visibility: {bucket.visibility}</Text>
                <Text style={styles.meta}>{bucket.signedUrl}</Text>
                <Text style={styles.meta}>{bucket.note}</Text>
                <Text style={styles.meta}>Related route: {bucket.route}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Realtime subscription plan" eyebrow="Future events">
          <View style={styles.grid}>
            {realtime.map((item) => (
              <View key={item.topic} style={styles.dataCard}>
                <Text style={styles.routeName}>{item.topic}</Text>
                <Text style={styles.body}>Publisher: {item.publisher}</Text>
                <Text style={styles.body}>Subscriber: {item.subscriber}</Text>
                <Text style={styles.meta}>Security note: {item.security}</Text>
                <Text style={styles.meta}>Future table/event: {item.event}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Migration order plan" eyebrow="Visual phases">
          {phases.map((phase) => (
            <View key={phase.title} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{phase.title}</Text>
                <Text style={styles.badge}>{phase.status}</Text>
              </View>
              <Text style={styles.body}>Priority: {phase.priority}</Text>
              <Text style={styles.meta}>App routes unlocked: {phase.routes}</Text>
              <Text style={styles.meta}>Risks: {phase.risks}</Text>
            </View>
          ))}
        </Section>

        <List title="Data integrity checklist" eyebrow="Future validation" items={integrity} />

        <Section title="Website-to-mobile data alignment" eyebrow="Single source of truth">
          <Text style={styles.body}>
            The mobile app should eventually share the same Supabase backend as the SitGuru website.
          </Text>
          <Text style={styles.body}>
            Mobile routes should map to website concepts: Pet Parent profiles, Guru profiles,
            Ambassador profiles, user_roles, conversations, bookings, PawReport/visit updates,
            referrals/PawPerks, pricing/payouts, and admin operations.
          </Text>
          <Text style={styles.noticeLight}>
            Do not duplicate production logic. Mobile should reuse the same source of truth.
          </Text>
        </Section>

        <List title="Release blocker card" eyebrow="Not production-ready" items={blockers} danger />

        <Section title="Quick actions" eyebrow="Internal routes">
          <View style={styles.actions}>
            {quickActions.map((action) => (
              <Button key={action.label} action={action} />
            ))}
          </View>
        </Section>

        <View style={styles.bottomDockSpacer} />
      </View>

      <View style={styles.bottomDock}>
        {[
          { label: 'Account', href: href('/account') },
          { label: 'Backend', href: href('/backend-readiness') },
          { label: 'Auth', href: href('/auth-readiness') },
          { label: 'QA', href: href('/qa-test-center') },
        ].map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            onPress={() => openAction(action)}
            style={styles.dockButton}>
            <Text style={styles.dockButtonText}>{action.label}</Text>
          </Pressable>
        ))}
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
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      {eyebrow ? <Text style={styles.eyebrowGreen}>{eyebrow}</Text> : null}
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Button({ action }: { action: Action }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => openAction(action)} style={styles.button}>
      <Text style={styles.buttonText}>{action.label}</Text>
    </Pressable>
  );
}

function List({
  title,
  eyebrow,
  items,
  danger = false,
}: {
  title: string;
  eyebrow: string;
  items: string[];
  danger?: boolean;
}) {
  return (
    <Section title={title} eyebrow={eyebrow}>
      <View style={styles.grid}>
        {items.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            onPress={() => placeholder(item)}
            style={[styles.checkItem, danger && styles.dangerItem]}>
            <Text style={styles.checkText}>□ {item}</Text>
          </Pressable>
        ))}
      </View>
    </Section>
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
  eyebrow: {
    color: '#C9F26D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 35,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 39,
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
  noticeLight: {
    backgroundColor: '#ECFDF5',
    borderColor: '#BBF7D0',
    borderRadius: 18,
    borderWidth: 1,
    color: SitGuruColors.primaryDark,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 19,
    padding: 12,
  },
  section: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  eyebrowGreen: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: SitGuruColors.text,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexBasis: 150,
    flexGrow: 1,
    gap: 4,
    padding: 14,
  },
  summaryLabel: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  summaryValue: {
    color: SitGuruColors.primary,
    fontSize: 17,
    fontWeight: '900',
  },
  card: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: SitGuruColors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    minWidth: 210,
  },
  badge: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 999,
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeSmall: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: 999,
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  body: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  meta: {
    color: SitGuruColors.textSoft,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 18,
  },
  dataCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: 250,
    flexGrow: 1,
    gap: 6,
    padding: 13,
  },
  routeName: {
    color: SitGuruColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  row: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    padding: 13,
  },
  checkItem: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: 240,
    flexGrow: 1,
    padding: 12,
  },
  dangerItem: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  checkText: {
    color: SitGuruColors.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
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