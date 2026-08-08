import { Droplets, Footprints } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import TouchTarget from '@/components/mobile/TouchTarget';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace, MobileType, TOUCH_MIN } from '@/constants/mobile-layout';

type CareQuickActionsProps = {
  onPotty: () => void;
  onWater: () => void;
  disabled?: boolean;
  pottyLabel?: string;
  waterLabel?: string;
};

/**
 * Thumb-zone primary care actions — oversized Potty / Water over map chrome.
 */
export default function CareQuickActions({
  onPotty,
  onWater,
  disabled = false,
  pottyLabel = 'Potty break',
  waterLabel = 'Fresh water',
}: CareQuickActionsProps) {
  return (
    <View style={styles.row}>
      <TouchTarget
        accessibilityRole="button"
        accessibilityLabel={pottyLabel}
        disabled={disabled}
        onPress={onPotty}
        style={[styles.action, styles.potty, disabled && styles.disabled]}
      >
        <View style={styles.iconWrap}>
          <Footprints color="#FFFFFF" size={26} strokeWidth={2.4} />
        </View>
        <Text style={styles.label}>{pottyLabel}</Text>
      </TouchTarget>

      <TouchTarget
        accessibilityRole="button"
        accessibilityLabel={waterLabel}
        disabled={disabled}
        onPress={onWater}
        style={[styles.action, styles.water, disabled && styles.disabled]}
      >
        <View style={styles.iconWrap}>
          <Droplets color="#FFFFFF" size={26} strokeWidth={2.4} />
        </View>
        <Text style={styles.label}>{waterLabel}</Text>
      </TouchTarget>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: MobileSpace.sm,
    width: '100%',
  },
  action: {
    borderRadius: 20,
    flex: 1,
    gap: MobileSpace.sm,
    minHeight: Math.max(TOUCH_MIN + 28, 88),
    paddingHorizontal: MobileSpace.md,
    paddingVertical: MobileSpace.lg,
  },
  potty: {
    backgroundColor: SitGuruColors.primary,
  },
  water: {
    backgroundColor: SitGuruColors.primaryDark,
  },
  disabled: {
    opacity: 0.55,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  label: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.body,
    textAlign: 'center',
  },
});
