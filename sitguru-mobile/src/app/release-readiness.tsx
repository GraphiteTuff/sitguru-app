import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type Status = 'Complete UI' | 'Needs wiring' | 'Visual-only' | 'Missing' | 'Needed' | 'Draft' | 'Future' | 'Review' | 'Not wired' | 'Future Supabase' | 'Future Stripe' | 'Future GPS' | 'Future push';
type Action = { label: string; href?: Href; alert?: string };
type Feature = { name: string; status: Status; route?: Href };

const summary = [
  ['UI screens', 'Strong progress'], ['Backend wiring', 'Pending'], ['Payments/Stripe', 'Visual-only'], ['GPS/live tracking', 'Visual-only'],
  ['Push notifications', 'Visual-only'], ['Privacy/legal', 'Needs review'], ['App store assets', 'Not started'], ['QA testing', 'In progress'],
] as const;

const progress = [
  ['Overall readiness', 45], ['Visual UI completion', 80], ['Backend completion', 10], ['Store readiness', 15],
] as const;

const features: Feature[] = [
  { name: 'Home / Welcome', status: 'Complete UI', route: '/' }, { name: 'Find Care', status: 'Complete UI', route: '/find-care' },
  { name: 'Guru Profile', status: 'Complete UI', route: '/guru-profile' }, { name: 'Pet Passports', status: 'Complete UI', route: '/pet-passports' },
  { name: 'Request Booking', status: 'Complete UI', route: '/request-booking' }, { name: 'Booking Details', status: 'Complete UI', route: '/booking-details' },
  { name: 'PawReport Live', status: 'Visual-only', route: '/pawreport-live' }, { name: 'Guru Live Walk', status: 'Visual-only', route: '/guru-live-walk' },
  { name: 'Messages', status: 'Needs wiring', route: '/conversation' }, { name: 'Notifications', status: 'Visual-only', route: '/notifications' },
  { name: 'Payments & Payouts', status: 'Visual-only', route: '/payments' }, { name: 'Guru Pricing', status: 'Complete UI', route: '/guru-pricing' },
  { name: 'Guru Requests', status: 'Complete UI', route: '/guru-requests' }, { name: 'Reviews & Ratings', status: 'Complete UI', route: '/reviews' },
  { name: 'Help & Support', status: 'Complete UI', route: '/support' }, { name: 'Account & Settings', status: 'Complete UI', route: '/account' },
  { name: 'Admin Operations', status: 'Visual-only', route: '/admin-operations' },
];

const roleFlows = [
  { title: 'Pet Parent flow', path: 'Find Care → Guru Profile → Message → Request Booking → Booking Details → PawReport Live → Reviews', status: 'Visual flow mapped', missing: 'Auth, live availability, booking persistence, payment hold, review storage', actions: [{ label: 'Find Care', href: '/find-care' }, { label: 'Request Booking', href: '/request-booking' }, { label: 'PawReport Live', href: '/pawreport-live' }] },
  { title: 'Guru flow', path: 'Guru Setup → Pricing Calendar → Requests → Booking Details → Live Walk Controls → Earnings/Payouts', status: 'Visual flow mapped', missing: 'Guru onboarding, availability, request matching, GPS, Stripe payouts', actions: [{ label: 'Guru Setup', href: '/guru-setup' }, { label: 'Guru Pricing', href: '/guru-pricing' }, { label: 'Live Walk Controls', href: '/guru-live-walk' }] },
  { title: 'Ambassador flow', path: 'Ambassador Setup → Referrals → Training → Rewards → Notifications', status: 'Preview flow mapped', missing: 'Referral attribution, training records, reward approvals, payout rules', actions: [{ label: 'Ambassador Setup', href: '/ambassador-setup' }, { label: 'Ambassador Dashboard', href: '/ambassador-dashboard' }, { label: 'Notifications', href: '/notifications' }] },
  { title: 'Admin flow', path: 'Operations → Support Queue → Active Care → Payments/Payouts → Safety Flags', status: 'Internal preview', missing: 'Admin permissions, support tooling, production audit logs, safety workflow', actions: [{ label: 'Admin Operations', href: '/admin-operations' }, { label: 'Support', href: '/support' }, { label: 'Payments', href: '/payments' }] },
];

