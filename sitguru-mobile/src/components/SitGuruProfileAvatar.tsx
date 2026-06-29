import { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { SitGuruColors } from '@/constants/colors';

type SitGuruProfileAvatarProps = {
  avatarUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
  size?: number;
  label?: string;
  role?: string;
};

function initialsFromValue(value?: string | null) {
  const cleaned = value?.trim();
  if (!cleaned) return null;
  const emailName = cleaned.includes('@') ? cleaned.split('@')[0] : cleaned;
  const parts = emailName.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return emailName.slice(0, 2).toUpperCase();
}

export default function SitGuruProfileAvatar({ avatarUrl, email, fullName, label, role, size = 72 }: SitGuruProfileAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const safeAvatarUrl = avatarUrl?.trim();
  const initials = useMemo(() => initialsFromValue(fullName) ?? initialsFromValue(email) ?? 'SG', [email, fullName]);
  const showImage = Boolean(safeAvatarUrl) && !imageFailed;
  const radius = Math.max(18, size * 0.34);

  return (
    <View style={styles.wrap}>
      <View style={[styles.avatar, { borderRadius: radius, height: size, width: size }]}>
        {showImage ? (
          <Image
            accessibilityIgnoresInvertColors
            onError={() => setImageFailed(true)}
            source={{ uri: safeAvatarUrl }}
            style={[styles.image, { borderRadius: radius, height: size, width: size }]}
          />
        ) : (
          <Text style={[styles.initials, { fontSize: Math.max(16, size * 0.34) }]}>{initials}</Text>
        )}
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {role ? <Text style={styles.roleBadge}>{role}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  avatar: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderWidth: 1, justifyContent: 'center', overflow: 'hidden' },
  image: { backgroundColor: SitGuruColors.surfaceSoft },
  initials: { color: SitGuruColors.primary, fontWeight: '900', letterSpacing: 0.5 },
  label: { color: SitGuruColors.textMuted, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  roleBadge: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 999, borderWidth: 1, color: SitGuruColors.primary, fontSize: 10, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, textTransform: 'uppercase' },
});
