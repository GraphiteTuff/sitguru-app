import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { SitGuruColors } from '@/constants/colors';
import { MobileSpace } from '@/constants/mobile-layout';

type SkeletonPanelProps = {
  /** Number of content lines under the header block. */
  lines?: number;
  /** Match PriorityCarousel card height. */
  variant?: 'card' | 'panel' | 'metric';
  style?: StyleProp<ViewStyle>;
};

/**
 * Soft loading placeholder that mirrors dashboard panel structure
 * so content does not pop in with a layout jump.
 */
export default function SkeletonPanel({
  lines = 3,
  variant = 'panel',
  style,
}: SkeletonPanelProps) {
  return (
    <View
      style={[
        styles.base,
        variant === 'card' ? styles.card : null,
        variant === 'metric' ? styles.metric : null,
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.eyebrow} />
        <View style={styles.chip} />
      </View>
      <View style={styles.title} />
      {Array.from({ length: lines }).map((_, index) => (
        <View
          key={`skel-line-${index}`}
          style={[
            styles.line,
            index === lines - 1 ? styles.lineShort : null,
          ]}
        />
      ))}
    </View>
  );
}

export function DashboardSkeletonStack() {
  return (
    <View style={styles.stack}>
      <SkeletonPanel variant="card" lines={2} />
      <View style={styles.metricRow}>
        <SkeletonPanel variant="metric" lines={1} style={styles.metricHalf} />
        <SkeletonPanel variant="metric" lines={1} style={styles.metricHalf} />
      </View>
      <SkeletonPanel variant="panel" lines={3} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: MobileSpace.md,
    width: '100%',
  },
  base: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: MobileSpace.sm,
    overflow: 'hidden',
    padding: MobileSpace.lg,
    width: '100%',
  },
  card: {
    minHeight: 148,
  },
  metric: {
    minHeight: 96,
    padding: MobileSpace.md,
  },
  metricRow: {
    flexDirection: 'row',
    gap: MobileSpace.sm,
    width: '100%',
  },
  metricHalf: {
    flex: 1,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyebrow: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 999,
    height: 10,
    width: 72,
  },
  chip: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 999,
    height: 18,
    width: 40,
  },
  title: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 10,
    height: 18,
    marginTop: 4,
    width: '68%',
  },
  line: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 8,
    height: 12,
    width: '100%',
  },
  lineShort: {
    width: '54%',
  },
});
