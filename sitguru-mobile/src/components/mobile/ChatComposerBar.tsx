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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace, MobileType, TOUCH_MIN } from '@/constants/mobile-layout';

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
 * Mobile chat composer: quick photo bar, hold-style voice notes,
 * and a compact field that plays well with KeyboardAvoidingView.
 */
export default function ChatComposerBar({
  value,
  onChangeText,
  onSend,
  placeholder = 'Message',
  sending = false,
  maxLength = 4000,
  onFocus,
}: ChatComposerBarProps) {
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

  function clearAttachment() {
    setAttachment(null);
  }

  function handleSend() {
    const text = value.trim();
    if (sending || (!text && !attachment)) return;
    onSend({ text, attachment });
    setAttachment(null);
  }

  const recording = recorderState.isRecording;
  const canSend = !sending && (!!value.trim() || !!attachment);

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickBar}
        keyboardShouldPersistTaps="handled"
      >
        <BubblePressable
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          onPress={() => void pickPhoto(true)}
          scaleTo={0.88}
          style={styles.chip}
        >
          <Camera color={SitGuruColors.primary} size={16} strokeWidth={2.4} />
          <Text style={styles.chipText}>Camera</Text>
        </BubblePressable>
        <BubblePressable
          accessibilityRole="button"
          accessibilityLabel="Choose photo"
          onPress={() => void pickPhoto(false)}
          scaleTo={0.88}
          style={styles.chip}
        >
          <ImagePlus color={SitGuruColors.primary} size={16} strokeWidth={2.4} />
          <Text style={styles.chipText}>Photo</Text>
        </BubblePressable>
        <BubblePressable
          accessibilityRole="button"
          accessibilityLabel={recording ? 'Stop voice note' : 'Record voice note'}
          onPress={() => void toggleVoiceNote()}
          scaleTo={0.88}
          style={[styles.chip, recording && styles.chipRecording]}
        >
          {recording ? (
            <Square color="#FFFFFF" size={14} fill="#FFFFFF" />
          ) : (
            <Mic color={SitGuruColors.primary} size={16} strokeWidth={2.4} />
          )}
          <Text style={[styles.chipText, recording && styles.chipTextRecording]}>
            {recording ? formatMs(recordingMs) : 'Voice'}
          </Text>
        </BubblePressable>
      </ScrollView>

      {attachment ? (
        <View style={styles.preview}>
          {attachment.kind === 'photo' ? (
            <Image source={{ uri: attachment.uri }} style={styles.previewImage} />
          ) : (
            <View style={styles.voicePreview}>
              <Mic color={SitGuruColors.primary} size={18} strokeWidth={2.4} />
              <Text style={styles.voicePreviewText}>
                Voice note · {formatMs(attachment.durationMs ?? 0)}
              </Text>
            </View>
          )}
          <BubblePressable
            accessibilityLabel="Remove attachment"
            accessibilityRole="button"
            onPress={clearAttachment}
            scaleTo={0.88}
            style={styles.clearAttachment}
          >
            <X color={SitGuruColors.textMuted} size={16} strokeWidth={2.4} />
          </BubblePressable>
        </View>
      ) : null}

      <View style={styles.composer}>
        <View style={styles.inputWrap}>
          <TextInput
            accessibilityLabel="Message"
            editable={!sending && !recording}
            maxLength={maxLength}
            multiline
            onChangeText={onChangeText}
            onFocus={onFocus}
            placeholder={placeholder}
            placeholderTextColor={SitGuruColors.textSoft}
            style={styles.input}
            value={value}
          />
        </View>

        <BubblePressable
          accessibilityLabel="Send message"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={handleSend}
          scaleTo={0.88}
          style={[styles.send, !canSend && styles.sendDisabled]}
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Send color="#FFFFFF" size={18} strokeWidth={2.6} />
          )}
        </BubblePressable>
      </View>
    </View>
  );
}

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: SitGuruColors.surface,
    borderTopColor: SitGuruColors.border,
    borderTopWidth: 1,
    gap: MobileSpace.sm,
    paddingBottom: MobileSpace.sm,
    paddingHorizontal: MobileSpace.md,
    paddingTop: MobileSpace.sm,
    width: '100%',
  },
  quickBar: {
    gap: MobileSpace.sm,
    paddingVertical: 2,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  chipRecording: {
    backgroundColor: '#B42318',
    borderColor: '#B42318',
  },
  chipText: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.caption,
  },
  chipTextRecording: {
    color: '#FFFFFF',
  },
  preview: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: MobileSpace.sm,
  },
  previewImage: {
    borderRadius: 12,
    height: 64,
    width: 64,
  },
  voicePreview: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: MobileSpace.sm,
    minHeight: TOUCH_MIN,
    paddingHorizontal: MobileSpace.md,
  },
  voicePreviewText: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.label,
  },
  clearAttachment: {
    alignItems: 'center',
    height: TOUCH_MIN,
    justifyContent: 'center',
    width: TOUCH_MIN,
  },
  composer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: MobileSpace.sm,
  },
  inputWrap: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    maxHeight: 120,
    minHeight: TOUCH_MIN,
    paddingHorizontal: MobileSpace.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  input: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.body,
    lineHeight: 22,
    maxHeight: 96,
    padding: 0,
  },
  send: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 16,
    height: TOUCH_MIN,
    justifyContent: 'center',
    width: TOUCH_MIN,
  },
  sendDisabled: {
    opacity: 0.45,
  },
});
