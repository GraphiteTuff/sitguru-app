import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { sitguruApiFetch } from '@/lib/data/api';

type Highlight = {
  id: string;
  badgeLabel: string;
  chipLabel: string;
  icon: string;
  providerName: string | null;
  summary: string;
  validThrough: string | null;
  filterKey: string;
};

type ChipPack = {
  chips: Highlight[];
  extraCount: number;
  highlights: Highlight[];
};

const ICONS: Record<string, string> = {
  paw: '🐾',
  shield: '🛡',
  lock: '🔐',
  star: '⭐',
  cap: '🎓',
  plus: '➕',
};

export function TrustCredentialHighlights({
  guruId,
  ownerUserId,
  variant = 'profile',
  isDark = false,
}: {
  guruId?: string | null;
  ownerUserId?: string | null;
  variant?: 'profile' | 'chips';
  isDark?: boolean;
}) {
  const [pack, setPack] = useState<ChipPack | null>(null);

  useEffect(() => {
    const ids = [guruId, ownerUserId].filter(Boolean).join(',');
    if (!ids) return;
    let cancelled = false;
    void sitguruApiFetch<{
      enabled?: boolean;
      chipsByGuruId?: Record<string, ChipPack>;
    }>(`/api/public/credentials?guruIds=${encodeURIComponent(ids)}`, {
      auth: false,
    }).then((result) => {
      if (cancelled || !result.data?.enabled) return;
      const map = result.data.chipsByGuruId || {};
      setPack(map[String(guruId || '')] || map[String(ownerUserId || '')] || null);
    });
    return () => {
      cancelled = true;
    };
  }, [guruId, ownerUserId]);

  if (!pack?.highlights?.length && !pack?.chips?.length) return null;

  if (variant === 'chips') {
    return (
      <View style={styles.row} accessibilityLabel="Verified credentials">
        {pack.chips.slice(0, 3).map((chip) => (
          <View key={chip.id} style={[styles.chip, isDark && styles.chipDark]}>
            <Text style={[styles.chipText, isDark && styles.chipTextDark]}>
              {ICONS[chip.icon] || '🐾'} {chip.chipLabel}
            </Text>
          </View>
        ))}
        {pack.extraCount > 0 ? (
          <Text style={[styles.more, isDark && styles.chipTextDark]}>+{pack.extraCount} more</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <Text style={styles.eyebrow}>Trust & Credentials</Text>
      <Text style={[styles.title, isDark && styles.titleDark]}>Professional highlights</Text>
      {pack.highlights.map((item) => (
        <View key={item.id} style={styles.item}>
          <Text style={[styles.itemTitle, isDark && styles.titleDark]}>
            {ICONS[item.icon] || '🐾'} {item.badgeLabel}
          </Text>
          {item.providerName ? (
            <Text style={[styles.body, isDark && styles.bodyDark]}>{item.providerName}</Text>
          ) : null}
          <Text style={[styles.body, isDark && styles.bodyDark]}>{item.summary}</Text>
          <Text style={styles.verified}>✓ Verified by SitGuru</Text>
          {item.validThrough ? (
            <Text style={[styles.body, isDark && styles.bodyDark]}>Valid through {item.validThrough}</Text>
          ) : null}
        </View>
      ))}
      <Pressable accessibilityRole="button" accessibilityLabel="What verified by SitGuru means">
        <Text style={styles.help}>
          Verified by SitGuru means the document was reviewed. SitGuru does not provide the training, insurance, bond, or certification, and it does not guarantee performance.
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: '#F4FBF7',
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  chipDark: { backgroundColor: '#143726' },
  chipText: { color: '#0D5C3A', fontWeight: '700', fontSize: 12 },
  chipTextDark: { color: '#D7F5E4' },
  more: { alignSelf: 'center', color: '#475569', fontWeight: '700', fontSize: 12 },
  card: {
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 8,
  },
  cardDark: { backgroundColor: '#102F22' },
  eyebrow: { color: '#0D5C3A', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#0F172A', fontSize: 22, fontWeight: '800' },
  titleDark: { color: '#F8FAFC' },
  item: { marginTop: 8, gap: 2 },
  itemTitle: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  body: { color: '#475569', fontSize: 14, fontWeight: '600' },
  bodyDark: { color: '#D6E5DC' },
  verified: { color: '#0D5C3A', fontWeight: '800', marginTop: 4 },
  help: { color: '#64748B', fontSize: 13, lineHeight: 18, marginTop: 8 },
});
