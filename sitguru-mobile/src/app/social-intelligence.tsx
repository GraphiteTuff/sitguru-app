import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import RoleGate from '@/components/RoleGate';
import MobileScreen from '@/components/mobile/MobileScreen';
import { useAuth } from '@/hooks/useAuth';
import { sitguruApiFetch } from '@/lib/data/api';
import { SitGuruColors } from '@/constants/colors';

type MetricName = 'views' | 'clicks' | 'shares' | 'signups' | 'bookings';
type Impact = { pageViews: number; linkClicks: number; signupEvents: number; bookingEvents: number };
type Post = {
  id: string;
  title: string;
  channel: string;
  publishedAt: string | null;
  trackingKey: string;
  metrics: { views: number | null; reach: number | null; likes: number | null; comments: number | null; shares: number | null; saves: number | null; follows: number | null; capturedAt: string | null };
  impact: Impact;
};
type Snapshot = {
  capturedAt: string;
  rangeLabel: string;
  postViews: number | null;
  postEngagements: number | null;
  total: Impact;
  channels: Array<{ channel: string; status: string; followers: number | null; impact: Impact }>;
  daily: Array<{ date: string; pageViews: number; linkClicks: number; signupEvents: number; bookingEvents: number }>;
  posts: Post[];
  notices: string[];
};

