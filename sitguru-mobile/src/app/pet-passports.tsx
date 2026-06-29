import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import SitGuruButton from '@/components/SitGuruButton';
import SitGuruProfilePhotoFrame from '@/components/SitGuruProfilePhotoFrame';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

const pets = [
  {
    name: 'Scout',
    emoji: '🐶',
    type: 'Dog',
    size: 'Medium',
    age: '5 years old',
    breed: 'German Shorthaired Pointer placeholder',
    photo_url: null,
    care_note: 'Energetic, affectionate, and happiest with a predictable walk routine.',
    complete: 100,
  },
  {
    name: 'Luna',
    emoji: '🐱',
    type: 'Cat',
    size: 'Small',
    age: '4 years old',
    breed: 'Indoor cat placeholder',
    photo_url: null,
    care_note: 'Prefers quiet greetings, fresh water, and a cozy sunny window.',
    complete: 80,
  },
];

const careSections = [
  ['Feeding & water', 'Meal timing, portions, refill notes, and water preferences.'],
  ['Walk/potty', 'Leash routine, potty cues, route preferences, and cleanup reminders.'],
  ['Medication/allergies', 'Safe placeholder area for future medication and allergy details.'],
  ['Behavior/comfort', 'Personality, triggers, favorite toys, and calming routines.'],
  ['Emergency/vet note', 'Vet and emergency notes stay ready for future secure profile wiring.'],
  ['Access/handoff notes', 'Door, crate, parking, and handoff reminders for booked care.'],
];

const typeOptions = ['Dog', 'Cat', 'Other'];
const sizeOptions = ['Teacup', 'Small', 'Medium', 'Large', 'Extra Large'];

function showPlaceholder(action: string) {
  Alert.alert('Visual-only preview', `${action} will connect to real Pet Passport tools later.`);
}

function RouteButton({ label, to, variant = 'primary' }: { label: string; to: Parameters<typeof router.push>[0]; variant?: 'primary' | 'secondary' | 'ghost' }) {
  return <SitGuruButton label={label} onPress={() => router.push(to)} variant={variant} />;
}

