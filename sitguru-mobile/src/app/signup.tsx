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

type StartOption = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
};

const startOptions: StartOption[] = [
  {
    id: 'pet-parent',
    eyebrow: 'Find Care',
    title: 'Pet Parent',
    description: 'Search local Gurus, add pet details, message, and request care.',
  },
  {
    id: 'guru',
    eyebrow: 'Offer Care',
    title: 'Pet Guru',
    description: 'Build your profile, choose services, and manage booking requests.',
  },
  {
    id: 'ambassador',
    eyebrow: 'Grow Community',
    title: 'Ambassador',
    description: 'Share SitGuru, invite others, complete training, and track rewards.',
  },
];

export default function SignupScreen() {
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
              <Text style={styles.heroBadgeText}>Free local signup</Text>
            </View>

            <Text style={styles.title}>Create your SitGuru account.</Text>

            <Text style={styles.subtitle}>
              Join SitGuru to find trusted local pet care, become a Pet Guru, or
              help grow the community as an Ambassador.
            </Text>

            <View style={styles.heroPhotoCard}>
              <View style={styles.heroPhotoPlaceholder}>
                <Text style={styles.heroPhotoIcon}>🐶</Text>
                <Text style={styles.heroPhotoTitle}>Welcome photo area</Text>
                <Text style={styles.heroPhotoText}>
                  Add a Pet Parent, Guru, pet, or community image here tomorrow.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.signupCard}>
            <View style={styles.signupHeader}>
              <Text style={styles.signupEyebrow}>Start here</Text>
              <Text style={styles.signupTitle}>Sign up in minutes.</Text>
            </View>

            <View style={styles.socialButtons}>
              <SitGuruButton label="Continue with Google" variant="secondary" />
              <SitGuruButton label="Continue with Apple" variant="secondary" />
            </View>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or use email</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.form}>
              <SitGuruTextField
                autoCapitalize="words"
                label="First name"
                placeholder="Jane"
                textContentType="givenName"
              />

              <SitGuruTextField
                autoCapitalize="none"
                keyboardType="email-address"
                label="Email address"
                placeholder="jane@example.com"
                textContentType="emailAddress"
              />

              <SitGuruTextField
                helperText="Use at least 8 characters."
                label="Password"
                placeholder="Create a password"
                secureTextEntry
                textContentType="newPassword"
              />
            </View>

            <View style={styles.ctaBlock}>
              <SitGuruButton
                label="Continue"
                onPress={() => router.push('/role-selection')}
              />

              <Text style={styles.ctaNote}>
                Next, choose whether you are here as a Pet Parent, Pet Guru,
                Ambassador, or more than one.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>Choose your path</Text>
          <Text style={styles.sectionTitle}>Start with what you need today.</Text>
        </View>

        <View style={[styles.optionGrid, isWide && styles.optionGridWide]}>
          {startOptions.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              onPress={() => router.push('/role-selection')}
              style={styles.optionCard}
            >
              <View style={styles.optionPhotoSlot}>
                <Text style={styles.optionPhotoIcon}>＋</Text>
                <Text style={styles.optionPhotoText}>Photo</Text>
              </View>

              <View style={styles.optionCopy}>
                <Text style={styles.optionEyebrow}>{option.eyebrow}</Text>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
                <Text style={styles.optionLink}>Choose role →</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.trustPanel}>
          <Text style={styles.trustEyebrow}>Trusted pet care. Made simple.</Text>

          <Text style={styles.trustTitle}>
            One account for care, bookings, messages, referrals, and growth.
          </Text>

          <View style={styles.trustList}>
            <View style={styles.trustItem}>
              <Text style={styles.trustCheck}>✓</Text>
              <Text style={styles.trustText}>Search trusted local Gurus</Text>
            </View>

            <View style={styles.trustItem}>
              <Text style={styles.trustCheck}>✓</Text>
              <Text style={styles.trustText}>Keep pet details organized</Text>
            </View>

            <View style={styles.trustItem}>
              <Text style={styles.trustCheck}>✓</Text>
              <Text style={styles.trustText}>Message before booking</Text>
            </View>

            <View style={styles.trustItem}>
              <Text style={styles.trustCheck}>✓</Text>
              <Text style={styles.trustText}>Switch roles when available</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Link href="/login" style={styles.footerLink}>
            Log in
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
  heroPhotoCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 28,
    borderWidth: 1,
    minHeight: 210,
    overflow: 'hidden',
  },
  heroPhotoPlaceholder: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    padding: 22,
  },
  heroPhotoIcon: {
    fontSize: 44,
  },
  heroPhotoTitle: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroPhotoText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    maxWidth: 260,
    textAlign: 'center',
  },
  signupCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 30,
    borderWidth: 1,
    flex: 1,
    gap: 16,
    padding: 18,
  },
  signupHeader: {
    gap: 5,
  },
  signupEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  signupTitle: {
    color: SitGuruColors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 31,
  },
  socialButtons: {
    gap: 10,
  },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  line: {
    backgroundColor: SitGuruColors.border,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: SitGuruColors.textSoft,
    fontSize: 13,
    fontWeight: '800',
  },
  form: {
    gap: 12,
  },
  ctaBlock: {
    gap: 10,
  },
  ctaNote: {
    color: SitGuruColors.textSoft,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
  },
  sectionHeader: {
    gap: 6,
    paddingHorizontal: 2,
  },
  sectionEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: SitGuruColors.text,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.7,
    lineHeight: 34,
  },
  optionGrid: {
    gap: 12,
  },
  optionGridWide: {
    flexDirection: 'row',
  },
  optionCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    flex: 1,
    gap: 12,
    overflow: 'hidden',
    padding: 12,
  },
  optionPhotoSlot: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderRadius: 24,
    gap: 6,
    height: 150,
    justifyContent: 'center',
    padding: 16,
  },
  optionPhotoIcon: {
    color: SitGuruColors.primary,
    fontSize: 26,
    fontWeight: '900',
  },
  optionPhotoText: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  optionCopy: {
    gap: 9,
    padding: 6,
  },
  optionEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  optionTitle: {
    color: SitGuruColors.text,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  optionDescription: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  optionLink: {
    color: SitGuruColors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  trustPanel: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 32,
    gap: 14,
    padding: 20,
  },
  trustEyebrow: {
    color: '#DCEFE2',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  trustTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  trustList: {
    gap: 10,
  },
  trustItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 13,
  },
  trustCheck: {
    color: '#C9F26D',
    fontSize: 16,
    fontWeight: '900',
  },
  trustText: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  footerText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  footerLink: {
    color: SitGuruColors.primary,
    fontWeight: '900',
  },
});