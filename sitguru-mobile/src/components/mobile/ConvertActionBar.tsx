import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import MarketplaceTrustNote from '@/components/mobile/MarketplaceTrustNote';
import StickyActionBar from '@/components/mobile/StickyActionBar';
import SitGuruButton from '@/components/SitGuruButton';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace } from '@/constants/mobile-layout';
import { useTheme } from '@/hooks/use-theme';

type ConvertActionBarProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  /** Short helper above the button (one line). */
  helper?: string;
  /** Show the compact “nothing charged until accept” trust line. */
  showTrust?: boolean;
  secondary?: ReactNode;
  embedded?: boolean;
  aboveBottomNav?: boolean;
  bottomNavHeight?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Thumb-zone conversion CTA: one clear primary action + optional trust line.
 * Use on discovery → book → pay surfaces so anyone can finish in one tap.
 */
export default function ConvertActionBar({
  label,
  onPress,
  accessibilityLabel,
  disabled = false,
  helper,
  showTrust = true,
  secondary,
  embedded = false,
  aboveBottomNav = false,
  bottomNavHeight,
  style,
}: ConvertActionBarProps) {
  const theme = useTheme();

  return (
    <StickyActionBar
      aboveBottomNav={aboveBottomNav}
      bottomNavHeight={bottomNavHeight}
      embedded={embedded}
      secondary={secondary}
      style={style}
    >
      {helper ? (
        <Text
          style={[styles.helper, { color: theme.colors.textMuted }]}
          numberOfLines={2}
        >
          {helper}
        </Text>
      ) : null}
      <SitGuruButton
        accessibilityLabel={accessibilityLabel ?? label}
        disabled={disabled}
        label={label}
        onPress={onPress}
      />
      {showTrust ? (
        <View style={styles.trust}>
          <MarketplaceTrustNote compact />
        </View>
      ) : null}
    </StickyActionBar>
  );
}

const styles = StyleSheet.create({
  helper: {
    fontFamily: AppFonts.semiBold,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: MobileSpace.xs,
    textAlign: 'center',
  },
  trust: {
    marginTop: MobileSpace.sm,
    paddingBottom: MobileSpace.xs,
  },
});
