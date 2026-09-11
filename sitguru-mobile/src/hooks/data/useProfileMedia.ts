import { useCallback, useEffect, useState } from 'react';

import {
  deleteProfileMediaItem,
  loadProfileMedia,
  uploadAndSaveProfileMedia,
  type ProfileMediaItem,
} from '@/lib/data/profile-media';

export function useProfileMedia(userId?: string | null) {
  const [items, setItems] = useState<ProfileMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setItems([]);
      return;
    }

    setLoading(true);
    const result = await loadProfileMedia(userId);
    setItems(result.items);
    setError(result.error);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upload = useCallback(
    async (
      input: Parameters<typeof uploadAndSaveProfileMedia>[0],
    ) => {
      const result = await uploadAndSaveProfileMedia(input);
      await refresh();
      return result;
    },
    [refresh],
  );

  const remove = useCallback(
    async (item: ProfileMediaItem) => {
      await deleteProfileMediaItem(item);
      await refresh();
    },
    [refresh],
  );

  return {
    items,
    gallery: items.filter((item) => item.kind === 'gallery'),
    cover: items.find((item) => item.kind === 'cover') ?? null,
    video: items.find((item) => item.kind === 'video') ?? null,
    loading,
    error,
    refresh,
    upload,
    remove,
  };
}
