import { router } from 'expo-router';
import {
  ArrowDown,
  ArrowUp,
  GraduationCap,
  Minus,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import MobileScreen from '@/components/mobile/MobileScreen';
import StickyActionBar from '@/components/mobile/StickyActionBar';
import TouchTarget from '@/components/mobile/TouchTarget';
import { BrandColors } from '@/constants/theme';
import { TOUCH_MIN } from '@/constants/mobile-layout';
import { useAuth } from '@/hooks/useAuth';
import { sitguruApiFetch } from '@/lib/data/api';
import { useWorkspaceLiveSync } from '@/hooks/data/useWorkspaceLiveSync';
import InternOnboardingFlow, {
  type InternOnboardingPayload,
} from '@/components/internship/InternOnboardingFlow';

type Standing = {
  letter?: string;
  summary?: string;
  tone?: string;
  trend?: { direction?: string; tone?: string; label?: string } | null;
};

type TaskItem = {
  id: string;
  title: string;
  status: string;
  workUrl?: string;
  studentNotes?: string;
  employerLetter?: string;
};

type GrowthSummary = {
  progress: Array<{ label: string; pct: number | null }>;
  assignmentCount: number;
  assignmentsDueSoon: number;
  hoursThisWeek: number;
  hoursPlanned: number;
  messages: Array<{ author: string; preview: string }>;
  upcoming: Array<{ title: string; when: string; kind: string }>;
};
type GrowthPayload = { summary?: GrowthSummary; error?: string };

type WorkspacePayload = {
  mode?: 'intern' | 'supervisor';
  onboarded?: boolean;
  onboardingRequired?: boolean;
  standing?: Standing;
  intern?: { id: string; fullName: string };
  workspace?: {
    intern?: { id: string; fullName: string };
    tasks?: TaskItem[];
  } | null;
  interns?: Array<{ id: string; fullName: string; email: string }>;
  error?: string;
};

function trendColor(tone?: string) {
  if (tone === 'up') return BrandColors.success;
  if (tone === 'down') return BrandColors.danger;
  return BrandColors.muted;
}

function letterColor(letter?: string) {
  if (letter === 'A' || letter === 'B') return BrandColors.success;
  if (letter === 'C') return BrandColors.warning;
  if (letter === 'D' || letter === 'F') return BrandColors.danger;
  return BrandColors.slate;
}

export default function InternPortalScreen() {
  const { session, loading } = useAuth();
  const [payload, setPayload] = useState<WorkspacePayload | null>(null);
  const [growth, setGrowth] = useState<GrowthSummary | null>(null);
  const [onboarding, setOnboarding] = useState<InternOnboardingPayload | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [internId, setInternId] = useState('');
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [workUrl, setWorkUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const path = internId
      ? `/api/internship/workspace?internId=${encodeURIComponent(internId)}`
      : '/api/internship/workspace';
    const result = await sitguruApiFetch<WorkspacePayload>(path, { cache: 'no-store' });
    if (result.error || !result.data) {
      setError(result.error || 'Could not open Intern Portal.');
      setPayload(null);
      setGrowth(null);
      return;
    }
    setError('');
    setPayload(result.data);
    if (result.data.onboardingRequired) {
      setGrowth(null);
      const pack = await sitguruApiFetch<InternOnboardingPayload>(
        '/api/internship/onboarding',
      );
      if (pack.error || !pack.data) {
        setOnboarding(result.data as InternOnboardingPayload);
      } else {
        setOnboarding(pack.data);
      }
      return;
    }
    setOnboarding(null);
    if (result.data.mode === 'intern') {
      const latest = await sitguruApiFetch<GrowthPayload>('/api/internship/growth', { cache: 'no-store' });
      setGrowth(latest.data?.summary || null);
    } else {
      setGrowth(null);
    }
    const firstOpen = result.data.workspace?.tasks?.find(
      (row) => row.status !== 'approved' && row.status !== 'not_accepted',
    );
    const tasks = result.data.workspace?.tasks || [];
    setSelectedTask((current) => tasks.find((task) => task.id === current?.id) || firstOpen || tasks[0] || null);
  }, [internId]);

  useWorkspaceLiveSync({ userId: session?.user.id, onRefresh: () => { void load(); } });

  useEffect(() => {
    if (!session) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intern workspace fetch
    void load();
  }, [session, load]);

  async function submitWork() {
    const id = payload?.workspace?.intern?.id;
    if (!id || !selectedTask) return;
    setBusy(true);
    const result = await sitguruApiFetch('/api/internship/work', {
      method: 'POST',
      body: {
        action: 'submit',
        internId: id,
        itemType: 'task',
        id: selectedTask.id,
        workUrl,
        studentNotes: notes,
      },
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setWorkUrl('');
    setNotes('');
    await load();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={BrandColors.greenDark} />
      </View>
    );
  }

  if (!session) {
    return (
      <MobileScreen>
        <Text style={styles.title}>Intern Portal</Text>
        <Text style={styles.body}>Sign in with the intern email SitGuru assigned.</Text>
        <TouchTarget
          onPress={() => router.push('/login')}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Sign in</Text>
        </TouchTarget>
      </MobileScreen>
    );
  }

  if (onboarding && !onboarding.onboarded) {
    return <InternOnboardingFlow payload={onboarding} onReload={load} />;
  }

  const standing = payload?.standing;
  const TrendIcon =
    standing?.trend?.direction === 'up'
      ? ArrowUp
      : standing?.trend?.direction === 'down'
        ? ArrowDown
        : Minus;

  return (
      <MobileScreen
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await load();
          setRefreshing(false);
        }}
        footer={
          payload?.mode === 'intern' && selectedTask ? (
            <StickyActionBar>
              <TouchTarget
                disabled={busy}
                onPress={() => void submitWork()}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>
                  {busy ? 'Submitting…' : 'Submit for SitGuru review'}
                </Text>
              </TouchTarget>
            </StickyActionBar>
          ) : undefined
        }
      >
        <TouchTarget onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>Back</Text>
        </TouchTarget>
        <Text style={styles.eyebrow}>Internship Program</Text>
        <Text style={styles.title}>
          {payload?.workspace?.intern?.fullName || 'Intern Portal'}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchTarget accessibilityRole="button" onPress={() => router.push('/community-studio' as never)} style={styles.card}>
          <Text style={styles.cardTitle}>Community Studio</Text>
          <Text style={styles.body}>Create Pack stories, nominate Pet of the Week, and follow manager feedback.</Text>
        </TouchTarget>

        {payload?.mode === 'supervisor' && !payload.workspace ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Employer HQ</Text>
            {(payload.interns || []).map((row) => (
              <TouchTarget
                key={row.id}
                onPress={() => setInternId(row.id)}
                style={styles.row}
              >
                <Text style={styles.rowTitle}>{row.fullName}</Text>
                <Text style={styles.caption}>{row.email}</Text>
              </TouchTarget>
            ))}
          </View>
        ) : null}

        {payload?.mode === 'intern' && growth ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Live Growth Workspace</Text>
            <Text style={styles.body}>
              {growth.assignmentCount} open assignments · {growth.assignmentsDueSoon} due soon
            </Text>
            <Text style={styles.caption}>
              Hours this week: {growth.hoursThisWeek} / {growth.hoursPlanned > 0 ? growth.hoursPlanned : 'not scheduled'}
            </Text>
            {growth.progress.map((item) => (
              <View key={item.label} style={styles.growthRow}>
                <Text style={styles.rowTitle}>{item.label}</Text>
                <Text style={styles.growthValue}>{item.pct == null ? 'Not available' : `${item.pct}%`}</Text>
              </View>
            ))}
            {growth.messages.length > 0 ? (
              <View style={styles.growthMessages}>
                <Text style={styles.rowTitle}>Recent team messages</Text>
                {growth.messages.slice(0, 2).map((message, index) => (
                  <Text key={`${index}-${message.author}`} style={styles.caption}>
                    {message.author}: {message.preview}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {standing ? (
          <View style={[styles.card, { borderColor: letterColor(standing.letter) }]}>
            <View style={styles.letterRow}>
              <GraduationCap color={BrandColors.greenDark} size={22} />
              <Text style={[styles.letter, { color: letterColor(standing.letter) }]}>
                {standing.letter || 'I'}
              </Text>
              <View style={styles.trend}>
                <TrendIcon
                  color={trendColor(standing.trend?.tone)}
                  size={20}
                  strokeWidth={3}
                />
                <Text style={[styles.trendLabel, { color: trendColor(standing.trend?.tone) }]}>
                  {standing.trend?.label || 'even'}
                </Text>
              </View>
            </View>
            <Text style={styles.body}>{standing.summary}</Text>
          </View>
        ) : null}

        {(payload?.workspace?.tasks || []).map((task) => (
          <TouchTarget
            key={task.id}
            onPress={() => {
              setSelectedTask(task);
              setWorkUrl(task.workUrl || '');
              setNotes(task.studentNotes || '');
            }}
            style={[
              styles.card,
              selectedTask?.id === task.id && styles.cardSelected,
            ]}
          >
            <Text style={styles.cardTitle}>{task.title}</Text>
            <Text style={styles.caption}>
              {task.status.replaceAll('_', ' ')}
              {task.employerLetter ? ` · Letter ${task.employerLetter}` : ''}
            </Text>
          </TouchTarget>
        ))}

        {payload?.mode === 'intern' && selectedTask ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Turn in {selectedTask.title}</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setWorkUrl}
              placeholder="Link to completed work"
              placeholderTextColor={BrandColors.muted}
              style={styles.input}
              value={workUrl}
            />
            <TextInput
              multiline
              onChangeText={setNotes}
              placeholder="What should SitGuru review?"
              placeholderTextColor={BrandColors.muted}
              style={[styles.input, styles.notes]}
              value={notes}
            />
          </View>
        ) : null}
      </MobileScreen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  back: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { color: BrandColors.greenDark, fontSize: 15, fontWeight: '800' },
  eyebrow: {
    color: '#2563EB',
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
  body: { color: BrandColors.charcoal, fontSize: 15, fontWeight: '600', marginTop: 8 },
  error: { color: BrandColors.danger, fontSize: 14, fontWeight: '700', marginTop: 10 },
  card: {
    backgroundColor: BrandColors.white,
    borderColor: BrandColors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  cardSelected: { borderColor: '#2563EB' },
  cardTitle: { color: BrandColors.ink, fontSize: 17, fontWeight: '800' },
  caption: { color: BrandColors.slate, fontSize: 13, fontWeight: '600', marginTop: 4 },
  letterRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  letter: { fontSize: 40, fontWeight: '800' },
  trend: { alignItems: 'center', flexDirection: 'row', gap: 4, marginLeft: 'auto' },
  trendLabel: { fontSize: 16, fontWeight: '800' },
  row: {
    borderTopColor: BrandColors.border,
    borderTopWidth: 1,
    minHeight: TOUCH_MIN,
    paddingVertical: 10,
  },
  rowTitle: { color: BrandColors.ink, fontSize: 16, fontWeight: '800' },
  growthRow: { borderTopColor: BrandColors.border, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 9 },
  growthValue: { color: '#1D4ED8', fontSize: 13, fontWeight: '800' },
  growthMessages: { borderTopColor: BrandColors.border, borderTopWidth: 1, marginTop: 8, paddingTop: 10 },

  input: {
    borderColor: BrandColors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: BrandColors.ink,
    fontSize: 15,
    fontWeight: '600',
    minHeight: TOUCH_MIN,
    marginTop: 10,
    paddingHorizontal: 14,
  },
  notes: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
  },
  primaryBtnText: { color: BrandColors.white, fontSize: 16, fontWeight: '800' },
});
