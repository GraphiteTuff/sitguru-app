import { useEffect, type ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import rogueAvatar from '@/assets/images/rogue-avatar.png';
import { AppFonts } from '@/constants/fonts';

type SitGuruBootScreenProps = {
  label?: string;
  children?: ReactNode;
};

/**
 * In-app launch canvas after the iPhone splash image.
 * Native iOS splash cannot play video; Rogue animates as soon as JS is up.
 */
export default function SitGuruBootScreen({
  label = 'Loading your SitGuru…',
  children,
}: SitGuruBootScreenProps) {
  const bounce = useSharedValue(0);
  const tilt = useSharedValue(0);
  const glow = useSharedValue(0.18);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(-10, {
          duration: 420,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(0, {
          duration: 520,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );

    tilt.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 640, easing: Easing.inOut(Easing.sin) }),
        withTiming(7, { duration: 640, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    glow.value = withRepeat(
      withSequence(
        withTiming(0.34, { duration: 700 }),
        withTiming(0.16, { duration: 700 }),
      ),
      -1,
      true,
    );
  }, [bounce, glow, tilt]);

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounce.value },
      { rotate: `${tilt.value}deg` },
      { scale: 1 + Math.abs(bounce.value) / 180 },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 1.02 + glow.value * 0.18 }],
  }));

  return (
    <View accessibilityLabel={label} style={styles.screen}>
      <View style={styles.stage}>
        <Animated.View style={[styles.halo, haloStyle]} />
        <Animated.View style={[styles.frame, avatarStyle]}>
          <View style={styles.photoFill} />
          <Image
            accessibilityLabel="Rogue, SitGuru mascot"
            resizeMode="cover"
            source={rogueAvatar}
            style={styles.photo}
          />
        </Animated.View>
      </View>

      <Text allowFontScaling maxFontSizeMultiplier={1.25} style={styles.label}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const AVATAR = 168;

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: '#0D5C3A',
    flex: 1,
    gap: 18,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  stage: {
    alignItems: 'center',
    height: AVATAR + 28,
    justifyContent: 'center',
    width: AVATAR + 28,
  },
  halo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: AVATAR + 22,
    position: 'absolute',
    width: AVATAR + 22,
  },
  frame: {
    borderRadius: 999,
    height: AVATAR,
    overflow: 'hidden',
    width: AVATAR,
  },
  photoFill: {
    backgroundColor: '#FFFFFF',
    ...StyleSheet.absoluteFillObject,
  },
  photo: {
    height: '100%',
    width: '100%',
  },
  label: {
    color: '#FFFFFF',
    fontFamily: AppFonts.medium,
    fontSize: 15,
    textAlign: 'center',
  },
});
