import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type Tone = 'good' | 'progress' | 'needs' | 'visual' | 'blocker' | 'optional';
type Action = { label: string; href?: Href; placeholder?: string };
type Summary = { label: string; value: string; tone: Tone };
type RouteRow = { route: string; purpose: string; status: 'Opens' | 'Needs test' | 'Optional' | 'Visual-only'; href?: Href };
type FlowStep = { label: string; expected: string; status: string; tone: Tone; action: Action };
type WireRow = { label: string; destination: string; status: string; tone: Tone; action: Action };

const href = (path: string) => path as Href;

const existingRoutes = new Set([
  '/', '/find-care', '/guru-profile', '/pet-passports', '/request-booking', '/booking-details', '/pawreport-live', '/guru-live-walk', '/conversation', '/notifications', '/account', '/support', '/payments', '/reviews', '/guru-pricing', '/guru-requests', '/admin-operations', '/release-readiness', '/backend-readiness', '/qa-test-center', '/guru-dashboard', '/ambassador-dashboard',
]);

function showPlaceholder(label: string) {
  Alert.alert('QA Test Center placeholder', `${label} is a safe visual-only QA action. No automated test, API call, payment, GPS, storage, auth, push, or backend logic was run.`);
}

function openAction(action: Action) {
  if (action.href && existingRoutes.has(String(action.href))) {
    router.push(action.href);
    return;
  }
  showPlaceholder(action.placeholder ?? action.label);
}

const summaryCards: Summary[] = [
  { label: 'TypeScript', value: 'Expected pass', tone: 'good' },
  { label: 'Route coverage', value: 'In progress', tone: 'progress' },
  { label: 'Button wiring', value: 'In progress', tone: 'progress' },
  { label: 'Mobile layout', value: 'Needs device testing', tone: 'needs' },
  { label: 'Accessibility', value: 'Needs review', tone: 'needs' },
  { label: 'Visual-only warnings', value: 'Needed', tone: 'visual' },
  { label: 'Conflict markers', value: 'Must be clear', tone: 'blocker' },
  { label: 'Release blockers', value: 'Open', tone: 'blocker' },
];

const conflictMarkerPattern = '<' + '<<<<<<|' + '===' + '====|' + '>>>' + '>>>>';
const commands = ['npx tsc --noEmit', `Get-ChildItem .\\src\\app -Recurse -File | Select-String -Pattern '${conflictMarkerPattern}'`, 'git status --short', 'npx expo start --web -c'];
const commandBadges = ['Required before merge', 'Required after pull', 'Required before testing'];

const routeRows: RouteRow[] = [
  ['/', 'Welcome and public entry', 'Opens'], ['/find-care', 'Pet Parent care discovery', 'Needs test'], ['/guru-profile', 'Guru public profile preview', 'Needs test'], ['/pet-passports', 'Pet care notes hub', 'Needs test'], ['/request-booking', 'Pet Parent Booking Request', 'Needs test'], ['/booking-details', 'Booking Details hub', 'Needs test'], ['/pawreport-live', 'Pet Parent live tracking view', 'Visual-only'], ['/guru-live-walk', 'Guru live walk controls', 'Visual-only'], ['/conversation', 'Messaging preview', 'Needs test'], ['/notifications', 'Notifications', 'Needs test'], ['/account', 'Account & Settings', 'Opens'], ['/support', 'Help & Support', 'Needs test'], ['/payments', 'Payments & Payouts', 'Visual-only'], ['/reviews', 'Review flow', 'Optional'], ['/guru-pricing', 'Guru Pricing Workspace', 'Visual-only'], ['/guru-requests', 'Guru request queue', 'Optional'], ['/admin-operations', 'Admin Operations', 'Visual-only'], ['/auth-readiness', 'Auth & Role Session Plan', 'Needs test'], ['/release-readiness', 'Release Readiness', 'Needs test'], ['/backend-readiness', 'Backend Readiness', 'Needs test'], ['/qa-test-center', 'QA Test Center', 'Opens'], ['/schema-readiness', 'Supabase Schema Readiness', 'Needs test'],
].map(([route, purpose, status]) => ({ route, purpose, status: status as RouteRow['status'], href: href(route) }));

