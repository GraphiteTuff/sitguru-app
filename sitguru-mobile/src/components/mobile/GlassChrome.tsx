import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useThemeMode } from '@/hooks/use-theme';

type GlassChromeProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  fallbackColor: string;
  tintColor?: string;
};

/**
 * iOS 26 liquid glass when the OS supports it, frosted blur on older iOS,
 * and a solid themed fallback everywhere else.
 */
export default function GlassChrome({
  children,
  style,
  fallbackColor,
  tintColor,
}: GlassChromeProps) {
  const isDark = useThemeMode() === 'dark';
  const colorScheme = isDark ? 'dark' : 'light';

  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return (
      <GlassView
        colorScheme={colorScheme}
        glassEffectStyle="regular"
        style={style}
        tintColor={tintColor}
      >
        {children}
      </GlassView>
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={isDark ? 42 : 56}
        style={[styles.blur, style]}
        tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[style, { backgroundColor: fallbackColor }]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  blur: {
    overflow: 'hidden',
  },
});
