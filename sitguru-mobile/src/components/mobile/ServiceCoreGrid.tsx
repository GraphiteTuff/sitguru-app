import {
  Dog,
  Footprints,
  Home,
  Moon,
  Sparkles,
  Sun,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import TouchTarget from '@/components/mobile/TouchTarget';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace, MobileType, TOUCH_MIN } from '@/constants/mobile-layout';

export type CareServiceKey =
  | 'dog_walking'
  | 'pet_sitting'
  | 'boarding'
  | 'drop_in'
  | 'day_care'
  | 'training_support';

export type CareServiceOption = {
  key: CareServiceKey;
  label: string;
  helper: string;
  serviceType: string;
};

export const CARE_SERVICES: CareServiceOption[] = [
  {
    key: 'dog_walking',
    label: 'Dog Walking',
    helper: 'Neighborhood routes & check-ins',
    serviceType: 'Dog Walking',
  },
  {
    key: 'pet_sitting',
    label: 'Pet Sitting',
    helper: 'In-home care with your routines',
    serviceType: 'Pet Sitting',
  },
  {
    key: 'boarding',
    label: 'Boarding',
    helper: 'Overnight stays with a Guru',
    serviceType: 'Boarding',
  },
  {
    key: 'drop_in',
    label: 'Drop-In',
    helper: 'Quick visits for food & potty',
    serviceType: 'Drop-In Visit',
  },
  {
    key: 'day_care',
    label: 'Day Care',
    helper: 'Daytime play and supervision',
    serviceType: 'Day Care',
  },
  {
    key: 'training_support',
    label: 'Training Support',
    helper: 'Coaching alongside booked care',
    serviceType: 'Training Support',
  },
];

const ICONS: Record<
  CareServiceKey,
  ComponentType<{ color?: string; size?: number; strokeWidth?: number }>
> = {
  dog_walking: Dog,
  pet_sitting: Home,
  boarding: Moon,
  drop_in: Footprints,
  day_care: Sun,
  training_support: Sparkles,
};

type ServiceCoreGridProps = {
  selectedKey?: CareServiceKey | null;
  onSelect: (service: CareServiceOption) => void;
};

/**
 * Thumb-accessible service picker — mirrors sitguru.com landing care intents.
 */
export default function ServiceCoreGrid({
  selectedKey = null,
  onSelect,
}: ServiceCoreGridProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Service core</Text>
        <Text style={styles.title}>What does your pet need?</Text>
      </View>

      <View style={styles.grid}>
        {CARE_SERVICES.map((service) => {
          const Icon = ICONS[service.key];
          const active = selectedKey === service.key;

          return (
            <TouchTarget
              key={service.key}
              accessibilityRole="button"
              accessibilityLabel={`${service.label}. ${service.helper}`}
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(service)}
              style={[styles.tile, active && styles.tileActive]}
            >
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <Icon
                  color={active ? '#FFFFFF' : SitGuruColors.primary}
                  size={22}
                  strokeWidth={2.4}
                />
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>
                {service.label}
              </Text>
              <Text
                style={[styles.helper, active && styles.helperActive]}
                numberOfLines={2}
              >
                {service.helper}
              </Text>
            </TouchTarget>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: MobileSpace.md,
    width: '100%',
  },
  header: {
    gap: 2,
  },
  eyebrow: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.caption,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.section,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MobileSpace.sm,
    width: '100%',
  },
  tile: {
    alignItems: 'flex-start',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    gap: MobileSpace.xs,
    minHeight: 112,
    minWidth: '46%',
    padding: MobileSpace.md,
  },
  tileActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 14,
    height: TOUCH_MIN - 4,
    justifyContent: 'center',
    marginBottom: 2,
    width: TOUCH_MIN - 4,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  label: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.label,
  },
  labelActive: {
    color: '#FFFFFF',
  },
  helper: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.micro,
    lineHeight: 16,
  },
  helperActive: {
    color: 'rgba(255,255,255,0.86)',
  },
});
