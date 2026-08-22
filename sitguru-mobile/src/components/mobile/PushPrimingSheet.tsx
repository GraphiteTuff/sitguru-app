import {
  Bell,
  CreditCard,
  MapPin,
  MessageCircle,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BubblePressable from '@/components/BubblePressable';
import { AppFonts } from '@/constants/fonts';
import { useThemeMode } from '@/hooks/use-theme';

type PushPrimingSheetProps = {
  visible: boolean;
  busy?: boolean;
  onAllow: () => void;
  onDismiss: () => void;
};

type Benefit = {
  icon: ComponentType<{ color: string; size: number; strokeWidth: number }>;
  title: string;
  body: string;
};

const BENEFITS: Benefit[] = [
  {
    icon: MapPin,
    title: 'Live care updates',
    body: 'Know the moment a walk starts, and see photos as they arrive.',
  },
  {
    icon: MessageCircle,
    title: 'Messages from your Guru',
    body: 'Reply without keeping the app open.',
  },
  {
    icon: CreditCard,
    title: 'Booking and payment alerts',
    body: 'Confirmations, changes, and receipts as they happen.',
  },
];

/**
 * Asks for consent before the OS dialog appears.
 *
 * iOS allows exactly one system prompt per install, so a cold "Allow
 * notifications?" spends the only attempt. Declining here costs nothing —
 * SitGuru can ask again later.
 */
export default function PushPrimingSheet({
  visible,
  busy = false,
  onAllow,
  onDismiss,
}: PushPrimingSheetProps) {
  const insets = useSafeAreaInsets();
  const isDark = useThemeMode() === 'dark';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onDismiss}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Dismiss notification prompt"
          accessibilityRole="button"
          onPress={onDismiss}
          style={styles.backdrop}
        />

        <View
          style={[
            styles.sheetWrapper,
            { paddingBottom: Math.max(insets.bottom, 14) },
          ]}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.iconBadge}>
              <Bell color={palette.primary} size={26} strokeWidth={2.4} />
            </View>

            <Text style={styles.title}>Stay with your pack</Text>

            <Text style={styles.subtitle}>
              Turn on notifications so you never miss what matters during care.
            </Text>

            <View style={styles.benefits}>
              {BENEFITS.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <View key={benefit.title} style={styles.benefitRow}>
                    <View style={styles.benefitIcon}>
                      <Icon
                        color={palette.primary}
                        size={18}
                        strokeWidth={2.3}
                      />
                    </View>

                    <View style={styles.benefitCopy}>
                      <Text style={styles.benefitTitle}>{benefit.title}</Text>
                      <Text style={styles.benefitBody}>{benefit.body}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <BubblePressable
              accessibilityRole="button"
              accessibilityState={{ busy, disabled: busy }}
              disabled={busy}
              onPress={onAllow}
              style={[styles.primaryButton, busy && styles.disabled]}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Turn on updates</Text>
              )}
            </BubblePressable>

            <BubblePressable
              accessibilityRole="button"
              disabled={busy}
              onPress={onDismiss}
              scaleTo={0.95}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Not now</Text>
            </BubblePressable>

            <Text style={styles.footnote}>
              You can change this any time in Notification settings.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getPalette(isDark: boolean) {
  return {
    surface: isDark ? '#15271F' : '#FFFFFF',
    surfaceSoft: isDark ? '#1C3529' : '#F3F8F4',
    border: isDark ? '#315442' : '#E4D8C7',
    text: isDark ? '#FFF6E9' : '#123F31',
    muted: isDark ? '#A5B5AC' : '#718078',
    primary: isDark ? '#39D982' : '#087449',
    primarySoft: isDark ? '#123E2A' : '#E4F5E9',
    buttonBackground: isDark ? '#159A61' : '#1A5C40',
  };
}

function createStyles(isDark: boolean) {
  const palette = getPalette(isDark);

  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      backgroundColor: 'rgba(0, 0, 0, 0.52)',
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    sheetWrapper: {
      alignItems: 'center',
      paddingHorizontal: Platform.OS === 'web' ? 16 : 0,
      width: '100%',
    },
    sheet: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      gap: 10,
      maxWidth: 430,
      paddingBottom: 16,
      paddingHorizontal: 20,
      paddingTop: 10,
      width: '100%',
    },
    handle: {
      alignSelf: 'center',
      backgroundColor: isDark ? '#6E8277' : '#CBD3CE',
      borderRadius: 999,
      height: 4,
      marginBottom: 6,
      width: 48,
    },
    iconBadge: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 56,
      justifyContent: 'center',
      width: 56,
    },
    title: {
      color: palette.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 22,
      textAlign: 'center',
    },
    subtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    benefits: {
      gap: 12,
      marginTop: 6,
    },
    benefitRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
    },
    benefitIcon: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    benefitCopy: {
      flex: 1,
      gap: 2,
    },
    benefitTitle: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 14,
    },
    benefitBody: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 12,
      lineHeight: 17,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: palette.buttonBackground,
      borderRadius: 14,
      justifyContent: 'center',
      marginTop: 8,
      minHeight: 54,
      paddingHorizontal: 18,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.bold,
      fontSize: 15,
    },
    secondaryButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 46,
    },
    secondaryButtonText: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 14,
    },
    footnote: {
      color: palette.muted,
      fontFamily: AppFonts.regular,
      fontSize: 11,
      opacity: 0.85,
      textAlign: 'center',
    },
    disabled: {
      opacity: 0.6,
    },
  });
}
