import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import ChatToastBanner from '@/components/mobile/ChatToastBanner';
import PushPrimingSheet from '@/components/mobile/PushPrimingSheet';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useIncomingMessageToast } from '@/hooks/data/useIncomingMessageToast';
import { usePushRegistration } from '@/hooks/data/usePushRegistration';
import { setPushPrimingHandler } from '@/lib/push-priming';

const PUSH_PRIMING_KEY = 'sitguru-push-priming';
const MAX_PRIMING_ASKS = 3;
const PRIMING_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
/** Brief settle so the destination screen paints before the sheet. */
const PRIMING_DELAY_MS = 400;

type PrimingRecord = {
  asks: number;
  lastShownAt: number;
};

async function readPrimingRecord(): Promise<PrimingRecord> {
  try {
    const raw = await AsyncStorage.getItem(PUSH_PRIMING_KEY);
    if (!raw) return { asks: 0, lastShownAt: 0 };

    const parsed = JSON.parse(raw) as Partial<PrimingRecord>;

    return {
      asks: typeof parsed.asks === 'number' ? parsed.asks : 0,
      lastShownAt:
        typeof parsed.lastShownAt === 'number' ? parsed.lastShownAt : 0,
    };
  } catch {
    return { asks: 0, lastShownAt: 0 };
  }
}

async function writePrimingRecord(record: PrimingRecord) {
  try {
    await AsyncStorage.setItem(PUSH_PRIMING_KEY, JSON.stringify(record));
  } catch {
    // A missed write only means the user may be asked once more.
  }
}

/**
 * Auth-scoped hosts for push permission priming and global chat toasts.
 * Mount inside AuthProvider as a Stack sibling (not under sticky footers).
 */
export default function MobileAlertHosts() {
  const colorScheme = useColorScheme();
  const { canPrompt, loading, requestPermission } = usePushRegistration({
    enabled: true,
  });

  const [primingVisible, setPrimingVisible] = useState(false);
  const [primingAsked, setPrimingAsked] = useState(false);

  const { toast, dismiss } = useIncomingMessageToast({ enabled: true });

  const maybeShow = useCallback(async () => {
    if (!canPrompt || primingAsked) return;

    const record = await readPrimingRecord();
    const cooledDown = Date.now() - record.lastShownAt > PRIMING_COOLDOWN_MS;

    if (record.asks >= MAX_PRIMING_ASKS || !cooledDown) {
      return;
    }

    setTimeout(() => {
      setPrimingVisible(true);
      setPrimingAsked(true);
      void writePrimingRecord({
        asks: record.asks + 1,
        lastShownAt: Date.now(),
      });
    }, PRIMING_DELAY_MS);
  }, [canPrompt, primingAsked]);

  useEffect(() => {
    setPushPrimingHandler(() => {
      void maybeShow();
    });

    return () => setPushPrimingHandler(null);
  }, [maybeShow]);

  const handleAllow = useCallback(async () => {
    await requestPermission();
    setPrimingVisible(false);
  }, [requestPermission]);

  return (
    <>
      <ChatToastBanner
        isDark={colorScheme === 'dark'}
        toast={toast}
        onDismiss={dismiss}
        onPress={(payload) => {
          router.push({
            pathname: '/conversation',
            params: { conversationId: payload.conversationId },
          });
        }}
      />

      <PushPrimingSheet
        busy={loading}
        onAllow={() => void handleAllow()}
        onDismiss={() => setPrimingVisible(false)}
        visible={primingVisible}
      />
    </>
  );
}
