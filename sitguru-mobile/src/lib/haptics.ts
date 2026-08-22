import { Platform } from 'react-native';

export type AppHaptic = 'none' | 'selection' | 'light' | 'medium' | 'success';

export function playAppHaptic(kind: AppHaptic = 'light') {
  if (kind === 'none' || Platform.OS === 'web') return;

  void import('expo-haptics')
    .then((Haptics) => {
      if (kind === 'selection') {
        return Haptics.selectionAsync();
      }

      if (kind === 'success') {
        return Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }

      return Haptics.impactAsync(
        kind === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light,
      );
    })
    .catch(() => undefined);
}
