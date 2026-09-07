import * as ImagePicker from 'expo-image-picker';
import { Linking } from 'react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import MobileScreen from '@/components/mobile/MobileScreen';
import StickyActionBar from '@/components/mobile/StickyActionBar';
import TouchTarget from '@/components/mobile/TouchTarget';
import { BrandColors } from '@/constants/theme';
import { TOUCH_MIN } from '@/constants/mobile-layout';
import { getSitGuruApiBaseUrl, sitguruApiFetch } from '@/lib/data/api';

export type InternOnboardingPayload = {
  intern?: { id: string; fullName: string; school?: string; program?: string };
  requiredPolicyVersion?: string;
  policyVersion?: string;
  onboarded?: boolean;
  step?: 'access' | 'esign' | 'wetink' | 'submit' | string;
  status?: string;
  accessDone?: boolean;
  signed?: boolean;
  uploaded?: boolean;
  submitted?: boolean;
  accessRules?: string[];
  notice?: {
    title?: string;
    employer?: string;
    subtitle?: string;
    intro?: string;
    sections?: Array<{ heading: string; body: string }>;
  };
  message?: string;
  error?: string;
};

type Props = {
  payload: InternOnboardingPayload;
  onReload: () => Promise<void>;
  onSignedInPress?: () => void;
};

