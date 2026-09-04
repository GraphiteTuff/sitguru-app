import * as ImagePicker from 'expo-image-picker';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { Camera, ImagePlus, Mic, Send, Square, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import { useKeyboardSafe } from '@/components/mobile/KeyboardSafeHost';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace, TOUCH_MIN } from '@/constants/mobile-layout';
import { useThemeMode } from '@/hooks/use-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ChatAttachment = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  kind: 'photo' | 'voice';
  durationMs?: number;
};

type ChatComposerBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: (payload: { text: string; attachment: ChatAttachment | null }) => void;
  placeholder?: string;
  sending?: boolean;
  maxLength?: number;
  onFocus?: () => void;
};

/**
 * iMessage-style composer: compact media icons, a rounded field,
 * and a send circle that replaces the mic once there is text.
 */
export default function ChatComposerBar({
  value,
  onChangeText,
  onSend,
  placeholder = 'iMessage',
  sending = false,
  maxLength = 4000,
  onFocus,
}: ChatComposerBarProps) {
  const isDark = useThemeMode() === 'dark';
  const palette = getComposerPalette(isDark);
  const styles = createComposerStyles(palette);
  const { revealFocusedInput } = useKeyboardSafe();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recordingMs, setRecordingMs] = useState(0);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (recorderState.isRecording) {
        void recorder.stop().catch(() => undefined);
      }
    };
  }, [recorder, recorderState.isRecording]);

  async function pickPhoto(fromCamera: boolean) {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.72,
          allowsEditing: true,
          aspect: [4, 3],
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.72,
          allowsEditing: true,
          aspect: [4, 3],
        });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setAttachment({
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
      kind: 'photo',
    });
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function toggleVoiceNote() {
    if (recorderState.isRecording) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }

      try {
        await recorder.stop();
        const uri = recorder.uri;
        const durationMs =
          recorderState.durationMillis > 0
            ? recorderState.durationMillis
            : recordingMs;

        if (uri) {
          setAttachment({
            uri,
            kind: 'voice',
            mimeType: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4',
            fileName: `voice-note-${Date.now()}.m4a`,
            durationMs,
          });
        }
      } catch {
        setAttachment(null);
      }

      setRecordingMs(0);
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }

    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) return;

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordingMs(0);
      tickRef.current = setInterval(() => {
        setRecordingMs((ms) => ms + 250);
      }, 250);
    } catch {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      setRecordingMs(0);
    }
  }

  function handleSend() {
    const text = value.trim();
    if (sending || (!text && !attachment)) return;
    onSend({ text, attachment });
    setAttachment(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const recording = recorderState.isRecording;
  const canSend = !sending && (!!value.trim() || !!attachment);

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(
            insets.bottom,
            Platform.OS === 'ios' ? 8 : MobileSpace.sm,
          ),
        },
      ]}
    >
      {attachment ? (
        <View style={styles.preview}>
          {attachment.kind === 'photo' ? (
            <Image source={{ uri: attachment.uri }} style={styles.previewImage} />
          ) : (
            <View style={styles.voicePreview}>
              <Mic color={palette.accent} size={18} strokeWidth={2.4} />
              <Text style={styles.voicePreviewText}>
                Voice note · {formatMs(attachment.durationMs ?? 0)}
              </Text>
            </View>
          )}
          <BubblePressable
            accessibilityLabel="Remove attachment"
            accessibilityRole="button"
            haptic="selection"
            onPress={() => setAttachment(null)}
            scaleTo={0.88}
            style={styles.clearAttachment}
          >
            <X color={palette.muted} size={16} strokeWidth={2.4} />
          </BubblePressable>
        </View>
      ) : null}

      <View style={styles.row}>
        <BubblePressable
          accessibilityLabel="Take photo"
          accessibilityRole="button"
          haptic="selection"
          onPress={() => void pickPhoto(true)}
          scaleTo={0.88}
          style={styles.iconButton}
        >
          <Camera color={palette.accent} size={22} strokeWidth={2.2} />
        </BubblePressable>
        <BubblePressable
          accessibilityLabel="Choose photo"
          accessibilityRole="button"
          haptic="selection"
          onPress={() => void pickPhoto(false)}
          scaleTo={0.88}
          style={styles.iconButton}
        >
          <ImagePlus color={palette.accent} size={22} strokeWidth={2.2} />
        </BubblePressable>

        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            accessibilityLabel="Message"
            allowFontScaling
            editable={!sending && !recording}
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            maxLength={maxLength}
            multiline
            onChangeText={onChangeText}
            onFocus={() => {
              revealFocusedInput();
              onFocus?.();
            }}
            placeholder={placeholder}
            placeholderTextColor={palette.placeholder}
            style={styles.input}
            value={value}
          />
        </View>

        {canSend ? (
          <BubblePressable
            accessibilityLabel="Send message"
            accessibilityRole="button"
            haptic="medium"
            onPress={handleSend}
            scaleTo={0.88}
            style={styles.send}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Send color="#FFFFFF" size={17} strokeWidth={2.6} />
            )}
          </BubblePressable>
        ) : (
          <BubblePressable
            accessibilityLabel={recording ? 'Stop voice note' : 'Record voice note'}
            accessibilityRole="button"
            haptic="selection"
            onPress={() => void toggleVoiceNote()}
            scaleTo={0.88}
            style={[styles.iconButton, recording && styles.iconRecording]}
          >
            {recording ? (
              <Square color="#FFFFFF" size={14} fill="#FFFFFF" />
            ) : (
              <Mic color={palette.accent} size={22} strokeWidth={2.2} />
            )}
          </BubblePressable>
        )}
      </View>

      {recording ? (
        <Text style={styles.recordingHint}>Recording {formatMs(recordingMs)}</Text>
      ) : null}
    </View>
  );
}

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getComposerPalette(isDark: boolean) {
  return {
    background: isDark ? 'rgba(8, 22, 16, 0.92)' : 'rgba(248, 248, 248, 0.94)',
    field: isDark ? '#1C2A23' : '#FFFFFF',
    border: isDark ? '#2A4034' : '#D8D8D8',
    text: isDark ? '#F4F7F5' : '#111111',
    muted: isDark ? '#8FA096' : '#8E8E93',
    placeholder: isDark ? '#7F9187' : '#8E8E93',
    accent: isDark ? '#30D158' : '#0D5C3A',
    send: isDark ? '#30D158' : '#0D5C3A',
  };
}

