import { StyleSheet, Text, View } from 'react-native';

import SitGuruIconBadge, { type SitGuruIconName } from '@/components/SitGuruIconBadge';
import { SitGuruColors } from '@/constants/colors';

type SitGuruBottomNavTone = 'primary' | 'warning' | 'danger';

type SitGuruBottomNavItem = {
  icon: SitGuruIconName;
  label: string;
};

type SitGuruBottomNavProps = {
  activeIndex?: number;
  items: SitGuruBottomNavItem[];
  tone?: SitGuruBottomNavTone;
};

export default function SitGuruBottomNav({
  activeIndex = 0,
  items,
  tone = 'primary',
}: SitGuruBottomNavProps) {
  return (
    <View style={styles.nav} accessibilityLabel="Dashboard navigation preview">
      {items.map((item, index) => {
        const isActive = index === activeIndex;

        return (
          <View
            key={item.label}
            style={[styles.item, isActive ? toneStyles[tone].activeItem : null]}
          >
            <SitGuruIconBadge
              name={item.icon}
              size="small"
              tone={isActive ? toneStyles[tone].badgeTone : 'neutral'}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                isActive ? toneStyles[tone].activeLabel : null,
              ]}
            >
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
    padding: 8,
  },
  item: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    gap: 4,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  label: {
    color: SitGuruColors.textSoft,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
  },
});

const toneStyles = {
  primary: {
    activeItem: {
      backgroundColor: SitGuruColors.surfaceSoft,
    },
    badgeTone: 'primary' as const,
    activeLabel: {
      color: SitGuruColors.primary,
    },
  },
  warning: {
    activeItem: {
      backgroundColor: 'rgba(181, 71, 8, 0.10)',
    },
    badgeTone: 'warning' as const,
    activeLabel: {
      color: SitGuruColors.warning,
    },
  },
  danger: {
    activeItem: {
      backgroundColor: 'rgba(180, 35, 24, 0.08)',
    },
    badgeTone: 'danger' as const,
    activeLabel: {
      color: SitGuruColors.danger,
    },
  },
};
