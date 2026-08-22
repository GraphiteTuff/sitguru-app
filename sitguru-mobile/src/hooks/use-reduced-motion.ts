import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

let currentValue = false;
const subscribers = new Set<(value: boolean) => void>();
let listening = false;

function ensureListener() {
  if (listening) return;
  listening = true;

  void AccessibilityInfo.isReduceMotionEnabled()
    .then((value) => {
      currentValue = value;
      subscribers.forEach((listener) => listener(value));
    })
    .catch(() => undefined);

  AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
    currentValue = value;
    subscribers.forEach((listener) => listener(value));
  });
}

/** Shared reduce-motion flag so pressables do not each attach a listener. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(currentValue);

  useEffect(() => {
    ensureListener();
    setReduced(currentValue);
    subscribers.add(setReduced);
    return () => {
      subscribers.delete(setReduced);
    };
  }, []);

  return reduced;
}
