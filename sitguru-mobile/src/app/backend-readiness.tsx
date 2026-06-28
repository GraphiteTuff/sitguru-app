import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type Status = 'Not started' | 'Visual-only' | 'Future wiring' | 'Blocker';
type Action = { label: string; href?: Href; alert?: string };
type Phase = { title: string; status: Status; tasks: string[]; routes: string[]; action: Action };
type DataRow = { name: string; purpose: string; status: 'Future table' | 'Existing later' | 'Visual-only'; routes: string; rls: 'Yes' | 'No placeholder' };
type Mapping = { route: string; needs: string };

const route = (href: string) => href as Href;
const existingRoutes = new Set(['/account', '/release-readiness', '/admin-operations', '/payments', '/booking-details', '/pawreport-live', '/guru-pricing', '/support', '/find-care', '/guru-profile', '/pet-passports', '/conversation', '/request-booking', '/guru-live-walk', '/notifications', '/reviews']);

function showPlaceholder(label: string) {
  Alert.alert('Backend Readiness placeholder', `${label} is a visual-only planning action. No production backend, auth, database, Stripe, GPS, storage, or push logic is wired here.`);
}

function openAction(action: Action) {
  if (action.href && existingRoutes.has(String(action.href))) {
    router.push(action.href);
    return;
  }
  showPlaceholder(action.alert ?? action.label);
}

const summary = [
  ['Auth', 'Not wired'], ['Supabase tables', 'Future'], ['Role access', 'Visual-only'], ['Storage uploads', 'Future'], ['Messaging realtime', 'Future'], ['Booking data', 'Future'],
  ['PawReport Live', 'Visual-only'], ['Stripe Checkout', 'Future'], ['Stripe Connect', 'Future'], ['Push notifications', 'Future'], ['RLS/security', 'Future'], ['Admin operations', 'Visual-only'],
] as const;

const phases: Phase[] = [
  { title: 'Phase 1: Auth and user roles', status: 'Blocker', tasks: ['Choose sign-in policy', 'Define Pet Parent, Guru, Ambassador, and Admin roles', 'Plan account recovery'], routes: ['/account', '/role-selection'], action: { label: 'Open Account', href: route('/account') } },
  { title: 'Phase 2: Profiles and Pet Passports', status: 'Future wiring', tasks: ['Profile rows', 'Pet Passport ownership', 'Care notes privacy'], routes: ['/account', '/pet-passports'], action: { label: 'Open Pet Passports', href: route('/pet-passports') } },
  { title: 'Phase 3: Search and Guru profiles', status: 'Future wiring', tasks: ['Service areas', 'Guru service catalog', 'Review summaries'], routes: ['/find-care', '/guru-profile'], action: { label: 'Open Find Care', href: route('/find-care') } },
  { title: 'Phase 4: Messaging and conversations', status: 'Future wiring', tasks: ['Conversation records', 'Realtime updates', 'Participant access'], routes: ['/conversation'], action: { label: 'Open Conversation', href: route('/conversation') } },
  { title: 'Phase 5: Booking requests and booking status', status: 'Future wiring', tasks: ['Request lifecycle', 'Status events', 'Guru accept or decline'], routes: ['/request-booking', '/booking-details', '/guru-requests'], action: { label: 'Open Booking Details', href: route('/booking-details') } },
  { title: 'Phase 6: Guru pricing and availability', status: 'Visual-only', tasks: ['Pricing rules', 'Availability windows', 'Estimate preview'], routes: ['/guru-pricing'], action: { label: 'Open Guru Pricing', href: route('/guru-pricing') } },
  { title: 'Phase 7: PawReport Live and visit updates', status: 'Visual-only', tasks: ['Visit sessions', 'Timeline updates', 'Live participant visibility'], routes: ['/pawreport-live', '/guru-live-walk'], action: { label: 'Open PawReport Live', href: route('/pawreport-live') } },
  { title: 'Phase 8: Payments and payouts', status: 'Blocker', tasks: ['Checkout after acceptance', 'Connect onboarding', 'Payment and payout records'], routes: ['/payments', '/booking-details'], action: { label: 'Open Payments', href: route('/payments') } },
  { title: 'Phase 9: Notifications', status: 'Future wiring', tasks: ['Notification rows', 'Push token plan', 'User preferences'], routes: ['/notifications'], action: { label: 'Open Notifications', href: route('/notifications') } },
  { title: 'Phase 10: Admin operations, safety, and support', status: 'Visual-only', tasks: ['Admin permissions', 'Support queue', 'Safety escalation'], routes: ['/admin-operations', '/support'], action: { label: 'Open Admin Operations', href: route('/admin-operations') } },
  { title: 'Phase 11: Storage uploads', status: 'Future wiring', tasks: ['Bucket strategy', 'Signed URL policy', 'Image moderation plan'], routes: ['/pet-passports', '/pawreport-live', '/support'], action: { label: 'Storage plan placeholder', alert: 'Storage upload plan' } },
  { title: 'Phase 12: QA, permissions, release readiness', status: 'Not started', tasks: ['Device QA', 'Permission copy review', 'Release blocker review'], routes: ['/release-readiness'], action: { label: 'Open Release Readiness', href: route('/release-readiness') } },
];

