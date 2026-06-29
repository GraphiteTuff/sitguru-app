import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import SitGuruButton from '@/components/SitGuruButton';
import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruTextField from '@/components/SitGuruTextField';
import { SitGuruColors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';

const accessItems = ['Messages', 'Bookings', 'Pet details', 'Guru tools', 'Ambassador referrals'];
const configMessage = 'Supabase is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.';

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const { signIn, loading, isConfigured, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setMessage('Enter your email and password to log in.');
      return;
    }

    const result = await signIn(email, password);
    if (result.error) {
      setMessage(result.error);
      return;
    }

    router.replace('/role-selection');
  }

  function showSocialPlaceholder(provider: string) {
    Alert.alert('Visual preview', `${provider} login will be connected after email auth is validated.`);
  }

  return (
    <SitGuruScreen scroll center={false} maxWidth={820}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <SitGuruLogo size="small" variant="symbol" />
          <Link href="/" style={styles.backLink}>Home</Link>
        </View>

        <View style={[styles.heroPanel, isWide && styles.heroPanelWide]}>
          <View style={styles.heroCopy}>
            <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>Welcome back</Text></View>
            <Text style={styles.title}>Secure sign-in to SitGuru.</Text>
            <Text style={styles.subtitle}>Continue to your Pet Parent, Pet Guru, or Ambassador dashboard.</Text>
            <View style={styles.photoCard}>
              <Text style={styles.photoIcon}>🐾</Text>
              <Text style={styles.photoTitle}>One account</Text>
              <Text style={styles.photoText}>Access your registered SitGuru dashboards.</Text>
            </View>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.loginEyebrow}>Login</Text>
            <Text style={styles.loginTitle}>Access your account.</Text>

            {!isConfigured ? <View style={styles.configCard}><Text style={styles.configText}>{configMessage}</Text></View> : null}
            {message || authError ? <Text style={styles.errorText}>{message ?? authError}</Text> : null}

            <View style={styles.socialButtons}>
              <SitGuruButton label="Continue with Google" variant="secondary" onPress={() => showSocialPlaceholder('Google')} />
              <SitGuruButton label="Continue with Apple" variant="secondary" onPress={() => showSocialPlaceholder('Apple')} />
            </View>

            <View style={styles.form}>
              <SitGuruTextField autoCapitalize="none" autoCorrect={false} keyboardType="email-address" label="Email address" onChangeText={setEmail} placeholder="jane@example.com" textContentType="emailAddress" value={email} />
              <SitGuruTextField label="Password" onChangeText={setPassword} placeholder="Enter your password" secureTextEntry textContentType="password" value={password} />
            </View>

            <SitGuruButton disabled={loading || !isConfigured} label={loading ? 'Logging in…' : 'Log In'} onPress={handleLogin} />

            <View style={styles.loginLinks}>
              <Pressable accessibilityRole="button" onPress={() => Alert.alert('Coming soon', 'Password reset will be connected in a later auth update.')}><Text style={styles.smallLink}>Forgot password?</Text></Pressable>
              <Link href="/signup" style={styles.smallLink}>Create account</Link>
              <Link href="/auth-readiness" style={styles.smallLink}>Auth readiness preview</Link>
            </View>
          </View>
        </View>

        <View style={styles.accessPanel}>
          <Text style={styles.accessEyebrow}>Pick up where you left off</Text>
          <Text style={styles.accessTitle}>Everything stays organized.</Text>
          <View style={styles.accessGrid}>{accessItems.map((item) => <View key={item} style={styles.accessPill}><Text style={styles.accessPillText}>✓ {item}</Text></View>)}</View>
        </View>

        <Text style={styles.footerText}>New to SitGuru? <Link href="/signup" style={styles.footerLink}>Create an account</Link></Text>
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18, paddingVertical: 4 }, topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  backLink: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, color: SitGuruColors.primary, fontSize: 13, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 9, textTransform: 'uppercase' },
  heroPanel: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 34, borderWidth: 1, elevation: 4, gap: 18, overflow: 'hidden', padding: 18 }, heroPanelWide: { flexDirection: 'row' }, heroCopy: { flex: 1, gap: 16, justifyContent: 'center', padding: 4 },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 }, heroBadgeText: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { color: SitGuruColors.text, fontSize: 42, fontWeight: '900', letterSpacing: -1.1, lineHeight: 45 }, subtitle: { color: SitGuruColors.textMuted, fontSize: 17, fontWeight: '700', lineHeight: 25 },
  photoCard: { alignItems: 'center', backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 8, minHeight: 230, justifyContent: 'center', padding: 22 }, photoIcon: { fontSize: 44 }, photoTitle: { color: SitGuruColors.text, fontSize: 18, fontWeight: '900' }, photoText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  loginCard: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, flex: 1, gap: 14, minWidth: 280, padding: 18 }, loginEyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' }, loginTitle: { color: SitGuruColors.text, fontSize: 26, fontWeight: '900' },
  socialButtons: { gap: 10 }, form: { gap: 12 }, configCard: { backgroundColor: '#FFF8ED', borderColor: '#F8DEC8', borderRadius: 18, borderWidth: 1, padding: 14 }, configText: { color: SitGuruColors.text, fontSize: 14, fontWeight: '800', lineHeight: 20 }, errorText: { color: SitGuruColors.danger, fontSize: 13, fontWeight: '800', lineHeight: 18 },
  loginLinks: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }, smallLink: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900' },
  accessPanel: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 12, padding: 18 }, accessEyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }, accessTitle: { color: SitGuruColors.text, fontSize: 24, fontWeight: '900' }, accessGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, accessPill: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }, accessPillText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900' },
  footerText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', textAlign: 'center' }, footerLink: { color: SitGuruColors.primary, fontWeight: '900' },
});
