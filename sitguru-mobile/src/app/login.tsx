import { Link, router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import SitGuruButton from '@/components/SitGuruButton';
import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruTextField from '@/components/SitGuruTextField';
import { SitGuruColors } from '@/constants/colors';

const accessItems = [
  'Messages',
  'Bookings',
  'Pet details',
  'Guru tools',
  'Ambassador referrals',
];

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  return (
    <SitGuruScreen scroll center={false} maxWidth={820}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <SitGuruLogo size="small" variant="symbol" />

          <Link href="/" style={styles.backLink}>
            Home
          </Link>
        </View>

        <View style={[styles.heroPanel, isWide && styles.heroPanelWide]}>
          <View style={styles.heroCopy}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Welcome back</Text>
            </View>

            <Text style={styles.title}>Log in to SitGuru.</Text>

            <Text style={styles.subtitle}>
              Continue to your Pet Parent, Pet Guru, or Ambassador dashboard.
            </Text>

            <View style={styles.photoCard}>
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoIcon}>🐾</Text>
                <Text style={styles.photoTitle}>Welcome back photo area</Text>
                <Text style={styles.photoText}>
                  Add a warm pet care, Guru, or Pet Parent photo here tomorrow.
                </Text>
              </View>

              <View style={styles.photoOverlay}>
                <Text style={styles.photoOverlayTitle}>One account</Text>
                <Text style={styles.photoOverlayText}>
                  Access your registered SitGuru dashboards.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.loginCard}>
            <View style={styles.loginHeader}>
              <Text style={styles.loginEyebrow}>Sign in</Text>
              <Text style={styles.loginTitle}>Access your account.</Text>
            </View>

            <View style={styles.form}>
              <SitGuruTextField
                autoCapitalize="none"
                keyboardType="email-address"
                label="Email address"
                placeholder="jane@example.com"
                textContentType="emailAddress"
              />

              <SitGuruTextField
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                textContentType="password"
              />
            </View>

            <SitGuruButton
              label="Log In"
              onPress={() => router.push('/role-selection')}
            />

            <View style={styles.loginLinks}>
              <Pressable accessibilityRole="button">
                <Text style={styles.smallLink}>Forgot password?</Text>
              </Pressable>

              <Link href="/signup" style={styles.smallLink}>
                Create account
              </Link>

              <Link href="/auth-readiness" style={styles.smallLink}>
                Auth readiness preview
              </Link>
            </View>
          </View>
        </View>

        <View style={styles.accessPanel}>
          <Text style={styles.accessEyebrow}>Pick up where you left off</Text>
          <Text style={styles.accessTitle}>Everything stays organized.</Text>

          <View style={styles.accessGrid}>
            {accessItems.map((item) => (
              <View key={item} style={styles.accessPill}>
                <Text style={styles.accessPillText}>✓ {item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.localPanel}>
          <Text style={styles.localTitle}>
            Trusted pet care, messages, and bookings in one place.
          </Text>

          <Text style={styles.localText}>
            Log in to manage care requests, continue conversations, view your
            dashboard, and keep your SitGuru activity easy to follow.
          </Text>

          <View style={[styles.localActions, isWide && styles.localActionsWide]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/signup')}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/')}
              style={styles.outlineButton}
            >
              <Text style={styles.outlineButtonText}>Back Home</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.footerText}>
          New to SitGuru?{' '}
          <Link href="/signup" style={styles.footerLink}>
            Create an account
          </Link>
        </Text>
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 18,
    paddingVertical: 4,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backLink: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 9,
    textTransform: 'uppercase',
  },
  heroPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 34,
    borderWidth: 1,
    elevation: 4,
    gap: 18,
    overflow: 'hidden',
    padding: 18,
  },
  heroPanelWide: {
    flexDirection: 'row',
  },
  heroCopy: {
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 4,
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
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.1,
    lineHeight: 45,
  },
  subtitle: {
    color: SitGuruColors.textMuted,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 25,
  },
  photoCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 28,
    borderWidth: 1,
    minHeight: 230,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPlaceholder: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    padding: 22,
  },
  photoIcon: {
    fontSize: 44,
  },
  photoTitle: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  photoText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    maxWidth: 260,
    textAlign: 'center',
  },
  photoOverlay: {
    backgroundColor: 'rgba(16, 21, 19, 0.32)',
    borderRadius: 22,
    bottom: 14,
    left: 14,
    padding: 14,
    position: 'absolute',
    right: 14,
  },
  photoOverlayTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  photoOverlayText: {
    color: '#E8F4EC',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 3,
  },
  loginCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 30,
    borderWidth: 1,
    flex: 1,
    gap: 16,
    padding: 18,
  },
  loginHeader: {
    gap: 5,
  },
  loginEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  loginTitle: {
    color: SitGuruColors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 31,
  },
  form: {
    gap: 12,
  },
  loginLinks: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallLink: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  accessPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 13,
    padding: 18,
  },
  accessEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  accessTitle: {
    color: SitGuruColors.text,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  accessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  accessPill: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  accessPillText: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  localPanel: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 32,
    gap: 14,
    padding: 20,
  },
  localTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  localText: {
    color: '#DCEFE2',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  localActions: {
    gap: 12,
    marginTop: 2,
  },
  localActionsWide: {
    flexDirection: 'row',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: SitGuruColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  outlineButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  outlineButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  footerText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  footerLink: {
    color: SitGuruColors.primary,
    fontWeight: '900',
  },
});