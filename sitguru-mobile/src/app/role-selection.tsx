import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import SitGuruButton from '@/components/SitGuruButton';
import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruProfileAvatar from '@/components/SitGuruProfileAvatar';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { roleDashboardPath, roleDescription, roleIcon, roleLabel, type AppRole } from '@/types/auth';

const previewRoles: AppRole[] = ['pet_parent', 'guru', 'ambassador'];

export default function RoleSelectionScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const { isAuthenticated, user, profile, roles, primaryRole, roleOptions, profileLoading, profileError, reloadProfileAndRoles } = useAuth();
  const profileName = profile?.full_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'SitGuru member';
  const shownRoles = roleOptions.length ? roleOptions : previewRoles.map((role) => ({ role, label: roleLabel(role), description: roleDescription(role), icon: roleIcon(role), dashboardPath: roleDashboardPath(role) }));

  return (
    <SitGuruScreen scroll center={false} maxWidth={820}>
      <View style={styles.page}>
        <View style={styles.topBar}><SitGuruLogo size="small" variant="symbol" /><View style={styles.topLinks}><Link href="/account" style={styles.topLink}>Account</Link><Link href="/find-care" style={styles.topLink}>Find Care</Link></View></View>
        <View style={[styles.heroPanel, isWide && styles.heroPanelWide]}>
          <View style={styles.heroCopy}><Text style={styles.heroBadge}>Role selection</Text><Text style={styles.title}>Choose your SitGuru role.</Text><Text style={styles.subtitle}>Use loaded website account roles when available, or preview dashboards while backend setup continues.</Text></View>
          <View style={styles.heroPhoto}><Text style={styles.heroIcon}>🐾</Text><Text style={styles.heroPhotoTitle}>One SitGuru account</Text><Text style={styles.heroPhotoText}>Pet Parent, Guru, and Ambassador paths stay friendly and mobile-ready.</Text></View>
        </View>

        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <SitGuruProfileAvatar avatarUrl={profile?.avatar_url} email={user?.email ?? profile?.email} fullName={profileName} role={primaryRole ? roleLabel(primaryRole) : undefined} size={68} />
            <View style={styles.sessionCopy}>
              <Text style={styles.cardEyebrow}>{isAuthenticated ? 'Signed-in role read' : 'Preview mode'}</Text>
              <Text style={styles.cardTitle}>{isAuthenticated ? `Signed in as ${user?.email ?? 'SitGuru member'}` : 'Not signed in yet'}</Text>
              {isAuthenticated ? <Text style={styles.cardText}>Profile name: {profile ? profileName : profileLoading ? 'Loading profile…' : 'Needs setup'}</Text> : <Text style={styles.cardText}>Dashboard preview buttons stay open for visual testing. Log in or create account when ready.</Text>}
              {isAuthenticated ? <Text style={styles.cardText}>Loaded roles: {roles.length ? roles.map(roleLabel).join(', ') : 'No roles found yet'}</Text> : null}
              {isAuthenticated && primaryRole ? <Text style={styles.cardText}>Primary role: {roleLabel(primaryRole)}</Text> : null}
            </View>
          </View>
          {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
          {isAuthenticated && !profileLoading && roles.length === 0 ? <View style={styles.setupNotice}><Text style={styles.setupTitle}>No roles found yet</Text><Text style={styles.setupText}>Your account is signed in, but SitGuru has not loaded a Pet Parent, Guru, or Ambassador role yet.</Text></View> : null}
          <View style={styles.buttonRow}>{isAuthenticated ? <SitGuruButton disabled={profileLoading} label={profileLoading ? 'Refreshing roles…' : 'Refresh roles'} onPress={reloadProfileAndRoles} /> : <><SitGuruButton label="Login" onPress={() => router.push('/login')} /><SitGuruButton label="Create account" variant="secondary" onPress={() => router.push('/signup')} /></>}</View>
        </View>

        {primaryRole && roles.length === 1 ? <Pressable accessibilityRole="button" onPress={() => router.push(roleDashboardPath(primaryRole))} style={styles.primaryContinue}><Text style={styles.primaryContinueText}>Continue to {roleLabel(primaryRole)} Dashboard</Text><Text style={styles.primaryArrow}>→</Text></Pressable> : null}

        <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>{roles.length > 1 ? 'Role switcher' : roles.length === 1 ? 'Loaded role' : 'Dashboard previews'}</Text><Text style={styles.sectionTitle}>{roles.length ? 'Roles loaded from SitGuru.' : 'Preview role dashboards.'}</Text></View>
        <View style={[styles.roleGrid, isWide && styles.roleGridWide]}>{shownRoles.map((option) => <Pressable key={option.role} accessibilityRole="button" onPress={() => router.push(option.dashboardPath)} style={styles.roleCard}><Text style={styles.roleIcon}>{option.icon}</Text><Text style={styles.roleTitle}>{option.label}</Text><Text style={styles.roleDescription}>{option.description}</Text><Text style={styles.roleAction}>{roles.length ? `Open ${option.label} Dashboard →` : `Preview ${option.label} Dashboard →`}</Text></Pressable>)}</View>
        <View style={styles.openSearchPanel}><View><Text style={styles.openSearchEyebrow}>Public search stays open</Text><Text style={styles.openSearchTitle}>Browse care first.</Text><Text style={styles.openSearchText}>Find Care remains available to visitors without forcing signup.</Text></View><SitGuruButton label="Find Care" variant="secondary" onPress={() => router.push('/find-care')} /></View>
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18, paddingBottom: 24, paddingVertical: 4 }, topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, topLinks: { flexDirection: 'row', gap: 8 }, topLink: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, color: SitGuruColors.primary, fontSize: 13, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 9, textTransform: 'uppercase' },
  heroPanel: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 34, borderWidth: 1, elevation: 4, gap: 18, overflow: 'hidden', padding: 18 }, heroPanelWide: { flexDirection: 'row' }, heroCopy: { flex: 1, gap: 14, justifyContent: 'center' }, heroBadge: { alignSelf: 'flex-start', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 999, borderWidth: 1, color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 7, textTransform: 'uppercase' }, title: { color: SitGuruColors.text, fontSize: 42, fontWeight: '900', letterSpacing: -1.1, lineHeight: 45 }, subtitle: { color: SitGuruColors.textMuted, fontSize: 17, fontWeight: '700', lineHeight: 25 }, heroPhoto: { alignItems: 'center', backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, flex: 1, gap: 8, minHeight: 220, justifyContent: 'center', padding: 22 }, heroIcon: { fontSize: 46 }, heroPhotoTitle: { color: SitGuruColors.text, fontSize: 20, fontWeight: '900' }, heroPhotoText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 20, textAlign: 'center' },
  sessionCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 28, borderWidth: 1, gap: 10, padding: 18 }, sessionHeader: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 14 }, sessionCopy: { flex: 1, gap: 6, minWidth: 220 }, cardEyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' }, cardTitle: { color: SitGuruColors.text, fontSize: 20, fontWeight: '900' }, cardText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 20 }, errorText: { color: SitGuruColors.danger, fontSize: 13, fontWeight: '800', lineHeight: 18 }, setupNotice: { backgroundColor: '#FFF8ED', borderColor: '#F8DEC8', borderRadius: 18, borderWidth: 1, gap: 4, padding: 14 }, setupTitle: { color: SitGuruColors.text, fontSize: 15, fontWeight: '900' }, setupText: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 18 }, buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primaryContinue: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 999, flexDirection: 'row', justifyContent: 'space-between', minHeight: 56, paddingHorizontal: 18 }, primaryContinueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' }, primaryArrow: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' }, sectionHeader: { gap: 6 }, sectionEyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' }, sectionTitle: { color: SitGuruColors.text, fontSize: 28, fontWeight: '900' }, roleGrid: { gap: 12 }, roleGridWide: { flexDirection: 'row' }, roleCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, elevation: 3, flex: 1, gap: 10, minWidth: 190, padding: 18 }, roleIcon: { fontSize: 34 }, roleTitle: { color: SitGuruColors.text, fontSize: 22, fontWeight: '900' }, roleDescription: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 20 }, roleAction: { color: SitGuruColors.primary, fontSize: 14, fontWeight: '900' }, openSearchPanel: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 28, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between', padding: 18 }, openSearchEyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }, openSearchTitle: { color: SitGuruColors.text, fontSize: 22, fontWeight: '900' }, openSearchText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 20 },
});