const backend = ['Auth / secure login','Role-based access','User roles','Profiles','Pet Passports','Guru profiles','Ambassador profiles','Conversations/messages','Booking requests','Bookings','PawReport sessions','Live location points','Visit updates','Guru pricing','Guru availability','Notifications','Payments','Payouts','Referrals / PawPerks','Reviews','Admin operations'];
const privacy = ['Privacy policy needed','Terms of service needed','Data Safety / app privacy labels needed','Location permission wording needed','Camera/photo permission wording needed','Notification permission wording needed','Payment security copy needed','Support/safety reporting needed','Live tracking only during active booked care','Off-platform payment warning','Account deletion / data request future requirement placeholder','Child safety / age policy review placeholder'];
const assets = ['App icon','Splash screen','App name','Subtitle/tagline','Short description','Long description','Keywords','Screenshots','Preview video','Support URL','Marketing URL','Privacy policy URL','Contact email','Category','Age rating','Test account instructions','Review notes','App content declarations','Data safety / privacy labels'];
const technical = ['TypeScript passes','Route audit passes','Expo web preview','Device testing needed','iOS simulator needed','Android emulator needed','Real phone testing needed','Offline behavior review','Performance review','Accessibility review','Crash/error tracking future placeholder','EAS build setup future placeholder','App signing future placeholder'];
const blockers = ['Backend not wired','Auth not wired','Real payments not wired','Real payouts not wired','Real GPS not wired','Real push notifications not wired','Real image upload not wired','App store metadata not prepared','Privacy/legal docs not finalized','Production QA not complete'];
const quickActions: Action[] = [{ label: 'Admin Operations', href: '/admin-operations' }, { label: 'Help & Support', href: '/support' }, { label: 'Account', href: '/account' }, { label: 'Notifications', href: '/notifications' }, { label: 'Payments', href: '/payments' }, { label: 'Booking Details', href: '/booking-details' }, { label: 'Guru Pricing', href: '/guru-pricing' }];

