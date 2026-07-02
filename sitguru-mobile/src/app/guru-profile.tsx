import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruProfilePhotoFrame from '@/components/SitGuruProfilePhotoFrame';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import {
  getGuruBookingLabel,
  getGuruDisplayName,
  getGuruFirstName,
  getGuruLocationLabel,
  getGuruPhotoUrl,
  getGuruProfileNotice,
  getGuruRateLabel,
  getGuruRatingLabel,
  getGuruSearchBadge,
  getGuruServices,
  getGuruSlug,
  isGuruBookable,
  isKnownPreviewGuru,
  type PublicGuruProfile,
} from '@/types/guru';

const previewGurus: PublicGuruProfile[] = [
  ['preview-avery', 'Avery', 'Quakertown', 'PA', 28, ['Dog Walking', 'Drop-In Visits', 'Pet Sitting']],
  ['preview-caleb', 'Caleb', 'Bethlehem', 'PA', 30, ['Boarding', 'Dog Walking', 'House Sitting']],
  ['preview-darius', 'Darius', 'Philadelphia', 'PA', 32, ['Drop-In Visits', 'Senior Pets', 'Dog Walking']],
  ['preview-emma', 'Emma', 'Doylestown', 'PA', 29, ['Pet Sitting', 'Cats', 'Medication Reminders']],
  ['preview-jason', 'Jason', 'Allentown', 'PA', 31, ['Doggy Day Care', 'Boarding', 'Large Dogs']],
  ['preview-maya', 'Maya', 'Lansdale', 'PA', 27, ['Puppy Visits', 'Dog Walking', 'Photo Updates']],
  ['preview-nina', 'Nina', 'Easton', 'PA', 26, ['Cats', 'Drop-In Visits', 'House Sitting']],
  ['preview-olivia', 'Olivia', 'New Hope', 'PA', 34, ['Pet Sitting', 'Trail Walks', 'Weekend Care']],
  ['preview-sofia', 'Sofia', 'Yardley', 'PA', 33, ['Dog Walking', 'Boarding', 'Senior Pets']],
  ['preview-suzy', 'Suzy', 'Perkasie', 'PA', 25, ['Drop-In Visits', 'Small Dogs', 'Pet Sitting']],
].map(([id, name, city, state, rate, services]) => ({
  id: id as string,
  display_name: name as string,
  first_name: name as string,
  slug: String(name).toLowerCase(),
  bio: `${name} is a local Guru preview designed to show families the quality of SitGuru profiles while local care availability grows.`,
  service_city: city as string,
  service_state: state as string,
  hourly_rate: rate as number,
  rating_avg: null,
  review_count: null,
  is_verified: false,
  is_bookable: false,
  accepting_bookings: false,
  is_accepting_bookings: false,
  role: 'Local Pet Care Guru',
  services: services as string[],
  source: 'placeholder',
}));

const SELECT_FIELDS = '*';
const fallbackServices = ['Dog Walking', 'Drop-In Visits', 'Pet Sitting', 'Boarding'];
const safetyNotes = ['Keep booking and payment inside SitGuru', 'Message before booking to confirm fit', 'Use SitGuru care notes and updates for active care'];
const reviewPreview = [
  ['Local family', 'Reviews will appear after completed SitGuru bookings.'],
  ['SitGuru', 'This profile format highlights communication, services, and safety details before families request care.'],
];

async function loadPublicGurus() {
  if (!isSupabaseConfigured) return [] as PublicGuruProfile[];
  const sources: Array<{ table: string; profiles?: boolean }> = [
    { table: 'public_guru_search_profiles' },
    { table: 'guru_profiles' },
    { table: 'gurus' },
    { table: 'profiles', profiles: true },
  ];
  for (const source of sources) {
    let query = supabase.from(source.table).select(SELECT_FIELDS).limit(24);
    if (source.profiles) query = query.in('role', ['guru', 'pet_guru', 'Guru', 'Pet Guru', 'pet care guru']);
    const result = await query;
    if (!result.error && result.data?.length) return (result.data as PublicGuruProfile[]).map((guru) => ({ ...guru, source: source.table as PublicGuruProfile['source'] }));
  }
  return [] as PublicGuruProfile[];
}

