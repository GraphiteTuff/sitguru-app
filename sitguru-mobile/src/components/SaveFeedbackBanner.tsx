import {
    AlertCircle,
    CheckCircle2,
    Info,
    X,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { AppFonts } from '@/constants/fonts';

export type SaveFeedbackTone = 'success' | 'warning' | 'error';

export type SaveFeedbackValue = {
  id: number;
  visible: boolean;
  tone: SaveFeedbackTone;
  title: string;
  message: string;
};

const EMPTY_FEEDBACK: SaveFeedbackValue = {
  id: 0,
  visible: false,
  tone: 'success',
  title: '',
  message: '',
};

export function useSaveFeedback() {
  const [feedback, setFeedback] =
    useState<SaveFeedbackValue>(EMPTY_FEEDBACK);

  const show = useCallback(
    (
      tone: SaveFeedbackTone,
      title: string,
      message = '',
    ) => {
      setFeedback({
        id: Date.now(),
        visible: true,
        tone,
        title,
        message,
      });
    },
    [],
  );

  const showSaved = useCallback(
    (
      title = 'Saved',
      message = 'Your changes were saved.',
    ) => show('success', title, message),
    [show],
  );

  const showWarning = useCallback(
    (
      title = 'Changes not fully saved',
      message = 'Review the message and try again.',
    ) => show('warning', title, message),
    [show],
  );

  const showError = useCallback(
    (
      title = 'Unable to save',
      message = 'Your changes were not saved. Please try again.',
    ) => show('error', title, message),
    [show],
  );

  const dismissFeedback = useCallback(() => {
    setFeedback((current) => ({
      ...current,
      visible: false,
    }));
  }, []);

  return {
    feedback,
    showSaved,
    showWarning,
    showError,
    dismissFeedback,
  };
}

export default function SaveFeedbackBanner({
  feedback,
  isDark,
  onDismiss,
  duration = 3600,
}: {
  feedback: SaveFeedbackValue;
  isDark: boolean;
  onDismiss: () => void;
  duration?: number;
}) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!feedback.visible) {
      animation.setValue(0);
      return;
    }

    animation.setValue(0);

    Animated.timing(animation, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(animation, {
        duration: 180,
        easing: Easing.in(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }).start(() => onDismiss());
    }, duration);

    return () => clearTimeout(timer);
  }, [
    animation,
    duration,
    feedback.id,
    feedback.visible,
    onDismiss,
  ]);

  if (!feedback.visible) return null;

  const palette = getPalette(feedback.tone, isDark);

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.banner,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [-16, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: palette.iconBackground },
        ]}
      >
        {feedback.tone === 'success' ? (
          <CheckCircle2
            color={palette.icon}
            size={22}
            strokeWidth={2.5}
          />
        ) : feedback.tone === 'error' ? (
          <AlertCircle
            color={palette.icon}
            size={22}
            strokeWidth={2.5}
          />
        ) : (
          <Info
            color={palette.icon}
            size={22}
            strokeWidth={2.5}
          />
        )}
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, { color: palette.title }]}>
          {feedback.title}
        </Text>

        {feedback.message ? (
          <Text style={[styles.message, { color: palette.text }]}>
            {feedback.message}
          </Text>
        ) : null}
      </View>

      <Pressable
        accessibilityLabel="Dismiss save confirmation"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onDismiss}
        style={styles.dismissButton}
      >
        <X
          color={palette.text}
          size={18}
          strokeWidth={2.4}
        />
      </Pressable>
    </Animated.View>
  );
}

function getPalette(tone: SaveFeedbackTone, isDark: boolean) {
  if (tone === 'error') {
    return {
      background: isDark ? '#351914' : '#FFF1EE',
      border: isDark ? '#7A3C31' : '#F2B8AD',
      iconBackground: isDark ? '#4B211A' : '#FFE0D9',
      icon: '#F15A3A',
      title: isDark ? '#FFF4F0' : '#7B2517',
      text: isDark ? '#EEC7BF' : '#8C4A3E',
    };
  }

  if (tone === 'warning') {
    return {
      background: isDark ? '#342912' : '#FFF8E5',
      border: isDark ? '#75602A' : '#EED78E',
      iconBackground: isDark ? '#4B3A16' : '#FFF0B8',
      icon: isDark ? '#F4CC57' : '#A96F00',
      title: isDark ? '#FFF7D8' : '#6C4B00',
      text: isDark ? '#E8DDAF' : '#80661F',
    };
  }

  return {
    background: isDark ? '#0D3222' : '#ECF9F0',
    border: isDark ? '#2C7450' : '#A9DEBA',
    iconBackground: isDark ? '#154A31' : '#D6F2DF',
    icon: isDark ? '#39D982' : '#087449',
    title: isDark ? '#F0FFF6' : '#075A39',
    text: isDark ? '#BFE2CC' : '#3C6855',
  };
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    left: 14,
    maxWidth: 410,
    minHeight: 66,
    paddingHorizontal: 11,
    paddingVertical: 10,
    position: 'absolute',
    right: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 13,
    top: Platform.OS === 'web' ? 40 : 14,
    zIndex: 1000,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontFamily: AppFonts.extraBold,
    fontSize: 11,
  },
  message: {
    fontFamily: AppFonts.medium,
    fontSize: 8,
    lineHeight: 12,
  },
  dismissButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 30,
  },
});