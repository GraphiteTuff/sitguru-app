import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import {
  registerAndPersistPushToken,
  type PushRegistrationResult,
} from '@/lib/notifications/register-device';
import {
  getPushPermissionStatus,
  type PushPermissionStatus,
} from '@/lib/notifications/push';

/**
 * Keeps the Expo push token fresh for the signed-in user.
 *
 * The OS dialog is never triggered here. iOS grants exactly one prompt per
 * install, so asking has to be a deliberate act tied to an explanation the
 * user has already read — see `PushPrimingSheet`.
 */
export function usePushRegistration(options?: { enabled?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const [result, setResult] = useState<PushRegistrationResult | null>(null);
  const [permission, setPermission] = useState<PushPermissionStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!enabled || !isAuthenticated || !user?.id) {
        lastUserIdRef.current = null;
        setResult(null);
        setPermission(null);
        return;
      }

      if (lastUserIdRef.current === user.id && result?.token) {
        return;
      }

      setLoading(true);

      const status = await getPushPermissionStatus();
      if (cancelled) return;

      setPermission(status);

      /* Only users who already granted permission get a silent refresh; the
       * rest are left alone until they opt in. */
      const next =
        status === 'granted'
          ? await registerAndPersistPushToken(user.id, { prompt: false })
          : { token: null, saved: false, error: null };

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

  /** Shows the system dialog. Call this only after the user has opted in. */
  const requestPermission = useCallback(async () => {
    if (!user?.id) {
      return { token: null, saved: false, error: 'Sign in required.' };
    }

    setLoading(true);

    const next = await registerAndPersistPushToken(user.id, { prompt: true });
    const status = await getPushPermissionStatus();

    lastUserIdRef.current = user.id;
    setResult(next);
    setPermission(status);
    setLoading(false);

    return next;
  }, [user?.id]);

  return {
    loading,
    token: result?.token ?? null,
    saved: result?.saved ?? false,
    error: result?.error ?? null,
    permission,
    canPrompt: permission === 'undetermined',
    requestPermission,
  };
}
