import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace, MobileType, TOUCH_MIN } from '@/constants/mobile-layout';

export type DistributionBarItem = {
  id: string;
  label: string;
  value: number;
  helper?: string;
};

type DistributionBarsProps = {
  items: DistributionBarItem[];
  maxValue?: number;
  emptyLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Horizontal StyleSheet distribution bars for Guru service volume / peaks.
 */
export default function DistributionBars({
  items,
  maxValue,
  emptyLabel = 'No activity in this window yet.',
  style,
}: DistributionBarsProps) {
  const peak = Math.max(
    maxValue ?? 0,
    ...items.map((item) => item.value),
    0,
  );

  if (!items.length || peak <= 0) {
    return (
      <View style={[styles.wrap, style]}>
        <Text style={styles.empty}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      {items.map((item) => {
        const widthPct = Math.max(6, Math.round((item.value / peak) * 100));

        return (
          <View key={item.id} style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.label}>{item.label}</Text>
              {item.helper ? (
                <Text style={styles.helper}>{item.helper}</Text>
              ) : null}
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${widthPct}%` }]} />
            </View>
            <Text style={styles.value}>{item.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: MobileSpace.md,
    width: '100%',
  },
  empty: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.regular,
    fontSize: MobileType.body,
    lineHeight: 21,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: MobileSpace.sm,
    minHeight: TOUCH_MIN - 4,
  },
  copy: {
    flexBasis: 112,
    flexGrow: 0,
    flexShrink: 0,
    gap: 2,
  },
  label: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.semiBold,
    fontSize: MobileType.caption,
  },
  helper: {
    color: SitGuruColors.textSoft,
    fontFamily: AppFonts.regular,
    fontSize: MobileType.micro,
  },
  track: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 999,
    flex: 1,
    height: 12,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    height: '100%',
  },
  value: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.caption,
    minWidth: 28,
    textAlign: 'right',
  },
});
