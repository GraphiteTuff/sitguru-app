import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type Badge = { icon: string; label: string };
type PricePreview = { service: string; estimate: string; helper: string };
type CalendarPreview = { day: string; date: string; status: 'Open' | 'Limited' | 'Booked' };

const trustBadges: Badge[] = [
  { icon: '✓', label: 'Identity ready' },
  { icon: '🛡️', label: 'Safety-minded' },
  { icon: '📸', label: 'PawReport updates' },
  { icon: '⭐', label: 'Highly responsive' },
];

const servicesOffered = ['Dog Walking', 'Drop-In Visits', 'Pet Sitting', 'House Sitting', 'Doggy Day Care'];
const petTypesAccepted = ['Dogs', 'Cats', 'Small pets', 'Senior pets'];

const pricingPreview: PricePreview[] = [
  { service: 'Drop-In Visit', estimate: '$22+', helper: '30-minute care check-in' },
  { service: 'Dog Walking', estimate: '$25+', helper: 'Neighborhood walk and potty break' },
  { service: 'House Sitting', estimate: '$72+', helper: 'Overnight routine support' },
];

const calendarPreview: CalendarPreview[] = [
  { day: 'Mon', date: '12', status: 'Open' },
  { day: 'Tue', date: '13', status: 'Limited' },
  { day: 'Wed', date: '14', status: 'Open' },
  { day: 'Thu', date: '15', status: 'Booked' },
  { day: 'Fri', date: '16', status: 'Open' },
];

const careStyle = [
  'Calm introductions before every new routine.',
  'Photo notes after walks, meals, medication reminders, and cozy check-ins.',
  'Great fit for pets who like predictable structure and gentle encouragement.',
];

const safetyNotes = [
  'Meet-and-greet recommended before the first booking.',
  'Care requests stay inside SitGuru messaging and booking flows.',
  'No private contact details are shown in this public preview.',
];

