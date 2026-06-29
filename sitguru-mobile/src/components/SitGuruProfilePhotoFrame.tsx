import { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { SitGuruColors } from '@/constants/colors';
import { resolveSupabaseStorageUrl } from '@/lib/storage';

export type SitGuruProfilePhotoFrameProps = {
  imageUrl?: string | null;
  name?: string | null;
  email?: string | null;
  roleLabel?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  shape?: 'circle' | 'squircle' | 'portrait' | 'square';
  fallbackEmoji?: string;
  helperLabel?: string;
};

function initialsFromValue(value?: string | null) {
  const cleaned = value?.trim();
  if (!cleaned) return '';
  const base = cleaned.includes('@') ? cleaned.split('@')[0] : cleaned;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

function dimensions(size: NonNullable<SitGuruProfilePhotoFrameProps['size']>, shape: NonNullable<SitGuruProfilePhotoFrameProps['shape']>) {
  const base = size === 'sm' ? 54 : size === 'md' ? 78 : size === 'lg' ? 116 : 244;
  if (shape === 'portrait') return { width: size === 'hero' ? 260 : Math.round(base * 0.82), height: size === 'hero' ? 332 : Math.round(base * 1.18) };
  return { width: base, height: base };
}

export default function SitGuruProfilePhotoFrame({ imageUrl, name, email, roleLabel, size = 'md', shape = 'squircle', fallbackEmoji, helperLabel }: SitGuruProfilePhotoFrameProps) {
  const [failed, setFailed] = useState(false);
  const resolvedUrl = useMemo(() => resolveSupabaseStorageUrl(imageUrl), [imageUrl]);
  const initials = useMemo(() => initialsFromValue(name) || initialsFromValue(email) || 'SG', [email, name]);
  const dim = dimensions(size, shape);
  const radius = shape === 'circle' ? dim.width / 2 : shape === 'portrait' ? 30 : shape === 'square' ? 22 : Math.max(18, dim.width * 0.3);
  const showImage = Boolean(resolvedUrl) && !failed;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.frame, { borderRadius: radius, height: dim.height, width: dim.width }]}>
        {showImage ? (
          <Image accessibilityIgnoresInvertColors accessibilityLabel={name ? `${name} profile photo` : 'Profile photo'} onError={() => setFailed(true)} resizeMode="cover" source={{ uri: resolvedUrl }} style={styles.image} />
        ) : (
          <View style={styles.fallback}>
            {fallbackEmoji ? <Text style={[styles.emoji, { fontSize: Math.max(20, dim.width * 0.28) }]}>{fallbackEmoji}</Text> : null}
            <Text style={[styles.initials, { fontSize: Math.max(14, dim.width * (shape === 'portrait' ? 0.18 : 0.24)) }]}>{initials}</Text>
          </View>
        )}
      </View>
      {roleLabel ? <Text style={styles.roleLabel}>{roleLabel}</Text> : null}
      {helperLabel ? <Text style={styles.helperLabel}>{helperLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 7 },
  frame: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderColor: '#FFFFFF', borderWidth: 4, elevation: 4, justifyContent: 'center', overflow: 'hidden', shadowColor: '#102417', shadowOpacity: 0.13, shadowRadius: 18 },
  image: { height: '100%', width: '100%' },
  fallback: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, height: '100%', justifyContent: 'center', width: '100%' },
  emoji: { marginBottom: 4 },
  initials: { color: SitGuruColors.primaryDark, fontWeight: '900', letterSpacing: 0.4 },
  roleLabel: { backgroundColor: SitGuruColors.primary, borderRadius: 999, color: '#FFFFFF', fontSize: 10, fontWeight: '900', marginTop: -18, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, textTransform: 'uppercase' },
  helperLabel: { color: SitGuruColors.textSoft, fontSize: 11, fontWeight: '900', textAlign: 'center' },
});
