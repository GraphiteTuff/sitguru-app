import 'react-native-url-polyfill/auto';

import {
  createClient,
  processLock,
} from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import {
  AppState,
  Platform,
  type AppStateStatus,
} from 'react-native';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

const supabasePublishableKey =
  process.env
    .EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const supabaseKey =
  supabasePublishableKey ||
  supabaseAnonKey;

export const isSupabaseConfigured =
  Boolean(
    supabaseUrl &&
      supabaseKey,
  );

export const supabaseConfigStatus = {
  hasUrl: Boolean(
    supabaseUrl,
  ),
  hasPublishableKey: Boolean(
    supabasePublishableKey,
  ),
  hasLegacyAnonKey: Boolean(
    supabaseAnonKey,
  ),
  isConfigured:
    isSupabaseConfigured,
  message:
    isSupabaseConfigured
      ? 'Supabase is configured for public client-side auth.'
      : 'Supabase is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
};

/*
 * Expo performs server-side rendering while
 * exporting the web app.
 *
 * window and localStorage do not exist during
 * that server-rendering step, so this adapter
 * safely returns null until the browser loads.
 */
const webStorage = {
  async getItem(
    key: string,
  ): Promise<string | null> {
    if (
      typeof window ===
      'undefined'
    ) {
      return null;
    }

    try {
      return window.localStorage.getItem(
        key,
      );
    } catch {
      return null;
    }
  },

  async setItem(
    key: string,
    value: string,
  ): Promise<void> {
    if (
      typeof window ===
      'undefined'
    ) {
      return;
    }

    try {
      window.localStorage.setItem(
        key,
        value,
      );
    } catch {
      /*
       * Storage can be unavailable in private
       * browsing or restricted browser contexts.
       * Supabase will continue with an in-memory
       * session for the current page.
       */
    }
  },

  async removeItem(
    key: string,
  ): Promise<void> {
    if (
      typeof window ===
      'undefined'
    ) {
      return;
    }

    try {
      window.localStorage.removeItem(
        key,
      );
    } catch {
      /*
       * Ignore browser storage restrictions.
       */
    }
  },
};

/*
 * SecureStore values can be limited in size.
 * Supabase session JSON can exceed that limit,
 * so large native sessions are split into
 * encrypted chunks.
 */
const SECURE_STORE_CHUNK_SIZE =
  1800;

const secureStoreOptions = {
  keychainAccessible:
    SecureStore
      .WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function metadataKey(
  key: string,
) {
  return `${key}::sitguru-meta`;
}

function chunkKey(
  key: string,
  index: number,
) {
  return `${key}::sitguru-chunk-${index}`;
}

async function removeSecureStoreValue(
  key: string,
) {
  const storedChunkCount =
    await SecureStore.getItemAsync(
      metadataKey(key),
    );

  const chunkCount =
    storedChunkCount
      ? Number.parseInt(
          storedChunkCount,
          10,
        )
      : 0;

  if (
    Number.isFinite(
      chunkCount,
    ) &&
    chunkCount > 0
  ) {
    await Promise.all(
      Array.from(
        {
          length:
            chunkCount,
        },
        (_, index) =>
          SecureStore.deleteItemAsync(
            chunkKey(
              key,
              index,
            ),
          ),
      ),
    );
  }

  await Promise.all([
    SecureStore.deleteItemAsync(
      key,
    ),
    SecureStore.deleteItemAsync(
      metadataKey(key),
    ),
  ]);
}

const nativeSecureStorage = {
  async getItem(
    key: string,
  ): Promise<string | null> {
    const directValue =
      await SecureStore.getItemAsync(
        key,
      );

    if (
      directValue !== null
    ) {
      return directValue;
    }

    const storedChunkCount =
      await SecureStore.getItemAsync(
        metadataKey(key),
      );

    if (
      !storedChunkCount
    ) {
      return null;
    }

    const chunkCount =
      Number.parseInt(
        storedChunkCount,
        10,
      );

    if (
      !Number.isFinite(
        chunkCount,
      ) ||
      chunkCount <= 0
    ) {
      return null;
    }

    const chunks =
      await Promise.all(
        Array.from(
          {
            length:
              chunkCount,
          },
          (_, index) =>
            SecureStore.getItemAsync(
              chunkKey(
                key,
                index,
              ),
            ),
        ),
      );

    if (
      chunks.some(
        (chunk) =>
          chunk === null,
      )
    ) {
      await removeSecureStoreValue(
        key,
      );

      return null;
    }

    return chunks.join('');
  },

  async setItem(
    key: string,
    value: string,
  ): Promise<void> {
    await removeSecureStoreValue(
      key,
    );

    if (
      value.length <=
      SECURE_STORE_CHUNK_SIZE
    ) {
      await SecureStore.setItemAsync(
        key,
        value,
        secureStoreOptions,
      );

      return;
    }

    const chunks:
      string[] = [];

    for (
      let index = 0;
      index < value.length;
      index +=
        SECURE_STORE_CHUNK_SIZE
    ) {
      chunks.push(
        value.slice(
          index,
          index +
            SECURE_STORE_CHUNK_SIZE,
        ),
      );
    }

    await Promise.all(
      chunks.map(
        (
          chunk,
          index,
        ) =>
          SecureStore.setItemAsync(
            chunkKey(
              key,
              index,
            ),
            chunk,
            secureStoreOptions,
          ),
      ),
    );

    await SecureStore.setItemAsync(
      metadataKey(key),
      String(
        chunks.length,
      ),
      secureStoreOptions,
    );
  },

  async removeItem(
    key: string,
  ): Promise<void> {
    await removeSecureStoreValue(
      key,
    );
  },
};

export const supabase =
  createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        storage:
          Platform.OS ===
          'web'
            ? webStorage
            : nativeSecureStorage,
        autoRefreshToken:
          true,
        persistSession:
          true,
        detectSessionInUrl:
          false,
        flowType: 'pkce',
        lock: processLock,
      },
    },
  );

type SitGuruGlobal =
  typeof globalThis & {
    __sitGuruSupabaseAppStateSubscription?: {
      remove: () => void;
    };
  };

if (
  Platform.OS !==
  'web'
) {
  const globalScope =
    globalThis as SitGuruGlobal;

  globalScope
    .__sitGuruSupabaseAppStateSubscription?.remove();

  const handleAppStateChange = (
    state: AppStateStatus,
  ) => {
    if (
      state === 'active'
    ) {
      void supabase.auth
        .startAutoRefresh();
    } else {
      void supabase.auth
        .stopAutoRefresh();
    }
  };

  globalScope.__sitGuruSupabaseAppStateSubscription =
    AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
}