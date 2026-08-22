import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { useKeyboardSafe } from '@/components/mobile/KeyboardSafeHost';
import { SitGuruColors } from '@/constants/colors';
import { MAX_FONT_SIZE_MULTIPLIER } from '@/lib/a11y/type-scale';
import { playAppHaptic } from '@/lib/haptics';

type SitGuruTextFieldProps = TextInputProps & {
  errorText?: string;
  helperText?: string;
  label: string;
};

export default function SitGuruTextField({
  errorText,
  helperText,
  label,
  multiline = false,
  style,
  onFocus,
  ...inputProps
}: SitGuruTextFieldProps) {
  const supportText = errorText ?? helperText;
  const { revealFocusedInput } = useKeyboardSafe();

  return (
    <View style={styles.field}>
      <Text
        allowFontScaling
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={styles.label}
      >
        {label}
      </Text>

      <TextInput
        allowFontScaling
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        multiline={multiline}
        placeholderTextColor={SitGuruColors.textSoft}
        {...inputProps}
        style={[
          styles.input,
          multiline ? styles.multiline : null,
          errorText ? styles.inputError : null,
          style,
        ]}
        onFocus={(event) => {
          playAppHaptic('selection');
          revealFocusedInput();
          onFocus?.(event);
        }}
      />

      {supportText ? (
        <Text
          allowFontScaling
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          style={[styles.supportText, errorText ? styles.errorText : null]}
        >
          {supportText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    minHeight: 56,
    backgroundColor: SitGuruColors.surface,
    borderWidth: 1,
    borderColor: SitGuruColors.border,
    borderRadius: 16,
    color: SitGuruColors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 1,
  },
  inputError: {
    borderColor: SitGuruColors.danger,
  },
  multiline: {
    minHeight: 104,
    textAlignVertical: 'top',
  },
  supportText: {
    color: SitGuruColors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: SitGuruColors.danger,
  },
});
