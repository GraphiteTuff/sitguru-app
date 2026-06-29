import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type Action = { label: string; href?: Href; placeholder?: string };
type Status = 'Future wiring' | 'Visual-only' | 'Needed';
type Role = { icon: string; title: string; summary: string; action: Action };
type RouteGroup = { title: string; routes: string[]; access: string; notes: string; action: Action };
type ChecklistItem = { label: string; status: Status };

const route = (href: string) => href as Href;
const existingRoutes = new Set(['/wiring-start-plan', 
  '/', '/account', '/admin-operations', '/ambassador-dashboard', '/ambassador-setup', '/auth-readiness', '/backend-readiness', '/booking-details', '/conversation', '/find-care', '/guru-dashboard', '/guru-live-walk', '/guru-pricing', '/guru-profile', '/guru-requests', '/guru-setup', '/login', '/notifications', '/pawreport-live', '/payments', '/pet-parent-dashboard', '/pet-parent-setup', '/pet-passports', '/qa-test-center', '/release-readiness', '/request-booking', '/reviews', '/role-selection', '/signup', '/support',
]);

function placeholder(label: string) {
  Alert.alert('Auth readiness placeholder', `${label} is a visual-only planning action. Real auth, sessions, RLS, backend access, payments, GPS, storage, and push notifications will be wired later.`);
}

function openAction(action: Action) {
  if (action.href && existingRoutes.has(String(action.href))) {
    router.push(action.href);
    return;
  }
  placeholder(action.placeholder ?? action.label);
}

const summary = [
  ['Login UI', 'Visual complete'], ['Signup UI', 'Visual complete'], ['Role selection', 'Visual complete'], ['Supabase Auth', 'Not wired'], ['Session persistence', 'Future'], ['Role-based routing', 'Visual-only'], ['Protected routes', 'Future'], ['Account recovery', 'Future'], ['Social login', 'Future'], ['MFA / 2FA', 'Future'], ['Biometric login', 'Future native'], ['Admin permissions', 'Future'],
] as const;

const futureFlow = ['Open app', 'Browse Find Care without account', 'Create account or log in', 'Confirm email/phone if required', 'Load user profile', 'Load user roles', 'Show available dashboards', 'User selects Pet Parent / Guru / Ambassador', 'Route to matching dashboard', 'Persist session', 'Refresh role access safely on app restart', 'Sign out from Account & Settings'];

const roles: Role[] = [
  { icon: '🐾', title: 'Pet Parent', summary: 'Can manage pets, search Gurus, message, request care, view bookings, see PawReport Live, pay after Guru acceptance.', action: { label: 'Pet Parent Dashboard', href: route('/pet-parent-dashboard') } },
  { icon: '🦮', title: 'Guru', summary: 'Can manage profile, pricing, availability, requests, messages, live walk controls, payouts.', action: { label: 'Guru Dashboard', href: route('/guru-dashboard') } },
  { icon: '🌱', title: 'Ambassador', summary: 'Can track referrals, training, rewards, support, outreach.', action: { label: 'Ambassador Dashboard', href: route('/ambassador-dashboard') } },
  { icon: '🛡️', title: 'Admin / Operations', summary: 'Future protected role only. Can view operations, support, safety, payments, and app health.', action: { label: 'Admin Operations', href: route('/admin-operations') } },
];