const petParentSteps: FlowStep[] = [
  ['Open Find Care','/find-care','Route check','/find-care'], ['Search by ZIP','Find Care search controls','Visual-only','/find-care'], ['View Guru Profile','/guru-profile','Route check','/guru-profile'], ['Message Guru','/conversation','Route check','/conversation'], ['Request Booking','/request-booking','Route check','/request-booking'], ['Choose Pet Passport','/pet-passports','Route check','/pet-passports'], ['Choose service','Pet Parent Booking Request','Visual-only','/request-booking'], ['Choose dates','Pet Parent Booking Request','Visual-only','/request-booking'], ['Review estimated price','Pet Parent Booking Request','Visual-only','/request-booking'], ['Submit request placeholder','Safe alert only','Placeholder',''], ['Open Booking Details','/booking-details','Route check','/booking-details'], ['View PawReport Live','/pawreport-live','Visual-only','/pawreport-live'], ['Leave review if /reviews exists','/reviews','Optional','/reviews'], ['Check Payments & Payouts if /payments exists','/payments','Visual-only','/payments'], ['Open Notifications','/notifications','Route check','/notifications'], ['Open Support','/support','Route check','/support'],
].map(([label, expected, status, path]) => ({ label, expected, status, tone: status === 'Optional' ? 'optional' : status === 'Visual-only' ? 'visual' : 'progress', action: path ? { label: 'Open', href: href(path) } : { label: 'Run placeholder', placeholder: label } }));

const guruSteps: FlowStep[] = [
  ['Open Guru Dashboard','/guru-dashboard','Route check','/guru-dashboard'], ['Open Pricing Calendar','/guru-pricing','Visual-only','/guru-pricing'], ['Set service rate visual-only','Guru Pricing Workspace','Visual-only','/guru-pricing'], ['Set calendar pricing visual-only','Guru Pricing Workspace','Visual-only','/guru-pricing'], ['View Care Requests if /guru-requests exists','/guru-requests','Optional','/guru-requests'], ['Open Booking Details','/booking-details','Route check','/booking-details'], ['Message Pet Parent','/conversation','Route check','/conversation'], ['Start Live Walk','/guru-live-walk','Visual-only','/guru-live-walk'], ['Add quick PawReport update','Live Walk Controls','Visual-only','/guru-live-walk'], ['Open Payments & Payouts','/payments','Visual-only','/payments'], ['Open Notifications','/notifications','Route check','/notifications'], ['Open Support','/support','Route check','/support'],
].map(([label, expected, status, path]) => ({ label, expected, status, tone: status === 'Optional' ? 'optional' : status === 'Visual-only' ? 'visual' : 'progress', action: { label: 'Open', href: href(path) } }));

const ambassadorSteps: FlowStep[] = [
  ['Open Ambassador Dashboard','/ambassador-dashboard','Route check','/ambassador-dashboard'], ['Check referral preview','Ambassador Dashboard','Visual-only','/ambassador-dashboard'], ['Check training preview','Ambassador Dashboard','Visual-only','/ambassador-dashboard'], ['Check rewards preview','Ambassador Dashboard','Visual-only','/ambassador-dashboard'], ['Open Notifications','/notifications','Route check','/notifications'], ['Open Payments & Payouts if present','/payments','Visual-only','/payments'], ['Open Support','/support','Route check','/support'],
].map(([label, expected, status, path]) => ({ label, expected, status, tone: status === 'Visual-only' ? 'visual' : 'progress', action: { label: 'Open', href: href(path) } }));

