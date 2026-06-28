import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruBottomNav from '@/components/SitGuruBottomNav';
import SitGuruButton from '@/components/SitGuruButton';
import SitGuruIconBadge, { type SitGuruIconName } from '@/components/SitGuruIconBadge';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

const statusSteps = ['Pending Guru Review', 'Accepted', 'Active', 'Completed'];

const priceRows = [
  { label: 'Service rate', value: '$25' },
  { label: 'Additional pet fee', value: '$0' },
  { label: 'Multi-pet savings', value: '—' },
  { label: 'PawPerks credit', value: '-$5' },
  { label: 'Payment status', value: 'Payment after Guru accepts' },
];

const careNotes = [
  { title: 'Feeding / water', detail: 'Fresh water before and after the walk.' },
  { title: 'Walk / potty', detail: 'Neighborhood loop, potty update, and calm return home.' },
  { title: 'Medication / allergies', detail: 'No medication listed. Allergy placeholder for Guru review.' },
  { title: 'Access notes', detail: 'Use SitGuru messages for safe handoff details.' },
];

function showPlaceholderAlert(action: string) {
  Alert.alert('Visual-only preview', `${action} is a safe placeholder for this screen.`);
}

function HubCard({
  children,
  icon,
  meta,
  title,
}: {
  children: React.ReactNode;
  icon: SitGuruIconName;
  meta?: string;
  title: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <SitGuruIconBadge name={icon} size="small" tone="primary" />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        {meta ? <Text style={styles.cardMeta}>{meta}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Avatar({ emoji, label }: { emoji: string; label: string }) {
  return (
    <View style={styles.avatar} accessibilityLabel={label}>
      <Text style={styles.avatarEmoji}>{emoji}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function BookingDetailsScreen() {
  const [selectedStatus, setSelectedStatus] = useState('Pending Guru Review');

  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.hero}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/pet-parent-dashboard')}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back to dashboard</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/notifications')}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Notifications</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/support')}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Help & Support</Text>
          </Pressable>
          <Text style={styles.eyebrow}>Central care hub</Text>
          <Text style={styles.title}>Booking Details</Text>
          <Text style={styles.subtitle}>
            Review Scout’s request, care notes, pricing preview, messages, and live visit status in one place.
          </Text>
        </View>

        <HubCard icon="booking" title="Booking status" meta="Preview">
          <View style={styles.statusWrap}>
            {statusSteps.map((status) => (
              <Pressable
                accessibilityRole="button"
                key={status}
                onPress={() => setSelectedStatus(status)}
                style={[styles.statusPill, selectedStatus === status ? styles.statusPillActive : null]}
              >
                <Text style={[styles.statusText, selectedStatus === status ? styles.statusTextActive : null]}>
                  {status}
                </Text>
              </Pressable>
            ))}
          </View>
        </HubCard>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryPet}>Scout</Text>
            <Text style={styles.summaryService}>Dog Walking • Today • 12:30 PM</Text>
          </View>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Estimated total</Text>
            <Text style={styles.totalValue}>$20</Text>
            <Text style={styles.paymentNote}>Payment after Guru accepts</Text>
          </View>
        </View>

        <HubCard icon="paw" title="Pet" meta="Pet Passport">
          <View style={styles.profileRow}>
            <Avatar emoji="🐶" label="Pet avatar placeholder" />
            <View style={styles.profileCopy}>
              <Text style={styles.profileName}>Scout</Text>
              <Text style={styles.profileMeta}>Dog • Medium • 4 years old</Text>
              <Text style={styles.bodyText}>Care notes preview: friendly, loves brisk walks, prefers a quiet greeting.</Text>
            </View>
          </View>
          <SitGuruButton label="View Pet Passport" variant="secondary" onPress={() => router.push('/pet-passports')} />
        </HubCard>

        <HubCard icon="trust" title="Guru" meta="Care provider">
          <View style={styles.profileRow}>
            <Avatar emoji="🧢" label="Guru avatar placeholder" />
            <View style={styles.profileCopy}>
              <Text style={styles.profileName}>Jordan P.</Text>
              <Text style={styles.profileMeta}>Service area: Near Midtown</Text>
              <Text style={styles.badge}>SitGuru Trust Badge • Preview</Text>
            </View>
          </View>
          <SitGuruButton label="Message Guru" onPress={() => router.push('/conversation')} />
        </HubCard>

        <HubCard icon="profile" title="Pet Parent" meta="Contact preference">
          <View style={styles.profileRow}>
            <Avatar emoji="🙂" label="Pet Parent avatar placeholder" />
            <View style={styles.profileCopy}>
              <Text style={styles.profileName}>Taylor M.</Text>
              <Text style={styles.profileMeta}>Booking contact preference</Text>
              <Text style={styles.bodyText}>Use SitGuru messages for all care communication.</Text>
            </View>
          </View>
        </HubCard>

        <HubCard icon="payment" title="Pricing" meta="Final after Guru accepts">
          {priceRows.map((row) => <InfoRow key={row.label} label={row.label} value={row.value} />)}
          <View style={styles.divider} />
          <InfoRow label="Estimated total" value="$20" />
          <Text style={styles.smallNote}>Payment after Guru accepts. No payment charged from this preview. Final amount confirmed before payment.</Text>
          <SitGuruButton label="Payment Status / Payments" variant="secondary" onPress={() => router.push('/payments')} />
        </HubCard>

        <HubCard icon="calendar" title="Schedule" meta="Calendar preview">
          <View style={styles.scheduleGrid}>
            <InfoRow label="Date" value="Today" />
            <InfoRow label="Time" value="12:30 PM" />
            <InfoRow label="Duration" value="30 minutes" />
            <InfoRow label="Service type" value="Dog Walking" />
          </View>
          <View style={styles.calendarPreview}>
            {['Mo', 'Tu', 'We', 'Th', 'Fr'].map((day, index) => (
              <View key={day} style={[styles.calendarDay, index === 2 ? styles.calendarDayActive : null]}>
                <Text style={[styles.calendarDayText, index === 2 ? styles.calendarDayTextActive : null]}>{day}</Text>
                <Text style={[styles.calendarDateText, index === 2 ? styles.calendarDayTextActive : null]}>{12 + index}</Text>
              </View>
            ))}
          </View>
        </HubCard>

        <HubCard icon="checklist" title="Care notes" meta="Guru review">
          {careNotes.map((note) => (
            <View key={note.title} style={styles.noteBlock}>
              <Text style={styles.noteTitle}>{note.title}</Text>
              <Text style={styles.bodyText}>{note.detail}</Text>
            </View>
          ))}
        </HubCard>

        <HubCard icon="visit" title="PawReport Live" meta="Status: Completed preview">
          <Text style={styles.bodyText}>Live updates and completed PawReport summaries stay connected to Booking Details.</Text>
          <View style={styles.buttonStack}>
            <SitGuruButton label="View PawReport Live" onPress={() => router.push('/pawreport-live')} />
            <SitGuruButton label="Reviews & Ratings" variant="secondary" onPress={() => router.push('/reviews')} />
          </View>
        </HubCard>

        <HubCard icon="request" title="Guru actions" meta="Guru view">
          <View style={styles.buttonStack}>
            <SitGuruButton label="Back to Requests" variant="secondary" onPress={() => router.push('/guru-requests')} />
            <SitGuruButton label="Message Pet Parent" onPress={() => router.push('/conversation')} />
            <SitGuruButton label="Start Live Walk" variant="secondary" onPress={() => router.push('/guru-live-walk')} />
            <SitGuruButton label="Accept Request placeholder" onPress={() => showPlaceholderAlert('Accept Request')} />
            <SitGuruButton label="Decline placeholder" variant="secondary" onPress={() => showPlaceholderAlert('Decline')} />
          </View>
        </HubCard>

        <HubCard icon="care" title="Pet Parent actions">
          <View style={styles.buttonStack}>
            <SitGuruButton label="Message Guru" onPress={() => router.push('/conversation')} />
            <SitGuruButton label="View Live PawReport" variant="secondary" onPress={() => router.push('/pawreport-live')} />
            <SitGuruButton label="Leave Review" variant="secondary" onPress={() => router.push('/reviews')} />
            <SitGuruButton label="Back to Find Care" variant="ghost" onPress={() => router.push('/find-care')} />
          </View>
        </HubCard>

        <HubCard icon="lock" title="Support & safety" meta="SitGuru safe care">
          <Text style={styles.bodyText}>Keep care communication, updates, and booking details inside SitGuru.</Text>
          <Text style={styles.bodyText}>Live tracking only runs during active booked care.</Text>
        </HubCard>

        <SitGuruBottomNav
          activeIndex={0}
          items={[
            { icon: 'home', label: 'Dashboard' },
            { icon: 'message', label: 'Message' },
            { icon: 'visit', label: 'Live' },
            { icon: 'trust', label: 'Help' },
          ]}
        />
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 18 },
  hero: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 8, padding: 20 },
  backButton: { alignSelf: 'flex-start', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  backButtonText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900' },
  eyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: SitGuruColors.text, fontSize: 34, fontWeight: '900', lineHeight: 38 },
  subtitle: { color: SitGuruColors.textMuted, fontSize: 16, fontWeight: '700', lineHeight: 23 },
  card: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 24, borderWidth: 1, gap: 14, padding: 16 },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  cardTitleRow: { alignItems: 'center', flexDirection: 'row', flex: 1, gap: 10 },
  cardTitle: { color: SitGuruColors.text, flex: 1, fontSize: 18, fontWeight: '900' },
  cardMeta: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '900' },
  statusWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusPill: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  statusPillActive: { backgroundColor: SitGuruColors.primary, borderColor: SitGuruColors.primary },
  statusText: { color: SitGuruColors.textMuted, fontSize: 12, fontWeight: '900' },
  statusTextActive: { color: '#FFFFFF' },
  summaryCard: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 28, gap: 16, padding: 20 },
  summaryPet: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' },
  summaryService: { color: '#D7F4DD', fontSize: 15, fontWeight: '800', marginTop: 4 },
  totalBox: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 16 },
  totalLabel: { color: '#D7F4DD', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  totalValue: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', marginTop: 3 },
  paymentNote: { color: '#D7F4DD', fontSize: 13, fontWeight: '800', marginTop: 2 },
  profileRow: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  avatar: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 24, borderWidth: 1, height: 72, justifyContent: 'center', width: 72 },
  avatarEmoji: { fontSize: 34 },
  profileCopy: { flex: 1, gap: 4 },
  profileName: { color: SitGuruColors.text, fontSize: 20, fontWeight: '900' },
  profileMeta: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '800' },
  badge: { alignSelf: 'flex-start', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 },
  bodyText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  infoRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
  infoLabel: { color: SitGuruColors.textMuted, flex: 1, fontSize: 14, fontWeight: '800' },
  infoValue: { color: SitGuruColors.text, fontSize: 15, fontWeight: '900' },
  divider: { backgroundColor: SitGuruColors.border, height: 1, marginVertical: 2 },
  smallNote: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '800', lineHeight: 18 },
  scheduleGrid: { gap: 4 },
  calendarPreview: { flexDirection: 'row', gap: 8 },
  calendarDay: { alignItems: 'center', backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 16, borderWidth: 1, flex: 1, minHeight: 66, justifyContent: 'center' },
  calendarDayActive: { backgroundColor: SitGuruColors.primary },
  calendarDayText: { color: SitGuruColors.textSoft, fontSize: 12, fontWeight: '900' },
  calendarDateText: { color: SitGuruColors.text, fontSize: 18, fontWeight: '900', marginTop: 2 },
  calendarDayTextActive: { color: '#FFFFFF' },
  noteBlock: { backgroundColor: SitGuruColors.background, borderRadius: 16, gap: 3, padding: 12 },
  noteTitle: { color: SitGuruColors.text, fontSize: 14, fontWeight: '900' },
  buttonStack: { gap: 10 },
});
