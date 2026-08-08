import { Settings2 } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';

import StickyActionBar from '@/components/mobile/StickyActionBar';
import SitGuruButton from '@/components/SitGuruButton';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace, MobileType, TOUCH_MIN } from '@/constants/mobile-layout';
import { useNotificationPreferences } from '@/hooks/data/useNotificationPreferences';

type NotificationPreferencePanelProps = {
  onDone?: () => void;
  showStickyDone?: boolean;
};

/**
 * Modular Switch matrix for Live Walk / Chat & Media / Financial alerts.
 */
export default function NotificationPreferencePanel({
  onDone,
  showStickyDone = false,
}: NotificationPreferencePanelProps) {
  const {
    preferences,
    savingKey,
    message,
    options,
    toggle,
  } = useNotificationPreferences();

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Push controls</Text>
          <Text style={styles.title}>Notification settings</Text>
          <Text style={styles.helper}>
            Toggle only the alerts you want on this device. Changes sync to your
            SitGuru session.
          </Text>
        </View>
        <Settings2 color={SitGuruColors.primary} size={22} strokeWidth={2.3} />
      </View>

      {options.map((option) => {
        const busy = savingKey === option.key;

        return (
          <View key={option.key} style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.label}>{option.label}</Text>
              <Text style={styles.rowHelper}>{option.helper}</Text>
            </View>

            {busy ? (
              <ActivityIndicator color={SitGuruColors.primary} size="small" />
            ) : (
              <Switch
                accessibilityLabel={option.label}
                onValueChange={() => void toggle(option.key)}
                trackColor={{
                  false: SitGuruColors.border,
                  true: SitGuruColors.primaryLight,
                }}
                thumbColor={
                  preferences[option.key]
                    ? SitGuruColors.primary
                    : '#FFFFFF'
                }
                value={preferences[option.key]}
              />
            )}
          </View>
        );
      })}

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {showStickyDone && onDone ? (
        <StickyActionBar embedded>
          <SitGuruButton label="Done" onPress={onDone} />
        </StickyActionBar>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: MobileSpace.md,
    padding: MobileSpace.lg,
    width: '100%',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: MobileSpace.md,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.semiBold,
    fontSize: MobileType.caption,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.section,
  },
  helper: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.regular,
    fontSize: MobileType.body,
    lineHeight: 21,
  },
  row: {
    alignItems: 'center',
    borderTopColor: SitGuruColors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: MobileSpace.md,
    minHeight: TOUCH_MIN + 8,
    paddingTop: MobileSpace.md,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.semiBold,
    fontSize: MobileType.body,
  },
  rowHelper: {
    color: SitGuruColors.textSoft,
    fontFamily: AppFonts.regular,
    fontSize: MobileType.caption,
    lineHeight: 18,
  },
  message: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.caption,
  },
});
