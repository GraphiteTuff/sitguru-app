import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type Action = { label: string; href?: Href; note?: string };

type CardProps = { title: string; eyebrow?: string; children: ReactNode };

const roles: Action[] = [
  { label: 'Pet Parent Dashboard', href: '/pet-parent-dashboard' },
  { label: 'Guru Dashboard', href: '/guru-dashboard' },
  { label: 'Ambassador Dashboard', href: '/ambassador-dashboard' },
  { label: 'Manage Roles', href: '/role-selection' },
];

const quickActions: Action[] = [
  { label: 'My Pets / Pet Passports', href: '/pet-passports' },
  { label: 'Find Care', href: '/find-care' },
  { label: 'Messages', href: '/conversation' },
  { label: 'Notifications', href: '/notifications' },
  { label: 'Booking Details', href: '/booking-details' },
  { label: 'Help & Support', href: '/support' },
  { label: 'Guru Pricing', href: '/guru-pricing' },
];

const notificationPrefs = [
  ['Booking alerts', true],
  ['Message alerts', true],
  ['PawReport Live alerts', true],
  ['Payment/payout alerts', false],
  ['PawPerks/referral alerts', true],
] as const;

function showPlaceholder(label: string) {
  Alert.alert('Visual preview', `${label} will be available after account settings are connected.`);
}

function openAction(action: Action) {
  if (action.href) {
    router.push(action.href);
    return;
  }

  showPlaceholder(action.note ?? action.label);
}