const dataRows: DataRow[] = [
  ['auth.users','Authentication identity source','Existing later','/account','Yes'], ['profiles','Shared user profile fields','Future table','/account','Yes'], ['user_roles','Role-based access','Future table','/account, /admin-operations','Yes'], ['pet_profiles','Pet Passport data','Future table','/pet-passports','Yes'], ['guru_profiles','Guru public profiles','Future table','/find-care, /guru-profile','Yes'], ['ambassador_profiles','Ambassador previews','Future table','/ambassador-dashboard','Yes'], ['service_areas','Search coverage','Future table','/find-care','Yes'], ['guru_services','Services offered','Future table','/guru-profile','Yes'], ['guru_pricing_rules','Rates and discounts','Future table','/guru-pricing','Yes'], ['guru_availability','Calendar readiness','Future table','/guru-pricing','Yes'], ['conversations','Message containers','Future table','/conversation','Yes'], ['messages','Message items','Future table','/conversation','Yes'], ['booking_requests','Pending care requests','Future table','/request-booking','Yes'], ['bookings','Accepted care records','Future table','/booking-details','Yes'], ['booking_status_events','Booking timeline','Future table','/booking-details','Yes'], ['booking_visit_sessions','Active visit sessions','Future table','/pawreport-live','Yes'], ['booking_visit_locations','Location points','Future table','/pawreport-live','Yes'], ['booking_visit_updates','Visit timeline updates','Future table','/pawreport-live','Yes'], ['pawreport_photos','Visit photo references','Future table','/pawreport-live','Yes'], ['notifications','In-app notification rows','Future table','/notifications','Yes'], ['payment_records','Checkout and payment status','Future table','/payments','Yes'], ['payout_records','Guru payout status','Future table','/payments','Yes'], ['referral_codes','Ambassador referral codes','Future table','/payments','Yes'], ['referral_events','Referral attribution','Future table','/payments','Yes'], ['pawperks_credits','Reward credits','Future table','/payments','Yes'], ['reviews','Care reviews','Future table','/reviews','Yes'], ['admin_notes','Internal support notes','Visual-only','/admin-operations','Yes'], ['support_tickets','Help requests','Future table','/support','Yes'], ['audit_logs','Sensitive action history','Future table','/admin-operations','Yes'],
].map(([name, purpose, status, routes, rls]) => ({ name, purpose, status: status as DataRow['status'], routes, rls: rls as DataRow['rls'] }));

const mappings: Mapping[] = [
  ['/find-care','guru_profiles, service_areas, guru_services, availability'], ['/guru-profile','guru_profiles, reviews, pricing, availability'], ['/pet-passports','pet_profiles, storage uploads'], ['/conversation','conversations, messages, realtime'], ['/request-booking','booking_requests, pets, guru services, pricing estimate'], ['/booking-details','bookings, status events, payment records'], ['/pawreport-live','visit_sessions, visit_locations, visit_updates, photos'], ['/guru-live-walk','visit_sessions, location writes, update writes'], ['/guru-pricing','guru_pricing_rules, availability'], ['/payments','Stripe Checkout, Stripe Connect, payment_records, payout_records'], ['/notifications','notifications, push tokens'], ['/reviews','reviews'], ['/support','support_tickets, admin_notes'], ['/admin-operations','admin permissions, audit logs, reporting'], ['/release-readiness','no production data'],
].map(([routeName, needs]) => ({ route: routeName, needs }));

