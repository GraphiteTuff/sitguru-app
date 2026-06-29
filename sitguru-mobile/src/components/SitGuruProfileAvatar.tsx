import { Text, View, StyleSheet } from 'react-native';

import SitGuruProfilePhotoFrame from '@/components/SitGuruProfilePhotoFrame';
import { SitGuruColors } from '@/constants/colors';

type SitGuruProfileAvatarProps = {
  avatarUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
  size?: number;
  label?: string;
  role?: string;
};

function frameSize(size: number): 'sm' | 'md' | 'lg' | 'hero' {
  if (size <= 60) return 'sm';
  if (size <= 92) return 'md';
  if (size <= 150) return 'lg';
  return 'hero';
}

export default function SitGuruProfileAvatar({ avatarUrl, email, fullName, label, role, size = 72 }: SitGuruProfileAvatarProps) {
  return (
    <View style={styles.wrap}>
      <SitGuruProfilePhotoFrame email={email} imageUrl={avatarUrl} name={fullName} roleLabel={role} shape="squircle" size={frameSize(size)} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  label: { color: SitGuruColors.textMuted, fontSize: 11, fontWeight: '900', textAlign: 'center' },
});