function SettingsCard({ title, eyebrow, children }: CardProps) {
  return (
    <View style={styles.card}>
      {eyebrow ? <Text style={styles.cardEyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function PillButton({ action, secondary = false }: { action: Action; secondary?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openAction(action)}
      style={[styles.pillButton, secondary && styles.pillButtonSecondary]}
    >
      <Text style={[styles.pillButtonText, secondary && styles.pillButtonTextSecondary]}>{action.label}</Text>
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function AccountScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/pet-parent-dashboard')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <SitGuruLogo size="small" variant="symbol" />
        </View>

        <View style={styles.heroPanel}>
          <Text style={styles.heroEyebrow}>Account hub</Text>
          <Text style={styles.title}>Account & Settings</Text>
          <Text style={styles.subtitle}>Manage your SitGuru profile, roles, alerts, privacy, and support options.</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>JG</Text></View>
          <View style={styles.profileCopy}>
            <Text style={styles.profileName}>Jason G.</Text>
            <Text style={styles.profileText}>member@example.com</Text>
            <Text style={styles.profileText}>555-555-5555 • Quakertown, PA</Text>
            <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
            <Text style={styles.profileMeta}>Profile completion: 85%</Text>
          </View>
          <PillButton action={{ label: 'Edit Profile', note: 'Edit Profile' }} />
        </View>

        <SettingsCard title="Switch roles" eyebrow="Your SitGuru access">
          <View style={styles.roleGrid}>
            {['Pet Parent', 'Guru', 'Ambassador'].map((role) => <Text key={role} style={styles.rolePill}>{role}</Text>)}
          </View>
          <View style={styles.buttonGrid}>{roles.map((action) => <PillButton key={action.label} action={action} secondary />)}</View>
        </SettingsCard>

        <SettingsCard title="Quick account actions">
          <View style={styles.buttonGrid}>{quickActions.map((action) => <PillButton key={action.label} action={action} secondary />)}</View>
        </SettingsCard>

        <SettingsCard title="Notification preferences">
          {notificationPrefs.map(([label, enabled]) => (
            <Pressable key={label} accessibilityRole="switch" accessibilityState={{ checked: enabled }} onPress={() => showPlaceholder(label)} style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>{label}</Text>
              <View style={[styles.toggleTrack, enabled && styles.toggleTrackOn]}><View style={[styles.toggleThumb, enabled && styles.toggleThumbOn]} /></View>
            </Pressable>
          ))}
          <PillButton action={{ label: 'Open Notifications', href: '/notifications' }} />
        </SettingsCard>

        <SettingsCard title="Privacy and security">
          <InfoRow label="Password" value="Update password placeholder" />
          <InfoRow label="Two-factor authentication" value="Visual-only setup status" />
          <InfoRow label="Devices & sessions" value="Review signed-in devices placeholder" />
          <InfoRow label="Data & privacy" value="Download or manage data placeholder" />
          <Text style={styles.safetyNote}>Keep booking, payments, messages, and PawReport updates inside SitGuru.</Text>
          <View style={styles.buttonGrid}>{['Password', 'Two-factor authentication', 'Devices', 'Data & privacy'].map((label) => <PillButton key={label} action={{ label, note: label }} secondary />)}</View>
        </SettingsCard>

        <SettingsCard title="Payment and payout readiness">
          <InfoRow label="Pet Parent payment method" value="Placeholder card readiness" />
          <InfoRow label="Guru Stripe Connect" value="Payout setup placeholder" />
          <InfoRow label="Ambassador rewards" value="Rewards destination placeholder" />
          <View style={styles.buttonGrid}>
            <PillButton action={{ label: 'Guru Pricing', href: '/guru-pricing' }} secondary />
            <PillButton action={{ label: 'Booking Details', href: '/booking-details' }} secondary />
            <PillButton action={{ label: 'Payment Setup', note: 'Payment setup' }} secondary />
          </View>
        </SettingsCard>

        <SettingsCard title="Support">
          <InfoRow label="Help Center" value="Browse common SitGuru questions placeholder" />
          <InfoRow label="Contact SitGuru" value="Send a support message" />
          <InfoRow label="Report a safety concern" value="Use urgent safety support placeholder" />
          <View style={styles.buttonGrid}>
            <PillButton action={{ label: 'Help & Support', href: '/support' }} secondary />
            <PillButton action={{ label: 'Contact SitGuru', href: '/conversation' }} secondary />
            <PillButton action={{ label: 'Report Safety Concern', note: 'Report a safety concern' }} secondary />
          </View>
        </SettingsCard>

        <SettingsCard title="App settings">
          <InfoRow label="App version" value="SitGuru preview 1.0" />
          <InfoRow label="Accessibility" value="Large tap targets and readable labels" />
          <InfoRow label="Saved preferences" value="Visual-only preferences" />
          <PillButton action={{ label: 'Sign Out', note: 'Sign out' }} />
        </SettingsCard>

        <View style={styles.bottomDockSpacer} />
      </View>

      <View style={styles.bottomDock}>
        {[
          ['Dashboard', '/pet-parent-dashboard'],
          ['Messages', '/conversation'],
          ['Alerts', '/notifications'],
          ['Account', '/account'],
        ].map(([label, href]) => (
          <Pressable key={label} accessibilityRole="button" onPress={() => router.push(href as Href)} style={[styles.dockButton, label === 'Account' && styles.dockButtonActive]}>
            <Text style={[styles.dockButtonText, label === 'Account' && styles.dockButtonTextActive]}>{label}</Text>
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
  profileCard: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 30, borderWidth: 1, elevation: 3, flexDirection: 'row', flexWrap: 'wrap', gap: 14, padding: 18 },
  avatar: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 28, borderWidth: 1, height: 76, justifyContent: 'center', width: 76 },
  avatarText: { color: SitGuruColors.primary, fontSize: 24, fontWeight: '900' },
  profileCopy: { flex: 1, gap: 5, minWidth: 210 },
  profileName: { color: SitGuruColors.text, fontSize: 24, fontWeight: '900' },
  profileText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '800' },
  profileMeta: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900' },
  progressTrack: { backgroundColor: SitGuruColors.border, borderRadius: 999, height: 9, overflow: 'hidden' },
  progressFill: { backgroundColor: SitGuruColors.primary, height: 9, width: '85%' },
  card: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 12, padding: 18 },
  cardEyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  cardTitle: { color: SitGuruColors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rolePill: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, color: SitGuruColors.primary, fontSize: 13, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8 },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pillButton: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 999, flexGrow: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
  pillButtonSecondary: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderWidth: 1 },
  pillButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  pillButtonTextSecondary: { color: SitGuruColors.primary },
  preferenceRow: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between', paddingVertical: 6 },
  preferenceLabel: { color: SitGuruColors.text, flex: 1, fontSize: 15, fontWeight: '800' },
  toggleTrack: { backgroundColor: SitGuruColors.border, borderRadius: 999, height: 30, justifyContent: 'center', padding: 3, width: 54 },
  toggleTrackOn: { backgroundColor: SitGuruColors.primaryLight },
  toggleThumb: { backgroundColor: '#FFFFFF', borderRadius: 999, height: 24, width: 24 },
  toggleThumbOn: { alignSelf: 'flex-end', backgroundColor: SitGuruColors.primary },
  infoRow: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, gap: 4, padding: 13 },
  infoLabel: { color: SitGuruColors.text, fontSize: 14, fontWeight: '900' },
  infoValue: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  safetyNote: { backgroundColor: '#FFF8ED', borderColor: '#F8DEC8', borderRadius: 18, borderWidth: 1, color: SitGuruColors.text, fontSize: 14, fontWeight: '800', lineHeight: 20, padding: 14 },
  bottomDockSpacer: { height: 86 },
  bottomDock: { alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, bottom: 16, elevation: 8, flexDirection: 'row', gap: 6, left: 16, padding: 8, position: 'absolute', right: 16 },
  dockButton: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, flex: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 8 },
  dockButtonActive: { backgroundColor: SitGuruColors.primary },
  dockButtonText: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900' },
  dockButtonTextActive: { color: '#FFFFFF' },
});
