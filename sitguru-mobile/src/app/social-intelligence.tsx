import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import RoleGate from '@/components/RoleGate';
import MobileScreen from '@/components/mobile/MobileScreen';
import { useAuth } from '@/hooks/useAuth';
import { sitguruApiFetch } from '@/lib/data/api';
import { SocialDeskColors, SocialDeskKpiTones } from '@/constants/social-intelligence-desk';

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
  connections: Array<{ platform: string; status: string }>;
  metaSync: Array<{ platform: string; status: string; importedPosts: number }>;
  publishedChannelCounts: Record<string, number>;
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
function Metric({
  title, value, note, tone,
}: {
  title: string;
  value: number | null;
  note?: string;
  tone: keyof typeof SocialDeskKpiTones;
}) {
  const colors = SocialDeskKpiTones[tone];
  return (
    <View style={[styles.metric, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={styles.metricLabel}>{title}</Text>
      <Text style={[styles.metricNumber, { color: colors.value }]}>{display(value)}</Text>
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

  const fetchLoad = useCallback(async (refresh = false) => {
    const query = new URLSearchParams({ preset, platform });

    return sitguruApiFetch<Snapshot>('/api/social-intelligence/snapshot?' + query.toString(), {
      method: 'GET', cache: 'no-store',
    }).then(async (result) => {
      if (result.error || !result.data) {
        setError(result.error || 'Unable to load Social Intelligence.');
        setSnapshot(null);
      } else setSnapshot(result.data);
      setLoading(false);
      setRefreshing(false);
    });
  }, [platform, preset]);

  const load = useCallback((refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    return fetchLoad(refresh);
  }, [fetchLoad, setRefreshing, setLoading, setError]);

  const filterKey = preset + ":" + platform;
  const [previousFilterKey, setPreviousFilterKey] = useState(filterKey);
  if (previousFilterKey !== filterKey) {
    setPreviousFilterKey(filterKey);
    setLoading(true);
    setError('');
  }

  useEffect(() => { void fetchLoad(); }, [fetchLoad]);

  const posts = useMemo(() =>
    [...(snapshot?.posts || [])].sort((a, b) =>
      (rankValue(b, metric) ?? -1) - (rankValue(a, metric) ?? -1)
    ).slice(0, 10),
  [snapshot, metric]);
  const opened = posts.find((post) => post.id === selected) || null;
  const daily = snapshot?.daily.slice(-14) || [];
  const maxBar = Math.max(1, ...daily.map((item) => item.pageViews));
  const recentPosts = [...(snapshot?.posts || [])]
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
    .slice(0, 6);

  return (
    <MobileScreen refreshing={refreshing} onRefresh={() => void load(true)}>
      <View style={styles.container}>
        <LinearGradient
          colors={[SocialDeskColors.navy, '#104951', SocialDeskColors.evergreen]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.hero}
        >
          <Text style={styles.heroKicker}>🐾 SitGuru · Growth Center Insights</Text>
          <Text style={styles.heroTitle}>Social Intelligence</Text>
          <Text style={styles.heroDescription}>Content performance, community growth and measurable SitGuru activity.</Text>
          <View style={styles.heroSteps}>
            {['Create', 'Publish', 'Measure', 'Grow SitGuru'].map((step) => (
              <Text key={step} style={styles.heroStep}>{step}</Text>
            ))}
          </View>
        </LinearGradient>
        <View style={styles.filterRow}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/guru-match-share')} style={styles.chip}>
            <Text style={styles.chipText}>Guru Match &amp; Share tracking →</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/content-studio')} style={styles.chip}>
            <Text style={styles.chipText}>Content Studio →</Text>
          </Pressable>
        </View>
        <View style={styles.filterPanel}>
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
        </View>
        {loading ? <View style={styles.center}><ActivityIndicator color={SocialDeskColors.primary}/><Text style={styles.muted}>Loading verified metrics…</Text></View> : null}
        {error ? <View style={styles.card}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void load()} style={styles.chip}><Text style={styles.chipText}>Retry</Text></Pressable></View> : null}
        {snapshot ? (
          <>
            <Text style={styles.freshness}>{snapshot.rangeLabel}</Text>
            <View style={styles.metrics}>
              <Metric title="Provider views" value={snapshot.postViews} note="Available snapshots" tone="views"/>
              <Metric title="Site visits" value={snapshot.total.pageViews} tone="visits"/>
              <Metric title="Link clicks" value={snapshot.total.linkClicks} tone="clicks"/>
              <Metric title="Signup events" value={snapshot.total.signupEvents} tone="signups"/>
              <Metric title="Booking events" value={snapshot.total.bookingEvents} note="Not verified paid bookings" tone="bookings"/>
              <Metric title="Paid revenue" value={null} note="Attribution not verified" tone="revenue"/>
            </View>
            <Text style={styles.section}>Recently published · All SitGuru socials</Text>
            <View style={styles.card}>
              <Text style={styles.muted}>Facebook, Instagram, TikTok, X and YouTube. Counts reflect your authorized published posts in this period, even when viewing one channel. Account followers do not imply post import access.</Text>
              <View style={styles.channelGrid}>
                {NETWORKS.filter((item) => item.value !== 'all').map((network) => {
                  const count = snapshot.publishedChannelCounts?.[network.value] ?? 0;
                  const meta = snapshot.metaSync?.find((item) => item.platform === network.value);
                  const connector = snapshot.connections?.find((item) => item.platform === network.value);
                  const status = meta
                    ? meta.status === 'success' ? 'Meta imported' : meta.status === 'error' ? 'Import needs access' : 'Awaiting Meta sync'
                    : count > 0 ? 'Posts cataloged' : connector?.status === 'connected' ? 'Account data only' : 'Post import unavailable';
                  const active = platform === network.value;
                  return (
                    <Pressable key={network.value} accessibilityRole="button" accessibilityState={{ selected: active }}
                      onPress={() => { setPlatform(active ? 'all' : network.value); setSelected(null); }}
                      style={[styles.channelCard, active && styles.channelSelected]}>
                      <Text style={styles.cardTitle}>{network.label}</Text>
                      <Text style={styles.channelCount}>{count} {count === 1 ? 'post' : 'posts'} in period</Text>
                      <Text style={styles.muted}>{status}</Text>
                      <Text style={styles.channelAction}>{active ? 'Show all' : 'View posts'}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.muted}>The web portal&apos;s Sync Facebook & Instagram button refreshes Meta only. TikTok, X and YouTube posts appear from approved publishing records or authorized imports.</Text>
              {recentPosts.map((post) => (
                <View key={post.id} style={styles.recentRow}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{post.channel.toUpperCase()} · {post.title}</Text>
                  <Text style={styles.muted}>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Date unavailable'} · {display(post.metrics.views)} verified views</Text>
                </View>
              ))}
              {!recentPosts.length ? <Text style={styles.body}>No published posts cataloged for these filters yet.</Text> : null}
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
            <Text style={styles.section}>🏆 Content leaderboards</Text>
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
            <View style={styles.card}>
              {(snapshot.notices || []).slice(0, 5).map((note) => <Text style={styles.muted} key={note}>{note}</Text>)}
              {!snapshot.notices?.length ? <Text style={styles.muted}>All connected sources are reporting normally.</Text> : null}
            </View>
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
  container: {
    paddingHorizontal: 4, paddingTop: 8, paddingBottom: 40, gap: 12,
    backgroundColor: SocialDeskColors.page, borderRadius: 24,
  },
  hero: {
    borderRadius: 24, padding: 20, paddingVertical: 24, gap: 8, overflow: 'hidden',
  },
  heroKicker: { fontSize: 11, fontWeight: '900', color: '#D1FAE5', letterSpacing: 1.1 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: SocialDeskColors.white },
  heroDescription: { fontSize: 13, fontWeight: '600', color: '#ECFDF5', lineHeight: 20 },
  heroSteps: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  heroStep: {
    backgroundColor: 'rgba(255,255,255,0.14)', color: SocialDeskColors.white,
    borderRadius: 22, paddingVertical: 6, paddingHorizontal: 9, fontWeight: '800', fontSize: 10,
  },
  filterPanel: {
    borderWidth: 1, borderColor: SocialDeskColors.border,
    backgroundColor: SocialDeskColors.white, borderRadius: 19,
    padding: 14, gap: 10,
  },
  section: { marginTop: 8, fontSize: 18, fontWeight: '900', color: SocialDeskColors.navy },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1, borderColor: SocialDeskColors.border, borderRadius: 24,
    paddingVertical: 10, paddingHorizontal: 14, minHeight: 44,
    backgroundColor: SocialDeskColors.control, justifyContent: 'center',
  },
  chipActive: { backgroundColor: SocialDeskColors.primary, borderColor: SocialDeskColors.primary },
  chipText: { fontSize: 12, fontWeight: '900', color: SocialDeskColors.navy },
  chipTextActive: { color: SocialDeskColors.white },
  center: { padding: 30, alignItems: 'center', gap: 12 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  metric: {
    width: '48%', borderRadius: 17, padding: 14, gap: 7, minHeight: 110,
    borderWidth: 1,
  },
  metricLabel: { fontSize: 11, fontWeight: '900', color: SocialDeskColors.navy },
  metricNumber: { fontSize: 26, fontWeight: '900' },
  card: {
    borderWidth: 1, borderColor: SocialDeskColors.border,
    backgroundColor: SocialDeskColors.white,
    borderRadius: 18, padding: 15, gap: 9,
  },
  freshness: { color: SocialDeskColors.textSoft, fontSize: 12, fontWeight: '700', paddingHorizontal: 3 },
  channelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  channelCard: { flexGrow: 1, width: '46%', gap: 5, minHeight: 115, padding: 11, borderRadius: 14, borderWidth: 1, borderColor: '#D1EADD', backgroundColor: '#F0FDF4' },
  channelSelected: { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
  channelCount: { fontSize: 13, fontWeight: '800', color: SocialDeskColors.navy },
  channelAction: { fontSize: 12, fontWeight: '900', color: '#2563EB' },
  recentRow: { borderTopWidth: 1, borderTopColor: SocialDeskColors.border, paddingTop: 9, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: SocialDeskColors.navy },
  body: { fontSize: 13, fontWeight: '600', color: '#334155', lineHeight: 20 },
  muted: { color: SocialDeskColors.muted, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  bars: { height: 108, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3 },
  barSlot: { flex: 1, justifyContent: 'flex-end', height: 100 },
  bar: {
    width: '100%', backgroundColor: SocialDeskColors.primary,
    borderTopLeftRadius: 5, borderTopRightRadius: 5,
  },
  details: {
    borderTopWidth: 1, borderTopColor: SocialDeskColors.softBlue,
    marginTop: 9, paddingTop: 12, gap: 9,
  },
  error: { color: SocialDeskColors.red, fontWeight: '700', fontSize: 13 },
});
