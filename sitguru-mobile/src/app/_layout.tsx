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
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import KeyboardSafeHost from '@/components/mobile/KeyboardSafeHost';
import SitGuruBootScreen from '@/components/mobile/SitGuruBootScreen';
import MobileAlertHosts from '@/components/mobile/MobileAlertHosts';
import RootErrorBoundary from '@/components/RootErrorBoundary';
import SitGuruPaymentsProvider from '@/components/SitGuruPaymentsProvider';
import { AuthProvider } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  openSitGuruDeepLink,
  shouldRemapSitGuruUrl,
} from '@/lib/navigation/deep-links';
import { applyReadableTypeDefaults } from '@/lib/a11y/type-scale';
import { PERF_BASELINES } from '@/lib/perf/baselines';
import {
  ACCEPT_BOOKING_ACTION,
  DECLINE_BOOKING_ACTION,
  OPEN_BOOKING_ACTION,
  subscribeToNotificationResponses,
} from '@/lib/notifications/push';
// Ensure TaskManager.defineTask runs before any walk screen mounts.
import '@/lib/location/background-walk-task';

applyReadableTypeDefaults();

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Native splash may already be hidden in web / Expo Go.
});

const BOOT_TIMEOUT_MS = PERF_BASELINES.warmLaunchMs.target;

export default function RootLayout() {
  const colorScheme = useColorScheme();
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

  useEffect(() => {
    if (Platform.OS === 'web') return;

    function handleUrl(url: string | null) {
      if (!url || !shouldRemapSitGuruUrl(url)) return;
      openSitGuruDeepLink(url);
    }

    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => subscription.remove();
  }, []);

  // Never return null after splash — that is a permanent white screen on device.
  if (!appReady) {
    return <SitGuruBootScreen label="Opening SitGuru…" />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <KeyboardSafeHost>
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
                    backgroundColor: '#FFFCF7',
                  },
                }}
              />

              <MobileAlertHosts />
            </AuthProvider>
          </SitGuruPaymentsProvider>
        </RootErrorBoundary>
      </KeyboardSafeHost>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#FFFCF7', flex: 1 },
});
