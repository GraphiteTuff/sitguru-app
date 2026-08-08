import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace, MobileType, TOUCH_MIN } from '@/constants/mobile-layout';
import { formatUsd, centsToDollars } from '@/lib/data/money';
import {
  computeTipCents,
  TIP_PERCENT_PRESETS,
  type TipChoice,
} from '@/lib/payments/tipping';

type TipSelectorProps = {
  serviceCents: number;
  choice: TipChoice;
  customDollars: string;
  onChoiceChange: (choice: TipChoice) => void;
  onCustomDollarsChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Thumb-friendly gratuity cards (15% / 18% / 20%) + editable custom tip.
 */
export default function TipSelector({
  serviceCents,
  choice,
  customDollars,
  onChoiceChange,
  onCustomDollarsChange,
  style,
}: TipSelectorProps) {
  const tipCents = computeTipCents(serviceCents, choice, customDollars);

  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.title}>Tip your Guru</Text>
      <Text style={styles.helper}>
        100% of your tip goes to your Guru. Pick a preset or enter a custom amount.
      </Text>

      <View style={styles.grid}>
        {TIP_PERCENT_PRESETS.map((percent) => {
          const active = choice === percent;
          const amount = computeTipCents(serviceCents, percent, '');

          return (
            <Pressable
              key={percent}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${percent} percent tip`}
              onPress={() => onChoiceChange(percent)}
              style={[styles.card, active ? styles.cardActive : null]}
            >
              <Text style={[styles.cardPercent, active ? styles.cardTextActive : null]}>
                {percent}%
              </Text>
              <Text style={[styles.cardAmount, active ? styles.cardTextActive : null]}>
                {formatUsd(centsToDollars(amount))}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: choice === 'custom' }}
          accessibilityLabel="Custom tip"
          onPress={() => onChoiceChange('custom')}
          style={[styles.card, choice === 'custom' ? styles.cardActive : null]}
        >
          <Text
            style={[
              styles.cardPercent,
              choice === 'custom' ? styles.cardTextActive : null,
            ]}
          >
            Custom
          </Text>
          <Text
            style={[
              styles.cardAmount,
              choice === 'custom' ? styles.cardTextActive : null,
            ]}
          >
            Tip
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: choice === 'none' }}
          accessibilityLabel="No tip"
          onPress={() => onChoiceChange('none')}
          style={[styles.card, choice === 'none' ? styles.cardActive : null]}
        >
          <Text
            style={[
              styles.cardPercent,
              choice === 'none' ? styles.cardTextActive : null,
            ]}
          >
            None
          </Text>
          <Text
            style={[
              styles.cardAmount,
              choice === 'none' ? styles.cardTextActive : null,
            ]}
          >
            $0.00
          </Text>
        </Pressable>
      </View>

      {choice === 'custom' ? (
        <View style={styles.customRow}>
          <Text style={styles.currencyPrefix}>$</Text>
          <TextInput
            accessibilityLabel="Custom tip amount"
            keyboardType="decimal-pad"
            value={customDollars}
            onChangeText={onCustomDollarsChange}
            placeholder="0.00"
            placeholderTextColor={SitGuruColors.textSoft}
            style={styles.customInput}
          />
        </View>
      ) : null}

      <View style={styles.selectedRow}>
        <Text style={styles.selectedLabel}>Selected tip</Text>
        <Text style={styles.selectedValue}>
          {formatUsd(centsToDollars(tipCents))}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: MobileSpace.md,
    width: '100%',
  },
  title: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.section,
  },
  helper: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.regular,
    fontSize: MobileType.body,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MobileSpace.sm,
  },
  card: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.border,
    borderRadius: 16,
    borderWidth: 1.5,
    minHeight: TOUCH_MIN + 8,
    minWidth: '30%',
    paddingHorizontal: MobileSpace.md,
    paddingVertical: MobileSpace.md,
    flexGrow: 1,
  },
  cardActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  cardPercent: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.body,
  },
  cardAmount: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.caption,
    marginTop: 4,
  },
  cardTextActive: {
    color: '#FFFFFF',
  },
  customRow: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: TOUCH_MIN,
    paddingHorizontal: MobileSpace.md,
  },
  currencyPrefix: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.semiBold,
    fontSize: MobileType.section,
  },
  customInput: {
    color: SitGuruColors.text,
    flex: 1,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.section,
    paddingVertical: MobileSpace.sm,
  },
  selectedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectedLabel: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.semiBold,
    fontSize: MobileType.caption,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  selectedValue: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.section,
  },
});