const routeGroups: RouteGroup[] = [
  { title: 'Public routes', routes: ['/', '/find-care', '/guru-profile'], access: 'Public', notes: 'Browse care discovery and public Guru previews without requiring a session.', action: { label: 'Open Find Care', href: route('/find-care') } },
  { title: 'Auth routes', routes: ['/login', '/signup', '/role-selection'], access: 'Visual-only', notes: 'Visual sign-in and setup entry points; no real credentials or sessions are created.', action: { label: 'Open Login', href: route('/login') } },
  { title: 'Pet Parent routes', routes: ['/pet-parent-dashboard', '/pet-passports', '/request-booking', '/booking-details', '/pawreport-live', '/payments', '/reviews'], access: 'Role-based future', notes: 'Future Pet Parent role should gate booking, pet, payment, and live-care views.', action: { label: 'Open Pet Parent Dashboard', href: route('/pet-parent-dashboard') } },
  { title: 'Guru routes', routes: ['/guru-dashboard', '/guru-pricing', '/guru-requests', '/guru-live-walk', '/booking-details', '/conversation', '/payments', '/reviews'], access: 'Role-based future', notes: 'Future Guru role should gate service, request, live-walk, and payout tools.', action: { label: 'Open Guru Dashboard', href: route('/guru-dashboard') } },
  { title: 'Ambassador routes', routes: ['/ambassador-dashboard', '/ambassador-setup', 'referrals/rewards/training future'], access: 'Role-based future', notes: 'Future Ambassador role should gate referral, reward, and training views.', action: { label: 'Open Ambassador Dashboard', href: route('/ambassador-dashboard') } },
  { title: 'Shared signed-in routes', routes: ['/account', '/notifications', '/conversation', '/support'], access: 'Signed-in', notes: 'Future signed-in users can access account, alerts, messages, and support.', action: { label: 'Open Account', href: route('/account') } },
  { title: 'Internal/admin preview routes', routes: ['/admin-operations', '/release-readiness', '/backend-readiness', '/qa-test-center', '/auth-readiness'], access: 'Admin-only future', notes: 'Internal visual planning only; future admin permissions must be verified server-side.', action: { label: 'Open Admin Operations', href: route('/admin-operations') } },
];

const sessionChecklist: ChecklistItem[] = ['App opens', 'Check stored session', 'Refresh session', 'Load profile', 'Load roles', 'Validate active role', 'Route to dashboard', 'Handle expired session', 'Handle role change', 'Handle sign out', 'Clear local role state', 'Return to public home/login'].map((label, index) => ({ label, status: index === 0 ? 'Visual-only' : index % 3 === 0 ? 'Needed' : 'Future wiring' } as ChecklistItem));
const supabaseChecklist = ['Email/password signup', 'Email/password login', 'Password reset', 'Email confirmation', 'Phone verification future', 'Social login with Google future', 'Social login with Apple future', 'Session refresh', 'Secure token handling', 'Profile creation after signup', 'user_roles creation after signup', 'Role completion checks', 'Admin role protection', 'Account deletion request future', 'Data export request future'];
const onboardingChecklist = ['Pet Parent setup', 'Pet Passport creation', 'Guru setup', 'Guru service area', 'Guru pricing calendar', 'Guru payout readiness', 'Ambassador setup', 'Ambassador referral code', 'Training checklist', 'Notifications preferences', 'Payment method readiness', 'Support access'];
const securityChecklist = ['Do not expose service role key in mobile client', 'Never store sensitive payment data in app', 'RLS required for every user-owned table', 'Admin role must be verified server-side', 'PawReport Live visible only to booking participants/admin', 'Messages visible only to participants/admin', 'Pet Passports visible only to owner/assigned Guru after booking', 'Payment records restricted', 'Payout records restricted', 'Support tickets restricted', 'Audit logs admin-only', 'Off-platform payment warning stays visible'];
const redirects: Action[] = [
  { label: 'Pet Parent role → /pet-parent-dashboard', href: route('/pet-parent-dashboard') }, { label: 'Guru role → /guru-dashboard', href: route('/guru-dashboard') }, { label: 'Ambassador role → /ambassador-dashboard', href: route('/ambassador-dashboard') }, { label: 'Multiple roles → /role-selection', href: route('/role-selection') }, { label: 'No role → /role-selection or setup', href: route('/role-selection') }, { label: 'Incomplete Pet Parent profile → /pet-parent-setup', href: route('/pet-parent-setup') }, { label: 'Incomplete Guru profile → /guru-setup', href: route('/guru-setup') }, { label: 'Incomplete Ambassador profile → /ambassador-setup', href: route('/ambassador-setup') }, { label: 'Admin role → /admin-operations future', href: route('/admin-operations') },
];
const recovery = ['Forgot password future', 'Change email future', 'Change phone future', 'Lost access support future', 'Role correction support', 'Suspended account placeholder', 'Safety/account issue report'];
const nativeSecurity = ['Biometric login future', 'Device/session management future', 'Push notification permission future', 'Location permission tied to PawReport Live future', 'Camera/photo permission tied to uploads future', 'Secure storage future', 'App lock future', 'Session timeout future'];
const quickActions: Action[] = [
  { label: 'Real Wiring Start Plan', href: route('/wiring-start-plan') },
  { label: 'Supabase Schema Readiness', href: route('/schema-readiness') },   { label: 'Login', href: route('/login') }, { label: 'Signup', href: route('/signup') }, { label: 'Role Selection', href: route('/role-selection') }, { label: 'Account', href: route('/account') }, { label: 'Backend Readiness', href: route('/backend-readiness') }, { label: 'Release Readiness', href: route('/release-readiness') }, { label: 'QA Test Center', href: route('/qa-test-center') }, { label: 'Admin Operations', href: route('/admin-operations') }, { label: 'Help & Support', href: route('/support') }, { label: 'Notifications', href: route('/notifications') },
];

