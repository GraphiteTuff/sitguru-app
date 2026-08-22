import 'react-native-gesture-handler';

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import MobileAlertHosts from '@/components/mobile/MobileAlertHosts';
import RootErrorBoundary from '@/components/RootErrorBoundary';
import SitGuruPaymentsProvider from '@/components/SitGuruPaymentsProvider';
import { getAppTheme } from '@/constants/theme';
import { AuthProvider } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  ACCEPT_BOOKING_ACTION,
  DECLINE_BOOKING_ACTION,
  OPEN_BOOKING_ACTION,
  subscribeToNotificationResponses,
} from '@/lib/notifications/push';
// Ensure TaskManager.defineTask runs before any walk screen mounts.
import '@/lib/location/background-walk-task';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Native splash may already be hidden in web / Expo Go.
});

const BOOT_TIMEOUT_MS = 8_000;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const appTheme = getAppTheme(
    colorScheme === 'dark' ? 'dark' : 'light',
  );
  const [bootTimedOut, setBootTimedOut] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const appReady = fontsLoaded || Boolean(fontError) || bootTimedOut;

  useEffect(() => {
    const timer = setTimeout(() => {
      setBootTimedOut(true);
    }, BOOT_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!appReady) return;
    void SplashScreen.hideAsync().catch(() => undefined);
  }, [appReady]);

  useEffect(() => {
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

  // Never return null after splash — that is a permanent white screen on device.
  if (!appReady) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <RootErrorBoundary>
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

            <MobileAlertHosts />
          </AuthProvider>
        </SitGuruPaymentsProvider>
      </RootErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  boot: {
    alignItems: 'center',
    backgroundColor: '#0D5C3A',
    flex: 1,
    justifyContent: 'center',
  },
});
