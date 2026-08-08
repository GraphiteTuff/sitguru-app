import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import {
  registerAndPersistPushToken,
  type PushRegistrationResult,
} from '@/lib/notifications/register-device';

/**
 * On authenticated session, request Expo push credentials and persist the token.
 */
export function usePushRegistration(options?: { enabled?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const [result, setResult] = useState<PushRegistrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!enabled || !isAuthenticated || !user?.id) {
        lastUserIdRef.current = null;
        setResult(null);
        return;
      }

      if (lastUserIdRef.current === user.id && result?.token) {
        return;
      }

      setLoading(true);
      const next = await registerAndPersistPushToken(user.id);
      if (cancelled) return;

      lastUserIdRef.current = user.id;
      setResult(next);
      setLoading(false);
    }

    void run();

    return () => {
      cancelled = true;
    };
    // Intentionally omit `result` to avoid re-register loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isAuthenticated, user?.id]);

  return {
    loading,
    token: result?.token ?? null,
    saved: result?.saved ?? false,
    error: result?.error ?? null,
  };
}
