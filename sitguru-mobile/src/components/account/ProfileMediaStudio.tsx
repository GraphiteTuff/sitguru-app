import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, Trash2, Video } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import SitGuruButton from '@/components/SitGuruButton';
import SitGuruIconButton from '@/components/SitGuruIconButton';
import { AppFonts } from '@/constants/fonts';
import { useProfileMedia } from '@/hooks/data/useProfileMedia';
import {
  MAX_INTRO_VIDEO_BYTES,
  MAX_INTRO_VIDEO_SECONDS,
  MAX_PROFILE_GALLERY,
} from '@/lib/data/profile-media';

type ProfileMediaStudioProps = {
  userId: string;
  isGuru: boolean;
  avatarUrl: string | null;
  coverUrl: string | null;
  introVideoUrl: string | null;
  isDark: boolean;
  onChanged: () => Promise<void> | void;
};

async function pickFromLibrary(kind: 'photo' | 'video') {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library access is required to update your profile.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: kind === 'video' ? ['videos'] : ['images'],
    quality: 0.78,
    allowsEditing: kind === 'photo',
    aspect: kind === 'photo' ? [1, 1] : undefined,
    videoMaxDuration: MAX_INTRO_VIDEO_SECONDS,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

async function pickFromCamera() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Camera access is required to take a profile photo.');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.78,
    allowsEditing: true,
    aspect: [1, 1],
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

function IntroVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="cover"
      nativeControls
    />
  );
}

