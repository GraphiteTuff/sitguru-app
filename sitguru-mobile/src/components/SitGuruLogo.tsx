import { Image, StyleSheet, type ImageSourcePropType, type ImageStyle, type StyleProp } from 'react-native';

import sitGuruLogoHorizontal from '@/assets/images/sitguru-logo-horizontal.jpg';
import sitGuruSymbolGreen from '@/assets/images/sitguru-symbol-green.jpg';

type SitGuruLogoVariant = 'symbol' | 'horizontal';
type SitGuruLogoSize = 'small' | 'medium' | 'large';

type SitGuruLogoProps = {
  accessibilityLabel?: string;
  size?: SitGuruLogoSize;
  style?: StyleProp<ImageStyle>;
  variant?: SitGuruLogoVariant;
};

const logoSources: Record<SitGuruLogoVariant, ImageSourcePropType> = {
  horizontal: sitGuruLogoHorizontal,
  symbol: sitGuruSymbolGreen,
};

const logoSizes: Record<SitGuruLogoVariant, Record<SitGuruLogoSize, ImageStyle>> = {
  horizontal: {
    small: {
      width: 128,
      height: 38,
    },
    medium: {
      width: 172,
      height: 50,
    },
    large: {
      width: 220,
      height: 64,
    },
  },
  symbol: {
    small: {
      width: 34,
      height: 34,
    },
    medium: {
      width: 48,
      height: 48,
    },
    large: {
      width: 64,
      height: 64,
    },
  },
};

export default function SitGuruLogo({
  accessibilityLabel = 'SitGuru',
  size = 'medium',
  style,
  variant = 'horizontal',
}: SitGuruLogoProps) {
  return (
    <Image
      accessibilityLabel={accessibilityLabel}
      alt={accessibilityLabel}
      resizeMode="contain"
      source={logoSources[variant]}
      style={[
        styles.logo,
        variant === 'symbol' ? styles.symbolLogo : null,
        logoSizes[variant][size],
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    flexShrink: 0,
  },
  symbolLogo: {
    borderRadius: 10,
  },
});