const security = ['Users can only see their own profile','Pet Parents can see their own pets','Gurus can see requests assigned to them','Pet Parents can see their own booking details','Only assigned Guru and Pet Parent can see messages','Only active booking participants can see PawReport Live','Live tracking writes only during active visit session','Admin-only operations require admin role','Payment records restricted to involved users/admin','Payout records restricted to Guru/admin','Storage uploads restricted by owner/booking','Support tickets restricted by owner/admin','Audit logs admin-only','Off-platform payment warning stays visible'];
const realtime = ['Conversation realtime updates','Booking request status updates','Guru acceptance/decline updates','PawReport Live location updates','Visit update timeline','Photo update events','Payment status updates','Payout readiness alerts','Referral/PawPerks updates','Support ticket updates','Admin operations queue alerts'];
const stripe = ['Pet Parent Checkout after Guru accepts','No charge before acceptance','Guru Stripe Connect setup','Marketplace fee preview','Tips pass-through','Refund/adjustment support','Payment records table','Payout records table','Webhooks future','Test mode first','Production keys later','No real payment logic now'];
const gps = ['Request location permission only during active care','Start session','Pause/resume session','End session','Store location points','Store accuracy/timestamps','Battery-safe update frequency','Pet Parent realtime subscription','Admin/support view','Offline queue future','Photo updates future','Final PawReport summary'];
const storage = ['Pet photos','Guru profile photos','PawReport photos','Visit photos','Avatar images','Support attachments','File size limits','Image moderation future','Storage bucket security','Signed URL strategy'];
const admin = ['Admin role','Operations dashboard data','Active bookings','Live walks','Support queue','Safety flags','Payment alerts','Payout alerts','Ambassador activity','User management','Audit trail'];
const env = ['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY only on server, never mobile client','STRIPE_PUBLISHABLE_KEY','Stripe secret keys server-only','Webhook secret server-only','Push notification keys future','Storage bucket names','Production domain','Deep link scheme','EAS build config future','App store metadata future'];
const blockers = ['Auth not wired','Supabase tables not finalized','RLS not written','Realtime not wired','Stripe not wired','Storage not wired','GPS not wired','Push notifications not wired','Admin permissions not wired','Privacy/legal docs not finalized','QA not complete'];
const quickActions: Action[] = [
  { label: 'Release Readiness', href: route('/release-readiness') }, { label: 'Admin Operations', href: route('/admin-operations') }, { label: 'Payments', href: route('/payments') }, { label: 'Booking Details', href: route('/booking-details') }, { label: 'PawReport Live', href: route('/pawreport-live') }, { label: 'Guru Pricing', href: route('/guru-pricing') }, { label: 'Support', href: route('/support') }, { label: 'Account', href: route('/account') },
];

export default function BackendReadinessScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={860}>
      <View style={styles.page}>
        <View style={styles.topBar}><Pressable accessibilityRole="button" onPress={() => router.push('/release-readiness')} style={styles.backButton}><Text style={styles.backButtonText}>← Back to Release Readiness</Text></Pressable><SitGuruLogo size="small" variant="symbol" /></View>
        <View style={styles.hero}><Text style={styles.eyebrow}>Production wiring plan</Text><Text style={styles.title}>Backend Readiness</Text><Text style={styles.subtitle}>Plan the production wiring for auth, roles, profiles, bookings, PawReport Live, payments, notifications, storage, and admin operations.</Text><Text style={styles.notice}>Internal planning screen only. No backend, auth, database, Stripe, GPS, or push notification logic is wired here.</Text></View>
        <Section title="Readiness summary" eyebrow="Visual-only status"><View style={styles.grid}>{summary.map(([label, value]) => <View key={label} style={styles.summaryCard}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>)}</View></Section>
        <Section title="Production wiring phases" eyebrow="Phased plan">{phases.map((phase) => <PhaseCard key={phase.title} phase={phase} />)}</Section>
        <Section title="Supabase data model checklist" eyebrow="Placeholder tables">{dataRows.map((row) => <DataCard key={row.name} row={row} />)}</Section>
        <Section title="Route-to-backend mapping" eyebrow="Future data needs"><View style={styles.grid}>{mappings.map((item) => <View key={item.route} style={styles.routeCard}><Text style={styles.routeName}>{item.route}</Text><Text style={styles.body}>Needs: {item.needs}</Text></View>)}</View></Section>
        <Checklist title="Security and RLS checklist" items={security} />
        <Checklist title="Realtime and notification checklist" items={realtime} />
        <Checklist title="Stripe readiness checklist" items={stripe} />
        <Checklist title="GPS/PawReport readiness checklist" items={gps} />
        <Checklist title="Storage upload checklist" items={storage} />
        <Checklist title="Admin operations wiring checklist" items={admin} />
        <Checklist title="Environment and deployment checklist" items={env} />
        <Section title="Release blockers" eyebrow="Not production-ready"><View style={styles.grid}>{blockers.map((item) => <Text key={item} style={styles.blocker}>• {item}</Text>)}</View></Section>
        <Section title="Quick actions" eyebrow="Internal routes"><View style={styles.actions}>{quickActions.map((action) => <Button key={action.label} action={action} />)}</View></Section>
        <View style={styles.bottomDockSpacer} />
      </View>
      <View style={styles.bottomDock}>{[['Account','/account'],['Release','/release-readiness'],['Admin','/admin-operations'],['Support','/support']].map(([label, href]) => <Pressable key={label} accessibilityRole="button" onPress={() => router.push(href as Href)} style={styles.dockButton}><Text style={styles.dockButtonText}>{label}</Text></Pressable>)}</View>
    </SitGuruScreen>
  );
}

