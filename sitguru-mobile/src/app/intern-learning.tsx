import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import MobileScreen from '@/components/mobile/MobileScreen';
import TouchTarget from '@/components/mobile/TouchTarget';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { sitguruApiFetch } from '@/lib/data/api';

type LearningWorkspace = {
  mode: 'intern' | 'instructor';
  firstName?: string;
  pillars?: { id: string; label: string; weight: number; assigned: number; completed: number; approvedHours: number }[];
  upcoming?: { id: string; title: string; date: string; type: string }[];
  grades?: { id: string; title: string; total: number; possible: number; feedback: string }[] | null;
  announcements?: { id: string; title: string; body: string; created_at: string }[] | null;
  partners?: { id: string; name: string; status: string; category: string }[] | null;
  reviews?: { id: string; title: string; internName: string; statusLabel: string }[];
};

const site = 'https://www.sitguru.com';

export default function InternLearningScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { session, loading } = useAuth();
  const [workspace, setWorkspace] = useState<LearningWorkspace | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(true);

  const load = useCallback(async (isCurrent: () => boolean = () => true) => {
    const result = await sitguruApiFetch<LearningWorkspace>(
      mode === 'instructor' ? '/api/internship/learning?mode=instructor' : '/api/internship/learning',
      { cache: 'no-store' },
    );
    if (!isCurrent()) return;
    setWorkspace(result.data);
    setError(result.error || '');
    setRefreshing(false);
  }, [mode]);

  useEffect(() => {
    if (!session) return;
    let current = true;
    void Promise.resolve().then(() => current ? load(() => current) : undefined);
    return () => { current = false; };
  }, [session, load]);

  return (
    <MobileScreen refreshing={Boolean(session) && refreshing} onRefresh={session ? () => { setRefreshing(true); return load(); } : undefined}>
      <View style={styles.hero}>
        <Text style={styles.title}>{mode === 'instructor' ? 'SitGuru Speed Review' : 'Learning & Growth Center'}</Text>
        {workspace?.firstName ? <Text style={styles.welcome}>Welcome back, {workspace.firstName}</Text> : null}
      </View>
      {loading || (session && refreshing && !workspace) ? <ActivityIndicator color={BrandColors.greenDark} /> : null}
      {!loading && !session ? <Text style={styles.body}>Sign in to open your SitGuru internship workspace.</Text> : null}
      {session && error ? (
        <View style={styles.card}>
          <Text accessibilityLiveRegion="polite" style={styles.body}>{error}</Text>
          <TouchTarget onPress={() => void load()} style={styles.button}><Text style={styles.buttonText}>Try again</Text></TouchTarget>
        </View>
      ) : null}
      {session && workspace?.mode === 'instructor' ? (
        <View style={styles.card}>
          <Text style={styles.heading}>Pending assignment submissions</Text>
          {workspace.reviews?.length ? workspace.reviews.map((row) => (
            <TouchTarget key={row.id} style={styles.review} onPress={() => void Linking.openURL(`${site}/manager/assignments/${encodeURIComponent(row.id)}`)}>
              <Text style={styles.body}>{row.title}</Text><Text style={styles.body}>{row.internName} · {row.statusLabel}</Text>
            </TouchTarget>
          )) : <Text style={styles.body}>No pending submissions.</Text>}
        </View>
      ) : null}
      {session && workspace?.mode === 'intern' ? (
        <>
          <View style={styles.card}>
            <Text style={styles.heading}>Growth pillar progress</Text>
            {workspace.pillars?.map((pillar) => (
              <View key={pillar.id} style={styles.line}>
                <Text style={styles.label}>{pillar.label}</Text>
                <Text style={styles.body}>Planned workload · {pillar.weight}%</Text>
                <Text style={styles.body}>{pillar.assigned ? `${pillar.completed} of ${pillar.assigned} assignments completed` : 'No classified assignments'}</Text>
                {pillar.approvedHours ? <Text style={styles.body}>{pillar.approvedHours} approved linked hours</Text> : null}
              </View>
            ))}
          </View>
          <View style={styles.card}>
            <Text style={styles.heading}>Upcoming deadlines</Text>
            {workspace.upcoming?.length ? workspace.upcoming.map((row) => (
              <Text key={`${row.type}-${row.id}`} style={styles.body}>{row.date} · {row.title}</Text>
            )) : <Text style={styles.body}>No upcoming assignment or milestone dates.</Text>}
          </View>
          <View style={styles.card}>
            <Text style={styles.heading}>My grades</Text>
            <Text style={styles.body}>SitGuru employer evaluations</Text>
            {workspace.grades === null ? <Text style={styles.body}>Grades are temporarily unavailable.</Text> :
              workspace.grades?.length ? workspace.grades.map((row) => (
                <View key={row.id} style={styles.line}>
                  <Text style={styles.label}>{row.title} · {row.total} / {row.possible}</Text>
                  {row.feedback ? <Text style={styles.body}>{row.feedback}</Text> : null}
                </View>
              )) : <Text style={styles.body}>No released evaluations.</Text>}
          </View>
          <View style={styles.card}>
            <Text style={styles.heading}>Announcements</Text>
            {workspace.announcements === null ? <Text style={styles.body}>Announcements are temporarily unavailable.</Text> :
              workspace.announcements?.length ? workspace.announcements.map((row) => (
                <View key={row.id} style={styles.line}><Text style={styles.label}>{row.title}</Text><Text style={styles.body}>{row.body}</Text></View>
              )) : <Text style={styles.body}>No announcements yet.</Text>}
          </View>
          <View style={styles.card}>
            <Text style={styles.heading}>Assigned partnerships</Text>
            {workspace.partners === null ? <Text style={styles.body}>Partnerships are temporarily unavailable.</Text> :
              workspace.partners?.length ? workspace.partners.map((row) => (
                <Text key={row.id} style={styles.body}>{row.name} · {row.status}</Text>
              )) : <Text style={styles.body}>No assigned partnerships.</Text>}
            <TouchTarget style={styles.button} onPress={() => void Linking.openURL(`${site}/intern/growth/partners`)}>
              <Text style={styles.buttonText}>Open partnership workspace</Text>
            </TouchTarget>
          </View>
        </>
      ) : null}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: BrandColors.greenDark, borderRadius: 20, padding: 18, marginBottom: 12 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  welcome: { color: '#fff', fontSize: 15, marginTop: 6 },
  heading: { color: BrandColors.greenDark, fontSize: 18, fontWeight: '800' },
  body: { color: BrandColors.slate, fontSize: 14, lineHeight: 20 },
  label: { color: BrandColors.greenDark, fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderColor: '#dbe6df', borderWidth: 1, borderRadius: 16, padding: 14, gap: 8, marginBottom: 12 },
  line: { borderTopWidth: 1, borderTopColor: '#e5eee7', paddingTop: 8, gap: 4 },
  button: { minHeight: 48, backgroundColor: BrandColors.greenDark, borderRadius: 12, padding: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  review: { minHeight: 48, backgroundColor: '#edf7f1', borderRadius: 12, padding: 10 },
});
