import type { LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GlassChrome from '@/components/mobile/GlassChrome';
import { AppFonts } from '@/constants/fonts';
import { TOUCH_MIN } from '@/constants/mobile-layout';
import type { TabChromePalette } from '@/constants/role-palettes';
import { MAX_CHROME_FONT_MULTIPLIER } from '@/lib/a11y/type-scale';
import { playAppHaptic } from '@/lib/haptics';

export type ToolbarOverflowMenuItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  selected?: boolean;
};

type ToolbarOverflowMenuProps = {
  visible: boolean;
  items: ToolbarOverflowMenuItem[];
  palette: TabChromePalette;
  onClose: () => void;
  onItemPress: (item: ToolbarOverflowMenuItem) => void;
};

/**
 * SitGuru overflow menu — UIKit additionalOverflowItems / SwiftUI
 * ToolbarOverflowMenu: secondary + unfitted actions, never a sixth tab.
 */
export default function ToolbarOverflowMenu({
  visible,
  items,
  palette,
  onClose,
  onItemPress,
}: ToolbarOverflowMenuProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View pointerEvents="box-none" style={styles.root}>
        <Pressable
          accessibilityLabel="Dismiss overflow menu"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />

        <View
          pointerEvents="box-none"
          style={[
            styles.anchor,
            { paddingBottom: Math.max(insets.bottom, 8) + 78 },
          ]}
        >
          <GlassChrome
            fallbackColor={palette.fallback}
            style={[styles.sheet, { borderColor: palette.border }]}
            tintColor={palette.tint}
          >
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={MAX_CHROME_FONT_MULTIPLIER}
              style={[styles.heading, { color: palette.mutedColor }]}
            >
              More
            </Text>

            {items.map((item) => {
              const Icon = item.icon;
              const color = item.selected
                ? palette.activeColor
                : palette.mutedColor;

              return (
                <Pressable
                  key={item.key}
                  accessibilityLabel={item.label}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: Boolean(item.selected) }}
                  hitSlop={6}
                  onPress={() => {
                    playAppHaptic('selection');
                    onItemPress(item);
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    item.selected && { backgroundColor: palette.bubble },
                    pressed && styles.rowPressed,
                  ]}
                >
                  <View style={styles.iconWell}>
                    <Icon
                      color={color}
                      size={22}
                      strokeWidth={item.selected ? 2.5 : 2.1}
                    />
                    {item.badge ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {item.badge > 9 ? '9+' : item.badge}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text
                    maxFontSizeMultiplier={MAX_CHROME_FONT_MULTIPLIER}
                    numberOfLines={1}
                    style={[styles.label, { color }]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </GlassChrome>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(16, 24, 20, 0.28)',
  },
  anchor: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  sheet: {
    alignSelf: 'flex-end',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 320,
    overflow: 'hidden',
    paddingBottom: 8,
    paddingTop: 12,
    width: '100%',
  },
  heading: {
    fontFamily: AppFonts.bold,
    fontSize: 12,
    letterSpacing: 0.4,
    paddingBottom: 6,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: TOUCH_MIN,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rowPressed: {
    opacity: 0.72,
  },
  iconWell: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  label: {
    flex: 1,
    fontFamily: AppFonts.bold,
    fontSize: 16,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#E5484D',
    borderRadius: 999,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -8,
    top: -6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: 10,
    lineHeight: 13,
  },
});
