import { router, type Href } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import { SitGuruColors } from '@/constants/colors';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { roleLabel, type AppRole } from '@/types/auth';

type RoleGateProps = {
  requiredRole: AppRole;
  title?: string;
  children: ReactNode;
  previewAllowed?: boolean;
};

type GateButton = { label: string; href: Href; primary?: boolean };

function GateActionButton({ button }: { button: GateButton }) {
  return (
    <BubblePressable
      accessibilityRole="button"
      onPress={() => router.push(button.href)}
      style={[styles.button, button.primary && styles.primaryButton]}
    >
      <Text style={[styles.buttonText, button.primary && styles.primaryButtonText]}>{button.label}</Text>
    </BubblePressable>
  );
}

function AccessCard({ eyebrow, title, message, detail, buttons }: { eyebrow: string; title: string; message: string; detail?: string; buttons: GateButton[] }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconBadge}><Text style={styles.icon}>🐾</Text></View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      <View style={styles.buttonRow}>{buttons.map((button) => <GateActionButton key={button.label} button={button} />)}</View>
    </View>
  );
}

export default function RoleGate({ requiredRole, title, children, previewAllowed = false }: RoleGateProps) {
  const { loading, isAuthenticated, roles, canAccessRequiredRole, profileError } = useRoleAccess(requiredRole);
  const [accessTimedOut, setAccessTimedOut] = useState(false);
  const requiredLabel = roleLabel(requiredRole);
  const loadedRoleLabels = roles.length ? roles.map(roleLabel).join(', ') : 'No roles loaded yet';

  useEffect(() => {
    if (!loading) {
      setAccessTimedOut(false);
      return;
    }

    const timer = setTimeout(() => setAccessTimedOut(true), 5_000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !accessTimedOut) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color="#FFFFFF" size="large" />
        <Text style={styles.bootLabel}>{title ?? 'Loading your SitGuru…'}</Text>
      </View>
    );
  }

  if (loading && accessTimedOut && !isAuthenticated) {
    return <AccessCard eyebrow="Taking longer than usual" title="Sign in to continue" message="SitGuru could not finish loading your session." buttons={[{ label: 'Log In', href: '/login', primary: true }, { label: 'Create Account', href: '/signup' }, { label: 'Find Care', href: '/find-care' }]} />;
  }

  if (!isAuthenticated) {
    return <AccessCard eyebrow="Account required" title="Sign in to continue" message="This dashboard uses your SitGuru account roles." buttons={[{ label: 'Log In', href: '/login', primary: true }, { label: 'Create Account', href: '/signup' }, { label: 'Find Care', href: '/find-care' }]} />;
  }

  if (!canAccessRequiredRole) {
    if (previewAllowed) {
      return (
        <View style={styles.previewWrap}>
          <View style={styles.previewNotice}>
            <Text style={styles.previewTitle}>Preview mode</Text>
            <Text style={styles.previewText}>This is a {requiredLabel} preview. Your loaded roles are: {loadedRoleLabels}.</Text>
          </View>
          {children}
        </View>
      );
    }

    return <AccessCard eyebrow="Role guard" title="Role access needed" message={`This screen is for ${requiredLabel}. Your loaded roles are: ${loadedRoleLabels}.`} detail={profileError ?? 'Refresh your roles from Account, or choose an available dashboard from Role Selection.'} buttons={[{ label: 'Role Selection', href: '/role-selection', primary: true }, { label: 'Account', href: '/account' }, { label: 'Find Care', href: '/find-care' }]} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  boot: {
    alignItems: 'center',
    backgroundColor: '#0D5C3A',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  bootLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 30, borderWidth: 1, elevation: 3, gap: 12, padding: 22 },
  iconBadge: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 24, borderWidth: 1, height: 64, justifyContent: 'center', width: 64 },
  icon: { fontSize: 30 },
  eyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: SitGuruColors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.7, textAlign: 'center' },
  message: { color: SitGuruColors.textMuted, fontSize: 16, fontWeight: '800', lineHeight: 23, textAlign: 'center' },
  detail: { backgroundColor: '#FFF8ED', borderColor: '#F8DEC8', borderRadius: 18, borderWidth: 1, color: SitGuruColors.text, fontSize: 14, fontWeight: '800', lineHeight: 20, padding: 14, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', width: '100%' },
  button: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 999, borderWidth: 1, flexGrow: 1, justifyContent: 'center', minHeight: 50, minWidth: 130, paddingHorizontal: 16 },
  primaryButton: { backgroundColor: SitGuruColors.primary, borderColor: SitGuruColors.primary },
  buttonText: { color: SitGuruColors.primary, fontSize: 14, fontWeight: '900' },
  primaryButtonText: { color: '#FFFFFF' },
  previewWrap: { gap: 14 },
  previewNotice: { backgroundColor: '#FFF8ED', borderColor: '#F8DEC8', borderRadius: 20, borderWidth: 1, gap: 4, padding: 14 },
  previewTitle: { color: SitGuruColors.text, fontSize: 15, fontWeight: '900' },
  previewText: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '800', lineHeight: 19 },
});
