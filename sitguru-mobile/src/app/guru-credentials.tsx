import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { sitguruApiFetch, getSitGuruApiBaseUrl } from '@/lib/data/api';
import { getSupabaseAccessToken } from '@/lib/supabase';

type CredentialType = {
  slug: string;
  display_name: string;
  description: string;
  icon: string;
  add_label: string;
  explore_label: string | null;
  default_provider_slug: string | null;
  requires_expiration: boolean;
  public_badge_label: string;
};

type Provider = {
  id: string;
  slug: string;
  provider_name: string;
  exploreUrl: string | null;
};

type Owned = {
  id: string;
  typeSlug: string;
  status: string;
  providerName: string | null;
  rejectionReason: string | null;
  expiringSoon: boolean;
};

const STATUS: Record<string, string> = {
  submitted: "Submitted — we're reviewing it.",
  under_review: "Submitted — we're reviewing it.",
  verified: 'Verified 🐾',
  rejected: 'We need a little more information.',
  expired: 'Time for a quick credential refresh.',
};

export default function GuruCredentialsScreen() {
  const isDark = useColorScheme() === 'dark';
  const [types, setTypes] = useState<CredentialType[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [credentials, setCredentials] = useState<Owned[]>([]);
  const [active, setActive] = useState<CredentialType | null>(null);
  const [reference, setReference] = useState('');
  const [providerName, setProviderName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await sitguruApiFetch<{
      enabled?: boolean;
      error?: string;
      types?: CredentialType[];
      providers?: Provider[];
      credentials?: Owned[];
    }>('/api/guru/credentials');
    setLoading(false);
    if (result.error || !result.data) {
      setError(result.error || 'SitGuru could not open Trust & Credentials.');
      return;
    }
    setTypes(result.data.types || []);
    setProviders(result.data.providers || []);
    setCredentials(result.data.credentials || []);
    setError('');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    if (!active) return;
    setBusy(true);
    setError('');
    const result = await sitguruApiFetch<{ credential?: { id: string }; error?: string }>(
      '/api/guru/credentials',
      {
        method: 'POST',
        body: {
          typeSlug: active.slug,
          credentialName: active.public_badge_label,
          customProviderName: providerName,
          reference,
          status: 'submitted',
        },
      },
    );
    setBusy(false);
    if (result.error || !result.data?.credential?.id) {
      setError(result.error || 'SitGuru could not save this highlight.');
      return;
    }
    setMessage("Submitted — we're reviewing it.");
    setActive(null);
    setReference('');
    setProviderName('');
    await load();
  }

  async function attachPhoto(credentialId: string) {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    const token = await getSupabaseAccessToken();
    const body = new FormData();
    body.append('file', {
      uri: asset.uri,
      name: 'credential.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    const response = await fetch(
      `${getSitGuruApiBaseUrl()}/api/guru/credentials/${credentialId}/document`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      },
    );
    if (!response.ok) {
      setError('The highlight was saved. The photo needs another try.');
      return;
    }
    setMessage('Document added.');
    await load();
  }

  const palette = {
    bg: isDark ? '#07140F' : '#F7FBF8',
    card: isDark ? '#102F22' : '#FFFFFF',
    text: isDark ? '#F8FAFC' : '#0F172A',
    muted: isDark ? '#D6E5DC' : '#475569',
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Trust & Credentials</Text>
      <Text style={[styles.title, { color: palette.text }]}>Show Pet Parents what makes you, you. 🐾</Text>
      <Text style={[styles.body, { color: palette.muted }]}>
        Add professional credentials you already have, or explore optional training. Nothing here is required to be bookable.
      </Text>
      {loading ? <ActivityIndicator color="#0D5C3A" /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      {credentials.length === 0 && !loading ? (
        <View style={[styles.card, { backgroundColor: palette.card }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Add your professional highlights 🐾</Text>
          <Text style={[styles.body, { color: palette.muted }]}>
            Have pet-care training, insurance, bonding, memberships, or certifications? You can add them whenever you're ready.
          </Text>
        </View>
      ) : null}
      {types.map((type) => {
        const provider = providers.find((item) => item.slug === type.default_provider_slug);
        const owned = credentials.filter((item) => item.typeSlug === type.slug);
        return (
          <View key={type.slug} style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>{type.display_name}</Text>
            <Text style={[styles.body, { color: palette.muted }]}>{type.description}</Text>
            {owned.map((item) => (
              <View key={item.id}>
                <Text style={styles.status}>{STATUS[item.status] || item.status}</Text>
                {item.rejectionReason ? <Text style={[styles.body, { color: palette.muted }]}>{item.rejectionReason}</Text> : null}
                {item.expiringSoon ? <Text style={[styles.body, { color: palette.muted }]}>Time for a quick credential refresh.</Text> : null}
                <Pressable accessibilityRole="button" onPress={() => void attachPhoto(item.id)} style={styles.secondary}>
                  <Text style={styles.secondaryText}>Add photo</Text>
                </Pressable>
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={type.add_label}
              onPress={() => setActive(type)}
              style={styles.primary}
            >
              <Text style={styles.primaryText}>{type.add_label}</Text>
            </Pressable>
            {provider?.exploreUrl ? (
              <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(provider.exploreUrl || '')}>
                <Text style={styles.link}>{type.explore_label || 'Learn More'} →</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
      {active ? (
        <View style={[styles.card, { backgroundColor: palette.card }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Add {active.display_name}</Text>
          <TextInput
            value={providerName}
            onChangeText={setProviderName}
            placeholder="Provider name"
            placeholderTextColor="#94A3B8"
            style={[styles.input, { color: palette.text }]}
          />
          <TextInput
            value={reference}
            onChangeText={setReference}
            placeholder="Reference number, kept private"
            placeholderTextColor="#94A3B8"
            style={[styles.input, { color: palette.text }]}
          />
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void submit()} style={styles.primary}>
            <Text style={styles.primaryText}>{busy ? 'Sending…' : 'Submit for review'}</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, gap: 14 },
  eyebrow: { color: '#0D5C3A', fontWeight: '800', letterSpacing: 1, fontSize: 12 },
  title: { fontSize: 30, fontWeight: '800' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  card: { borderRadius: 24, padding: 16, gap: 8 },
  cardTitle: { fontSize: 20, fontWeight: '800' },
  status: { color: '#0D5C3A', fontWeight: '800' },
  primary: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: '#0D5C3A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '800' },
  secondary: { minHeight: 44, justifyContent: 'center' },
  secondaryText: { color: '#0D5C3A', fontWeight: '800' },
  link: { color: '#0D5C3A', fontWeight: '800' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  error: { color: '#BE123C', fontWeight: '700' },
  ok: { color: '#0D5C3A', fontWeight: '700' },
});