export default function GuruProfileScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  return (
    <SitGuruScreen scroll center={false} maxWidth={920}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <SitGuruLogo size="small" variant="symbol" />
            <Text style={styles.brandText}>Guru Preview</Text>
          </View>

          <Pressable accessibilityRole="button" onPress={() => router.push('/find-care')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Find Care</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroPhotoArea}>
            <Text style={styles.heroPhotoIcon}>🌿</Text>
            <Text style={styles.heroPhotoTitle}>Guru hero photo</Text>
            <Text style={styles.heroPhotoText}>Ready for a real uploaded care lifestyle image.</Text>
          </View>

          <View style={[styles.profileHeader, isWide && styles.profileHeaderWide]}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>SG</Text>
              </View>
            </View>

            <View style={styles.profileCopy}>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Available this week</Text>
              </View>

              <Text style={styles.name}>Sample Guru</Text>
              <Text style={styles.location}>Philadelphia, PA • Serves nearby neighborhoods</Text>
              <Text style={styles.profileSummary}>
                A warm, detail-oriented pet care preview for families comparing trusted SitGuru care.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.badgeGrid}>
          {trustBadges.map((badge) => (
            <View key={badge.label} style={styles.trustBadge}>
              <Text style={styles.trustBadgeIcon}>{badge.icon}</Text>
              <Text style={styles.trustBadgeText}>{badge.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.contentGrid, isWide && styles.contentGridWide]}>
          <View style={styles.mainColumn}>
            <Section title="Services offered" eyebrow="Care menu">
              <View style={styles.pillGrid}>
                {servicesOffered.map((service) => (
                  <View key={service} style={styles.pill}>
                    <Text style={styles.pillText}>{service}</Text>
                  </View>
                ))}
              </View>
            </Section>

            <Section title="About this Guru" eyebrow="Profile">
              <Text style={styles.bodyText}>
                This public profile is a safe placeholder preview showing how a Guru can introduce their care experience,
                service area, and pet routine preferences once real profile content is added.
              </Text>
            </Section>

            <Section title="Care style" eyebrow="What to expect">
              <View style={styles.listStack}>
                {careStyle.map((item) => (
                  <View key={item} style={styles.listRow}>
                    <Text style={styles.listBullet}>•</Text>
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            </Section>

            <Section title="Reviews" eyebrow="Coming soon">
              <View style={styles.reviewPlaceholder}>
                <Text style={styles.reviewStars}>★★★★★</Text>
                <Text style={styles.bodyText}>
                  Reviews from verified SitGuru bookings will appear here after families complete care.
                </Text>
              </View>
            </Section>
          </View>

          <View style={styles.sideColumn}>
            <Section title="Pet types accepted" eyebrow="Best fit">
              <View style={styles.pillGrid}>
                {petTypesAccepted.map((petType) => (
                  <View key={petType} style={styles.softPill}>
                    <Text style={styles.softPillText}>{petType}</Text>
                  </View>
                ))}
              </View>
            </Section>

            <Section title="Estimated pricing" eyebrow="Preview only">
              <View style={styles.priceStack}>
                {pricingPreview.map((price) => (
                  <View key={price.service} style={styles.priceRow}>
                    <View style={styles.priceCopy}>
                      <Text style={styles.priceService}>{price.service}</Text>
                      <Text style={styles.priceHelper}>{price.helper}</Text>
                    </View>
                    <Text style={styles.priceEstimate}>{price.estimate}</Text>
                  </View>
                ))}
              </View>
            </Section>

            <Section title="Availability preview" eyebrow="Calendar">
              <View style={styles.calendarRow}>
                {calendarPreview.map((day) => (
                  <View key={`${day.day}-${day.date}`} style={styles.calendarDay}>
                    <Text style={styles.calendarDayText}>{day.day}</Text>
                    <Text style={styles.calendarDateText}>{day.date}</Text>
                    <Text
                      style={[
                        styles.calendarStatus,
                        day.status === 'Open' && styles.calendarOpen,
                        day.status === 'Limited' && styles.calendarLimited,
                        day.status === 'Booked' && styles.calendarBooked,
                      ]}
                    >
                      {day.status}
                    </Text>
                  </View>
                ))}
              </View>
            </Section>

            <Section title="Safety & trust" eyebrow="Notes">
              <View style={styles.listStack}>
                {safetyNotes.map((note) => (
                  <View key={note} style={styles.listRow}>
                    <Text style={styles.checkBullet}>✓</Text>
                    <Text style={styles.listText}>{note}</Text>
                  </View>
                ))}
              </View>
            </Section>
          </View>
        </View>

        <View style={styles.actionPanel}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/conversation')} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Message</Text>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={() => router.push('/request-booking')} style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Request Care</Text>
          </Pressable>
        </View>

        <View style={styles.bottomDock}>
          <DockButton label="Find Care" onPress={() => router.push('/find-care')} />
          <DockButton label="Message" onPress={() => router.push('/conversation')} />
          <DockButton label="Request Care" primary onPress={() => router.push('/request-booking')} />
        </View>
      </View>
    </SitGuruScreen>
  );
}

function Section({ children, eyebrow, title }: { children: ReactNode; eyebrow: string; title: string }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DockButton({ label, onPress, primary = false }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.dockButton, primary && styles.dockButtonPrimary]}>
      <Text style={[styles.dockButtonText, primary && styles.dockButtonTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18, paddingBottom: 22 },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  brandText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '800' },
  backButton: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  backButtonText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900' },
  heroCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 30, borderWidth: 1, overflow: 'hidden' },
  heroPhotoArea: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, justifyContent: 'center', minHeight: 210, padding: 26 },
  heroPhotoIcon: { fontSize: 42, marginBottom: 8 },
  heroPhotoTitle: { color: SitGuruColors.primaryDark, fontSize: 20, fontWeight: '900' },
  heroPhotoText: { color: SitGuruColors.textMuted, fontSize: 14, marginTop: 6, textAlign: 'center' },
  profileHeader: { gap: 14, padding: 20 },
  profileHeaderWide: { alignItems: 'flex-end', flexDirection: 'row' },
  avatarWrap: { marginTop: -64 },
  avatar: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderColor: SitGuruColors.surface, borderRadius: 58, borderWidth: 5, height: 116, justifyContent: 'center', width: 116 },
  avatarInitials: { color: SitGuruColors.surface, fontSize: 34, fontWeight: '900' },
  profileCopy: { flex: 1, gap: 8 },
  statusPill: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: SitGuruColors.primaryLight, borderRadius: 999, flexDirection: 'row', gap: 7, paddingHorizontal: 12, paddingVertical: 7 },
  statusDot: { backgroundColor: SitGuruColors.primary, borderRadius: 5, height: 10, width: 10 },
  statusText: { color: SitGuruColors.primaryDark, fontSize: 12, fontWeight: '900' },
  name: { color: SitGuruColors.primaryDark, fontSize: 34, fontWeight: '900', letterSpacing: -0.8 },
  location: { color: SitGuruColors.textMuted, fontSize: 15, fontWeight: '700' },
  profileSummary: { color: SitGuruColors.textSoft, fontSize: 15, lineHeight: 22 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  trustBadge: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  trustBadgeIcon: { fontSize: 15 },
  trustBadgeText: { color: SitGuruColors.text, fontSize: 13, fontWeight: '800' },
  contentGrid: { gap: 16 },
  contentGridWide: { alignItems: 'flex-start', flexDirection: 'row' },
  mainColumn: { flex: 1, gap: 16 },
  sideColumn: { flex: 0.82, gap: 16, width: '100%' },
  sectionCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 24, borderWidth: 1, gap: 12, padding: 18 },
  sectionEyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  sectionTitle: { color: SitGuruColors.primaryDark, fontSize: 21, fontWeight: '900' },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { backgroundColor: SitGuruColors.primary, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 },
  pillText: { color: SitGuruColors.surface, fontSize: 13, fontWeight: '900' },
  softPill: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 },
  softPillText: { color: SitGuruColors.primaryDark, fontSize: 13, fontWeight: '900' },
  bodyText: { color: SitGuruColors.textMuted, fontSize: 15, lineHeight: 23 },
  listStack: { gap: 10 },
  listRow: { flexDirection: 'row', gap: 9 },
  listBullet: { color: SitGuruColors.primary, fontSize: 18, fontWeight: '900', lineHeight: 22 },
  checkBullet: { color: SitGuruColors.primary, fontSize: 15, fontWeight: '900', lineHeight: 22 },
  listText: { color: SitGuruColors.textMuted, flex: 1, fontSize: 14, lineHeight: 22 },
  reviewPlaceholder: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 18, gap: 8, padding: 14 },
  reviewStars: { color: SitGuruColors.warning, fontSize: 18, fontWeight: '900', letterSpacing: 1.5 },
  priceStack: { gap: 10 },
  priceRow: { alignItems: 'center', borderColor: SitGuruColors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, justifyContent: 'space-between', padding: 12 },
  priceCopy: { flex: 1 },
  priceService: { color: SitGuruColors.text, fontSize: 14, fontWeight: '900' },
  priceHelper: { color: SitGuruColors.textSoft, fontSize: 12, lineHeight: 18, marginTop: 2 },
  priceEstimate: { color: SitGuruColors.primary, fontSize: 18, fontWeight: '900' },
  calendarRow: { flexDirection: 'row', gap: 8 },
  calendarDay: { alignItems: 'center', backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 16, borderWidth: 1, flex: 1, padding: 8 },
  calendarDayText: { color: SitGuruColors.textSoft, fontSize: 11, fontWeight: '800' },
  calendarDateText: { color: SitGuruColors.primaryDark, fontSize: 18, fontWeight: '900', marginVertical: 4 },
  calendarStatus: { fontSize: 9, fontWeight: '900' },
  calendarOpen: { color: SitGuruColors.primary },
  calendarLimited: { color: SitGuruColors.warning },
  calendarBooked: { color: SitGuruColors.textSoft },
  actionPanel: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 12 },
  secondaryAction: { alignItems: 'center', borderColor: SitGuruColors.primary, borderRadius: 18, borderWidth: 1, flex: 1, paddingVertical: 14 },
  secondaryActionText: { color: SitGuruColors.primary, fontSize: 15, fontWeight: '900' },
  primaryAction: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 18, flex: 1, paddingVertical: 14 },
  primaryActionText: { color: SitGuruColors.surface, fontSize: 15, fontWeight: '900' },
  bottomDock: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 26, flexDirection: 'row', gap: 8, padding: 8 },
  dockButton: { alignItems: 'center', borderRadius: 18, flex: 1, paddingVertical: 12 },
  dockButtonPrimary: { backgroundColor: SitGuruColors.surface },
  dockButtonText: { color: SitGuruColors.primaryLight, fontSize: 12, fontWeight: '900' },
  dockButtonTextPrimary: { color: SitGuruColors.primaryDark },
});
