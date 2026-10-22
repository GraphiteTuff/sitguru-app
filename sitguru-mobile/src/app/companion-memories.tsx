/**
 * Mobile controls to view, correct, and forget AI companion memories.
 * Uses the same authenticated companion APIs as web Account settings.
 */

import { router } from 'expo-router';
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import SitGuruScreen from '@/components/SitGuruScreen';
import { AppFonts } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { companionWebUrl } from '@/lib/ai/companion-api';
import { getSupabaseAccessToken } from '@/lib/supabase';

type MemoryRow = {
  id: string;
  key: string;
  value: string;
  category: string;
  scope: string;
  companion_id: string | null;
  is_active: boolean;
};

export default function CompanionMemoriesScreen() {
  const colors = useThemeColors();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memories, setMemories] = useState<MemoryRow[]>([]);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [draftValue, setDraftValue] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isAuthenticated) {
        setMemories([]);
        return;
      }
      const token = await getSupabaseAccessToken();
      if (!token) {
        setError('Sign in required.');
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      const [memRes, setRes] = await Promise.all([
        fetch(companionWebUrl('/api/companions/memories'), { headers }),
        fetch(companionWebUrl('/api/companions/memory-settings'), { headers }),
      ]);
      const memJson = (await memRes.json().catch(() => ({}))) as {
        memories?: MemoryRow[];
        error?: string;
      };
      const setJson = (await setRes.json().catch(() => ({}))) as {
        settings?: { memory_enabled?: boolean };
        error?: string;
      };
      if (!memRes.ok) {
        setError(memJson.error || 'Unable to load memories.');
      } else {
        setMemories((memJson.memories || []).filter((row) => row.is_active !== false));
      }
      if (setRes.ok) {
        setMemoryEnabled(setJson.settings?.memory_enabled !== false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load memories.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  async function authHeaders() {
    const token = await getSupabaseAccessToken();
    if (!token) throw new Error('Sign in required.');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async function toggleEnabled(next: boolean) {
    setSaving(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(companionWebUrl('/api/companions/memory-settings'), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ memoryEnabled: next }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Update failed.');
      setMemoryEnabled(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setSaving(false);
    }
  }

  async function forget(memoryId: string) {
    setSaving(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(companionWebUrl('/api/companions/memories'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'forget', memoryId }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Forget failed.');
      setMemories((current) => current.filter((row) => row.id !== memoryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Forget failed.');
    } finally {
      setSaving(false);
    }
  }

  async function saveDraft() {
    const value = draftValue.trim();
    if (!value) return;
    setSaving(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(companionWebUrl('/api/companions/memories'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          key: 'preference',
          value,
          category: 'preference',
          scope: 'shared',
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Save failed.');
      setDraftValue('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SitGuruScreen>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BubblePressable
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.iconBtn}
        >
          <ArrowLeft color={colors.text} size={22} />
        </BubblePressable>
        <Text style={[styles.title, { color: colors.text }]}>Companion memories</Text>
        <BubblePressable
          accessibilityLabel="Refresh"
          onPress={() => void load()}
          style={styles.iconBtn}
        >
          <RefreshCw color={colors.text} size={20} />
        </BubblePressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.copy, { color: colors.textSecondary }]}>
          Preferences you asked Rogue, Scout, Taco, or Delilah to remember. Forgetting a
          preference never deletes pet profiles or bookings.
        </Text>

        {!isAuthenticated ? (
          <Text style={[styles.copy, { color: colors.textSecondary }]}>
            Sign in to manage companion memories.
          </Text>
        ) : (
          <>
            <View style={[styles.row, { backgroundColor: colors.card }]}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                Allow lasting memories
              </Text>
              <Switch
                value={memoryEnabled}
                disabled={saving || loading}
                onValueChange={(value) => void toggleEnabled(value)}
              />
            </View>

            {error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}

            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
            ) : memories.length === 0 ? (
              <Text style={[styles.copy, { color: colors.textSecondary }]}>
                No saved preferences yet. In chat, say “Remember that I prefer boarding.”
              </Text>
            ) : (
              memories.map((memory) => (
                <View
                  key={memory.id}
                  style={[styles.card, { backgroundColor: colors.card }]}
                >
                  <Text style={[styles.meta, { color: colors.primary }]}>
                    {memory.category}
                    {memory.scope === 'companion' && memory.companion_id
                      ? ` · ${memory.companion_id}`
                      : ' · shared'}
                  </Text>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {memory.key.replace(/_/g, ' ')}
                  </Text>
                  <Text style={[styles.copy, { color: colors.textSecondary }]}>
                    {memory.value}
                  </Text>
                  <BubblePressable
                    accessibilityLabel="Forget memory"
                    disabled={saving}
                    onPress={() =>
                      Alert.alert('Forget preference?', memory.value, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Forget',
                          style: 'destructive',
                          onPress: () => void forget(memory.id),
                        },
                      ])
                    }
                    style={styles.forgetBtn}
                  >
                    <Trash2 color="#B42318" size={18} />
                    <Text style={styles.forgetText}>Forget</Text>
                  </BubblePressable>
                </View>
              ))
            )}

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Save a preference
              </Text>
              <TextInput
                value={draftValue}
                onChangeText={setDraftValue}
                placeholder="I prefer boarding within 10 miles"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                editable={!saving && memoryEnabled}
              />
              <BubblePressable
                accessibilityLabel="Save preference"
                disabled={saving || !draftValue.trim() || !memoryEnabled}
                onPress={() => void saveDraft()}
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.saveText}>Save</Text>
              </BubblePressable>
            </View>
          </>
        )}
      </ScrollView>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: AppFonts.extraBold,
    fontSize: 18,
  },
  body: {
    padding: 16,
    gap: 14,
    paddingBottom: 48,
  },
  copy: {
    fontFamily: AppFonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontFamily: AppFonts.semiBold,
    fontSize: 15,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  meta: {
    fontFamily: AppFonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 16,
  },
  forgetBtn: {
    marginTop: 4,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forgetText: {
    color: '#B42318',
    fontFamily: AppFonts.semiBold,
    fontSize: 14,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontFamily: AppFonts.regular,
    fontSize: 15,
  },
  saveBtn: {
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#fff',
    fontFamily: AppFonts.bold,
    fontSize: 15,
  },
  error: {
    color: '#B42318',
    fontFamily: AppFonts.semiBold,
    fontSize: 14,
  },
});
