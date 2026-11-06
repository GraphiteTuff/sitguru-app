import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Pulse = { id: string; message: string; tone: 'loading' | 'success' | 'error' };

type PawPulseApi = {
  begin: (message: string, id?: string) => string;
  succeed: (id: string, message: string) => void;
  fail: (id: string, message: string) => void;
};

const PawPulseContext = createContext<PawPulseApi | null>(null);

export function PawPulseHost({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Pulse[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    const active = timers.current;
    return () => {
      for (const timer of active.values()) clearTimeout(timer);
      active.clear();
    };
  }, []);

  const begin = useCallback((message: string, id = `paw-${Date.now()}`) => {
    setItems((current) => {
      if (current.some((item) => item.id === id && item.tone === 'loading')) return current;
      return [...current.filter((item) => item.id !== id), { id, message, tone: 'loading' }];
    });
    return id;
  }, []);

  const succeed = useCallback((id: string, message: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, message, tone: 'success' } : item)));
    const existing = timers.current.get(id);
    if (existing) clearTimeout(existing);
    timers.current.set(
      id,
      setTimeout(() => {
        timers.current.delete(id);
        setItems((current) => current.filter((item) => item.id !== id));
      }, 4000),
    );
  }, []);

  const fail = useCallback((id: string, message: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, message, tone: 'error' } : item)));
  }, []);

  const api = useMemo(() => ({ begin, succeed, fail }), [begin, fail, succeed]);

  return (
    <PawPulseContext.Provider value={api}>
      {children}
      <View
        pointerEvents="box-none"
        style={[styles.stack, { bottom: Math.max(insets.bottom, 8) + 72, right: 12 }]}
        accessibilityLiveRegion="polite"
      >
        {items.map((item) => (
          <View key={item.id} style={styles.card} accessibilityRole="alert">
            <Text style={styles.paw}>{item.tone === 'error' ? '!' : item.tone === 'success' ? '✓' : '🐾'}</Text>
            <Text style={styles.message}>{item.message}</Text>
            {item.tone === 'error' ? (
              <Pressable accessibilityRole="button" onPress={() => setItems((current) => current.filter((row) => row.id !== item.id))}>
                <Text style={styles.dismiss}>Dismiss</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>
    </PawPulseContext.Provider>
  );
}

export function usePawPulse() {
  return useContext(PawPulseContext);
}

const styles = StyleSheet.create({
  stack: { position: 'absolute', width: 320, maxWidth: '92%', gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  paw: { color: '#0D5C3A', fontWeight: '800' },
  message: { flex: 1, color: '#0F2744', fontWeight: '700' },
  dismiss: { color: '#64748B', fontWeight: '800' },
});