export default function GuruProfileScreen() {
  const { guruId, slug } = useLocalSearchParams<{ guruId?: string; slug?: string }>();
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const [gurus, setGurus] = useState<PublicGuruProfile[]>(previewGurus);

  useEffect(() => {
    let mounted = true;
    loadPublicGurus().then((rows) => {
      if (mounted && rows.length) setGurus(rows);
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  const normalizedSlug = typeof slug === 'string' ? slug.toLowerCase() : '';
  const selectedGuru = gurus.find((guru) => guru.id === guruId || getGuruSlug(guru).toLowerCase() === normalizedSlug) ?? previewGurus.find((guru) => guru.id === guruId || getGuruSlug(guru).toLowerCase() === normalizedSlug) ?? gurus[0] ?? previewGurus[0];
  const guruName = getGuruDisplayName(selectedGuru);
  const guruLocation = getGuruLocationLabel(selectedGuru);
  const guruPhotoUrl = resolveSupabaseStorageUrl(getGuruPhotoUrl(selectedGuru));
  const preview = isKnownPreviewGuru(selectedGuru);
  const bookable = isGuruBookable(selectedGuru);
  const services = getGuruServices(selectedGuru);
  const serviceList = services.length ? services : fallbackServices;
  const notice = getGuruProfileNotice(selectedGuru);

  function handleBookingAction() {
    if (preview) {
      Alert.alert('Profile Preview', 'This local Guru profile is a preview and is not currently accepting booking requests yet.');
      return;
    }
    if (bookable) router.push('/request-booking');
    else router.push('/conversation');
  }

  return (
    <SitGuruScreen scroll center={false} maxWidth={940}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}><SitGuruLogo size="small" variant="symbol" /><Text style={styles.brandText}>Local Guru Profile</Text></View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/find-care')} style={styles.backButton}><Text style={styles.backButtonText}>← Back to Find Care</Text></Pressable>
        </View>

        <View style={[styles.heroCard, isWide && styles.heroCardWide]}>
          <View style={styles.heroPhoto}><SitGuruProfilePhotoFrame fallbackEmoji="" helperLabel={preview ? 'Local Guru Preview' : 'Public Guru photo'} imageUrl={guruPhotoUrl} name={guruName} roleLabel={getGuruSearchBadge(selectedGuru)} shape="portrait" size="hero" /></View>
          <View style={styles.heroContent}>
            <View style={styles.badgeRow}><Badge label={getGuruSearchBadge(selectedGuru)} />{selectedGuru.is_verified && !preview ? <Badge label="Verified Guru" muted /> : null}</View>
            <Text style={styles.name}>{guruName}</Text>
            <Text style={styles.meta}>{guruLocation}</Text>
            <Text style={styles.meta}>{getGuruRateLabel(selectedGuru)} • {getGuruRatingLabel(selectedGuru)}</Text>
            {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}
            <View style={styles.primaryActions}><Action label={preview ? 'Message Preview' : 'Message Guru'} route="/conversation" secondary /><Pressable accessibilityRole="button" onPress={handleBookingAction} style={[styles.action, (!bookable || preview) && styles.disabledAction]}><Text style={[styles.actionText, (!bookable || preview) && styles.disabledActionText]}>{getGuruBookingLabel(selectedGuru)}</Text></Pressable></View>
          </View>
        </View>

        <View style={[styles.snapshotGrid, isWide && styles.fourColumns]}>
          <MiniCard label="Status" value={getGuruSearchBadge(selectedGuru)} />
          <MiniCard label="Location" value={guruLocation} />
          <MiniCard label="Rate" value={getGuruRateLabel(selectedGuru)} />
          <MiniCard label="Rating" value={getGuruRatingLabel(selectedGuru)} />
        </View>

        <View style={[styles.contentGrid, isWide && styles.contentGridWide]}>
          <View style={styles.column}>
            <Section eyebrow="Care menu" title="Services offered"><Pills items={serviceList} /></Section>
            <Section eyebrow="Pricing preview" title="Estimated pricing"><Row label="Starting care rate" value={getGuruRateLabel(selectedGuru)} /><Row label="Additional pet fee" value="Confirmed by Guru" /><Row label="Custom needs" value="Message first" /><Text style={styles.note}>Final price is confirmed only after a real Guru accepts a request.</Text></Section>
            <Section eyebrow="Availability" title="Current request status"><Text style={styles.body}>{preview ? 'This local Guru preview is visible for search quality and is not currently accepting booking requests.' : bookable ? `${getGuruFirstName(selectedGuru)} is marked booking-ready by current profile settings.` : 'Message first to confirm whether this Guru is accepting new requests.'}</Text><Pressable accessibilityRole="button" onPress={handleBookingAction} style={[styles.fullAction, (!bookable || preview) && styles.disabledAction]}><Text style={[styles.actionText, (!bookable || preview) && styles.disabledActionText]}>{getGuruBookingLabel(selectedGuru)}</Text></Pressable></Section>
          </View>

          <View style={styles.column}>
            <Section eyebrow="Profile" title="About this Guru"><Text style={styles.body}>{selectedGuru.bio || 'Friendly local Guru who values clear communication, thoughtful care notes, and calm pet routines for nearby families.'}</Text></Section>
            <Section eyebrow="Trust and safety" title="What to expect">{safetyNotes.map((note) => <Text key={note} style={styles.check}>✓ {note}</Text>)}</Section>
            <Section eyebrow="Reviews" title={Number(selectedGuru.review_count || 0) > 0 ? 'Reviews' : 'Reviews coming soon'}>{reviewPreview.map(([name, text]) => <View key={name} style={styles.review}><Text style={styles.reviewName}>{name}</Text><Text style={styles.reviewText}>{text}</Text></View>)}</Section>
          </View>
        </View>

        <View style={styles.bookingCard}><Text style={styles.bookingTitle}>{preview ? 'Profile Preview' : 'Ready to connect?'}</Text><Text style={styles.bookingText}>{preview ? 'This local Guru profile is not currently accepting booking requests, but remains viewable while SitGuru grows local availability.' : bookable ? 'Request care with this Guru or message first to confirm fit.' : 'Message this Guru first to confirm availability.'}</Text><View style={styles.primaryActions}><Action label="Message Guru" route="/conversation" secondary /><Pressable accessibilityRole="button" onPress={handleBookingAction} style={[styles.action, (!bookable || preview) && styles.disabledAction]}><Text style={[styles.actionText, (!bookable || preview) && styles.disabledActionText]}>{getGuruBookingLabel(selectedGuru)}</Text></Pressable></View></View>
      </View>
    </SitGuruScreen>
  );
}

function Section({ children, eyebrow, title }: { children: ReactNode; eyebrow: string; title: string }) { return <View style={styles.section}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }
function Badge({ label, muted = false }: { label: string; muted?: boolean }) { return <View style={[styles.badge, muted && styles.badgeMuted]}><Text style={[styles.badgeText, muted && styles.badgeTextMuted]}>{label}</Text></View>; }
function Action({ label, route, secondary = false }: { label: string; route: '/conversation'; secondary?: boolean }) { return <Pressable accessibilityRole="button" onPress={() => router.push(route)} style={[styles.action, secondary && styles.actionSecondary]}><Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{label}</Text></Pressable>; }
function MiniCard({ label, value }: { label: string; value: string }) { return <View style={styles.miniCard}><Text style={styles.miniValue} numberOfLines={1}>{value}</Text><Text style={styles.miniLabel}>{label}</Text></View>; }
function Pills({ items }: { items: string[] }) { return <View style={styles.pills}>{items.map((item) => <View key={item} style={styles.pill}><Text style={styles.pillText}>{item}</Text></View>)}</View>; }
function Row({ label, value }: { label: string; value: string }) { return <View style={styles.priceRow}><Text style={styles.priceLabel}>{label}</Text><Text style={styles.priceValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  page: { gap: 18, paddingBottom: 24 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  brandText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '900' },
  backButton: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  backButtonText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900' },
  heroCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 32, borderWidth: 1, gap: 18, overflow: 'hidden', padding: 18 },
  heroCardWide: { alignItems: 'center', flexDirection: 'row' },
  heroPhoto: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 28, justifyContent: 'center', padding: 22 },
  heroContent: { flex: 1, gap: 10 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { backgroundColor: SitGuruColors.primary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  badgeMuted: { backgroundColor: SitGuruColors.primaryLight },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  badgeTextMuted: { color: SitGuruColors.primaryDark },
  name: { color: SitGuruColors.text, fontSize: 38, fontWeight: '900', letterSpacing: -1 },
  meta: { color: SitGuruColors.textMuted, fontSize: 15, fontWeight: '800' },
  notice: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 20, borderWidth: 1, padding: 13 },
  noticeText: { color: SitGuruColors.primaryDark, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  primaryActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  action: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 999, flex: 1, minHeight: 50, minWidth: 150, justifyContent: 'center', paddingHorizontal: 16 },
  actionSecondary: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primary, borderWidth: 1 },
  actionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  actionTextSecondary: { color: SitGuruColors.primary },
  disabledAction: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.border, borderWidth: 1 },
  disabledActionText: { color: SitGuruColors.primaryDark },
  fullAction: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 999, minHeight: 50, justifyContent: 'center', paddingHorizontal: 16 },
  snapshotGrid: { gap: 10 },
  fourColumns: { flexDirection: 'row' },
  miniCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 22, borderWidth: 1, flex: 1, padding: 16 },
  miniValue: { color: SitGuruColors.primaryDark, fontSize: 18, fontWeight: '900' },
  miniLabel: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '900', marginTop: 4 },
  contentGrid: { gap: 16 },
  contentGridWide: { alignItems: 'flex-start', flexDirection: 'row' },
  column: { flex: 1, gap: 16, width: '100%' },
  section: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 26, borderWidth: 1, gap: 12, padding: 18 },
  eyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  sectionTitle: { color: SitGuruColors.text, fontSize: 22, fontWeight: '900' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { backgroundColor: SitGuruColors.primary, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 },
  pillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  priceRow: { alignItems: 'center', borderColor: SitGuruColors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  priceLabel: { color: SitGuruColors.text, fontSize: 14, fontWeight: '800' },
  priceValue: { color: SitGuruColors.primary, fontSize: 15, fontWeight: '900' },
  note: { color: SitGuruColors.textSoft, fontSize: 13, fontWeight: '800' },
  body: { color: SitGuruColors.textMuted, fontSize: 15, lineHeight: 23 },
  review: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 18, gap: 5, padding: 13 },
  reviewName: { color: SitGuruColors.primaryDark, fontSize: 14, fontWeight: '900' },
  reviewText: { color: SitGuruColors.textMuted, fontSize: 13, lineHeight: 19 },
  check: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '800', lineHeight: 22 },
  bookingCard: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 28, gap: 8, padding: 18 },
  bookingTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  bookingText: { color: SitGuruColors.primaryLight, fontSize: 15, fontWeight: '800', lineHeight: 22 },
});
