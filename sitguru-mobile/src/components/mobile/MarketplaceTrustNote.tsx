import { ShieldCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppFonts } from '@/constants/fonts';
import { MARKETPLACE_TRUST_LINES } from '@/lib/marketplace-trust';

type MarketplaceTrustNoteProps = {
  compact?: boolean;
  tone?: 'light' | 'dark';
};

export default function MarketplaceTrustNote({
  compact = false,
  tone = 'light',
}: MarketplaceTrustNoteProps) {
  const isDark = tone === 'dark';

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <ShieldCheck color={isDark ? '#78D990' : '#1A4E37'} size={14} strokeWidth={2.4} />
        <Text style={[styles.compactText, isDark && styles.compactTextDark]}>
          Nothing charged until they accept · Cancel free before accept
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={styles.header}>
        <ShieldCheck color={isDark ? '#78D990' : '#1A4E37'} size={16} strokeWidth={2.4} />
        <Text style={[styles.title, isDark && styles.titleDark]}>
          Book with SitGuru protection
        </Text>
      </View>
      {MARKETPLACE_TRUST_LINES.map((line) => (
        <Text key={line} style={[styles.line, isDark && styles.lineDark]}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  compactRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  compactText: {
    color: '#465349',
    flex: 1,
    fontFamily: AppFonts.semiBold,
    fontSize: 11,
    lineHeight: 15,
  },
  compactTextDark: {
    color: '#C8EBD4',
  },
  card: {
    backgroundColor: '#F3F8F4',
    borderColor: '#C9DDD1',
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  cardDark: {
    backgroundColor: '#12241B',
    borderColor: '#1E3B2B',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    color: '#14291F',
    fontFamily: AppFonts.extraBold,
    fontSize: 13,
  },
  titleDark: {
    color: '#E7F6EC',
  },
  line: {
    color: '#465349',
    fontFamily: AppFonts.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  lineDark: {
    color: '#AEB9B0',
  },
});