export default function AuthReadinessScreen() {
  return <SitGuruScreen scroll center={false} maxWidth={860}><View style={styles.page}>
    <View style={styles.topBar}><Pressable accessibilityRole="button" onPress={() => router.push('/backend-readiness')} style={styles.backButton}><Text style={styles.backButtonText}>← Back to Backend Readiness</Text></Pressable><SitGuruLogo size="small" variant="symbol" /></View>
    <View style={styles.hero}><Text style={styles.eyebrow}>Internal planning</Text><Text style={styles.title}>Auth & Role Session Plan</Text><Text style={styles.subtitle}>Plan secure sign-in, role access, dashboard switching, session handling, and future Supabase Auth wiring.</Text><Text style={styles.notice}>Internal visual planning screen only. Real auth, sessions, RLS, and backend access will be wired later.</Text></View>
    <Section title="Auth readiness summary" eyebrow="Visual-only status"><View style={styles.grid}>{summary.map(([label, value]) => <View key={label} style={styles.summaryCard}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>)}</View></Section>
    <Section title="Future auth flow" eyebrow="Intended path"><NumberedList items={futureFlow} /></Section>
    <Section title="Role access model" eyebrow="Future role gates"><View style={styles.grid}>{roles.map((roleItem) => <View key={roleItem.title} style={styles.roleCard}><Text style={styles.roleIcon}>{roleItem.icon}</Text><Text style={styles.cardTitle}>{roleItem.title}</Text><Text style={styles.body}>{roleItem.summary}</Text><Button action={roleItem.action} /></View>)}</View></Section>
    <Section title="Route protection plan" eyebrow="Future access rules">{routeGroups.map((group) => <View key={group.title} style={styles.card}><View style={styles.cardHeader}><Text style={styles.cardTitle}>{group.title}</Text><Text style={styles.badge}>{group.access}</Text></View><Text style={styles.body}>{group.routes.join(', ')}</Text><Text style={styles.meta}>{group.notes}</Text><Button action={group.action} /></View>)}</Section>
    <Checklist title="Session lifecycle checklist" items={sessionChecklist} />
    <SimpleChecklist title="Supabase Auth wiring checklist" items={supabaseChecklist} />
    <SimpleChecklist title="Role onboarding checklist" items={onboardingChecklist} />
    <SimpleChecklist title="Security and privacy checklist" items={securityChecklist} />
    <Section title="Dashboard redirect plan" eyebrow="Future routing"><View style={styles.actions}>{redirects.map((action) => <Button key={action.label} action={action} />)}</View></Section>
    <Section title="Account recovery and support plan" eyebrow="Support paths"><View style={styles.grid}>{recovery.map((item) => <Pressable key={item} accessibilityRole="button" onPress={() => placeholder(item)} style={styles.checkItem}><Text style={styles.checkText}>□ {item}</Text></Pressable>)}</View><View style={styles.actions}><Button action={{ label: 'Help & Support', href: route('/support') }} /><Button action={{ label: 'Account & Settings', href: route('/account') }} /></View></Section>
    <SimpleChecklist title="Future native security features" items={nativeSecurity} />
    <Section title="Quick actions" eyebrow="Internal routes"><View style={styles.actions}>{quickActions.map((action) => <Button key={action.label} action={action} />)}</View></Section>
    <View style={styles.bottomDockSpacer} />
  </View><View style={styles.bottomDock}>{[{ label: 'Account', href: route('/account') }, { label: 'Roles', href: route('/role-selection') }, { label: 'Backend', href: route('/backend-readiness') }, { label: 'Support', href: route('/support') }].map((action) => <Pressable key={action.label} accessibilityRole="button" onPress={() => openAction(action)} style={styles.dockButton}><Text style={styles.dockButtonText}>{action.label}</Text></Pressable>)}</View></SitGuruScreen>;
}