function open(action: Action) {
  if (action.href) router.push(action.href);
  else Alert.alert('Release readiness preview', action.alert ?? `${action.label} is not available in this visual-only checklist yet.`);
}
function Card({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) { return <View style={styles.card}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.cardTitle}>{title}</Text>{children}</View>; }
function Badge({ label }: { label: Status | string }) { return <Text style={[styles.badge, label.includes('Missing') || label.includes('Needed') || label.includes('Not wired') ? styles.badgeWarn : null]}>{label}</Text>; }
function Button({ action, primary = false }: { action: Action; primary?: boolean }) { return <Pressable accessibilityRole="button" onPress={() => open(action)} style={[styles.button, primary && styles.primaryButton]}><Text style={[styles.buttonText, primary && styles.primaryButtonText]}>{action.label}</Text></Pressable>; }
function ProgressRow({ label, value }: { label: string; value: number }) { return <View style={styles.progressRow}><View style={styles.progressHeader}><Text style={styles.rowTitle}>{label}</Text><Text style={styles.percent}>{value}% placeholder</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${value}%` }]} /></View></View>; }
function ChecklistRow({ label, status, action }: { label: string; status: Status | string; action?: Action }) { return <View style={styles.checkRow}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{label}</Text><Badge label={status} /></View>{action ? <Button action={action} /> : null}</View>; }

export default function ReleaseReadinessScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={820}>
      <View style={styles.page}>
        <View style={styles.topBar}><Pressable accessibilityRole="button" onPress={() => router.push('/account')} style={styles.backButton}><Text style={styles.backButtonText}>← Back to Account</Text></Pressable><SitGuruLogo size="small" variant="symbol" /></View>
        <View style={styles.hero}><Text style={styles.eyebrowLight}>Internal checklist</Text><Text style={styles.title}>Release Readiness</Text><Text style={styles.subtitle}>Track SitGuru mobile app readiness across features, privacy, testing, payments, live tracking, support, and store submission.</Text><Text style={styles.notice}>Internal visual checklist only. Final App Store and Google Play requirements must be reviewed before public release.</Text></View>

        <View style={styles.summaryGrid}>{summary.map(([label, value]) => <View key={label} style={styles.summaryCard}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>)}</View>
        <Card title="Completion progress" eyebrow="Placeholder readiness"><View style={styles.progressStack}>{progress.map(([label, value]) => <ProgressRow key={label} label={label} value={value} />)}</View></Card>
        <Card title="Core feature checklist" eyebrow="Visual route audit">{features.map((feature) => <ChecklistRow key={feature.name} label={feature.name} status={feature.status} action={{ label: feature.route ? 'Open' : 'Review', href: feature.route, alert: feature.name }} />)}</Card>
        <Card title="Role flow checklist" eyebrow="End-to-end previews">{roleFlows.map((flow) => <View key={flow.title} style={styles.flowCard}><Text style={styles.flowTitle}>{flow.title}</Text><Text style={styles.body}>{flow.path}</Text><Badge label={flow.status} /><Text style={styles.missing}>Missing backend pieces: {flow.missing}</Text><View style={styles.buttonRow}>{flow.actions.map((action) => <Button key={action.label} action={action} />)}</View></View>)}</Card>
        <Card title="Backend and data wiring checklist" eyebrow="Future wiring only">{backend.map((item, index) => <ChecklistRow key={item} label={item} status={index === 16 || index === 17 ? 'Future Stripe' : index === 11 ? 'Future GPS' : index === 15 ? 'Future push' : index < 6 ? 'Future Supabase' : index % 2 ? 'Not wired' : 'Visual-only'} />)}</Card>
        <Card title="Privacy, safety, and permissions checklist">{privacy.map((item, index) => <ChecklistRow key={item} label={item} status={index < 3 ? 'Needed' : index < 8 ? 'Draft' : index < 10 ? 'Review' : 'Future'} />)}</Card>
        <Card title="App store asset checklist" eyebrow="Not a submission workflow">{assets.map((item, index) => <ChecklistRow key={item} label={item} status={index < 3 ? 'Draft' : 'Needed'} />)}</Card>
        <Card title="Technical release checklist">{technical.map((item, index) => <ChecklistRow key={item} label={item} status={index < 2 ? 'Review' : index < 4 ? 'Draft' : 'Needed'} />)}</Card>
        <Card title="Release blockers" eyebrow="Must resolve before public launch">{blockers.map((item) => <View key={item} style={styles.blocker}><Text style={styles.blockerDot}>!</Text><Text style={styles.blockerText}>{item}</Text></View>)}</Card>
        <Card title="Quick actions"> <View style={styles.buttonRow}>{quickActions.map((action) => <Button key={action.label} action={action} primary={action.label === 'Account'} />)}</View></Card>
        <View style={styles.bottomDockSpacer} />
      </View>
      <View style={styles.bottomDock}>{[['Account','/account'],['Operations','/admin-operations'],['Alerts','/notifications'],['Support','/support']].map(([label, href]) => <Pressable key={label} accessibilityRole="button" onPress={() => router.push(href as Href)} style={styles.dockButton}><Text style={styles.dockButtonText}>{label}</Text></Pressable>)}</View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 8 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  backButton: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  backButtonText: { color: SitGuruColors.text, fontSize: 14, fontWeight: '900' },
  hero: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 30, gap: 10, padding: 22 },
  eyebrowLight: { color: '#C9F26D', fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 36, fontWeight: '900', letterSpacing: -1, lineHeight: 40 },
  subtitle: { color: '#DCEFE2', fontSize: 15, fontWeight: '700', lineHeight: 22 },
  notice: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.22)', borderRadius: 18, borderWidth: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '900', lineHeight: 19, padding: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 22, borderWidth: 1, flexBasis: 150, flexGrow: 1, gap: 5, padding: 15 },
  summaryLabel: { color: SitGuruColors.textMuted, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  summaryValue: { color: SitGuruColors.text, fontSize: 18, fontWeight: '900' },
  card: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 12, padding: 18 },
  eyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  cardTitle: { color: SitGuruColors.text, fontSize: 23, fontWeight: '900', letterSpacing: -0.4 },
  progressStack: { gap: 12 },
  progressRow: { gap: 7 },
  progressHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  track: { backgroundColor: SitGuruColors.border, borderRadius: 999, height: 10, overflow: 'hidden' },
  fill: { backgroundColor: SitGuruColors.primary, borderRadius: 999, height: 10 },
  percent: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900' },
  checkRow: { alignItems: 'center', backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', padding: 12 },
  rowCopy: { flex: 1, gap: 6, minWidth: 185 },
  rowTitle: { color: SitGuruColors.text, fontSize: 15, fontWeight: '900' },
  badge: { alignSelf: 'flex-start', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, color: SitGuruColors.primary, fontSize: 11, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, textTransform: 'uppercase' },
  badgeWarn: { backgroundColor: '#FFF8ED', color: SitGuruColors.warning },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  button: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 999, borderWidth: 1, flexGrow: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 14 },
  primaryButton: { backgroundColor: SitGuruColors.primary, borderColor: SitGuruColors.primary },
  buttonText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  primaryButtonText: { color: '#FFFFFF' },
  flowCard: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 22, borderWidth: 1, gap: 9, padding: 14 },
  flowTitle: { color: SitGuruColors.text, fontSize: 18, fontWeight: '900' },
  body: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  missing: { color: SitGuruColors.warning, fontSize: 13, fontWeight: '900', lineHeight: 19 },
  blocker: { alignItems: 'center', backgroundColor: '#FFF8ED', borderColor: '#F8DEC8', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12 },
  blockerDot: { backgroundColor: SitGuruColors.warning, borderRadius: 999, color: '#FFFFFF', fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4 },
  blockerText: { color: SitGuruColors.text, flex: 1, fontSize: 14, fontWeight: '900' },
  bottomDockSpacer: { height: 86 },
  bottomDock: { alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.96)', borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, bottom: 16, elevation: 8, flexDirection: 'row', gap: 6, left: 16, padding: 8, position: 'absolute', right: 16 },
  dockButton: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 999, flex: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 8 },
  dockButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
