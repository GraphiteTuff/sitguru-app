/* eslint-disable react-hooks/refs -- RN Animated.Value is the supported fade driver; .current is read to pass that driver into styles, not to store React state. */
import { useEventListener } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from 'expo-router';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react-native';
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  AppState,
  Image,
  type ImageSourcePropType,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import {
  HOME_HERO_CLIP_SETTINGS,
  HOME_HERO_VIDEO_LABELS,
} from '@/components/home-hero-clips';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export { HOME_HERO_CLIP_SETTINGS, HOME_HERO_VIDEO_LABELS };

/** Share of the 16:9 frame kept visible on a tall phone before we stop zooming out. */
const HOWLWEEN_TARGET_VISIBLE_WIDTH = 0.66;

export type HomeHeroClip = {
  source: number;
  poster: ImageSourcePropType;
  label: string;
  playbackRate: number;
  hasAudioControl: boolean;
  framing: 'standard' | 'howlween';
};

type HomeHeroMediaProps = {
  clips: readonly HomeHeroClip[];
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
      <Image
        accessible={false}
        alt=""
        source={poster}
        resizeMode="cover"
        style={styles.fill}
      />
      <HeroScrim />
    </View>
  );
}

function howlweenScaleFor(width: number, height: number) {
  if (width <= 0 || height <= 0) return 1;

  const coverVisibleFraction = width / (height * (16 / 9));
  if (coverVisibleFraction >= HOWLWEEN_TARGET_VISIBLE_WIDTH) return 1;

  return coverVisibleFraction / HOWLWEEN_TARGET_VISIBLE_WIDTH;
}

function applyClipAudio(player: VideoPlayer, audible: boolean) {
  player.muted = !audible;
  player.volume = audible ? 1 : 0;
}

function ActiveHeroClip({
  source,
  playbackRate,
  paused,
  audible,
  useBanner,
  bannerTop,
  bannerHeight,
  onEnded,
  onPlayer,
}: {
  source: number;
  playbackRate: number;
  paused: boolean;
  audible: boolean;
  useBanner: boolean;
  bannerTop: number;
  bannerHeight: number;
  onEnded: () => void;
  onPlayer: (player: VideoPlayer | null) => void;
}) {
  const player = useVideoPlayer(source, (nextPlayer) => {
    nextPlayer.loop = false;
    nextPlayer.staysActiveInBackground = false;
    nextPlayer.showNowPlayingNotification = false;
    applyClipAudio(nextPlayer, audible);
    nextPlayer.playbackRate = playbackRate;
    if (!paused) {
      nextPlayer.play();
    }
  });

  useEffect(() => {
    onPlayer(player);
    return () => onPlayer(null);
  }, [onPlayer, player]);

  useEffect(() => {
    // expo-video documents a mutable player; rate/play/pause are not React state.
    // eslint-disable-next-line react-hooks/immutability -- VideoPlayer is an external mutable host object
    player.playbackRate = playbackRate;
    applyClipAudio(player, audible);

    if (paused) {
      player.pause();
      return;
    }

    try {
      const pending = player.play() as void | Promise<void>;
      if (pending && typeof pending.then === 'function') {
        void pending.catch(() => {
          if (!player.muted) {
            applyClipAudio(player, false);
            player.play();
          }
        });
      }
    } catch {
      if (!player.muted) {
        applyClipAudio(player, false);
        try {
          player.play();
        } catch {
          player.pause();
        }
      }
    }
  }, [audible, paused, playbackRate, player]);

  useEventListener(player, 'playToEnd', onEnded);

  return (
    <View
      pointerEvents="none"
      style={
        useBanner
          ? [styles.howlweenBanner, { top: bannerTop, height: bannerHeight }]
          : styles.fill
      }
    >
      <VideoView
        contentFit="cover"
        fullscreenOptions={{ enable: false }}
        nativeControls={false}
        player={player}
        playsInline
        pointerEvents="none"
        style={useBanner ? styles.bannerVideo : styles.fill}
        surfaceType={Platform.OS === 'android' ? 'textureView' : undefined}
        useExoShutter={false}
      />
    </View>
  );
}