export default function ProfileMediaStudio({
  userId,
  isGuru,
  avatarUrl,
  coverUrl,
  introVideoUrl,
  isDark,
  onChanged,
}: ProfileMediaStudioProps) {
  const palette = useMemo(() => getPalette(isDark), [isDark]);
  const media = useProfileMedia(userId);
  const [busy, setBusy] = useState<string | null>(null);

  const cover = coverUrl || media.cover?.fileUrl || null;
  const videoUrl = introVideoUrl || media.video?.fileUrl || null;

  async function runUpload(
    label: string,
    work: () => Promise<void>,
  ) {
    setBusy(label);
    try {
      await work();
      await onChanged();
    } catch (error) {
      Alert.alert(
        'Upload did not finish',
        error instanceof Error
          ? error.message
          : 'SitGuru could not save that photo.',
      );
    } finally {
      setBusy(null);
    }
  }

  function choosePhotoSource(onPicked: (asset: ImagePicker.ImagePickerAsset) => void) {
    Alert.alert('Add a photo', 'Use your camera or choose from your library.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Camera',
        onPress: () => {
          void pickFromCamera()
            .then((asset) => {
              if (asset) onPicked(asset);
            })
            .catch((error) =>
              Alert.alert(
                'Camera unavailable',
                error instanceof Error ? error.message : 'Try the library instead.',
              ),
            );
        },
      },
      {
        text: 'Library',
        onPress: () => {
          void pickFromLibrary('photo')
            .then((asset) => {
              if (asset) onPicked(asset);
            })
            .catch((error) =>
              Alert.alert(
                'Library unavailable',
                error instanceof Error ? error.message : 'Photo access is required.',
              ),
            );
        },
      },
    ]);
  }

  return (
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Text style={[styles.eyebrow, { color: palette.primary }]}>PHOTOS & INTRO</Text>
      <Text style={[styles.title, { color: palette.title }]}>
        Show who you are
      </Text>
      <Text style={[styles.copy, { color: palette.muted }]}>
        {isGuru
          ? 'Pet Parents see your avatar, cover, extra photos, and a short intro clip before they book.'
          : 'Gurus see your avatar, cover, extra photos, and a short intro so they know your pack.'}
      </Text>

      <View style={[styles.cover, { backgroundColor: palette.soft }]}>
        {cover ? (
          <Image
            accessibilityLabel="Cover photo"
            alt="Cover photo"
            source={{ uri: cover }}
            style={styles.coverImage}
          />
        ) : (
          <Text style={[styles.coverEmpty, { color: palette.muted }]}>
            Add a cover photo
          </Text>
        )}
        <View style={styles.coverActions}>
          <SitGuruButton
            label={busy === 'cover' ? 'Saving…' : 'Cover photo'}
            onPress={() =>
              choosePhotoSource((asset) => {
                void runUpload('cover', async () => {
                  await media.upload({
                    userId,
                    isGuru,
                    kind: 'cover',
                    localUri: asset.uri,
                    mimeType: asset.mimeType,
                    fileName: asset.fileName,
                  });
                });
              })
            }
            size="compact"
            variant="secondary"
          />
        </View>
      </View>

      <View style={styles.avatarRow}>
        <View style={[styles.avatarWrap, { borderColor: palette.avatarBorder, backgroundColor: palette.avatarBackground }]}>
          {avatarUrl ? (
            <Image
              accessibilityLabel="Profile photo"
              alt="Profile photo"
              source={{ uri: avatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <Camera color={palette.primary} size={22} strokeWidth={2.3} />
          )}
        </View>
        <View style={styles.avatarCopy}>
          <Text style={[styles.itemTitle, { color: palette.title }]}>Profile photo</Text>
          <Text style={[styles.copy, { color: palette.muted }]}>
            Square headshot works best. This is what bookings and messages use.
          </Text>
          <SitGuruButton
            label={busy === 'avatar' ? 'Saving…' : 'Change photo'}
            onPress={() =>
              choosePhotoSource((asset) => {
                void runUpload('avatar', async () => {
                  await media.upload({
                    userId,
                    isGuru,
                    kind: 'avatar',
                    localUri: asset.uri,
                    mimeType: asset.mimeType,
                    fileName: asset.fileName,
                  });
                });
              })
            }
            size="compact"
          />
        </View>
      </View>

      <Text style={[styles.itemTitle, { color: palette.title }]}>
        Extra photos · {media.gallery.length}/{MAX_PROFILE_GALLERY}
      </Text>
      <View style={styles.gallery}>
        {media.gallery.map((item) => (
          <View key={item.id} style={styles.galleryItem}>
            <Image
              accessibilityLabel="Gallery photo"
              alt="Gallery photo"
              source={{ uri: item.fileUrl }}
              style={styles.galleryImage}
            />
            <View style={styles.deleteBadge}>
              <SitGuruIconButton
                accessibilityLabel="Remove photo"
                onPress={() => {
                  void runUpload('delete', async () => {
                    await media.remove(item);
                  });
                }}>
                <Trash2 color="#FFFFFF" size={16} strokeWidth={2.3} />
              </SitGuruIconButton>
            </View>
          </View>
        ))}
        {media.gallery.length < MAX_PROFILE_GALLERY ? (
          <SitGuruButton
            label={busy === 'gallery' ? 'Saving…' : 'Add photo'}
            onPress={() =>
              choosePhotoSource((asset) => {
                void runUpload('gallery', async () => {
                  await media.upload({
                    userId,
                    isGuru,
                    kind: 'gallery',
                    localUri: asset.uri,
                    mimeType: asset.mimeType,
                    fileName: asset.fileName,
                  });
                });
              })
            }
            size="compact"
            variant="secondary"
          />
        ) : null}
      </View>

      <View style={styles.videoBlock}>
        <View style={styles.videoHeader}>
          <Video color={palette.primary} size={18} strokeWidth={2.3} />
          <Text style={[styles.itemTitle, { color: palette.title }]}>
            Short intro video
          </Text>
        </View>
        <Text style={[styles.copy, { color: palette.muted }]}>
          One clip, up to {MAX_INTRO_VIDEO_SECONDS} seconds. MP4 or MOV, 30 MB max.
        </Text>
        {videoUrl ? <IntroVideo key={videoUrl} uri={videoUrl} /> : null}
        <SitGuruButton
          label={busy === 'video' ? 'Saving…' : videoUrl ? 'Replace intro' : 'Add intro video'}
          onPress={() => {
            void pickFromLibrary('video')
              .then((asset) => {
                if (!asset) return;
                if ((asset.fileSize || 0) > MAX_INTRO_VIDEO_BYTES) {
                  throw new Error('Keep the intro video under 30 MB.');
                }
                if (
                  asset.duration &&
                  asset.duration > MAX_INTRO_VIDEO_SECONDS * 1000
                ) {
                  throw new Error(
                    `Keep the intro to ${MAX_INTRO_VIDEO_SECONDS} seconds or less.`,
                  );
                }
                return runUpload('video', async () => {
                  await media.upload({
                    userId,
                    isGuru,
                    kind: 'video',
                    localUri: asset.uri,
                    mimeType: asset.mimeType,
                    fileName: asset.fileName,
                    replaceVideo: true,
                  });
                });
              })
              .catch((error) =>
                Alert.alert(
                  'Video did not save',
                  error instanceof Error
                    ? error.message
                    : 'Choose a short MP4 or MOV clip.',
                ),
              );
          }}
          size="compact"
          variant="secondary"
        />
      </View>

      {busy ? (
        <View style={styles.busyRow}>
          <ActivityIndicator color={palette.primary} size="small" />
          <Text style={[styles.copy, { color: palette.muted }]}>Saving your media…</Text>
        </View>
      ) : null}

      {media.error ? (
        <Text style={[styles.copy, { color: palette.danger }]}>{media.error}</Text>
      ) : null}

      <View style={styles.hintRow}>
        <ImagePlus color={palette.muted} size={14} strokeWidth={2.2} />
        <Text style={[styles.hint, { color: palette.muted }]}>
          Photos upload to SitGuru profile buckets. PawReport walk photos use the live care camera.
        </Text>
      </View>
    </View>
  );
}

function getPalette(isDark: boolean) {
  return {
    avatarBackground: isDark ? '#173527' : '#EEF5EE',
    avatarBorder: isDark ? '#2E6C4B' : '#FFFFFF',
    border: isDark ? '#234B38' : '#EADDCB',
    danger: isDark ? '#FF8F7A' : '#B43D2F',
    muted: isDark ? '#9DB0A5' : '#738078',
    primary: isDark ? '#39D982' : '#087449',
    soft: isDark ? '#102D21' : '#E8F6EC',
    surface: isDark ? '#0B2118' : '#FFFEFA',
    title: isDark ? '#FFF5E8' : '#123F31',
  };
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  eyebrow: {
    fontFamily: AppFonts.extraBold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: AppFonts.extraBold,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  copy: {
    fontFamily: AppFonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  cover: {
    borderRadius: 18,
    height: 140,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  coverImage: {
    ...StyleSheet.absoluteFill,
  },
  coverEmpty: {
    fontFamily: AppFonts.medium,
    fontSize: 13,
    padding: 16,
  },
  coverActions: {
    padding: 10,
  },
  avatarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  avatarWrap: {
    alignItems: 'center',
    borderRadius: 40,
    borderWidth: 2,
    height: 80,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 80,
  },
  avatar: {
    height: '100%',
    width: '100%',
  },
  avatarCopy: {
    flex: 1,
    gap: 8,
  },
  itemTitle: {
    fontFamily: AppFonts.extraBold,
    fontSize: 15,
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  galleryItem: {
    height: 84,
    width: 84,
  },
  galleryImage: {
    borderRadius: 14,
    height: '100%',
    width: '100%',
  },
  deleteBadge: {
    position: 'absolute',
    right: -4,
    top: -4,
  },
  videoBlock: {
    gap: 8,
  },
  videoHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  video: {
    borderRadius: 16,
    height: 180,
    width: '100%',
  },
  busyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  hintRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
  },
  hint: {
    flex: 1,
    fontFamily: AppFonts.medium,
    fontSize: 11,
    lineHeight: 15,
  },
});
