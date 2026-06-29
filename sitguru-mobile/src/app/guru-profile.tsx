import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruProfileAvatar from '@/components/SitGuruProfileAvatar';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

const snapshot = [
  ['Response time', '< 1 hour'],
  ['Completed visits', '48'],
  ['Repeat clients', '12'],
  ['Rating', '4.9 preview'],
];
const services = ['Dog Walking', 'Drop-In Visits', 'Boarding', 'House Sitting', 'Doggy Day Care', 'Multi-Day Care'];
const prices = [
  ['Dog Walking', 'from $25'],
  ['Drop-In', 'from $22'],
  ['Boarding', 'from $58/night'],
  ['House Sitting', 'from $72/night'],
  ['Additional pet fee', 'set by Guru'],
];
const days = [
  ['Mon', 'Open', 'Weekend'],
  ['Tue', 'Open', 'Peak'],
  ['Wed', 'Limited', 'Busy'],
  ['Thu', 'Open', 'Weekend'],
];
const petTypes = ['Dogs', 'Cats', 'Multiple pets', 'Senior pets'];
const careStyle = ['Calm walks', 'Photo updates', 'Potty/water notes', 'PawReport updates'];
const safetyNotes = ['Keep booking and payment inside SitGuru', 'Message before booking', 'PawReport Live available for active care'];
const reviews = [
  ['Jordan P.', 'Clear notes and a kind check-in style made the preview feel easy to trust.'],
  ['Taylor R.', 'The profile shows the kind of updates I would want during care.'],
  ['Morgan S.', 'Friendly, local, and organized for first-time booking questions.'],
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
            <Text style={styles.brandText}>Local Guru Profile</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/find-care')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Find Care</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroPhoto}>
            <Text style={styles.heroIcon}>🌿</Text>
            <Text style={styles.heroPhotoTitle}>Large hero photo placeholder</Text>
            <Text style={styles.heroPhotoText}>A warm local care photo will appear here.</Text>
          </View>
          <View style={[styles.heroContent, isWide && styles.heroContentWide]}>
            <View style={styles.avatarWrap}><SitGuruProfileAvatar fullName="Local Guru" email="localguru@sitguru.com" role="Certified Guru" size={112} /></View>
            <View style={styles.heroCopy}>
              <View style={styles.badgeRow}>
                <Badge label="Booking Ready" />
                <Badge label="Certified Guru" muted />
              </View>
              <Text style={styles.name}>Local Guru</Text>
              <Text style={styles.meta}>Quakertown, PA</Text>
              <Text style={styles.meta}>25-mile service radius</Text>
              <View style={styles.primaryActions}>
                <Action label="Message Guru" route="/conversation" secondary />
                <Action label="Request Care" route="/request-booking" />
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.snapshotGrid, isWide && styles.fourColumns]}>
          {snapshot.map(([label, value]) => <MiniCard key={label} label={label} value={value} />)}
        </View>

        <View style={[styles.contentGrid, isWide && styles.contentGridWide]}>
          <View style={styles.column}>
            <Section eyebrow="Care menu" title="Services offered"><Pills items={services} /></Section>
            <Section eyebrow="Pricing preview" title="Estimated pricing">
              {prices.map(([label, value]) => <Row key={label} label={label} value={value} />)}
              <Text style={styles.note}>Final price confirmed after Guru accepts.</Text>
            </Section>
            <Section eyebrow="Availability" title="Availability preview">
              <View style={styles.calendarRow}>{days.map(([day, status, tag]) => <View key={day} style={styles.dayCard}><Text style={styles.day}>{day}</Text><Text style={styles.status}>{status}</Text><Text style={styles.dayTag}>{tag}</Text></View>)}</View>
              <Action label="Request Care" route="/request-booking" />
            </Section>
            <Section eyebrow="Good fit" title="Pet types accepted"><Pills items={petTypes} soft /></Section>
          </View>

          <View style={styles.column}>
            <Section eyebrow="Profile" title="About this Guru">
              <Text style={styles.body}>Friendly placeholder bio for a trusted local Guru who values clear communication, thoughtful care notes, and calm pet routines for nearby families.</Text>
            </Section>
            <Section eyebrow="Care style" title="What to expect"><Pills items={careStyle} soft /></Section>
            <Section eyebrow="Reviews" title="Reviews placeholder">
              <Text style={styles.body}>Reviews build trust after completed SitGuru bookings.</Text>
              <Action label="View Reviews" route="/reviews" secondary />
              {reviews.map(([name, text]) => <View key={name} style={styles.review}><Text style={styles.reviewName}>{name}</Text><Text style={styles.reviewText}>{text}</Text></View>)}
            </Section>
            <Section eyebrow="Safety" title="Safety/trust notes">{safetyNotes.map((note) => <Text key={note} style={styles.check}>✓ {note}</Text>)}</Section>
          </View>
        </View>

        <View style={styles.bookingCard}>
          <Text style={styles.bookingTitle}>Ready to request care?</Text>
          <Text style={styles.body}>Send a visual-only booking request or message the Guru first.</Text>
          <View style={styles.primaryActions}><Action label="Message Guru" route="/conversation" secondary /><Action label="Request Care" route="/request-booking" /></View>
        </View>

        <View style={styles.bottomDock}>
          <Dock label="Find Care" route="/find-care" />
          <Dock label="Message" route="/conversation" />
          <Dock label="Request" route="/request-booking" primary />
          <Dock label="Booking" route="/booking-details" />
        </View>
      </View>
    </SitGuruScreen>
  );
}

