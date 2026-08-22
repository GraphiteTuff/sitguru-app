import { Heart, Star } from 'lucide-react-native';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import FocusTextInput from '@/components/mobile/FocusTextInput';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace, MobileType, TOUCH_MIN } from '@/constants/mobile-layout';
import {
  RATING_LABELS,
  REVIEW_TEXT_MAX,
  VISIT_PRAISE_TAGS,
} from '@/lib/reviews/visit-review';

type VisitReviewControlsProps = {
  rating: number;
  onRatingChange: (rating: number) => void;
  selectedPraise: string[];
  onTogglePraise: (tag: string) => void;
  reviewText: string;
  onReviewTextChange: (text: string) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Touch-friendly 5-star selector + praise tag grid + capped testimonial field.
 */
export default function VisitReviewControls({
  rating,
  onRatingChange,
  selectedPraise,
  onTogglePraise,
  reviewText,
  onReviewTextChange,
  disabled = false,
  style,
}: VisitReviewControlsProps) {
  const length = reviewText.trim().length;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= rating;

          return (
            <BubblePressable
              key={star}
              accessibilityLabel={`${star} star rating`}
              accessibilityRole="button"
              accessibilityState={{ selected: star === rating }}
              disabled={disabled}
              hitSlop={8}
              onPress={() => onRatingChange(star)}
              scaleTo={0.88}
              style={[
                styles.starButton,
                disabled ? styles.disabledControl : null,
              ]}
            >
              <Star
                color={active ? '#F3AA1F' : SitGuruColors.border}
                fill={active ? '#F3AA1F' : 'transparent'}
                size={40}
                strokeWidth={2}
              />
            </BubblePressable>
          );
        })}
      </View>

      <Text style={styles.ratingLabel}>
        {RATING_LABELS[rating] || 'Rate this visit'}
      </Text>

      <Text style={styles.fieldLabel}>What stood out</Text>
      <View style={styles.praiseGrid}>
        {VISIT_PRAISE_TAGS.map((tag) => {
          const active = selectedPraise.includes(tag);

          return (
            <BubblePressable
              key={tag}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              disabled={disabled}
              onPress={() => onTogglePraise(tag)}
              scaleTo={0.88}
              style={[
                styles.praiseChip,
                active ? styles.praiseChipActive : null,
                disabled ? styles.disabledControl : null,
              ]}
            >
              <Heart
                color={active ? '#FFFFFF' : SitGuruColors.textMuted}
                fill={active ? '#FFFFFF' : 'transparent'}
                size={14}
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.praiseChipText,
                  active ? styles.praiseChipTextActive : null,
                ]}
              >
                {tag}
              </Text>
            </BubblePressable>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>Your review</Text>
      <FocusTextInput
        multiline
        value={reviewText}
        onChangeText={onReviewTextChange}
        placeholder="Share what went well and what future Pet Parents should know."
        editable={!disabled}
        textAlignVertical="top"
        maxLength={REVIEW_TEXT_MAX}
        inputStyle={styles.reviewInput}
      />
      <Text
        style={[
          styles.characterCount,
          length >= REVIEW_TEXT_MAX ? styles.characterCountMax : null,
        ]}
      >
        {length}/{REVIEW_TEXT_MAX}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: MobileSpace.md,
    width: '100%',
  },
  stars: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  starButton: {
    alignItems: 'center',
    height: TOUCH_MIN,
    justifyContent: 'center',
    minWidth: TOUCH_MIN,
  },
  disabledControl: {
    opacity: 0.55,
  },
  ratingLabel: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.semiBold,
    fontSize: MobileType.body,
    textAlign: 'center',
  },
  fieldLabel: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.semiBold,
    fontSize: MobileType.caption,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  praiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MobileSpace.sm,
  },
  praiseChip: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  praiseChipActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  praiseChipText: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.caption,
  },
  praiseChipTextActive: {
    color: '#FFFFFF',
  },
  reviewInput: {
    minHeight: 128,
    paddingVertical: MobileSpace.md,
  },
  characterCount: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.caption,
    textAlign: 'right',
  },
  characterCountMax: {
    color: SitGuruColors.danger,
  },
});