function Section({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) { return <View style={styles.section}>{eyebrow ? <Text style={styles.eyebrowGreen}>{eyebrow}</Text> : null}<Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }
function Button({ action }: { action: Action }) { return <Pressable accessibilityRole="button" onPress={() => openAction(action)} style={styles.button}><Text style={styles.buttonText}>{action.label}</Text></Pressable>; }
function PhaseCard({ phase }: { phase: Phase }) { return <View style={styles.card}><View style={styles.cardHeader}><Text style={styles.cardTitle}>{phase.title}</Text><Text style={[styles.badge, phase.status === 'Blocker' && styles.badgeBlocker]}>{phase.status}</Text></View><Text style={styles.body}>Key tasks: {phase.tasks.join(' • ')}</Text><Text style={styles.body}>Related app routes: {phase.routes.join(', ')}</Text><Button action={phase.action} /></View>; }
function DataCard({ row }: { row: DataRow }) { return <View style={styles.dataCard}><Text style={styles.routeName}>{row.name}</Text><Text style={styles.body}>{row.purpose}</Text><Text style={styles.meta}>Status: {row.status} • RLS needed: {row.rls}</Text><Text style={styles.meta}>Routes affected: {row.routes}</Text></View>; }
function Checklist({ title, items }: { title: string; items: string[] }) { return <Section title={title} eyebrow="Checklist"><View style={styles.grid}>{items.map((item) => <Pressable key={item} accessibilityRole="button" onPress={() => showPlaceholder(item)} style={styles.checkItem}><Text style={styles.checkText}>□ {item}</Text></Pressable>)}</View></Section>; }

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 8 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  backButton: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  backButtonText: { color: SitGuruColors.text, fontSize: 14, fontWeight: '900' },
  hero: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 30, gap: 10, padding: 22 },
  eyebrow: { color: '#C9F26D', fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 36, fontWeight: '900', letterSpacing: -1, lineHeight: 40 },
  subtitle: { color: '#DCEFE2', fontSize: 15, fontWeight: '700', lineHeight: 22 },
  notice: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.22)', borderRadius: 18, borderWidth: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '900', lineHeight: 19, padding: 12 },
  section: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 12, padding: 18 },
  eyebrowGreen: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  sectionTitle: { color: SitGuruColors.text, fontSize: 23, fontWeight: '900', letterSpacing: -0.4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 20, borderWidth: 1, flexBasis: 150, flexGrow: 1, gap: 4, padding: 14 },
  summaryLabel: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '800' },
  summaryValue: { color: SitGuruColors.primary, fontSize: 17, fontWeight: '900' },
  card: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 22, borderWidth: 1, gap: 10, padding: 14 },
  cardHeader: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  cardTitle: { color: SitGuruColors.text, flex: 1, fontSize: 17, fontWeight: '900', minWidth: 210 },
  badge: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 },
  badgeBlocker: { backgroundColor: '#FFF1F2', color: SitGuruColors.danger },
  body: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  meta: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '900', lineHeight: 18 },
  dataCard: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, flexBasis: 245, flexGrow: 1, gap: 5, padding: 13 },
  routeCard: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, flexBasis: 230, flexGrow: 1, gap: 6, padding: 13 },
  routeName: { color: SitGuruColors.text, fontSize: 16, fontWeight: '900' },
  checkItem: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 16, borderWidth: 1, flexBasis: 240, flexGrow: 1, padding: 12 },
  checkText: { color: SitGuruColors.text, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  blocker: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA', borderRadius: 16, borderWidth: 1, color: SitGuruColors.text, flexBasis: 230, flexGrow: 1, fontSize: 14, fontWeight: '900', overflow: 'hidden', padding: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  button: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 999, flexGrow: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  bottomDockSpacer: { height: 88 },
  bottomDock: { alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.96)', borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, bottom: 16, elevation: 8, flexDirection: 'row', gap: 6, left: 16, padding: 8, position: 'absolute', right: 16 },
  dockButton: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, flex: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 8 },
  dockButtonText: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900' },
});
