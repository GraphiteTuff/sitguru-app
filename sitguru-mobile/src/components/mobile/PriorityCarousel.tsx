import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import TouchTarget from '@/components/mobile/TouchTarget';
import {
  MobileSpace,
  MobileType,
  TOUCH_MIN,
} from '@/constants/mobile-layout';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';

export type PriorityCard = {
  id: string;
  eyebrow: string;
  title: string;
  helper: string;
  /** Deep-dive route or callback via onPress. */
  onPress: () => void;
  tone?: 'primary' | 'surface' | 'warning';
  icon?: ReactNode;
  ctaLabel?: string;
};

type PriorityCarouselProps = {
  cards: PriorityCard[];
  /** Optional label above the carousel. */
  label?: string;
};

function CarouselCardShell({
  focused,
  children,
  width,
}: {
  focused: boolean;
  children: ReactNode;
  width: number;
}) {
  const scale = useSharedValue(focused ? 1 : 0.96);
  const opacity = useSharedValue(focused ? 1 : 0.88);

  useEffect(() => {
    scale.value = withTiming(focused ? 1 : 0.96, { duration: 200 });
    opacity.value = withTiming(focused ? 1 : 0.88, { duration: 200 });
  }, [focused, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ width }, animatedStyle]}>{children}</Animated.View>
  );
}

/**
 * Progressive disclosure: one high-priority card in focus at a time.
 * Swipe horizontally between cards; tap to open the deep-dive screen.
 * Outer app scroll stays vertical — this is the only intentional H-scroll.
 */
export default function PriorityCarousel({
  cards,
  label = 'Now',
}: PriorityCarouselProps) {
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width - MobileSpace.lg * 2, 560);
  const [index, setIndex] = useState(0);
  const scrolling = useRef(false);

  if (!cards.length) return null;

  const onMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const next = Math.round(
      event.nativeEvent.contentOffset.x / Math.max(pageWidth + MobileSpace.sm, 1),
    );
    setIndex(Math.max(0, Math.min(next, cards.length - 1)));
    scrolling.current = false;
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.counter}>
          {index + 1}/{cards.length}
        </Text>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        snapToInterval={pageWidth + MobileSpace.sm}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={styles.track}
        onScrollBeginDrag={() => {
          scrolling.current = true;
        }}
        onMomentumScrollEnd={onMomentumEnd}
      >
        {cards.map((card, cardIndex) => (
          <CarouselCardShell
            key={card.id}
            focused={cardIndex === index}
            width={pageWidth}
          >
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel={`${card.title}. ${card.helper}`}
              onPress={card.onPress}
              style={[
                styles.card,
                card.tone === 'primary' && styles.cardPrimary,
                card.tone === 'warning' && styles.cardWarning,
              ]}
            >
              <View style={styles.cardTop}>
                <View style={styles.copy}>
                  <Text
                    style={[
                      styles.eyebrow,
                      card.tone === 'primary' && styles.textOnPrimary,
                    ]}
                  >
                    {card.eyebrow}
                  </Text>
                  <Text
                    style={[
                      styles.title,
                      card.tone === 'primary' && styles.textOnPrimary,
                    ]}
                    numberOfLines={2}
                  >
                    {card.title}
                  </Text>
                  <Text
                    style={[
                      styles.helper,
                      card.tone === 'primary' && styles.helperOnPrimary,
                    ]}
                    numberOfLines={2}
                  >
                    {card.helper}
                  </Text>
                </View>
                {card.icon ? (
                  <View
                    style={[
                      styles.iconWrap,
                      card.tone === 'primary' && styles.iconOnPrimary,
                    ]}
                  >
                    {card.icon}
                  </View>
                ) : null}
              </View>

              <View style={styles.ctaRow}>
                <Text
                  style={[
                    styles.cta,
                    card.tone === 'primary' && styles.textOnPrimary,
                  ]}
                >
                  {card.ctaLabel ?? 'Open details'}
                </Text>
                <ChevronRight
                  color={
                    card.tone === 'primary' ? '#FFFFFF' : SitGuruColors.primary
                  }
                  size={18}
                  strokeWidth={2.4}
                />
              </View>
            </TouchTarget>
          </CarouselCardShell>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {cards.map((card, i) => (
          <View
            key={card.id}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: MobileSpace.sm,
    maxWidth: '100%',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  label: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.caption,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  counter: {
    color: SitGuruColors.textSoft,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.caption,
  },
  track: {
    gap: MobileSpace.sm,
    paddingRight: MobileSpace.sm,
  },
  card: {
    alignItems: 'stretch',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: MobileSpace.md,
    justifyContent: 'space-between',
    minHeight: 148,
    padding: MobileSpace.lg,
    width: '100%',
  },
  cardPrimary: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  cardWarning: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  cardTop: {
    flexDirection: 'row',
    gap: MobileSpace.md,
    width: '100%',
  },
  copy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  eyebrow: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  helper: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  textOnPrimary: {
    color: '#FFFFFF',
  },
  helperOnPrimary: {
    color: 'rgba(255,255,255,0.86)',
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 16,
    height: TOUCH_MIN,
    justifyContent: 'center',
    width: TOUCH_MIN,
  },
  iconOnPrimary: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  ctaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    minHeight: TOUCH_MIN - 8,
  },
  cta: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.extraBold,
    fontSize: 14,
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  dot: {
    backgroundColor: SitGuruColors.border,
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  dotActive: {
    backgroundColor: SitGuruColors.primary,
    width: 16,
  },
});