const PERIODS = [
  { value: 'last_7', label: '7 days' },
  { value: 'last_28', label: '28 days' },
  { value: 'last_90', label: '90 days' },
] as const;
const NETWORKS = [
  { value: 'all', label: 'All' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'x', label: 'X' },
] as const;
const RANKS: Array<{ value: MetricName; label: string }> = [
  { value: 'views', label: 'Watched' },
  { value: 'clicks', label: 'Clicked' },
  { value: 'shares', label: 'Shared' },
  { value: 'signups', label: 'Signups' },
  { value: 'bookings', label: 'Bookings' },
];
function display(value: number | null) {
  return value == null ? '—' : value.toLocaleString('en-US');
}
function rankValue(post: Post, metric: MetricName): number | null {
  if (metric === 'views') return post.metrics.views;
  if (metric === 'shares') return post.metrics.shares;
  if (!post.trackingKey) return null;
  if (metric === 'clicks') return post.impact.linkClicks;
  if (metric === 'signups') return post.impact.signupEvents;
  return post.impact.bookingEvents;
}
function Metric({ title, value, note }: { title: string; value: number | null; note?: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{title}</Text>
      <Text style={styles.metricNumber}>{display(value)}</Text>
      {note ? <Text style={styles.muted}>{note}</Text> : null}
    </View>
  );
}
function Dashboard() {
  const [preset, setPreset] = useState('last_7');
  const [platform, setPlatform] = useState('all');
  const [metric, setMetric] = useState<MetricName>('views');
  const [selected, setSelected] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    const query = new URLSearchParams({ preset, platform });
    const result = await sitguruApiFetch<Snapshot>('/api/social-intelligence/snapshot?' + query.toString(), {
      method: 'GET', cache: 'no-store',
    });
    if (result.error || !result.data) {
      setError(result.error || 'Unable to load Social Intelligence.');
      setSnapshot(null);
    } else setSnapshot(result.data);
    setLoading(false);
    setRefreshing(false);
  }, [platform, preset]);

  useEffect(() => { void load(); }, [load]);

  const posts = useMemo(() =>
    [...(snapshot?.posts || [])].sort((a, b) =>
      (rankValue(b, metric) ?? -1) - (rankValue(a, metric) ?? -1)
    ).slice(0, 10),
  [snapshot, metric]);
  const opened = posts.find((post) => post.id === selected) || null;
  const daily = snapshot?.daily.slice(-14) || [];
  const maxBar = Math.max(1, ...daily.map((item) => item.pageViews));

  return (
    <MobileScreen refreshing={refreshing} onRefresh={() => void load(true)}>
      <View style={styles.container}>
        <Text style={styles.title}>Social Intelligence</Text>
        <Text style={styles.subtitle}>SitGuru Content Studio · Measure what grows our community.</Text>
        <Text style={styles.section}>Reporting period</Text>
        <View style={styles.filterRow}>
          {PERIODS.map((period) => (
            <Pressable key={period.value} accessibilityRole="button" accessibilityState={{ selected: preset === period.value }}
              onPress={() => { setPreset(period.value); setSelected(null); }} style={[styles.chip, preset === period.value && styles.chipActive]}>
              <Text style={[styles.chipText, preset === period.value && styles.chipTextActive]}>{period.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.section}>Social network</Text>
        <View style={styles.filterRow}>
          {NETWORKS.map((network) => (
            <Pressable key={network.value} accessibilityRole="button" accessibilityState={{ selected: platform === network.value }}
              onPress={() => { setPlatform(network.value); setSelected(null); }} style={[styles.chip, platform === network.value && styles.chipActive]}>
              <Text style={[styles.chipText, platform === network.value && styles.chipTextActive]}>{network.label}</Text>
            </Pressable>
          ))}
        </View>
        {loading ? <View style={styles.center}><ActivityIndicator color={SitGuruColors.primary}/><Text style={styles.muted}>Loading verified metrics…</Text></View> : null}
        {error ? <View style={styles.card}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void load()} style={styles.chip}><Text style={styles.chipText}>Retry</Text></Pressable></View> : null}
        {snapshot ? (
          <>
            <Text style={styles.muted}>{snapshot.rangeLabel}</Text>
            <View style={styles.metrics}>
              <Metric title="Provider views" value={snapshot.postViews} note="Available snapshots"/>
              <Metric title="Site visits" value={snapshot.total.pageViews}/>
              <Metric title="Link clicks" value={snapshot.total.linkClicks}/>
              <Metric title="Signup events" value={snapshot.total.signupEvents}/>
              <Metric title="Booking events" value={snapshot.total.bookingEvents} note="Not verified paid bookings"/>
              <Metric title="Paid revenue" value={null} note="Attribution not verified"/>
            </View>
            <Text style={styles.section}>Site visits over time</Text>
            <View style={styles.card}>
              <View style={styles.bars}>
                {daily.map((item) => (
                  <View key={item.date} style={styles.barSlot}>
                    <View style={[styles.bar, { height: Math.max(2, 96 * item.pageViews / maxBar) }]} />
                  </View>
                ))}
              </View>
              <Text style={styles.muted}>First-party social-attributed site activity, not social views.</Text>
            </View>
            <Text style={styles.section}>Content leaderboards</Text>
            <View style={styles.filterRow}>
              {RANKS.map((rank) => (
                <Pressable key={rank.value} accessibilityRole="button" accessibilityState={{ selected: metric === rank.value }}
                  onPress={() => { setMetric(rank.value); setSelected(null); }} style={[styles.chip, metric === rank.value && styles.chipActive]}>
                  <Text style={[styles.chipText, metric === rank.value && styles.chipTextActive]}>{rank.label}</Text>
                </Pressable>
              ))}
            </View>
            {posts.length ? posts.map((post, index) => (
              <View key={post.id} style={styles.card}>
                <Pressable accessibilityRole="button" onPress={() => setSelected(selected === post.id ? null : post.id)}>
                  <Text style={styles.cardTitle}>{index + 1}. {post.title}</Text>
                  <Text style={styles.muted}>{post.channel} · {display(rankValue(post, metric))} {metric} · {selected === post.id ? 'Hide details' : 'View details'}</Text>
                </Pressable>
                {opened?.id === post.id ? (
                  <View style={styles.details}>
                    <Text style={styles.cardTitle}>Provider performance</Text>
                    <Text style={styles.body}>Views {display(post.metrics.views)} · Reach {display(post.metrics.reach)}</Text>
                    <Text style={styles.body}>Likes {display(post.metrics.likes)} · Comments {display(post.metrics.comments)} · Shares {display(post.metrics.shares)}</Text>
                    <Text style={styles.body}>Saves {display(post.metrics.saves)} · Follows {display(post.metrics.follows)}</Text>
                    <Text style={styles.cardTitle}>SitGuru impact</Text>
                    <Text style={styles.body}>Link clicks {post.trackingKey ? display(post.impact.linkClicks) : '—'} · Signups {post.trackingKey ? display(post.impact.signupEvents) : '—'}</Text>
                    <Text style={styles.body}>Booking events {post.trackingKey ? display(post.impact.bookingEvents) : '—'} · Paid bookings unverified</Text>
                    <Text style={styles.muted}>Provider insights last synced: {post.metrics.capturedAt ? new Date(post.metrics.capturedAt).toLocaleString() : 'Not available'}</Text>
                  </View>
                ) : null}
              </View>
            )) : <View style={styles.card}><Text style={styles.body}>No published social posts are linked to these filters yet.</Text></View>}
            <Text style={styles.section}>Data coverage</Text>
            {(snapshot.notices || []).slice(0, 5).map((note) => <Text style={styles.muted} key={note}>{note}</Text>)}
          </>
        ) : null}
      </View>
    </MobileScreen>
  );
}
export default function SocialIntelligenceScreen() {
  const { roles } = useAuth();
  const requiredRole = roles.includes('admin') ? 'admin' : roles.includes('manager') ? 'manager' : roles.includes('intern') ? 'intern' : 'admin';
  return <RoleGate requiredRole={requiredRole} title="Social Intelligence"><Dashboard/></RoleGate>;
}
const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 12 },
  title: { fontSize: 27, fontWeight: '900', color: '#0F2744' },
  subtitle: { fontSize: 13, fontWeight: '600', color: '#475569' },
  section: { marginTop: 8, fontSize: 17, fontWeight: '900', color: '#0F2744' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, minHeight: 42, backgroundColor: '#FFFFFF', justifyContent: 'center' },
  chipActive: { backgroundColor: '#0D5C3A', borderColor: '#0D5C3A' },
  chipText: { fontSize: 12, fontWeight: '800', color: '#334155' },
  chipTextActive: { color: '#FFFFFF' },
  center: { padding: 30, alignItems: 'center', gap: 12 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { width: '47%', borderRadius: 15, padding: 12, backgroundColor: '#EFF6F2', gap: 6, borderWidth: 1, borderColor: '#D1EADD' },
  metricLabel: { fontSize: 11, fontWeight: '800', color: '#475569' },
  metricNumber: { fontSize: 25, fontWeight: '900', color: '#0F2744' },
  card: { borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: '#0F2744' },
  body: { fontSize: 13, fontWeight: '600', color: '#334155', lineHeight: 20 },
  muted: { color: '#64748B', fontSize: 12, fontWeight: '600', lineHeight: 17 },
  bars: { height: 108, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3 },
  barSlot: { flex: 1, justifyContent: 'flex-end', height: 100 },
  bar: { width: '100%', backgroundColor: '#0D5C3A', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  details: { borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 9, paddingTop: 12, gap: 9 },
  error: { color: '#BE123C', fontWeight: '700', fontSize: 13 },
});