export default function PetPassportsScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/pet-parent-dashboard')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Pet Parent Dashboard</Text>
          </Pressable>
          <Text style={styles.eyebrow}>Pet profile hub</Text>
          <Text style={styles.title}>Pet Passports</Text>
          <Text style={styles.subtitle}>Pet Passports help Gurus understand pets before care begins, so bookings and PawReport updates feel prepared, safe, and personal.</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoEmoji}>🐾</Text>
            <Text style={styles.photoTitle}>Photo/avatar upload area</Text>
            <Text style={styles.photoText}>Ready for future real pet photos.</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Pet profiles your Gurus can understand</Text>
            <Text style={styles.heroText}>Keep routines, comfort notes, care needs, and handoff details organized before every request.</Text>
            <SitGuruButton label="Add Pet Passport" onPress={() => showPlaceholder('Add Pet Passport')} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your pets</Text>
          <Text style={styles.sectionMeta}>Visual data</Text>
        </View>

        {pets.map((pet) => (
          <View key={pet.name} style={styles.petCard}>
            <View style={styles.petTopRow}>
              <SitGuruProfilePhotoFrame fallbackEmoji={pet.emoji} imageUrl={pet.photo_url} name={pet.name} shape="square" size="md" />
              <View style={styles.petCopy}>
                <View style={styles.nameRow}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.typeBadge}>{pet.type}</Text>
                </View>
                <Text style={styles.petMeta}>{pet.breed}</Text>
                <Text style={styles.petMeta}>{pet.age} • {pet.size}</Text>
                <Text style={styles.petMeta}>{pet.care_note}</Text>
              </View>
            </View>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Passport completion</Text>
              <Text style={styles.progressValue}>{pet.complete}% complete</Text>
            </View>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${pet.complete}%` }]} /></View>
            <View style={styles.buttonStack}>
              <SitGuruButton label="Edit Passport" onPress={() => showPlaceholder(`Edit ${pet.name}'s Passport`)} variant="secondary" />
              <RouteButton label="Request Care" to="/request-booking" />
              <RouteButton label="View Booking Details" to="/booking-details" variant="ghost" />
            </View>
          </View>
        ))}

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Add Pet Passport</Text>
          <TextInput editable={false} placeholder="Pet name" placeholderTextColor={SitGuruColors.textSoft} style={styles.input} />
          <Text style={styles.fieldLabel}>Pet type</Text>
          <View style={styles.pillRow}>{typeOptions.map((option) => <Pressable key={option} onPress={() => showPlaceholder(option)} style={styles.pill}><Text style={styles.pillText}>{option}</Text></Pressable>)}</View>
          <Text style={styles.fieldLabel}>Size</Text>
          <View style={styles.pillRow}>{sizeOptions.map((option) => <Pressable key={option} onPress={() => showPlaceholder(option)} style={styles.pill}><Text style={styles.pillText}>{option}</Text></Pressable>)}</View>
          <TextInput editable={false} placeholder="Breed dropdown placeholder" placeholderTextColor={SitGuruColors.textSoft} style={styles.input} />
          <TextInput editable={false} placeholder="Age" placeholderTextColor={SitGuruColors.textSoft} style={styles.input} />
          <View style={styles.uploadBox}><SitGuruProfilePhotoFrame fallbackEmoji="🐾" name="New pet" shape="square" size="md" /><Text style={styles.uploadText}>Premium pet photo upload placeholder</Text></View>
          <SitGuruButton label="Save Passport" onPress={() => showPlaceholder('Save Passport')} />
        </View>

        <View style={styles.detailsGrid}>{careSections.map(([title, detail]) => <View key={title} style={styles.detailCard}><Text style={styles.detailTitle}>{title}</Text><Text style={styles.detailText}>{detail}</Text></View>)}</View>

        <View style={styles.pawReportCard}>
          <Text style={styles.pawReportTitle}>These details help your Guru send better PawReport updates.</Text>
          <RouteButton label="PawReport Live" to="/pawreport-live" />
        </View>

        <View style={styles.safetyNote}><Text style={styles.safetyText}>Keep pet care details inside SitGuru so Gurus, Pet Parents, and support stay aligned.</Text></View>

        <View style={styles.bottomDock}>
          {[
            ['Dashboard', '/pet-parent-dashboard'],
            ['Find Care', '/find-care'],
            ['Messages', '/conversation'],
            ['Booking', '/booking-details'],
          ].map(([label, href]) => (
            <Pressable key={label} accessibilityRole="button" onPress={() => router.push(href as Parameters<typeof router.push>[0])} style={styles.dockItem}>
              <Text style={styles.dockText}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 18 },
  header: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 8, padding: 20 },
  backButton: { alignSelf: 'flex-start', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  backButtonText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900' },
  eyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: SitGuruColors.text, fontSize: 34, fontWeight: '900', lineHeight: 39 },
  subtitle: { color: SitGuruColors.textMuted, fontSize: 16, fontWeight: '700', lineHeight: 23 },
  heroCard: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 30, gap: 14, padding: 18 },
  photoPlaceholder: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.18)', borderRadius: 24, borderWidth: 1, gap: 8, minHeight: 180, justifyContent: 'center', padding: 18 },
  photoEmoji: { fontSize: 46 },
  photoTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  photoText: { color: '#DCEFE2', fontSize: 14, fontWeight: '700' },
  heroCopy: { gap: 10 },
  heroTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', lineHeight: 32 },
  heroText: { color: '#DCEFE2', fontSize: 15, fontWeight: '700', lineHeight: 22 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: SitGuruColors.text, fontSize: 22, fontWeight: '900' },
  sectionMeta: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  petCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 26, borderWidth: 1, gap: 14, padding: 16 },
  petTopRow: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  petAvatar: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 24, borderWidth: 1, height: 76, justifyContent: 'center', width: 76 },
  petAvatarText: { fontSize: 36 },
  petCopy: { flex: 1, gap: 4 },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  petName: { color: SitGuruColors.text, fontSize: 22, fontWeight: '900' },
  typeBadge: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 },
  petMeta: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  progressLabel: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '900' },
  progressValue: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900' },
  progressTrack: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, height: 10, overflow: 'hidden' },
  progressFill: { backgroundColor: SitGuruColors.primary, borderRadius: 999, height: '100%' },
  buttonStack: { gap: 10 },
  formCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 28, borderWidth: 1, gap: 12, padding: 18 },
  cardTitle: { color: SitGuruColors.text, fontSize: 22, fontWeight: '900' },
  input: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 16, borderWidth: 1, color: SitGuruColors.text, fontSize: 15, fontWeight: '800', minHeight: 54, paddingHorizontal: 14 },
  fieldLabel: { color: SitGuruColors.text, fontSize: 14, fontWeight: '900' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10 },
  pillText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900' },
  uploadBox: { alignItems: 'center', backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, gap: 6, minHeight: 130, justifyContent: 'center', padding: 16 },
  uploadIcon: { color: SitGuruColors.primary, fontSize: 30, fontWeight: '900' },
  uploadText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '900' },
  detailsGrid: { gap: 10 },
  detailCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 20, borderWidth: 1, gap: 5, padding: 14 },
  detailTitle: { color: SitGuruColors.text, fontSize: 16, fontWeight: '900' },
  detailText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  pawReportCard: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 24, borderWidth: 1, gap: 12, padding: 16 },
  pawReportTitle: { color: SitGuruColors.text, fontSize: 18, fontWeight: '900', lineHeight: 24 },
  safetyNote: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 20, borderWidth: 1, padding: 14 },
  safetyText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  bottomDock: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 6, padding: 8 },
  dockItem: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 16, flex: 1, minHeight: 52, justifyContent: 'center', padding: 6 },
  dockText: { color: SitGuruColors.primary, fontSize: 11, fontWeight: '900', textAlign: 'center' },
});
