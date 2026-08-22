import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { playAppHaptic } from '@/lib/haptics';

type FocusedInput = {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
};

type KeyboardSafeContextValue = {
  keyboardHeight: number;
  revealFocusedInput: () => void;
};

const KeyboardSafeContext = createContext<KeyboardSafeContextValue>({
  keyboardHeight: 0,
  revealFocusedInput: () => undefined,
});

export function useKeyboardSafe() {
  return useContext(KeyboardSafeContext);
}

function getFocusedInput(): FocusedInput | null {
  const state = TextInput.State as {
    currentlyFocusedInput?: () => FocusedInput | null;
  };

  if (typeof state.currentlyFocusedInput !== 'function') return null;
  return state.currentlyFocusedInput() ?? null;
}

/**
 * App-wide keyboard guard. After the keyboard opens it measures the focused
 * field and lifts the tree only as far as needed so typing stays visible.
 * Screens that already avoid the keyboard correctly measure as uncovered and
 * are left alone.
 */
export default function KeyboardSafeHost({ children }: { children: ReactNode }) {
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const lift = useRef(new Animated.Value(0)).current;
  const liftOffsetRef = useRef(0);
  const windowHeightRef = useRef(windowHeight);
  const keyboardHeightRef = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  windowHeightRef.current = windowHeight;

  const applyLift = useCallback(
    (next: number) => {
      const safe = Math.max(0, Math.round(next));
      if (safe === liftOffsetRef.current) return;
      liftOffsetRef.current = safe;

      if (reduceMotion || Platform.OS === 'web') {
        lift.setValue(safe);
        return;
      }

      Animated.timing(lift, {
        toValue: safe,
        duration: Platform.OS === 'ios' ? 280 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [lift, reduceMotion],
  );

  const revealFocusedInput = useCallback(() => {
    if (Platform.OS === 'web') return;

    const input = getFocusedInput();
    if (!input) {
      if (keyboardHeightRef.current === 0) applyLift(0);
      return;
    }

    input.measureInWindow((_x, y, _width, height) => {
      if (!Number.isFinite(y) || !Number.isFinite(height) || height <= 0) {
        return;
      }

      const keyboardInset = Platform.OS === 'ios' ? keyboardHeightRef.current : 0;
      const visibleBottom = windowHeightRef.current - keyboardInset - 16;
      const untransformedBottom = y + liftOffsetRef.current + height;
      applyLift(Math.max(0, untransformedBottom - visibleBottom));
    });
  }, [applyLift]);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;

    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (event) => {
      const nextHeight = event.endCoordinates?.height ?? 0;
      keyboardHeightRef.current = nextHeight;
      setKeyboardHeight(nextHeight);
      playAppHaptic('selection');
      revealFocusedInput();
      setTimeout(revealFocusedInput, Platform.OS === 'ios' ? 320 : 90);
    });

    let frameTimer: ReturnType<typeof setTimeout> | null = null;
    const frame =
      Platform.OS === 'ios'
        ? Keyboard.addListener('keyboardWillChangeFrame', (event) => {
            const nextHeight = event.endCoordinates?.height ?? 0;
            keyboardHeightRef.current = nextHeight;
            setKeyboardHeight(nextHeight);
            if (frameTimer) clearTimeout(frameTimer);
            frameTimer = setTimeout(revealFocusedInput, 48);
          })
        : null;

    const hide = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = 0;
      setKeyboardHeight(0);
      applyLift(0);
    });

    return () => {
      show.remove();
      frame?.remove();
      hide.remove();
      if (frameTimer) clearTimeout(frameTimer);
    };
  }, [applyLift, revealFocusedInput]);

  const value = useMemo(
    () => ({ keyboardHeight, revealFocusedInput }),
    [keyboardHeight, revealFocusedInput],
  );

  return (
    <KeyboardSafeContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            flex: 1,
            transform: [{ translateY: Animated.multiply(lift, -1) }],
          }}
        >
          {children}
        </Animated.View>
      </View>
    </KeyboardSafeContext.Provider>
  );
}
