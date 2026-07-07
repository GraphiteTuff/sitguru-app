import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruProfilePhotoFrame from '@/components/SitGuruProfilePhotoFrame';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import {
  getGuruBookingLabel,
  getGuruDisplayName,
  getGuruLocationLabel,
  getGuruPhotoUrl,
  getGuruRateLabel,
  getGuruRatingLabel,
  getGuruSearchBadge,
  getGuruServices,
  getGuruSlug,
  getGuruVisibilityLabel,
  getGuruBookingStatusLabel,
  isGuruBookable,
  isKnownPreviewGuru,
  type PublicGuruProfile,
} from '@/types/guru';

type ServiceOption = { label: string; value: string };
type GuruLoadResult = { gurus: PublicGuruProfile[]; usedFallback: boolean };

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
  bio: `${name} is a polished local Guru preview showing the care style, services, and trust details SitGuru families can review as local availability grows.`,
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
  service_area: `${city}, ${state} service area`,
  source: 'placeholder',
}));

const services: ServiceOption[] = [
  { label: 'Dog Walking', value: 'dog_walking' },
  { label: 'Pet Sitting', value: 'pet_sitting' },
  { label: 'Drop-In Visits', value: 'drop_in_visits' },
  { label: 'Boarding', value: 'boarding' },
  { label: 'House Sitting', value: 'house_sitting' },
  { label: 'Doggy Day Care', value: 'doggy_day_care' },
  { label: 'Training Support', value: 'training_support' },
];

const SELECT_FIELDS = '*';

async function loadPublicGurus(): Promise<GuruLoadResult> {
  if (!isSupabaseConfigured) return { gurus: [], usedFallback: true };
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
    if (!result.error && result.data?.length) {
      return { gurus: (result.data as PublicGuruProfile[]).map((guru) => ({ ...guru, source: source.table as PublicGuruProfile['source'] })), usedFallback: false };
    }
  }
  return { gurus: [], usedFallback: true };
}