export default function InternOnboardingFlow({ payload, onReload }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(payload.error || '');
  const [notice, setNotice] = useState(payload.message || '');
  const [agreeAccess, setAgreeAccess] = useState(false);
  const [agreeConfidential, setAgreeConfidential] = useState(false);
  const [agreeOwnership, setAgreeOwnership] = useState(false);
  const [agreeTools, setAgreeTools] = useState(false);
  const [agreeLimitedProtection, setAgreeLimitedProtection] = useState(false);
  const [typedName, setTypedName] = useState(payload.intern?.fullName || '');

  const step = payload.step || 'access';
  const version = payload.requiredPolicyVersion || payload.policyVersion || '';

  const cta = useMemo(() => {
    if (payload.onboarded || payload.submitted) return 'Open intern portal';
    if (step === 'access') return 'Accept access rules';
    if (step === 'esign') return 'Sign electronically';
    if (step === 'wetink') return 'Upload signed page';
    return 'Submit signed page';
  }, [payload.onboarded, payload.submitted, step]);

  async function postAction(body: Record<string, unknown>) {
    setBusy(true);
    setError('');
    const result = await sitguruApiFetch<InternOnboardingPayload>(
      '/api/internship/onboarding',
      { method: 'POST', body },
    );
    setBusy(false);
    if (result.error || !result.data) {
      setError(result.error || 'Could not save onboarding.');
      return;
    }
    setNotice(result.data.message || '');
    await onReload();
  }

  async function uploadPhoto(fromCamera: boolean) {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow camera or photos so you can upload the signed page.');
      return;
    }
    const picked = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (picked.canceled || !picked.assets[0]?.uri) return;

    const asset = picked.assets[0];
    const name = asset.fileName || `signed-page.${(asset.mimeType || 'image/jpeg').includes('png') ? 'png' : 'jpg'}`;
    const form = new FormData();
    form.append('action', 'upload');
    form.append('file', {
      uri: asset.uri,
      name,
      type: asset.mimeType || 'image/jpeg',
    } as never);

    setBusy(true);
    setError('');
    const result = await sitguruApiFetch<InternOnboardingPayload>(
      '/api/internship/onboarding',
      { method: 'POST', body: form, timeoutMs: 60_000 },
    );
    setBusy(false);
    if (result.error || !result.data) {
      setError(result.error || 'Could not upload the signed page.');
      return;
    }
    setNotice(result.data.message || '');
    await onReload();
  }

  async function runPrimary() {
    if (payload.onboarded || payload.submitted) {
      await onReload();
      return;
    }
    if (step === 'access') {
      if (!agreeAccess) {
        setError('Confirm the intern access rules to continue.');
        return;
      }
      await postAction({ action: 'accept', agreeAccess: true });
      return;
    }
    if (step === 'esign') {
      await postAction({
        action: 'sign',
        typedLegalName: typedName,
        agreeConfidential,
        agreeOwnership,
        agreeTools,
        agreeLimitedProtection,
      });
      return;
    }
    if (step === 'wetink') {
      await uploadPhoto(true);
      return;
    }
    await postAction({ action: 'submit' });
  }

  return (
    <MobileScreen
      footer={
        <StickyActionBar>
          <TouchTarget disabled={busy} onPress={() => void runPrimary()} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>{busy ? 'Saving…' : cta}</Text>
          </TouchTarget>
        </StickyActionBar>
      }
    >
      <Text style={styles.eyebrow}>Required before portal access</Text>
      <Text style={styles.title}>Intern onboarding</Text>
      <Text style={styles.meta}>
        {[payload.intern?.fullName, payload.intern?.school, payload.intern?.program, version ? `Agreement ${version}` : '']
          .filter(Boolean)
          .join(' · ')}
      </Text>
      <Text style={styles.body}>
        SitGuru unlocks the intern portal after you accept the access rules, sign,
        print or photo the signed page, then submit. Email confirmation will be sent
        to your email on file.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.ok}>{notice}</Text> : null}

      <View style={styles.steps}>
        {['Access rules', 'Electronic signature', 'Print or photo', 'Submit'].map((label, index) => {
            const ids = ['access', 'esign', 'wetink', 'submit'] as const;
            const id = ids[index];
            const done =
              (id === 'access' && payload.accessDone) ||
              (id === 'esign' && payload.signed) ||
              (id === 'wetink' && payload.uploaded) ||
              (id === 'submit' && payload.submitted);
            const active = step === id && !payload.onboarded;
            return (
              <View key={id} style={[styles.step, done && styles.stepDone, active && styles.stepNow]}>
                <Text style={styles.stepLabel}>
                  Step {index + 1}
                  {done ? ' · done' : active ? ' · now' : ''}
                </Text>
                <Text style={styles.stepTitle}>{label}</Text>
              </View>
            );
          })}
      </View>

      {step === 'access' || !payload.accessDone ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Intern access rules</Text>
          {(payload.accessRules || []).map((rule) => (
            <Text key={rule} style={styles.rule}>
              {rule}
            </Text>
          ))}
          <TouchTarget onPress={() => setAgreeAccess((value) => !value)} style={styles.checkRow}>
            <Text style={styles.check}>{agreeAccess ? '☑' : '☐'}</Text>
            <Text style={styles.checkLabel}>I understand these access rules and will follow them.</Text>
          </TouchTarget>
        </View>
      ) : null}

      {payload.accessDone && (step === 'esign' || !payload.signed) ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{payload.notice?.title || 'Intern agreement'}</Text>
          <Text style={styles.caption}>{payload.notice?.employer}</Text>
          <Text style={styles.body}>{payload.notice?.intro}</Text>
          {(payload.notice?.sections || []).map((section) => (
            <View key={section.heading} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.heading}</Text>
              <Text style={styles.body}>{section.body}</Text>
            </View>
          ))}
          <TouchTarget onPress={() => setAgreeConfidential((value) => !value)} style={styles.checkRow}>
            <Text style={styles.check}>{agreeConfidential ? '☑' : '☐'}</Text>
            <Text style={styles.checkLabel}>
              I have read this agreement and agree to protect SitGuru confidential information.
            </Text>
          </TouchTarget>
          <TouchTarget onPress={() => setAgreeOwnership((value) => !value)} style={styles.checkRow}>
            <Text style={styles.check}>{agreeOwnership ? '☑' : '☐'}</Text>
            <Text style={styles.checkLabel}>
              I assign internship work product to Graff Enterprises LLC d/b/a SitGuru as set out in Section 4.
            </Text>
          </TouchTarget>
          <TouchTarget onPress={() => setAgreeTools((value) => !value)} style={styles.checkRow}>
            <Text style={styles.check}>{agreeTools ? '☑' : '☐'}</Text>
            <Text style={styles.checkLabel}>
              I will not put SitGuru confidential information into unapproved AI or other third-party tools, and I will not share credentials.
            </Text>
          </TouchTarget>
          <TouchTarget onPress={() => setAgreeLimitedProtection((value) => !value)} style={styles.checkRow}>
            <Text style={styles.check}>{agreeLimitedProtection ? '☑' : '☐'}</Text>
            <Text style={styles.checkLabel}>
              I will not use SitGuru confidential information to establish, operate, or materially assist a directly competing pet care marketplace during the internship and for twelve months after it ends. This is not a ban on working for another pet care company or elsewhere in the pet industry.
            </Text>
          </TouchTarget>
          <TextInput
            autoCapitalize="words"
            onChangeText={setTypedName}
            placeholder="Type your legal name to sign"
            placeholderTextColor={BrandColors.muted}
            style={styles.input}
            value={typedName}
          />
        </View>
      ) : null}

      {payload.signed && !payload.uploaded ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Print or photo, then upload</Text>
          <Text style={styles.body}>
            Photograph a wet-ink signed printout, or open the acknowledgment on the web to print it.
          </Text>
          <TouchTarget
            onPress={() =>
              void Linking.openURL(`${getSitGuruApiBaseUrl()}/intern/onboarding/print`)
            }
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnText}>Open acknowledgment</Text>
          </TouchTarget>
          <TouchTarget disabled={busy} onPress={() => void uploadPhoto(false)} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Choose photo</Text>
          </TouchTarget>
        </View>
      ) : null}

      {payload.uploaded && !payload.submitted ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>4. Submit</Text>
          <Text style={styles.body}>
            Email confirmation will be sent to your email on file. The intern portal
            unlocks after this step.
          </Text>
        </View>
      ) : null}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: BrandColors.greenDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: BrandColors.ink,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },
  meta: { color: BrandColors.slate, fontSize: 13, fontWeight: '700', marginTop: 8 },
  body: { color: BrandColors.charcoal, fontSize: 15, fontWeight: '600', marginTop: 8, lineHeight: 22 },
  error: { color: BrandColors.danger, fontSize: 14, fontWeight: '700', marginTop: 10 },
  ok: { color: BrandColors.success, fontSize: 14, fontWeight: '700', marginTop: 10 },
  steps: { marginTop: 14, gap: 8 },
  step: {
    backgroundColor: BrandColors.white,
    borderColor: BrandColors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  stepDone: { borderColor: BrandColors.success },
  stepNow: { borderColor: BrandColors.warning },
  stepLabel: { color: BrandColors.greenDark, fontSize: 11, fontWeight: '800' },
  stepTitle: { color: BrandColors.ink, fontSize: 16, fontWeight: '800', marginTop: 2 },
  card: {
    backgroundColor: BrandColors.white,
    borderColor: BrandColors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  cardTitle: { color: BrandColors.ink, fontSize: 17, fontWeight: '800' },
  caption: { color: BrandColors.slate, fontSize: 13, fontWeight: '700', marginTop: 4 },
  rule: { color: BrandColors.charcoal, fontSize: 14, fontWeight: '600', marginTop: 10, lineHeight: 20 },
  section: { marginTop: 12 },
  sectionTitle: { color: BrandColors.ink, fontSize: 15, fontWeight: '800' },
  checkRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    minHeight: TOUCH_MIN,
  },
  check: { color: BrandColors.greenDark, fontSize: 20, fontWeight: '800', lineHeight: 28 },
  checkLabel: { color: BrandColors.ink, flex: 1, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  input: {
    borderColor: BrandColors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: BrandColors.ink,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    minHeight: TOUCH_MIN,
    paddingHorizontal: 14,
  },
  secondaryBtn: {
    alignItems: 'center',
    borderColor: BrandColors.greenDark,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: TOUCH_MIN,
  },
  secondaryBtnText: { color: BrandColors.greenDark, fontSize: 15, fontWeight: '800' },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: BrandColors.greenDark,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
  },
  primaryBtnText: { color: BrandColors.white, fontSize: 16, fontWeight: '800' },
});
