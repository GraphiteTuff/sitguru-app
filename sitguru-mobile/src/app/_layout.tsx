import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SitGuruPaymentsProvider from '@/components/SitGuruPaymentsProvider';
import { getAppTheme } from '@/constants/theme';
import { AuthProvider } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  ACCEPT_BOOKING_ACTION,
  DECLINE_BOOKING_ACTION,
  OPEN_BOOKING_ACTION,
  registerForPushNotificationsAsync,
  subscribeToNotificationResponses,
} from '@/lib/notifications/push';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const appTheme = getAppTheme(
    colorScheme === 'dark' ? 'dark' : 'light',
  );

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    void registerForPushNotificationsAsync();

    const subscription = subscribeToNotificationResponses(
      ({ actionId, bookingId, href }) => {
        const defaultHref = '/guru-requests';
        const target =
          href ||
          (bookingId
            ? {
                pathname: '/guru-requests' as const,
                params: { bookingId },
              }
            : defaultHref);

        if (
          actionId === ACCEPT_BOOKING_ACTION ||
          actionId === DECLINE_BOOKING_ACTION ||
          actionId === OPEN_BOOKING_ACTION ||
          actionId === 'expo.modules.notifications.actions.DEFAULT'
        ) {
          router.push(target as never);
        }
      },
    );

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SitGuruPaymentsProvider>
        <AuthProvider>
          <StatusBar
            style={colorScheme === 'dark' ? 'light' : 'dark'}
          />

          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: appTheme.colors.screen,
              },
            }}
          />
        </AuthProvider>
      </SitGuruPaymentsProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