export default function FindCareScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const [zipCode, setZipCode] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceOption>(services[0]);
  const [hasSearched, setHasSearched] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [dynamicGurus, setDynamicGurus] = useState<PublicGuruProfile[]>([]);
  const [isLoadingGurus, setIsLoadingGurus] = useState(true);
  const [usedGuruFallback, setUsedGuruFallback] = useState(false);

  const cleanZip = zipCode.replace(/\D/g, '').slice(0, 5);
  const hasValidZip = cleanZip.length === 5;
  const careAreaLabel = hasValidZip ? `ZIP ${cleanZip}` : 'your care area';
  const displayedGurus = dynamicGurus.length > 0 ? dynamicGurus : previewGurus;

  useEffect(() => {
    let mounted = true;
    loadPublicGurus().then(({ gurus, usedFallback }) => {
      if (!mounted) return;
      setDynamicGurus(gurus);
      setUsedGuruFallback(usedFallback || gurus.length === 0);
    }).catch(() => {
      if (!mounted) return;
      setDynamicGurus([]);
      setUsedGuruFallback(true);
    }).finally(() => {
      if (mounted) setIsLoadingGurus(false);
    });
    return () => { mounted = false; };
  }, []);

  function handleSearch() {
    setHasSearched(true);
    setNoticeMessage(hasValidZip ? `Showing ${selectedService.label} options for ${careAreaLabel}.` : `Showing ${selectedService.label} previews. Enter a ZIP code to narrow care by location.`);
  }

  function handleViewProfile(guru: PublicGuruProfile) {
    const slug = getGuruSlug(guru);
    router.push({ pathname: '/guru-profile', params: slug ? { slug } : { guruId: guru.id } });
  }

  function handleBookingAction(guru: PublicGuruProfile) {
    if (isKnownPreviewGuru(guru)) {
      Alert.alert('Profile Preview', 'This local Guru profile is a preview and is not currently accepting booking requests yet.');
      return;
    }
    if (isGuruBookable(guru)) router.push('/request-booking');
    else router.push('/conversation');
  }

  return (
    <SitGuruScreen scroll center={false} maxWidth={900}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <SitGuruLogo size="small" variant="symbol" />
          <Pressable accessibilityRole="button" onPress={() => router.push('/')} style={styles.topLinkButton}><Text style={styles.topLinkText}>Home</Text></Pressable>
        </View>

        <View style={[styles.heroPanel, isWide && styles.heroPanelWide]}>
          <View style={styles.heroCopy}>
            <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>Open Care Search</Text></View>
            <Text style={styles.title}>Find trusted local Gurus.</Text>
            <Text style={styles.subtitle}>Search by service and ZIP code, compare real Gurus and local Guru previews, then view profiles without creating an account.</Text>
            <View style={styles.heroActions}>
              <Pressable accessibilityRole="button" onPress={handleSearch} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Search Care</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Log In</Text></Pressable>
            </View>
          </View>
          <View style={styles.heroPhotoCard}>
            <Text style={styles.heroPhotoIcon}>🐾</Text>
            <Text style={styles.heroPhotoTitle}>Premium local care search</Text>
            <Text style={styles.heroPhotoText}>Profile photos are shown when Gurus add them. Otherwise, SitGuru uses a polished initials fallback.</Text>
          </View>
        </View>

        <View style={styles.searchPanel}>
          <View style={styles.searchHeader}><View><Text style={styles.searchEyebrow}>Search Gurus</Text><Text style={styles.searchTitle}>What care do you need?</Text></View><Text style={styles.searchBadge}>Public search</Text></View>
          <View style={styles.serviceGrid}>{services.map((service) => <Pressable key={service.value} accessibilityRole="button" onPress={() => { setSelectedService(service); setNoticeMessage(''); }} style={[styles.servicePill, selectedService.value === service.value && styles.servicePillSelected]}><Text style={[styles.servicePillText, selectedService.value === service.value && styles.servicePillTextSelected]}>{service.label}</Text></Pressable>)}</View>
          <View style={styles.zipPanel}><View style={styles.zipInputWrap}><Text style={styles.inputLabel}>Care ZIP code</Text><TextInput keyboardType="number-pad" maxLength={5} onChangeText={(value) => { setZipCode(value.replace(/\D/g, '').slice(0, 5)); setNoticeMessage(''); }} placeholder="18951" placeholderTextColor={SitGuruColors.textSoft} style={styles.zipInput} value={zipCode} /><Text style={styles.inputHelper}>Enter the ZIP code where care is needed.</Text></View><Pressable accessibilityRole="button" onPress={() => setNoticeMessage('Location search will be available after phone location permission is enabled. For now, enter a care ZIP code.')} style={styles.locationButton}><Text style={styles.locationButtonText}>Use my location</Text></Pressable></View>
          <Pressable accessibilityRole="button" onPress={handleSearch} style={styles.searchButton}><Text style={styles.searchButtonText}>Search {selectedService.label}</Text></Pressable>
          {noticeMessage ? <View style={styles.noticePanel}><Text style={styles.noticeText}>{noticeMessage}</Text></View> : null}
        </View>

        <View style={styles.resultsHeader}><Text style={styles.resultsEyebrow}>{hasSearched ? 'Search results' : 'Local Guru preview'}</Text><Text style={styles.resultsTitle}>Gurus for {selectedService.label}</Text><Text style={styles.resultsText}>{isLoadingGurus ? 'Loading available Guru profiles and photos...' : usedGuruFallback ? 'Live Guru data is not available yet, so SitGuru is showing local preview profiles until availability grows.' : hasSearched ? `Showing live Guru profiles and any local previews for ${careAreaLabel}.` : 'Search is public. Choose a service or ZIP to compare local Guru profiles.'}</Text></View>

        <View style={[styles.resultsGrid, isWide && styles.resultsGridWide]}>
          {displayedGurus.map((guru) => {
            const name = getGuruDisplayName(guru);
            const photoUrl = resolveSupabaseStorageUrl(getGuruPhotoUrl(guru));
            const bookable = isGuruBookable(guru);
            const preview = isKnownPreviewGuru(guru);
            const allServices = getGuruServices(guru);
            const chips = allServices.slice(0, 4);
            const extraServiceCount = Math.max(0, allServices.length - chips.length);
            const bookingStatus = getGuruBookingStatusLabel(guru);
            const visibilityStatus = getGuruVisibilityLabel(guru);
            return (
              <View key={guru.id} style={styles.guruCard}>
                <View style={styles.guruPhotoSlot}>
                  <SitGuruProfilePhotoFrame fallbackEmoji="🐾" helperLabel={preview ? 'Local Guru Preview' : 'Local Guru'} imageUrl={photoUrl} name={name} roleLabel={getGuruSearchBadge(guru)} shape="square" size="lg" />
                  <View style={styles.photoTrustRow}>
                    <Text style={styles.photoTrustText}>✓ Profile</Text>
                    <Text style={styles.photoTrustText}>✓ Updates</Text>
                    <Text style={styles.photoTrustText}>✓ SitGuru care</Text>
                  </View>
                </View>
                <View style={styles.guruContent}>
                  <View style={styles.guruTopRow}><SitGuruProfilePhotoFrame imageUrl={photoUrl} name={name} shape="circle" size="sm" /><View style={styles.guruMeta}><View style={styles.nameRow}><Text style={styles.guruName}>{name}</Text>{guru.is_verified && !preview ? <Text style={styles.verifiedBadge}>Verified</Text> : null}</View><Text style={styles.guruRole}>{guru.role || 'Pet Care Guru'}</Text></View></View>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusBadge}>{bookingStatus}</Text>
                    <Text style={styles.visibilityBadge}>{visibilityStatus}</Text>
                  </View>
                  <Text style={styles.guruBio} numberOfLines={3}>{guru.bio || 'Trusted local care with clear updates, thoughtful routines, and SitGuru safety reminders.'}</Text>
                  <View style={styles.detailPanel}>
                    <Text style={styles.detailLabel}>Service area</Text>
                    <Text style={styles.detailValue}>⌖ {getGuruLocationLabel(guru)}</Text>
                  </View>
                  <View style={styles.guruStatsRow}><View style={styles.guruStat}><Text style={styles.guruStatValue}>{getGuruRatingLabel(guru)}</Text><Text style={styles.guruStatLabel}>Rating</Text></View><View style={styles.guruStat}><Text style={styles.guruStatValue}>{getGuruRateLabel(guru)}</Text><Text style={styles.guruStatLabel}>Rate</Text></View></View>
                  {chips.length ? <View style={styles.serviceSection}><Text style={styles.sectionLabel}>Services</Text><View style={styles.chips}>{chips.map((chip) => <Text key={chip} style={styles.chip}>{chip}</Text>)}{extraServiceCount ? <Text style={styles.moreChip}>+{extraServiceCount} more</Text> : null}</View></View> : null}
                  <View style={styles.guruActions}><Pressable accessibilityRole="button" onPress={() => handleViewProfile(guru)} style={styles.viewButton}><Text style={styles.viewButtonText}>View Profile</Text></Pressable><Pressable accessibilityRole="button" onPress={() => handleBookingAction(guru)} style={[styles.bookButton, (!bookable || preview) && styles.disabledBookButton]}><Text style={[styles.bookButtonText, (!bookable || preview) && styles.disabledBookButtonText]}>{getGuruBookingLabel(guru)}</Text></Pressable></View>
                  <Pressable accessibilityRole="button" onPress={() => router.push('/conversation')} style={styles.messageButton}><Text style={styles.messageButtonText}>Ask a Question</Text></Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18, paddingBottom: 28, paddingVertical: 4 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  topLinkButton: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  topLinkText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  heroPanel: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 34, borderWidth: 1, elevation: 4, gap: 18, overflow: 'hidden', padding: 18 },
  heroPanelWide: { flexDirection: 'row' },
  heroCopy: { flex: 1, gap: 16, justifyContent: 'center', padding: 4 },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  heroBadgeText: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { color: SitGuruColors.text, fontSize: 42, fontWeight: '900', letterSpacing: -1.1, lineHeight: 45 },
  subtitle: { color: SitGuruColors.textMuted, fontSize: 17, fontWeight: '700', lineHeight: 25 },
  heroActions: { gap: 10 },
  primaryButton: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 999, justifyContent: 'center', minHeight: 52, paddingHorizontal: 18, paddingVertical: 14 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primary, borderRadius: 999, borderWidth: 1, justifyContent: 'center', minHeight: 52, paddingHorizontal: 18, paddingVertical: 14 },
  secondaryButtonText: { color: SitGuruColors.primary, fontSize: 16, fontWeight: '900' },
  heroPhotoCard: { alignItems: 'center', backgroundColor: SitGuruColors.primaryDark, borderRadius: 28, flex: 1, gap: 8, justifyContent: 'center', minHeight: 220, padding: 22 },
  heroPhotoIcon: { fontSize: 46 },
  heroPhotoTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  heroPhotoText: { color: SitGuruColors.primaryLight, fontSize: 14, fontWeight: '700', lineHeight: 20, textAlign: 'center' },
  searchPanel: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 30, borderWidth: 1, gap: 16, padding: 18 },
  searchHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  searchEyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  searchTitle: { color: SitGuruColors.text, fontSize: 24, fontWeight: '900' },
  searchBadge: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, color: SitGuruColors.primaryDark, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 7 },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  servicePill: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10 },
  servicePillSelected: { backgroundColor: SitGuruColors.primary, borderColor: SitGuruColors.primary },
  servicePillText: { color: SitGuruColors.primaryDark, fontSize: 13, fontWeight: '900' },
  servicePillTextSelected: { color: '#FFFFFF' },
  zipPanel: { gap: 12 },
  zipInputWrap: { gap: 7 },
  inputLabel: { color: SitGuruColors.text, fontSize: 13, fontWeight: '900' },
  zipInput: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, color: SitGuruColors.text, fontSize: 18, fontWeight: '900', paddingHorizontal: 14, paddingVertical: 12 },
  inputHelper: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '700' },
  locationButton: { alignItems: 'center', borderColor: SitGuruColors.primary, borderRadius: 999, borderWidth: 1, padding: 12 },
  locationButtonText: { color: SitGuruColors.primary, fontSize: 14, fontWeight: '900' },
  searchButton: { alignItems: 'center', backgroundColor: SitGuruColors.primaryDark, borderRadius: 999, padding: 15 },
  searchButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  noticePanel: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 18, padding: 12 },
  noticeText: { color: SitGuruColors.primaryDark, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  resultsHeader: { gap: 6 },
  resultsEyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  resultsTitle: { color: SitGuruColors.text, fontSize: 28, fontWeight: '900' },
  resultsText: { color: SitGuruColors.textMuted, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  resultsGrid: { gap: 16 },
  resultsGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  guruCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 30, borderWidth: 1, flexGrow: 1, gap: 14, maxWidth: 420, minWidth: 300, overflow: 'hidden', padding: 16 },
  guruPhotoSlot: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 24, borderWidth: 1, gap: 12, padding: 16 },
  photoTrustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  photoTrustText: { backgroundColor: '#FFFFFF', borderRadius: 999, color: SitGuruColors.primaryDark, fontSize: 11, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5 },
  guruContent: { gap: 12 },
  guruTopRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  guruMeta: { flex: 1, gap: 3 },
  nameRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  guruName: { color: SitGuruColors.text, fontSize: 22, fontWeight: '900' },
  verifiedBadge: { backgroundColor: SitGuruColors.primaryLight, borderRadius: 999, color: SitGuruColors.primaryDark, fontSize: 10, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4 },
  guruRole: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '900' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: SitGuruColors.primary, borderRadius: 999, color: '#FFFFFF', fontSize: 11, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, textTransform: 'uppercase' },
  visibilityBadge: { alignSelf: 'flex-start', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 999, borderWidth: 1, color: SitGuruColors.primaryDark, fontSize: 11, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, textTransform: 'uppercase' },
  guruBio: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  guruInfoText: { color: SitGuruColors.primaryDark, fontSize: 13, fontWeight: '900' },
  detailPanel: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, gap: 4, padding: 12 },
  detailLabel: { color: SitGuruColors.textSoft, fontSize: 11, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  detailValue: { color: SitGuruColors.primaryDark, fontSize: 14, fontWeight: '900', lineHeight: 19 },
  guruStatsRow: { flexDirection: 'row', gap: 10 },
  guruStat: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, flex: 1, padding: 12 },
  guruStatValue: { color: SitGuruColors.text, fontSize: 15, fontWeight: '900' },
  guruStatLabel: { color: SitGuruColors.textSoft, fontSize: 11, fontWeight: '900', marginTop: 3 },
  serviceSection: { gap: 8 },
  sectionLabel: { color: SitGuruColors.textSoft, fontSize: 11, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, color: SitGuruColors.primaryDark, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 7 },
  moreChip: { backgroundColor: SitGuruColors.primaryLight, borderRadius: 999, color: SitGuruColors.primaryDark, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 7 },
  guruActions: { flexDirection: 'row', gap: 10 },
  viewButton: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 999, flex: 1, padding: 13 },
  viewButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  messageButton: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primary, borderRadius: 999, borderWidth: 1, padding: 13 },
  messageButtonText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900' },
  bookButton: { alignItems: 'center', backgroundColor: SitGuruColors.primaryDark, borderRadius: 999, flex: 1, padding: 13 },
  bookButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  disabledBookButton: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.border, borderWidth: 1 },
  disabledBookButtonText: { color: SitGuruColors.primaryDark },
});
