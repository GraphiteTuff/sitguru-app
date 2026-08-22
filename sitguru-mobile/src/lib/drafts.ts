import AsyncStorage from '@react-native-async-storage/async-storage';

export async function readDraft<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeDraft(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Drafts are convenience — the live form still works.
  }
}

export async function clearDraft(key: string) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Ignore storage races when the screen already unmounted.
  }
}