function Section({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) { return <View style={styles.section}>{eyebrow ? <Text style={styles.eyebrowGreen}>{eyebrow}</Text> : null}<Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }
function Button({ action }: { action: Action }) { return <Pressable accessibilityRole="button" onPress={() => openAction(action)} style={styles.button}><Text style={styles.buttonText}>{action.label}</Text></Pressable>; }
function NumberedList({ items }: { items: string[] }) { return <View style={styles.grid}>{items.map((item, index) => <View key={item} style={styles.stepCard}><Text style={styles.stepNumber}>{index + 1}</Text><Text style={styles.checkText}>{item}</Text></View>)}</View>; }
function Checklist({ title, items }: { title: string; items: ChecklistItem[] }) { return <Section title={title} eyebrow="Checklist"><View style={styles.grid}>{items.map((item) => <Pressable key={item.label} accessibilityRole="button" onPress={() => placeholder(item.label)} style={styles.checkItem}><Text style={styles.checkText}>□ {item.label}</Text><Text style={styles.meta}>Status: {item.status}</Text></Pressable>)}</View></Section>; }
function SimpleChecklist({ title, items }: { title: string; items: string[] }) { return <Section title={title} eyebrow="Checklist"><View style={styles.grid}>{items.map((item) => <Pressable key={item} accessibilityRole="button" onPress={() => placeholder(item)} style={styles.checkItem}><Text style={styles.checkText}>□ {item}</Text><Text style={styles.meta}>Status: Future wiring</Text></Pressable>)}</View></Section>; }

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 8 }, topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, backButton: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 }, backButtonText: { color: SitGuruColors.text, fontSize: 14, fontWeight: '900' }, hero: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 30, gap: 10, padding: 22 }, eyebrow: { color: '#C9F26D', fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' }, title: { color: '#FFFFFF', fontSize: 35, fontWeight: '900', letterSpacing: -1, lineHeight: 40 }, subtitle: { color: '#DCEFE2', fontSize: 15, fontWeight: '700', lineHeight: 22 }, notice: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.22)', borderRadius: 18, borderWidth: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '900', lineHeight: 19, padding: 12 }, section: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 12, padding: 18 }, eyebrowGreen: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' }, sectionTitle: { color: SitGuruColors.text, fontSize: 23, fontWeight: '900', letterSpacing: -0.4 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, summaryCard: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 20, borderWidth: 1, flexBasis: 150, flexGrow: 1, gap: 4, padding: 14 }, summaryLabel: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '800' }, summaryValue: { color: SitGuruColors.primary, fontSize: 17, fontWeight: '900' }, card: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 22, borderWidth: 1, gap: 10, padding: 14 }, cardHeader: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }, cardTitle: { color: SitGuruColors.text, flex: 1, fontSize: 17, fontWeight: '900', minWidth: 160 }, badge: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 }, body: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 21 }, meta: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '900', lineHeight: 18 }, roleCard: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 22, borderWidth: 1, flexBasis: 245, flexGrow: 1, gap: 9, padding: 15 }, roleIcon: { fontSize: 30 }, checkItem: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 16, borderWidth: 1, flexBasis: 240, flexGrow: 1, gap: 4, padding: 12 }, checkText: { color: SitGuruColors.text, fontSize: 14, fontWeight: '800', lineHeight: 20 }, stepCard: { alignItems: 'center', backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, flexBasis: 190, flexDirection: 'row', flexGrow: 1, gap: 10, padding: 12 }, stepNumber: { backgroundColor: SitGuruColors.primary, borderRadius: 999, color: '#FFFFFF', fontSize: 13, fontWeight: '900', minWidth: 28, overflow: 'hidden', paddingVertical: 6, textAlign: 'center' }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, button: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 999, flexGrow: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 }, buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' }, bottomDockSpacer: { height: 88 }, bottomDock: { alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.96)', borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, bottom: 16, elevation: 8, flexDirection: 'row', gap: 6, left: 16, padding: 8, position: 'absolute', right: 16 }, dockButton: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, flex: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 8 }, dockButtonText: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900' },
});
