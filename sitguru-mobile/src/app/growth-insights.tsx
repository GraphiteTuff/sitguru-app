import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import RoleGate from '@/components/RoleGate';
import { useAuth } from '@/hooks/useAuth';
import MobileScreen from '@/components/mobile/MobileScreen';
import { SitGuruColors } from '@/constants/colors';
import { TOUCH_MIN } from '@/constants/mobile-layout';
import { sitguruApiFetch } from '@/lib/data/api';

type Snapshot = {
  freshnessLabel?: string;
  kpis?: Array<{
    id: string;
    label: string;
    value: number | null;
    unit: string;
    availability: string;
    note?: string;
  }>;
  insights?: Array<{
    id: string;
    title: string;
    observation: string;
    nextAction: string;
    confidence: string;
  }>;
  social?: Array<{
    platform: string;
    label: string;
    status: string;
    followers: number | null;
    setupHint: string;
  }>;
  goals?: Array<{
    id: string;
    label: string;
    target: number;
    actual: number | null;
    percentComplete: number | null;
    status: string;
  }>;
  coverageNotes?: string[];
};

function formatValue(value: number | null, unit: string, availability: string) {
  if (availability === 'unavailable' || value == null) return '—';
  if (unit === 'percent') return `${value.toFixed(1)}%`;
  return value.toLocaleString('en-US');
}

function GrowthInsightsBody() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const result = await sitguruApiFetch<Snapshot>(
      '/api/growth-center/v2/snapshot?preset=last_7',
      { method: 'GET', cache: 'no-store' },
    );
    if (result.error || !result.data) {
      setError(result.error || 'Could not load Growth Center Insights.');
      setSnapshot(null);
    } else {
      setSnapshot(result.data);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <MobileScreen refreshing={refreshing} onRefresh={() => void load(true)}>
      <View style={styles.content}>
        <Text style={styles.title}>Growth Insights</Text>
        <Text style={styles.subtitle}>SitGuru Growth Center 2.0</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/manager-help')} style={styles.helpButton}>
          <Text style={styles.helpButtonText}>Manager Help · How-tos, FAQs & troubleshooting →</Text>
        </Pressable>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={SitGuruColors.primary} />
            <Text style={styles.muted}>Loading live growth metrics…</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.card}>
            <Text style={styles.error}>{error}</Text>
            <Pressable style={styles.button} onPress={() => void load()}>
              <Text style={styles.buttonText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {snapshot ? (
          <>
            <Text style={styles.freshness}>{snapshot.freshnessLabel || 'Live snapshot'}</Text>

            <View style={styles.grid}>
              {(snapshot.kpis || []).slice(0, 8).map((kpi) => (
                <View key={kpi.id} style={styles.kpi}>
                  <Text style={styles.kpiLabel}>{kpi.label}</Text>
                  <Text style={styles.kpiValue}>
                    {formatValue(kpi.value, kpi.unit, kpi.availability)}
                  </Text>
                  {kpi.note ? <Text style={styles.muted}>{kpi.note}</Text> : null}
                </View>
              ))}
            </View>

            <Text style={styles.section}>Insights</Text>
            {(snapshot.insights || []).slice(0, 6).map((insight) => (
              <View key={insight.id} style={styles.card}>
                <Text style={styles.cardTitle}>{insight.title}</Text>
                <Text style={styles.body}>{insight.observation}</Text>
                <Text style={styles.next}>Next: {insight.nextAction}</Text>
                <Text style={styles.muted}>Confidence: {insight.confidence}</Text>
              </View>
            ))}

            <Text style={styles.section}>Weekly goals</Text>
            {(snapshot.goals || []).slice(0, 5).map((goal) => (
              <View key={goal.id} style={styles.card}>
                <Text style={styles.cardTitle}>{goal.label}</Text>
                <Text style={styles.body}>
                  {goal.actual == null ? '—' : goal.actual} / {goal.target}
                  {goal.percentComplete != null ? ` (${goal.percentComplete}%)` : ''}
                </Text>
                <Text style={styles.muted}>Status: {goal.status}</Text>
              </View>
            ))}

            <Text style={styles.section}>Social status</Text>
            {(snapshot.social || []).map((item) => (
              <View key={item.platform} style={styles.card}>
                <Text style={styles.cardTitle}>
                  {item.label} · {item.status}
                </Text>
                <Text style={styles.body}>
                  Followers:{' '}
                  {item.followers == null ? '—' : item.followers.toLocaleString('en-US')}
                </Text>
                <Text style={styles.muted}>{item.setupHint}</Text>
              </View>
            ))}

            {(snapshot.coverageNotes || []).map((note) => (
              <Text key={note} style={styles.muted}>
                {note}
              </Text>
            ))}
          </>
        ) : null}
      </View>
    </MobileScreen>
  );
}

export default function GrowthInsightsScreen() {
  const { roles } = useAuth();
  const requiredRole = roles.includes('admin')
    ? 'admin'
    : roles.includes('manager')
      ? 'manager'
      : roles.includes('intern')
        ? 'intern'
        : 'admin';

  return (
    <RoleGate requiredRole={requiredRole} title="Growth Insights">
      <GrowthInsightsBody />
    </RoleGate>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F2744',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: SitGuruColors.textMuted,
    marginBottom: 4,
  },
  helpButton: { minHeight: TOUCH_MIN, borderRadius: 14, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  helpButtonText: { fontSize: 13, fontWeight: '900', color: '#1D4ED8', textAlign: 'center' },
  center: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 40,
  },
  freshness: {
    color: SitGuruColors.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpi: {
    width: '47%',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: SitGuruColors.textMuted,
    textTransform: 'uppercase',
  },
  kpiValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '900',
    color: '#0F2744',
  },
  section: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '900',
    color: '#0F2744',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F2744',
  },
  body: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  next: {
    fontSize: 13,
    fontWeight: '800',
    color: SitGuruColors.primary,
  },
  muted: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  error: {
    color: '#BE123C',
    fontWeight: '700',
  },
  button: {
    marginTop: 8,
    minHeight: TOUCH_MIN,
    borderRadius: 14,
    backgroundColor: SitGuruColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '900',
  },
});
