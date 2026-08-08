import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace, MobileType } from '@/constants/mobile-layout';

type FocusTextInputProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

/**
 * Form field with clear SitGuru-green focus ring for passport / review inputs.
 */
export default function FocusTextInput({
  containerStyle,
  inputStyle,
  style,
  onFocus,
  onBlur,
  editable = true,
  ...rest
}: FocusTextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.wrap,
        focused && editable ? styles.wrapFocused : null,
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    width: '100%',
  },
  wrapFocused: {
    borderColor: SitGuruColors.primary,
    shadowColor: SitGuruColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
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
