import { useEffect, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace, MobileType } from '@/constants/mobile-layout';

type FocusTextInputProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  /** Soft green pulse when the field meets step criteria. */
  valid?: boolean;
};

/**
 * Form field with SitGuru-green focus ring + optional valid-state pulse.
 */
export default function FocusTextInput({
  containerStyle,
  inputStyle,
  style,
  onFocus,
  onBlur,
  editable = true,
  valid = false,
  ...rest
}: FocusTextInputProps) {
  const [focused, setFocused] = useState(false);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!valid || !editable) {
      pulse.value = withTiming(0, { duration: 160 });
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 520 }),
        withTiming(0.28, { duration: 520 }),
      ),
      3,
      false,
    );
  }, [editable, pulse, valid]);

  const wrapStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      pulse.value,
      [0, 1],
      [
        focused && editable ? SitGuruColors.primary : SitGuruColors.border,
        SitGuruColors.primary,
      ],
    );

    return {
      borderColor,
      shadowColor: SitGuruColors.primary,
      shadowOpacity: focused || valid ? 0.12 + pulse.value * 0.14 : 0,
      shadowRadius: 4 + pulse.value * 4,
      transform: [{ scale: 1 + pulse.value * 0.008 }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.wrap,
        wrapStyle,
        !editable ? styles.wrapDisabled : null,
        containerStyle,
      ]}
    >
      <TextInput
        {...rest}
        editable={editable}
        placeholderTextColor={SitGuruColors.textSoft}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[styles.input, inputStyle, style]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: SitGuruColors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    width: '100%',
  },
  wrapDisabled: {
    backgroundColor: SitGuruColors.surfaceSoft,
    opacity: 0.72,
  },
  input: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.regular,
    fontSize: MobileType.body,
    minHeight: 48,
    paddingHorizontal: MobileSpace.md,
    paddingVertical: MobileSpace.sm + 2,
    width: '100%',
  },
});