function RotatingHeroVideo({
  clips,
  activeIndex,
  onActiveIndexChange,
  onTransitionChange,
  topInset: _topInset = 0,
  bottomInset = 0,
}: HomeHeroMediaProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const rotatingRef = useRef(false);
  const playerRef = useRef<VideoPlayer | null>(null);
  const userStartedRef = useRef(false);
  const reduceMotion = useReducedMotion();
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [paused, setPaused] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  const clip = clips[activeIndex] ?? clips[0];
  const screenActive = isFocused && appActive;
  const playbackPaused = paused || !screenActive;
  const audible = Boolean(clip?.hasAudioControl && audioEnabled && screenActive && !playbackPaused);
  const useHowlweenBanner =
    clip?.framing === 'howlween' && howlweenScaleFor(frameSize.width, frameSize.height) < 0.995;
  const bannerHeight = frameSize.width * (9 / 16);
  const bannerTop = Math.max(0, (frameSize.height - bannerHeight) * 0.42);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const active = nextState === 'active';
      setAppActive(active);

      const player = playerRef.current;
      if (!player) return;

      if (!active) {
        applyClipAudio(player, false);
        player.pause();
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion && !userStartedRef.current) {
      setPaused(true);
    }
  }, [reduceMotion]);

  useEffect(() => {
    if (!isFocused) {
      const player = playerRef.current;
      if (!player) return;
      applyClipAudio(player, false);
      player.pause();
    }
  }, [isFocused]);

  function rotateToNext() {
    if (rotatingRef.current || clips.length < 2) {
      return;
    }

    rotatingRef.current = true;
    applyClipAudioSafe();
    onActiveIndexChange((activeIndex + 1) % clips.length);
    onTransitionChange?.(false);
    opacity.setValue(1);
    rotatingRef.current = false;
  }

  function applyClipAudioSafe() {
    const player = playerRef.current;
    if (!player) return;
    applyClipAudio(player, false);
  }

  const handlePlayer = useCallback((player: VideoPlayer | null) => {
    playerRef.current = player;
  }, []);

  function togglePlayback() {
    if (playbackPaused) {
      userStartedRef.current = true;
      setPaused(false);
      return;
    }

    setPaused(true);
    playerRef.current?.pause();
  }

  function toggleHalloweenAudio() {
    if (!clip?.hasAudioControl) return;

    const nextEnabled = !audioEnabled;
    setAudioEnabled(nextEnabled);
    const player = playerRef.current;
    if (!player || !screenActive) return;

    const playSound = nextEnabled && !paused;
    applyClipAudio(player, playSound);
    if (playSound) {
      userStartedRef.current = true;
      setPaused(false);
      try {
        player.play();
      } catch {
        applyClipAudio(player, false);
        setAudioEnabled(false);
      }
    }
  }

  if (!clip) {
    return <View style={styles.root} />;
  }

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setFrameSize((current) =>
          current.width === width && current.height === height ? current : { width, height },
        );
      }}
    >
      <Image
        accessible={false}
        alt=""
        source={clip.poster}
        blurRadius={useHowlweenBanner ? 28 : 0}
        resizeMode="cover"
        style={styles.fill}
      />

      <Animated.View style={[styles.fill, { opacity }]}>
        <ActiveHeroClip
          key={`${clip.source}-${activeIndex}`}
          source={clip.source}
          playbackRate={clip.playbackRate}
          paused={playbackPaused}
          audible={audible}
          useBanner={useHowlweenBanner}
          bannerTop={bannerTop}
          bannerHeight={bannerHeight}
          onEnded={() => {
            if (!paused && screenActive) {
              rotateToNext();
            }
          }}
          onPlayer={handlePlayer}
        />
      </Animated.View>

      <HeroScrim />

      <View
        style={[
          styles.controls,
          { top: Math.max(_topInset, 0) + 96 },
        ]}
      >
        {clip.hasAudioControl ? (
          <BubblePressable
            accessibilityLabel={audible ? 'Mute Halloween music' : 'Play Halloween music'}
            accessibilityRole="button"
            accessibilityState={{ selected: audible }}
            hitSlop={8}
            onPress={toggleHalloweenAudio}
            scaleTo={0.88}
            style={styles.controlButton}
          >
            {audible ? (
              <Volume2 color="#FFFFFF" size={18} strokeWidth={2.4} />
            ) : (
              <VolumeX color="#FFFFFF" size={18} strokeWidth={2.4} />
            )}
          </BubblePressable>
        ) : null}

        <BubblePressable
          accessibilityLabel={playbackPaused ? 'Play homepage videos' : 'Pause homepage videos'}
          accessibilityRole="button"
          hitSlop={8}
          onPress={togglePlayback}
          scaleTo={0.88}
          style={styles.controlButton}
        >
          {playbackPaused ? (
            <Play color="#FFFFFF" size={18} strokeWidth={2.5} fill="#FFFFFF" />
          ) : (
            <Pause color="#FFFFFF" size={18} strokeWidth={2.5} fill="#FFFFFF" />
          )}
        </BubblePressable>
      </View>
    </View>
  );
}

/**
 * Website-matching full-bleed hero. Howl-ween leads the rotation and is the
 * only clip with a soundtrack control.
 */
export default function HomeHeroMedia(props: HomeHeroMediaProps) {
  const poster = props.clips[props.activeIndex]?.poster ?? props.clips[0]?.poster;
  if (!poster) return null;

  return (
    <HeroMediaErrorBoundary fallback={<PosterFallback poster={poster} />}>
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
    height: '100%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
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
  controls: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    right: 18,
    zIndex: 5,
  },
  howlweenBanner: {
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    width: '100%',
  },
  bannerVideo: {
    height: '100%',
    width: '100%',
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
