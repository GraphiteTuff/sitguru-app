import { router } from 'expo-router';

import ChatToastBanner from '@/components/mobile/ChatToastBanner';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useIncomingMessageToast } from '@/hooks/data/useIncomingMessageToast';
import { usePushRegistration } from '@/hooks/data/usePushRegistration';

/**
 * Auth-scoped hosts for push token registration + global chat toasts.
 * Mount inside AuthProvider as a Stack sibling (not under sticky footers).
 */
export default function MobileAlertHosts() {
  const colorScheme = useColorScheme();
  usePushRegistration({ enabled: true });

  const { toast, dismiss } = useIncomingMessageToast({ enabled: true });

  return (
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
  );
}
