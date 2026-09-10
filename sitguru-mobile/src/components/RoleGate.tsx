import { router, type Href } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BubblePressable from '@/components/BubblePressable';
import SitGuruBootScreen from '@/components/mobile/SitGuruBootScreen';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { WORKSPACES } from '@/constants/workspaces';
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
      <Text style={[styles.buttonText, button.primary && styles.primaryButtonText]}>
        {button.label}
      </Text>
    </BubblePressable>
  );
}

function AccessScreen({
  eyebrow,
  title,
  message,
  detail,
  buttons,
}: {
  eyebrow: string;
  title: string;
  message: string;
  detail?: string;
  buttons: GateButton[];
}) {
  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.screenBody}>
        <View style={styles.iconBadge}>
          <Text style={styles.icon}>🐾</Text>
        </View>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        <View style={styles.buttonStack}>
          {buttons.map((button) => (
            <GateActionButton key={button.label} button={button} />
          ))}
        </View>
        <BubblePressable
          accessibilityRole="button"
          onPress={() => router.push(WORKSPACES.admin.dashboardPath)}
          style={styles.adminLink}
        >
          <Text style={styles.adminLinkText}>SitGuru admin sign in</Text>
        </BubblePressable>
      </View>
    </SafeAreaView>
  );
}

export default function RoleGate({
  requiredRole,
  title,
  children,
  previewAllowed = false,
}: RoleGateProps) {
  const { loading, isAuthenticated, roles, canAccessRequiredRole, profileError } =
    useRoleAccess(requiredRole);
  const [accessTimedOut, setAccessTimedOut] = useState(false);
  const requiredLabel = roleLabel(requiredRole);
  const loadedRoleLabels = roles.length
    ? roles.map(roleLabel).join(', ')
    : 'No roles loaded yet';

  useEffect(() => {
    if (!loading) {
      setAccessTimedOut(false);
      return;
    }

    const timer = setTimeout(() => setAccessTimedOut(true), 5_000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !accessTimedOut) {
    return <SitGuruBootScreen label={title ?? 'Loading your SitGuru…'} />;
  }

  const guestButtons: GateButton[] = [
    { label: 'Log In', href: '/login', primary: true },
    { label: 'Create Account', href: '/signup' },
    { label: 'Find Care', href: '/find-care' },
  ];

  if (loading && accessTimedOut && !isAuthenticated) {
    return (
      <AccessScreen
        buttons={guestButtons}
        eyebrow="Taking longer than usual"
        message="SitGuru could not finish loading your session."
        title="Sign in to continue"
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <AccessScreen
        buttons={guestButtons}
        eyebrow="Account required"
        message="This dashboard uses your SitGuru account roles."
        title="Sign in to continue"
      />
    );
  }

  if (!canAccessRequiredRole) {
    if (previewAllowed) {
      return (
        <View style={styles.previewWrap}>
          <View style={styles.previewNotice}>
            <Text style={styles.previewTitle}>Preview mode</Text>
            <Text style={styles.previewText}>
              This is a {requiredLabel} preview. Your loaded roles are:{' '}
              {loadedRoleLabels}.
            </Text>
          </View>
          {children}
        </View>
      );
    }

    return (
      <AccessScreen
        buttons={[
          { label: 'Role Selection', href: '/role-selection', primary: true },
          { label: 'Account', href: '/account' },
          { label: 'Find Care', href: '/find-care' },
        ]}
        detail={
          profileError ??
          'Refresh your roles from Account, or choose an available dashboard from Role Selection.'
        }
        eyebrow="Role guard"
        message={`This screen is for ${requiredLabel}. Your loaded roles are: ${loadedRoleLabels}.`}
        title="Role access needed"
      />
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: SitGuruColors.background,
    flex: 1,
  },
  screenBody: {
    alignItems: 'stretch',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  iconBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 28,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  icon: { fontSize: 34 },
  eyebrow: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.extraBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  title: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: 30,
    letterSpacing: -0.7,
    lineHeight: 34,
    textAlign: 'center',
  },
  message: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.semiBold,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
  detail: {
    backgroundColor: '#FFF8ED',
    borderColor: '#F8DEC8',
    borderRadius: 16,
    borderWidth: 1,
    color: SitGuruColors.text,
    fontFamily: AppFonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    padding: 14,
    textAlign: 'center',
  },
  buttonStack: {
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  button: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  buttonText: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.extraBold,
    fontSize: 17,
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  adminLink: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: 8,
  },
  adminLinkText: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.bold,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  previewWrap: { gap: 14 },
  previewNotice: {
    backgroundColor: '#FFF8ED',
    borderColor: '#F8DEC8',
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  previewTitle: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: 15,
  },
  previewText: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.semiBold,
    fontSize: 13,
    lineHeight: 19,
  },
});
