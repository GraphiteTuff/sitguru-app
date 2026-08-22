import { useEventListener } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Pause, Play } from 'lucide-react-native';
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Image,
  type ImageSourcePropType,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';

export const HOME_HERO_VIDEO_LABELS = [
  'Dog Walking',
  'Drop-In Visits',
  'Join the SitGuru Community',
] as const;

const HERO_PLAYBACK_RATES = [1, 1, 0.9] as const;
const HERO_TRANSITION_MS = 420;

type HomeHeroMediaProps = {
  sources: number[];
  poster: ImageSourcePropType;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onTransitionChange?: (isTransitioning: boolean) => void;
  /** Safe-area offsets so controls clear the notch / home indicator. */
  topInset?: number;
  bottomInset?: number;
};

type BoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type BoundaryState = {
  failed: boolean;
};

class HeroMediaErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SitGuru] Full-bleed hero media failed', error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

/*
 * Full-width gradients only. A partial-width overlay leaves a visible seam
 * where its edge meets the uncovered video.
 */
function HeroScrim() {
  return (
    <View pointerEvents="none" style={styles.fill}>
      <View style={styles.shade} />

      <LinearGradient
        colors={[
          'rgba(0,0,0,0.82)',
          'rgba(0,0,0,0.48)',
          'rgba(0,0,0,0.12)',
          'rgba(0,0,0,0)',
        ]}
        locations={[0, 0.38, 0.72, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.fill}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomGradient}
      />
    </View>
  );
}

function PosterFallback({ poster }: { poster: ImageSourcePropType }) {
  return (
    <View style={styles.root} pointerEvents="none">
      <Image source={poster} resizeMode="cover" style={styles.fill} />
      <HeroScrim />
    </View>
  );
}

function ActiveHeroClip({
  source,
  playbackRate,
  paused,
  onEnded,
}: {
  source: number;
  playbackRate: number;
  paused: boolean;
  onEnded: () => void;
}) {
  const player = useVideoPlayer(source, (nextPlayer) => {
    nextPlayer.loop = false;
    nextPlayer.muted = true;
    nextPlayer.playbackRate = playbackRate;
    if (!paused) {
      nextPlayer.play();
    }
  });

  useEffect(() => {
    player.playbackRate = playbackRate;
    if (paused) {
      player.pause();
    } else {
      player.play();
    }
  }, [paused, playbackRate, player]);

  useEventListener(player, 'playToEnd', onEnded);

  return (
    <VideoView
      contentFit="cover"
      nativeControls={false}
      player={player}
      playsInline
      pointerEvents="none"
      style={styles.fill}
      surfaceType={Platform.OS === 'android' ? 'textureView' : undefined}
      useExoShutter={false}
    />
  );
}

function RotatingHeroVideo({
  sources,
  poster,
  activeIndex,
  onActiveIndexChange,
  onTransitionChange,
  topInset: _topInset = 0,
  bottomInset = 0,
}: HomeHeroMediaProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const rotatingRef = useRef(false);
  const [paused, setPaused] = useState(false);

  const source = sources[activeIndex] ?? sources[0];
  const playbackRate = HERO_PLAYBACK_RATES[activeIndex] ?? 1;

  function rotateToNext() {
    if (rotatingRef.current || sources.length < 2) {
      return;
    }

    rotatingRef.current = true;
    onTransitionChange?.(true);

    Animated.timing(opacity, {
      toValue: 0,
      duration: HERO_TRANSITION_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        rotatingRef.current = false;
        onTransitionChange?.(false);
        return;
      }

      const nextIndex = (activeIndex + 1) % sources.length;
      onActiveIndexChange(nextIndex);
      onTransitionChange?.(false);

      Animated.timing(opacity, {
        toValue: 1,
        duration: HERO_TRANSITION_MS,
        useNativeDriver: true,
      }).start(() => {
        rotatingRef.current = false;
      });
    });
  }

  function togglePlayback() {
    setPaused((current) => !current);
  }

  return (
    <View style={styles.root}>
      <Image source={poster} resizeMode="cover" style={styles.fill} />

      <Animated.View style={[styles.fill, { opacity }]}>
        <ActiveHeroClip
          key={activeIndex}
          source={source}
          playbackRate={playbackRate}
          paused={paused}
          onEnded={() => {
            if (!paused) {
              rotateToNext();
            }
          }}
        />
      </Animated.View>

      <HeroScrim />

      <BubblePressable
        accessibilityLabel={paused ? 'Play homepage videos' : 'Pause homepage videos'}
        accessibilityRole="button"
        hitSlop={10}
        onPress={togglePlayback}
        scaleTo={0.88}
        style={[styles.playButton, { bottom: Math.max(bottomInset, 12) + 18 }]}
      >
        {paused ? (
          <Play color="#FFFFFF" size={18} strokeWidth={2.5} fill="#FFFFFF" />
        ) : (
          <Pause color="#FFFFFF" size={18} strokeWidth={2.5} fill="#FFFFFF" />
        )}
      </BubblePressable>
    </View>
  );
}

/**
 * Website-matching full-bleed hero: three videos rotate on end with a soft fade.
 */
export default function HomeHeroMedia(props: HomeHeroMediaProps) {
  const fallback = <PosterFallback poster={props.poster} />;

  return (
    <HeroMediaErrorBoundary fallback={fallback}>
      <RotatingHeroVideo {...props} />
    </HeroMediaErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#020807',
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  fill: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  shade: {
    backgroundColor: 'rgba(0,0,0,0.14)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  bottomGradient: {
    bottom: 0,
    height: '42%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    width: 44,
    zIndex: 5,
  },
});