const adminSteps: FlowStep[] = [
  ['Open Admin Operations','/admin-operations','Visual-only','/admin-operations'], ['Check active care','Admin Operations','Visual-only','/admin-operations'], ['Check live walk monitor','Admin Operations','Visual-only','/admin-operations'], ['Check support queue','Admin Operations','Visual-only','/admin-operations'], ['Check payment alerts','Admin Operations','Visual-only','/admin-operations'], ['Check safety flags','Admin Operations','Visual-only','/admin-operations'], ['Open Auth & Role Session Plan','/auth-readiness','Route check','/auth-readiness'], ['Open Release Readiness','/release-readiness','Route check','/release-readiness'], ['Open Backend Readiness','/backend-readiness','Route check','/backend-readiness'], ['Open QA Test Center','/qa-test-center','Route check','/qa-test-center'],
].map(([label, expected, status, path]) => ({ label, expected, status, tone: status === 'Visual-only' ? 'visual' : 'progress', action: { label: 'Open', href: href(path) } }));

const wiringRows: WireRow[] = [
  ['Find Care → View Profile','/guru-profile'], ['Find Care → Message','/conversation'], ['Find Care → Request Care','/request-booking'], ['Conversation → View Profile','/guru-profile'], ['Conversation → Request Care','/request-booking'], ['Conversation → View Booking','/booking-details'], ['Conversation → PawReport Live','/pawreport-live'], ['Request Booking → View Guru','/guru-profile'], ['Request Booking → Booking Details','/booking-details'], ['Booking Details → PawReport Live','/pawreport-live'], ['Booking Details → Guru Live Walk','/guru-live-walk'], ['Booking Details → Reviews','/reviews'], ['Booking Details → Payments','/payments'], ['Guru Dashboard → Pricing Calendar','/guru-pricing'], ['Guru Dashboard → Live Walk','/guru-live-walk'], ['Guru Dashboard → Requests','/guru-requests'], ['Account → Notifications','/notifications'], ['Account → Support','/support'], ['Account → Payments','/payments'], ['Account → Release Readiness','/release-readiness'], ['Release Readiness → Backend Readiness','/backend-readiness'], ['Backend Readiness → QA Test Center','/qa-test-center'],
].map(([label, destination]) => ({ label, destination, status: 'Needs manual tap test', tone: 'progress', action: { label: 'Test destination', href: href(destination) } }));

const mobileChecks = ['One-handed bottom actions','Large tap targets','Scrollable screens','No content cut off','Cards readable on phone width','Calendar usable on phone','Bottom dock does not cover content','Buttons not too small','No desktop-only layout dependency','Works on web preview','Needs real phone testing'];
const accessibilityChecks = ['Button labels clear','Text contrast review needed','Font sizes readable','Touch targets large enough','Screen sections structured','Important alerts visible','Visual-only features labeled','Future native accessibility review needed','Future screen reader review needed'];
const visualWarnings = ['Payments are visual-only','Payouts are visual-only','GPS live tracking is visual-only','Push notifications are visual-only','Image uploads are visual-only','Auth is visual-only','Backend data is visual-only','Admin permissions are visual-only','Reviews are visual-only','Support submissions are visual-only'];
const releaseBlockers = ['Backend not wired','Auth not wired','RLS/security not wired','Stripe not wired','GPS not wired','Push notifications not wired','Storage upload not wired','App store metadata not ready','Privacy/legal docs not finalized','Device QA not complete'];
const quickActions: Action[] = [
  { label: 'Supabase Schema Readiness', href: href('/schema-readiness') },   { label: 'Auth & Role Session Plan', href: href('/auth-readiness') }, { label: 'Release Readiness', href: href('/release-readiness') }, { label: 'Backend Readiness', href: href('/backend-readiness') }, { label: 'Admin Operations', href: href('/admin-operations') }, { label: 'Account', href: href('/account') }, { label: 'Notifications', href: href('/notifications') }, { label: 'Support', href: href('/support') }, { label: 'Payments', href: href('/payments') }, { label: 'Booking Details', href: href('/booking-details') }, { label: 'Find Care', href: href('/find-care') },
];

