import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type BiometricGate = {
  ok: boolean;
  skipped: boolean;
};

/**
 * Step-up check for money and account changes.
 * If the device has no enrolled biometrics, the action proceeds.
 */
export async function confirmSensitiveAction(
  promptMessage: string,
): Promise<BiometricGate> {
  if (Platform.OS === 'web') {
    return { ok: true, skipped: true };
  }

  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return { ok: true, skipped: true };

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return { ok: result.success, skipped: false };
  } catch {
    return { ok: true, skipped: true };
  }
}
