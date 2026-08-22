import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';

import SitGuruScreen from '@/components/SitGuruScreen';
import { AppFonts } from '@/constants/fonts';
import { useAuth } from '@/hooks/useAuth';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();
  const { completeOAuthCallback } = useAuth();
  const [message, setMessage] = useState('Finishing secure sign-in…');

  useEffect(() => {
    let active = true;

    async function finishSignIn() {
      const incomingUrl = await Linking.getInitialURL();
      const fallbackUrl = Linking.createURL('auth/callback', {
        queryParams: Object.fromEntries(
          Object.entries(params).flatMap(([key, value]) =>
            typeof value === 'string' ? [[key, value]] : [],
          ),
        ),
      });

      const result = await completeOAuthCallback(incomingUrl || fallbackUrl);

      if (!active) return;

      if (result.error) {
        setMessage(result.error);
        return;
      }

      if (result.cancelled) {
        router.replace('/login');
        return;
      }

      router.replace('/role-selection');
    }

    void finishSignIn();

    return () => {
      active = false;
    };
  }, [completeOAuthCallback, params]);

  return (
    <SitGuruScreen>
      <View style={styles.wrap}>
        <ActivityIndicator color="#0D5C3A" size="large" />
        <Text style={styles.copy}>{message}</Text>
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  copy: {
    color: '#142019',
    fontFamily: AppFonts.semiBold,
    fontSize: 15,
    textAlign: 'center',
  },
});
