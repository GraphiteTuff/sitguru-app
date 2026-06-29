import { Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruProfilePhotoFrame from '@/components/SitGuruProfilePhotoFrame';
import { SitGuruColors } from '@/constants/colors';

type Props = {
  title: string;
  subtitle?: string | null;
  profileName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  roleLabel?: string | null;
  roleLabels?: string[];
  statusLabel?: string | null;
  showEmail?: boolean;
  primaryActionLabel?: string | null;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string | null;
  onSecondaryAction?: () => void;
  tone?: 'petParent' | 'guru' | 'ambassador' | 'admin' | 'neutral';
};

const toneEmoji = { petParent: '🐾', guru: '🏡', ambassador: '🌟', admin: '🛡️', neutral: '✨' };

export default function SitGuruRoleIdentityCard({ title, subtitle, profileName, email, avatarUrl, roleLabel, roleLabels, statusLabel, showEmail = false, primaryActionLabel, onPrimaryAction, secondaryActionLabel, onSecondaryAction, tone = 'neutral' }: Props) {
  const name = profileName?.trim() || email?.split('@')[0] || 'SitGuru member';
  const badges = roleLabels?.length ? roleLabels : roleLabel ? [roleLabel] : [];
  return (
    <View style={[styles.card, tone !== 'neutral' && styles.tintedCard]}>
      <SitGuruProfilePhotoFrame email={email} fallbackEmoji={toneEmoji[tone]} imageUrl={avatarUrl} name={name} roleLabel={roleLabel} shape="squircle" size="lg" />
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{title}</Text>
        <Text style={styles.name}>{name}</Text>
        {showEmail && email ? <Text style={styles.email}>{email}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.badgeRow}>
          {badges.map((badge) => <Text key={badge} style={styles.badge}>{badge}</Text>)}
          {statusLabel ? <Text style={[styles.badge, styles.statusBadge]}>{statusLabel}</Text> : null}
        </View>
        <View style={styles.actions}>
          {primaryActionLabel && onPrimaryAction ? <Pressable accessibilityRole="button" onPress={onPrimaryAction} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{primaryActionLabel}</Text></Pressable> : null}
          {secondaryActionLabel && onSecondaryAction ? <Pressable accessibilityRole="button" onPress={onSecondaryAction} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{secondaryActionLabel}</Text></Pressable> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 30, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 16, padding: 18, shadowColor: '#102417', shadowOpacity: 0.08, shadowRadius: 20 },
  tintedCard: { backgroundColor: '#FBFFFC' },
  copy: { flex: 1, gap: 7, minWidth: 220 },
  eyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  name: { color: SitGuruColors.text, fontSize: 26, fontWeight: '900', lineHeight: 30 },
  email: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '800' },
  subtitle: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  badge: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 999, borderWidth: 1, color: SitGuruColors.primaryDark, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 },
  statusBadge: { backgroundColor: '#FFFFFF', color: SitGuruColors.primary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  primaryButton: { backgroundColor: SitGuruColors.primary, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  secondaryButton: { backgroundColor: '#FFFFFF', borderColor: SitGuruColors.primary, borderRadius: 999, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  secondaryButtonText: { color: SitGuruColors.primary, fontSize: 14, fontWeight: '900' },
});