export default function QATestCenterScreen() {
  const [notes, setNotes] = useState('');
  return (
    <SitGuruScreen scroll center={false} maxWidth={900}>
      <View style={styles.page}>
        <View style={styles.topBar}><Button action={{ label: '← Back to Release Readiness', href: href('/release-readiness') }} /><SitGuruLogo size="small" variant="symbol" /></View>
        <View style={styles.hero}><Text style={styles.eyebrow}>Internal app QA</Text><Text style={styles.title}>QA Test Center</Text><Text style={styles.subtitle}>Validate routes, role flows, buttons, mobile layouts, visual-only warnings, and release blockers before production wiring.</Text><Text style={styles.notice}>Internal visual QA checklist only. This does not run automated tests or certify production readiness.</Text></View>
        <Section title="QA summary" eyebrow="Manual readiness"><View style={styles.grid}>{summaryCards.map((item) => <View key={item.label} style={styles.summaryCard}><Text style={styles.summaryLabel}>{item.label}</Text><Badge label={item.value} tone={item.tone} /></View>)}</View></Section>
        <Section title="Required local checks" eyebrow="PowerShell-friendly commands"><View style={styles.badgeRow}>{commandBadges.map((b) => <Badge key={b} label={b} tone="blocker" />)}</View>{commands.map((cmd) => <Text key={cmd} style={styles.command}>{cmd}</Text>)}</Section>
        <Section title="Route test checklist" eyebrow="Routes and purposes">{routeRows.map((row) => <Row key={row.route} left={row.route} middle={row.purpose} badge={row.status} action={{ label: 'Open route', href: row.href }} />)}</Section>
        <Flow title="Pet Parent flow test" steps={petParentSteps} />
        <Flow title="Guru flow test" steps={guruSteps} />
        <Flow title="Ambassador flow test" steps={ambassadorSteps} />
        <Flow title="Admin/internal flow test" steps={adminSteps} />
        <Section title="Button wiring checklist" eyebrow="Expected destinations">{wiringRows.map((row) => <Row key={row.label} left={row.label} middle={row.destination} badge={row.status} action={row.action} />)}</Section>
        <CheckGrid title="Mobile layout checklist" items={mobileChecks} tone="needs" />
        <CheckGrid title="Accessibility checklist" items={accessibilityChecks} tone="needs" />
        <CheckGrid title="Visual-only warning checklist" items={visualWarnings} tone="visual" />
        <CheckGrid title="Release blocker checklist" items={releaseBlockers} tone="blocker" />
        <Section title="QA notes" eyebrow="Manual testing notes"><TextInput multiline value={notes} onChangeText={setNotes} placeholder="Write notes from manual testing, bugs found, screen issues, or route problems." placeholderTextColor={SitGuruColors.textSoft} style={styles.textArea} /><View style={styles.actions}><Button action={{ label: 'Save QA Notes', placeholder: 'Save QA Notes' }} primary /><Button action={{ label: 'Report Issue', placeholder: 'Report Issue' }} /><Button action={{ label: 'Open Support', href: href('/support') }} /><Button action={{ label: 'Open Admin Operations', href: href('/admin-operations') }} /></View></Section>
        <Section title="Quick actions" eyebrow="Internal routes"><View style={styles.actions}>{quickActions.map((action) => <Button key={action.label} action={action} />)}</View></Section>
        <View style={styles.bottomDockSpacer} />
      </View>
      <View style={styles.bottomDock}>{[['Account','/account'],['Release','/release-readiness'],['Backend','/backend-readiness'],['Support','/support']].map(([label, path]) => <Pressable key={label} accessibilityRole="button" onPress={() => router.push(href(path))} style={styles.dockButton}><Text style={styles.dockButtonText}>{label}</Text></Pressable>)}</View>
    </SitGuruScreen>
  );
}

