import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { trackMobileEvent } from '@/lib/analytics/track';
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
  credentialName?: string | null;
  providerName: string | null;
  expirationDate?: string | null;
  rejectionReason: string | null;
  expiringSoon: boolean;
};

function analyticsSlug(slug?: string | null) {
  return String(slug || '').replace(/-/g, '_');
}

function validThrough(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

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
  const [pendingFile, setPendingFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [providerId, setProviderId] = useState('');
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
          providerId: providerId || null,
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
    if (pendingFile) {
      const uploaded = await uploadEvidence(result.data.credential.id, pendingFile);
      if (!uploaded) {
        setError('The highlight was saved. The document needs another try.');
        setPendingFile(null);
        await load();
        return;
      }
    }
    setMessage("Submitted — we're reviewing it.");
    setActive(null);
    setReference('');
    setProviderName('');
    setPendingFile(null);
    await load();
  }

  async function uploadEvidence(
    credentialId: string,
    file: { uri: string; name: string; type: string },
  ) {
    const token = await getSupabaseAccessToken();
    const body = new FormData();
    body.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
    const response = await fetch(
      `${getSitGuruApiBaseUrl()}/api/guru/credentials/${credentialId}/document`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      },
    );
    return response.ok;
  }

  async function choosePhoto() {
    const file = await pickPhotoFile();
    if (!file) return;
    setPendingFile(file);
    setError('');
  }

  async function pickPhotoFile() {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (picked.canceled || !picked.assets[0]) return null;
    const asset = picked.assets[0];
    const type = asset.mimeType || 'image/jpeg';
    if (type === 'image/heic' || type === 'image/heif') {
      setError('Save HEIC photos as JPG or PNG before uploading.');
      return null;
    }
    return {
      uri: asset.uri,
      name: asset.fileName || (type === 'image/png' ? 'credential.png' : 'credential.jpg'),
      type: type === 'image/png' ? 'image/png' : 'image/jpeg',
    };
  }

  async function pickDocumentFile() {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (picked.canceled || !picked.assets?.[0]) return null;
    const asset = picked.assets[0];
    if (asset.size && asset.size > 8 * 1024 * 1024) {
      setError('Upload a PDF, JPG, or PNG up to 8 MB.');
      return null;
    }
    return {
      uri: asset.uri,
      name: asset.name || 'credential.pdf',
      type: asset.mimeType || 'application/pdf',
    };
  }

  async function attachExisting(credentialId: string, kind: 'photo' | 'file') {
    const file = kind === 'photo' ? await pickPhotoFile() : await pickDocumentFile();
    if (!file) return;
    const uploaded = await uploadEvidence(credentialId, file);
    if (!uploaded) {
      setError('That document needs another try.');
      return;
    }
    setMessage('Document added.');
    await load();
  }

  async function chooseFile() {
    const file = await pickDocumentFile();
    if (!file) return;
    setPendingFile(file);
    setError('');
  }

  const palette = {
    bg: isDark ? '#07140F' : '#F7FBF8',
    card: isDark ? '#102F22' : '#FFFFFF',
    text: isDark ? '#F8FAFC' : '#0F172A',
    muted: isDark ? '#D6E5DC' : '#475569',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }} edges={['bottom']}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
            <Text style={[styles.cardTitle, { color: palette.text }]} numberOfLines={3}>{type.display_name}</Text>
            <Text style={[styles.body, { color: palette.muted }]}>{type.description}</Text>
            {owned.map((item) => (
              <View key={item.id}>
                <Text style={styles.status}>{STATUS[item.status] || item.status}</Text>
                {item.providerName ? <Text style={[styles.body, { color: palette.muted }]}>{item.providerName}</Text> : null}
                {item.status === 'verified' ? <Text style={styles.status}>Verified by SitGuru</Text> : null}
                {validThrough(item.expirationDate) ? (
                  <Text style={[styles.body, { color: palette.muted }]}>Valid through {validThrough(item.expirationDate)}</Text>
                ) : null}
                {item.rejectionReason ? <Text style={[styles.body, { color: palette.muted }]}>{item.rejectionReason}</Text> : null}
                {item.expiringSoon ? <Text style={[styles.body, { color: palette.muted }]}>Time for a quick credential refresh.</Text> : null}
                {['draft', 'submitted', 'rejected', 'expired'].includes(item.status) ? (
                  <View style={styles.uploadRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Choose photo"
                      onPress={() => void attachExisting(item.id, 'photo')}
                      style={styles.secondary}
                    >
                      <Text style={styles.secondaryText}>Choose Photo</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Choose file"
                      onPress={() => void attachExisting(item.id, 'file')}
                      style={styles.secondary}
                    >
                      <Text style={styles.secondaryText}>Choose File</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))}
            {provider?.exploreUrl ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={type.explore_label || 'Explore Certification'}
                onPress={() => {
                  void trackMobileEvent({
                    eventName: 'credential_provider_explore_clicked',
                    eventType: 'credentials',
                    role: 'guru',
                    source: 'guru_credentials',
                    metadata: {
                      credential_type: analyticsSlug(type.slug),
                      provider: analyticsSlug(provider.slug),
                      platform: 'mobile',
                      source_surface: 'guru_credentials',
                    },
                  });
                  void Linking.openURL(provider.exploreUrl || '');
                }}
                style={styles.primary}
              >
                <Text style={styles.primaryText}>{type.explore_label || 'Learn More'}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={type.add_label}
              onPress={() => {
                setActive(type);
                const match = providers.find((item) => item.slug === type.default_provider_slug);
                setProviderId(match?.id || '');
                setProviderName(match ? '' : providerName);
              }}
              style={styles.outline}
            >
              <Text style={styles.outlineText}>{type.add_label}</Text>
            </Pressable>
          </View>
        );
      })}
      {active ? (
        <View style={[styles.card, { backgroundColor: palette.card }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Add {active.public_badge_label}</Text>
          {active.slug === 'pet-cpr-first-aid' ? (
            <Text style={[styles.body, { color: palette.muted }]}>
              American Health Training can be selected, or choose another recognized provider. Nothing here is required.
            </Text>
          ) : null}
          {providers.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected: providerId === item.id }}
              accessibilityLabel={item.provider_name}
              onPress={() => setProviderId(item.id)}
              style={[styles.outline, providerId === item.id && styles.outlineSelected]}
            >
              <Text style={styles.outlineText}>{item.provider_name}</Text>
            </Pressable>
          ))}
          <TextInput
            accessibilityLabel="Provider name"
            value={providerName}
            onChangeText={setProviderName}
            placeholder="Provider name"
            placeholderTextColor="#94A3B8"
            style={[styles.input, { color: palette.text, borderColor: isDark ? '#405247' : '#CBD5E1' }]}
          />
          <TextInput
            accessibilityLabel="Reference number, kept private"
            value={reference}
            onChangeText={setReference}
            placeholder="Reference number, kept private"
            placeholderTextColor="#94A3B8"
            style={[styles.input, { color: palette.text, borderColor: isDark ? '#405247' : '#CBD5E1' }]}
          />
          <View style={styles.uploadRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Choose photo" onPress={() => void choosePhoto()} style={styles.secondary}>
              <Text style={styles.secondaryText}>Choose Photo</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Choose file" onPress={() => void chooseFile()} style={styles.secondary}>
              <Text style={styles.secondaryText}>Choose File</Text>
            </Pressable>
          </View>
          {pendingFile ? (
            <Text style={[styles.body, { color: palette.muted }]} numberOfLines={2}>
              Ready to attach: {pendingFile.name}
            </Text>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityLabel="Submit for review" disabled={busy} onPress={() => void submit()} style={styles.primary}>
            <Text style={styles.primaryText}>{busy ? 'Sending…' : 'Submit for review'}</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
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
  outline: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0D5C3A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  outlineSelected: { backgroundColor: '#E8F6EE' },
  outlineText: { color: '#0D5C3A', fontWeight: '800', textAlign: 'center' },
  uploadRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  secondary: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 4 },
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
