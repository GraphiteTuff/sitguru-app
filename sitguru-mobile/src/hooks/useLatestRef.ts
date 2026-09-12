import { useEffect, useRef } from 'react';

/**
 * Keep a ref pointed at the latest value without writing it during render.
 * Used so realtime/location callbacks stay current without reconnecting.
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