function Section({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) { return <View style={styles.section}>{eyebrow ? <Text style={styles.eyebrowGreen}>{eyebrow}</Text> : null}<Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }
function Badge({ label, tone }: { label: string; tone: Tone }) { return <Text style={[styles.badge, styles[`badge_${tone}`]]}>{label}</Text>; }
function Button({ action, primary = false }: { action: Action; primary?: boolean }) { return <Pressable accessibilityRole="button" onPress={() => openAction(action)} style={[styles.button, primary && styles.primaryButton]}><Text style={[styles.buttonText, primary && styles.primaryButtonText]}>{action.label}</Text></Pressable>; }
function Row({ left, middle, badge, action }: { left: string; middle: string; badge: string; action: Action }) { return <View style={styles.row}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{left}</Text><Text style={styles.body}>{middle}</Text><Badge label={badge} tone={badge.includes('Optional') ? 'optional' : badge.includes('Visual') ? 'visual' : badge.includes('Open') ? 'good' : 'progress'} /></View><Button action={action} /></View>; }
function Flow({ title, steps }: { title: string; steps: FlowStep[] }) { return <Section title={title} eyebrow="Role flow">{steps.map((step) => <Row key={step.label} left={step.label} middle={`Expected screen: ${step.expected}`} badge={step.status} action={step.action} />)}</Section>; }
function CheckGrid({ title, items, tone }: { title: string; items: string[]; tone: Tone }) { return <Section title={title} eyebrow="Checklist"><View style={styles.grid}>{items.map((item) => <Pressable key={item} accessibilityRole="button" onPress={() => showPlaceholder(item)} style={styles.checkCard}><Text style={styles.checkText}>□ {item}</Text><Badge label={tone === 'blocker' ? 'Open' : tone === 'visual' ? 'Visual-only' : 'Needs review'} tone={tone} /></Pressable>)}</View></Section>; }

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 8 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  hero: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 30, gap: 10, padding: 22 },
  eyebrow: { color: '#C9F26D', fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 36, fontWeight: '900', letterSpacing: -1, lineHeight: 40 },
  subtitle: { color: '#DCEFE2', fontSize: 15, fontWeight: '700', lineHeight: 22 },
  notice: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.22)', borderRadius: 18, borderWidth: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '900', lineHeight: 19, padding: 12 },
  section: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 12, padding: 18 },
  eyebrowGreen: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  sectionTitle: { color: SitGuruColors.text, fontSize: 23, fontWeight: '900', letterSpacing: -0.4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryCard: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 20, borderWidth: 1, flexBasis: 170, flexGrow: 1, gap: 8, padding: 14 },
  summaryLabel: { color: SitGuruColors.text, fontSize: 15, fontWeight: '900' },
  badge: { alignSelf: 'flex-start', borderRadius: 999, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 },
  badge_good: { backgroundColor: '#ECFDF3', color: '#167A3A' },
  badge_progress: { backgroundColor: SitGuruColors.surfaceSoft, color: SitGuruColors.primary },
  badge_needs: { backgroundColor: '#FFF7ED', color: SitGuruColors.warning },
  badge_visual: { backgroundColor: '#EEF2FF', color: '#4338CA' },
  badge_blocker: { backgroundColor: '#FFF1F2', color: SitGuruColors.danger },
  badge_optional: { backgroundColor: SitGuruColors.background, color: SitGuruColors.textMuted },
  command: { backgroundColor: '#102A1D', borderRadius: 14, color: '#E8F8EE', fontSize: 13, fontWeight: '800', lineHeight: 19, padding: 12 },
  row: { alignItems: 'center', backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 20, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', padding: 14 },
  rowCopy: { flex: 1, gap: 6, minWidth: 220 },
  rowTitle: { color: SitGuruColors.text, fontSize: 16, fontWeight: '900' },
  body: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  button: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 999, borderWidth: 1, flexGrow: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
  primaryButton: { backgroundColor: SitGuruColors.primary, borderColor: SitGuruColors.primary },
  buttonText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900' },
  primaryButtonText: { color: '#FFFFFF' },
  checkCard: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, flexBasis: 230, flexGrow: 1, gap: 8, padding: 13 },
  checkText: { color: SitGuruColors.text, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  textArea: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 20, borderWidth: 1, color: SitGuruColors.text, fontSize: 15, fontWeight: '700', minHeight: 140, padding: 14, textAlignVertical: 'top' },
  bottomDockSpacer: { height: 92 },
  bottomDock: { alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.96)', borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, bottom: 16, elevation: 8, flexDirection: 'row', gap: 6, left: 16, padding: 8, position: 'absolute', right: 16 },
  dockButton: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, flex: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 8 },
  dockButtonText: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900' },
});