function createComposerStyles(palette: ReturnType<typeof getComposerPalette>) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: palette.background,
      borderTopColor: palette.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: 8,
      paddingBottom: Platform.OS === 'ios' ? 6 : MobileSpace.sm,
      paddingHorizontal: 8,
      paddingTop: 8,
      width: '100%',
    },
    row: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: 6,
    },
    iconButton: {
      alignItems: 'center',
      height: TOUCH_MIN,
      justifyContent: 'center',
      width: TOUCH_MIN,
    },
    iconRecording: {
      backgroundColor: '#E5484D',
      borderRadius: 999,
      width: TOUCH_MIN,
    },
    inputWrap: {
      backgroundColor: palette.field,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 1,
      maxHeight: 120,
      minHeight: 36,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    },
    input: {
      color: palette.text,
      fontFamily: AppFonts.regular,
      fontSize: 17,
      lineHeight: 22,
      maxHeight: 96,
      padding: 0,
    },
    send: {
      alignItems: 'center',
      backgroundColor: palette.send,
      borderRadius: 999,
      height: TOUCH_MIN,
      justifyContent: 'center',
      marginBottom: 0,
      width: TOUCH_MIN,
    },
    preview: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: MobileSpace.sm,
      paddingHorizontal: 8,
    },
    previewImage: {
      borderRadius: 14,
      height: 72,
      width: 72,
    },
    voicePreview: {
      alignItems: 'center',
      backgroundColor: palette.field,
      borderRadius: 16,
      flex: 1,
      flexDirection: 'row',
      gap: MobileSpace.sm,
      minHeight: 44,
      paddingHorizontal: MobileSpace.md,
    },
    voicePreviewText: {
      color: palette.text,
      fontFamily: AppFonts.semiBold,
      fontSize: 15,
    },
    clearAttachment: {
      alignItems: 'center',
      height: TOUCH_MIN,
      justifyContent: 'center',
      width: TOUCH_MIN,
    },
    recordingHint: {
      color: '#E5484D',
      fontFamily: AppFonts.semiBold,
      fontSize: 12,
      paddingHorizontal: 12,
    },
  });
}
