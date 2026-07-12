import {
  StyleSheet,
  Text,
  type TextProps,
  type TextStyle,
} from 'react-native';

import { AppFonts } from '@/constants/fonts';
import {
  useTheme,
  useThemeMode,
} from '@/hooks/use-theme';

type ThemeColors =
  ReturnType<typeof useTheme>['colors'];

export type ThemeColorName =
  keyof ThemeColors;

export type ThemedTextType =
  | 'default'
  | 'defaultSemiBold'
  | 'title'
  | 'subtitle'
  | 'link'
  | 'linkPrimary'
  | 'small'
  | 'smallBold'
  | 'code'
  | 'body'
  | 'caption';

export type ThemedTextProps =
  TextProps & {
    lightColor?: string;
    darkColor?: string;
    themeColor?: ThemeColorName;
    type?: ThemedTextType;
  };

export function ThemedText({
  style,
  lightColor,
  darkColor,
  themeColor = 'text',
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();
  const themeMode = useThemeMode();

  const customColor =
    themeMode === 'dark'
      ? darkColor
      : lightColor;

  const color =
    customColor ??
    theme.colors[themeColor];

  return (
    <Text
      {...rest}
      style={[
        {
          color,
        },
        getTypeStyle(type),
        style,
      ]}
    />
  );
}

function getTypeStyle(
  type: ThemedTextType,
): TextStyle {
  switch (type) {
    case 'title':
      return styles.title;

    case 'subtitle':
      return styles.subtitle;

    case 'defaultSemiBold':
      return styles.defaultSemiBold;

    case 'link':
      return styles.link;

    case 'linkPrimary':
      return styles.linkPrimary;

    case 'small':
      return styles.small;

    case 'smallBold':
      return styles.smallBold;

    case 'code':
      return styles.code;

    case 'body':
      return styles.body;

    case 'caption':
      return styles.caption;

    default:
      return styles.default;
  }
}

const styles = StyleSheet.create({
  default: {
    fontFamily: AppFonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontFamily: AppFonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: AppFonts.extraBold,
    fontSize: 32,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: AppFonts.bold,
    fontSize: 22,
    letterSpacing: -0.35,
    lineHeight: 28,
  },
  link: {
    fontFamily: AppFonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    textDecorationLine: 'underline',
  },
  linkPrimary: {
    fontFamily: AppFonts.bold,
    fontSize: 15,
    lineHeight: 22,
    textDecorationLine: 'underline',
  },
  small: {
    fontFamily: AppFonts.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  smallBold: {
    fontFamily: AppFonts.bold,
    fontSize: 14,
    lineHeight: 21,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  body: {
    fontFamily: AppFonts.regular,
    fontSize: 15,
    lineHeight: 23,
  },
  caption: {
    fontFamily: AppFonts.medium,
    fontSize: 12,
    lineHeight: 17,
  },
});