function Section({ children, eyebrow, title }: { children: ReactNode; eyebrow: string; title: string }) { return <View style={styles.section}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }
function Badge({ label, muted = false }: { label: string; muted?: boolean }) { return <View style={[styles.badge, muted && styles.badgeMuted]}><Text style={styles.badgeText}>{label}</Text></View>; }
function Action({ label, route, secondary = false }: { label: string; route: '/conversation' | '/request-booking' | '/reviews'; secondary?: boolean }) { return <Pressable accessibilityRole="button" onPress={() => router.push(route)} style={[styles.action, secondary && styles.actionSecondary]}><Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{label}</Text></Pressable>; }
function Dock({ label, route, primary = false }: { label: string; route: '/find-care' | '/conversation' | '/request-booking' | '/booking-details'; primary?: boolean }) { return <Pressable accessibilityRole="button" onPress={() => router.push(route)} style={[styles.dockButton, primary && styles.dockPrimary]}><Text style={[styles.dockText, primary && styles.dockTextPrimary]}>{label}</Text></Pressable>; }
function MiniCard({ label, value }: { label: string; value: string }) { return <View style={styles.miniCard}><Text style={styles.miniValue}>{value}</Text><Text style={styles.miniLabel}>{label}</Text></View>; }
function Pills({ items, soft = false }: { items: string[]; soft?: boolean }) { return <View style={styles.pills}>{items.map((item) => <View key={item} style={[styles.pill, soft && styles.softPill]}><Text style={[styles.pillText, soft && styles.softPillText]}>{item}</Text></View>)}</View>; }
function Row({ label, value }: { label: string; value: string }) { return <View style={styles.priceRow}><Text style={styles.priceLabel}>{label}</Text><Text style={styles.priceValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  page: { gap: 18, paddingBottom: 24 }, topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, brandRow: { alignItems: 'center', flexDirection: 'row', gap: 10 }, brandText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '900' }, backButton: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 }, backButtonText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900' },
  heroCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 32, borderWidth: 1, overflow: 'hidden' }, heroPhoto: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, minHeight: 220, justifyContent: 'center', padding: 24 }, heroIcon: { fontSize: 46 }, heroPhotoTitle: { color: SitGuruColors.text, fontSize: 20, fontWeight: '900', marginTop: 8 }, heroPhotoText: { color: SitGuruColors.textMuted, fontSize: 14, marginTop: 4, textAlign: 'center' }, heroContent: { gap: 14, padding: 18 }, heroContentWide: { alignItems: 'flex-end', flexDirection: 'row' }, avatarWrap: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 66, borderWidth: 5, borderColor: '#FFFFFF', justifyContent: 'center', marginTop: -70, padding: 4 }, heroCopy: { flex: 1, gap: 8 }, badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, badge: { backgroundColor: SitGuruColors.primary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }, badgeMuted: { backgroundColor: SitGuruColors.primaryLight }, badgeText: { color: SitGuruColors.surface, fontSize: 12, fontWeight: '900' }, name: { color: SitGuruColors.text, fontSize: 36, fontWeight: '900', letterSpacing: -1 }, meta: { color: SitGuruColors.textMuted, fontSize: 15, fontWeight: '800' }, primaryActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }, action: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 999, flex: 1, minHeight: 50, minWidth: 150, justifyContent: 'center', paddingHorizontal: 16 }, actionSecondary: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primary, borderWidth: 1 }, actionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' }, actionTextSecondary: { color: SitGuruColors.primary },
  snapshotGrid: { gap: 10 }, fourColumns: { flexDirection: 'row' }, miniCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 22, borderWidth: 1, flex: 1, padding: 16 }, miniValue: { color: SitGuruColors.primaryDark, fontSize: 20, fontWeight: '900' }, miniLabel: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '900', marginTop: 4 }, contentGrid: { gap: 16 }, contentGridWide: { alignItems: 'flex-start', flexDirection: 'row' }, column: { flex: 1, gap: 16, width: '100%' }, section: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 26, borderWidth: 1, gap: 12, padding: 18 }, eyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' }, sectionTitle: { color: SitGuruColors.text, fontSize: 22, fontWeight: '900' }, pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, pill: { backgroundColor: SitGuruColors.primary, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 }, softPill: { backgroundColor: SitGuruColors.surfaceSoft }, pillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' }, softPillText: { color: SitGuruColors.primaryDark }, priceRow: { alignItems: 'center', borderColor: SitGuruColors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 12 }, priceLabel: { color: SitGuruColors.text, fontSize: 14, fontWeight: '800' }, priceValue: { color: SitGuruColors.primary, fontSize: 15, fontWeight: '900' }, note: { color: SitGuruColors.textSoft, fontSize: 13, fontWeight: '800' }, calendarRow: { flexDirection: 'row', gap: 8 }, dayCard: { alignItems: 'center', backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 16, borderWidth: 1, flex: 1, padding: 10 }, day: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '900' }, status: { color: SitGuruColors.primaryDark, fontSize: 14, fontWeight: '900', marginTop: 5 }, dayTag: { color: SitGuruColors.warning, fontSize: 10, fontWeight: '900', marginTop: 5 }, body: { color: SitGuruColors.textMuted, fontSize: 15, lineHeight: 23 }, review: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 18, gap: 5, padding: 13 }, reviewName: { color: SitGuruColors.primaryDark, fontSize: 14, fontWeight: '900' }, reviewText: { color: SitGuruColors.textMuted, fontSize: 13, lineHeight: 19 }, check: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '800', lineHeight: 22 }, bookingCard: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 28, gap: 8, padding: 18 }, bookingTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' }, bottomDock: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 28, flexDirection: 'row', gap: 6, padding: 8 }, dockButton: { alignItems: 'center', borderRadius: 18, flex: 1, paddingVertical: 12 }, dockPrimary: { backgroundColor: '#FFFFFF' }, dockText: { color: SitGuruColors.primaryLight, fontSize: 12, fontWeight: '900' }, dockTextPrimary: { color: SitGuruColors.primaryDark },
});
