import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import SitGuruButton from '@/components/SitGuruButton';
import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruTextField from '@/components/SitGuruTextField';
import { SitGuruColors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';

type StartOption = { id: string; eyebrow: string; title: string; description: string };

const startOptions: StartOption[] = [
  { id: 'pet-parent', eyebrow: 'Find Care', title: 'Pet Parent', description: 'Search local Gurus, add pet details, message, and request care.' },
  { id: 'guru', eyebrow: 'Offer Care', title: 'Pet Guru', description: 'Build your profile, choose services, and manage booking requests.' },
  { id: 'ambassador', eyebrow: 'Grow Community', title: 'Ambassador', description: 'Share SitGuru, invite others, complete training, and track rewards.' },
  { id: 'multiple', eyebrow: 'More than one', title: 'Multiple roles', description: 'Use one account for multiple SitGuru paths as features roll out.' },
];
const configMessage = 'Supabase is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.';

export default function SignupScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const { signUp, loading, isConfigured, authError } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupIntent, setSignupIntent] = useState('pet-parent');
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSignup() {
    setSuccess(null);
    if (!firstName.trim() || !email.trim() || password.length < 8) {
      setMessage('Add your first name, email, and a password with at least 8 characters.');
      return;
    }

    const result = await signUp(email, password, { first_name: firstName, signup_intent: signupIntent });
    if (result.error) {
      setMessage(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setMessage(null);
      setSuccess('Check your email to confirm your account, then log in.');
      return;
    }

    router.replace('/role-selection');
  }

  function showSocialPlaceholder(provider: string) {
    Alert.alert('Visual preview', `${provider} signup will be connected after email auth is validated.`);
  }

  return (
    <SitGuruScreen scroll center={false} maxWidth={820}>
      <View style={styles.page}>
        <View style={styles.topBar}><SitGuruLogo size="small" variant="symbol" /><Link href="/" style={styles.backLink}>Home</Link></View>
        <View style={[styles.heroPanel, isWide && styles.heroPanelWide]}>
          <View style={styles.heroCopy}>
            <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>Free local signup</Text></View>
            <Text style={styles.title}>Create your SitGuru account.</Text>
            <Text style={styles.subtitle}>Join SitGuru to find trusted local pet care, become a Pet Guru, or help grow the community as an Ambassador.</Text>
            <View style={styles.heroPhotoCard}><Text style={styles.heroPhotoIcon}>🐶</Text><Text style={styles.heroPhotoTitle}>Welcome to SitGuru</Text><Text style={styles.heroPhotoText}>One light, friendly account experience for local pet care.</Text></View>
          </View>
          <View style={styles.signupCard}>
            <Text style={styles.signupEyebrow}>Create account</Text><Text style={styles.signupTitle}>Sign up in minutes.</Text>
            {!isConfigured ? <View style={styles.configCard}><Text style={styles.configText}>{configMessage}</Text></View> : null}
            {message || authError ? <Text style={styles.errorText}>{message ?? authError}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}
            <View style={styles.socialButtons}><SitGuruButton label="Continue with Google" variant="secondary" onPress={() => showSocialPlaceholder('Google')} /><SitGuruButton label="Continue with Apple" variant="secondary" onPress={() => showSocialPlaceholder('Apple')} /></View>
            <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>or use email</Text><View style={styles.line} /></View>
            <View style={styles.form}>
              <SitGuruTextField autoCapitalize="words" label="First name" onChangeText={setFirstName} placeholder="Jane" textContentType="givenName" value={firstName} />
              <SitGuruTextField autoCapitalize="none" autoCorrect={false} keyboardType="email-address" label="Email address" onChangeText={setEmail} placeholder="jane@example.com" textContentType="emailAddress" value={email} />
              <SitGuruTextField helperText="Use at least 8 characters." label="Password" onChangeText={setPassword} placeholder="Create a password" secureTextEntry textContentType="newPassword" value={password} />
            </View>
            <View style={styles.intentGrid}>{startOptions.map((option) => <Pressable key={option.id} accessibilityRole="button" onPress={() => setSignupIntent(option.id)} style={[styles.intentPill, signupIntent === option.id && styles.intentPillActive]}><Text style={[styles.intentPillText, signupIntent === option.id && styles.intentPillTextActive]}>{option.title}</Text></Pressable>)}</View>
            <SitGuruButton disabled={loading || !isConfigured} label={loading ? 'Creating account…' : 'Create account'} onPress={handleSignup} />
            <Text style={styles.ctaNote}>Next, choose whether you are here as a Pet Parent, Pet Guru, Ambassador, or more than one.</Text>
            <Link href="/auth-readiness" style={styles.authPreviewLink}>Auth readiness preview</Link>
          </View>
        </View>
        <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>Choose your path</Text><Text style={styles.sectionTitle}>Start with what you need today.</Text></View>
        <View style={[styles.optionGrid, isWide && styles.optionGridWide]}>{startOptions.map((option) => <Pressable key={option.id} accessibilityRole="button" onPress={() => setSignupIntent(option.id)} style={styles.optionCard}><Text style={styles.optionEyebrow}>{option.eyebrow}</Text><Text style={styles.optionTitle}>{option.title}</Text><Text style={styles.optionDescription}>{option.description}</Text></Pressable>)}</View>
        <Text style={styles.footerText}>Already have an account? <Link href="/login" style={styles.footerLink}>Log in</Link></Text>
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18, paddingVertical: 4 }, topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, backLink: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, color: SitGuruColors.primary, fontSize: 13, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 9, textTransform: 'uppercase' },
  heroPanel: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 34, borderWidth: 1, elevation: 4, gap: 18, overflow: 'hidden', padding: 18 }, heroPanelWide: { flexDirection: 'row' }, heroCopy: { flex: 1, gap: 16, justifyContent: 'center', padding: 4 }, heroBadge: { alignSelf: 'flex-start', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 }, heroBadgeText: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' }, title: { color: SitGuruColors.text, fontSize: 42, fontWeight: '900', letterSpacing: -1.1, lineHeight: 45 }, subtitle: { color: SitGuruColors.textMuted, fontSize: 17, fontWeight: '700', lineHeight: 25 },
  heroPhotoCard: { alignItems: 'center', backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 8, minHeight: 230, justifyContent: 'center', padding: 22 }, heroPhotoIcon: { fontSize: 44 }, heroPhotoTitle: { color: SitGuruColors.text, fontSize: 18, fontWeight: '900' }, heroPhotoText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  signupCard: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, flex: 1, gap: 14, minWidth: 280, padding: 18 }, signupEyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' }, signupTitle: { color: SitGuruColors.text, fontSize: 26, fontWeight: '900' }, socialButtons: { gap: 10 }, divider: { alignItems: 'center', flexDirection: 'row', gap: 10 }, line: { backgroundColor: SitGuruColors.border, flex: 1, height: 1 }, dividerText: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }, form: { gap: 12 },
  configCard: { backgroundColor: '#FFF8ED', borderColor: '#F8DEC8', borderRadius: 18, borderWidth: 1, padding: 14 }, configText: { color: SitGuruColors.text, fontSize: 14, fontWeight: '800', lineHeight: 20 }, errorText: { color: SitGuruColors.danger, fontSize: 13, fontWeight: '800', lineHeight: 18 }, successText: { color: SitGuruColors.primary, fontSize: 14, fontWeight: '900', lineHeight: 20 }, intentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, intentPill: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 }, intentPillActive: { backgroundColor: SitGuruColors.primary }, intentPillText: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900' }, intentPillTextActive: { color: '#FFFFFF' }, ctaNote: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 18, textAlign: 'center' }, authPreviewLink: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  sectionHeader: { gap: 5 }, sectionEyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }, sectionTitle: { color: SitGuruColors.text, fontSize: 26, fontWeight: '900' }, optionGrid: { gap: 12 }, optionGridWide: { flexDirection: 'row', flexWrap: 'wrap' }, optionCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 24, borderWidth: 1, flex: 1, gap: 8, minWidth: 180, padding: 16 }, optionEyebrow: { color: SitGuruColors.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }, optionTitle: { color: SitGuruColors.text, fontSize: 18, fontWeight: '900' }, optionDescription: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 18 }, footerText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', textAlign: 'center' }, footerLink: { color: SitGuruColors.primary, fontWeight: '900' },
});
