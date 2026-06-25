import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { SitGuruColors } from '@/constants/colors';

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
  ...inputProps
}: SitGuruTextFieldProps) {
  const supportText = errorText ?? helperText;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        multiline={multiline}
        placeholderTextColor={SitGuruColors.textSoft}
        style={[
          styles.input,
          multiline ? styles.multiline : null,
          errorText ? styles.inputError : null,
          style,
        ]}
        {...inputProps}
      />

      {supportText ? (
        <Text style={[styles.supportText, errorText ? styles.errorText : null]}>
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
    lineHeight: 17,
  },
  input: {
    minHeight: 56,
    backgroundColor: SitGuruColors.surface,
    borderWidth: 1,
    borderColor: SitGuruColors.border,
    borderRadius: 16,
    color: SitGuruColors.text,
    fontSize: 16,
    lineHeight: 22,
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
    lineHeight: 16,
  },
  errorText: {
    color: SitGuruColors.danger,
  },
});
