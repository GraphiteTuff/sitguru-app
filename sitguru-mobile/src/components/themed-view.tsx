import {
  View,
  type ViewProps,
} from 'react-native';

import {
  useTheme,
  useThemeMode,
} from '@/hooks/use-theme';

type ThemeColors =
  ReturnType<typeof useTheme>['colors'];

export type ThemedViewColorName =
  keyof ThemeColors;

export type ThemedViewProps =
  ViewProps & {
    lightColor?: string;
    darkColor?: string;
    type?: ThemedViewColorName;
  };

export function ThemedView({
  style,
  lightColor,
  darkColor,
  type = 'background',
  ...otherProps
}: ThemedViewProps) {
  const theme = useTheme();
  const themeMode = useThemeMode();

  const customColor =
    themeMode === 'dark'
      ? darkColor
      : lightColor;

  const backgroundColor =
    customColor ??
    theme.colors[type];

  return (
    <View
      {...otherProps}
      style={[
        {
          backgroundColor,
        },
        style,
      ]}
    />
  );
}