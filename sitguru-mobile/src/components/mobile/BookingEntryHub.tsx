import { ArrowRight, CalendarDays, Camera, Heart, MapPin, PawPrint, Search } from 'lucide-react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import TouchTarget from '@/components/mobile/TouchTarget';
import { AppFonts } from '@/constants/fonts';

type BookingEntryHubProps = {
  petName: string;
  serviceName: string;
  zip: string;
  onZipChange: (zip: string) => void;
  onManagePets: () => void;
  onChooseService: () => void;
  onChooseDates: () => void;
  onFindGuru: () => void;
  onShareMoment: () => void;
};

/**
 * A booking-first, thumb-friendly entry point for the native Pet Parent home.
 * The original find-care map, availability, and booking flows remain unchanged.
 */
export default function BookingEntryHub({
  petName,
  serviceName,
  zip,
  onZipChange,
  onManagePets,
  onChooseService,
  onChooseDates,
  onFindGuru,
  onShareMoment,
}: BookingEntryHubProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.hub}>
        <View style={styles.headingRow}>
          <PawPrint size={29} color="#BEF264" strokeWidth={2.5} />
          <View style={styles.headingCopy}>
            <Text style={styles.title}>Find the perfect Guru for your pet</Text>
            <Text style={styles.subtitle}>Fast, personalized pet care near you.</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <TouchTarget accessibilityRole="button" accessibilityLabel="Choose your pet in Pet Passports" onPress={onManagePets} style={styles.tile}>
            <PawPrint size={26} color="#F97316" strokeWidth={2.5} />
            <Text style={styles.tileTitle}>Your Pet</Text>
            <Text numberOfLines={1} style={styles.tileDetail}>{petName || 'Add a pet'}</Text>
          </TouchTarget>
          <TouchTarget accessibilityRole="button" accessibilityLabel="Choose care service" onPress={onChooseService} style={styles.tile}>
            <Heart size={26} color="#F97316" strokeWidth={2.5} />
            <Text style={styles.tileTitle}>Service</Text>
            <Text numberOfLines={1} style={styles.tileDetail}>{serviceName || 'Walking, sitting & more'}</Text>
          </TouchTarget>
          <TouchTarget accessibilityRole="button" accessibilityLabel="Choose care dates when requesting a Guru" onPress={onChooseDates} style={styles.tile}>
            <CalendarDays size={26} color="#F97316" strokeWidth={2.5} />
            <Text style={styles.tileTitle}>Dates</Text>
            <Text numberOfLines={1} style={styles.tileDetail}>Set when booking</Text>
          </TouchTarget>
          <View style={styles.tile}>
            <MapPin size={26} color="#F97316" strokeWidth={2.5} />
            <Text style={styles.tileTitle}>Location</Text>
            <TextInput
              accessibilityLabel="Care ZIP code"
              value={zip}
              onChangeText={(value) => onZipChange(value.replace(/\D/g, '').slice(0, 5))}
              keyboardType="number-pad"
              maxLength={5}
              placeholder="Search ZIP"
              placeholderTextColor="#64748b"
              style={styles.zipInput}
            />
          </View>
        </View>

        <TouchTarget accessibilityRole="button" accessibilityLabel="Find My Guru" onPress={onFindGuru} style={styles.findButton}>
          <Search color="#FFFFFF" size={23} strokeWidth={2.8} />
          <Text style={styles.findText}>Find My Guru</Text>
          <ArrowRight color="#FFFFFF" size={22} strokeWidth={2.8} />
        </TouchTarget>
        <Text style={styles.trustNote}>See real Guru profiles, local service coverage and available care options.</Text>
      </View>
      <TouchTarget accessibilityRole="button" accessibilityLabel="Share a Pet Moment photo or video" onPress={onShareMoment} style={styles.momentButton}>
        <View style={styles.momentIcon}><Camera size={26} color="#FFFFFF" strokeWidth={2.4} /></View>
        <View style={styles.momentCopy}>
          <Text style={styles.momentTitle}>Share a Pet Moment</Text>
          <Text style={styles.momentDetail}>Your pet's photos, videos & memories.</Text>
        </View>
        <ArrowRight size={22} color="#FFFFFF" strokeWidth={2.7} />
      </TouchTarget>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12 },
  hub: { padding: 15, borderRadius: 26, backgroundColor: '#005438', borderColor: '#006C46', borderWidth: 1, gap: 13 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headingCopy: { flex: 1, gap: 5 },
  title: { color: '#FFFFFF', fontFamily: AppFonts.extraBold, fontSize: 23, lineHeight: 28, letterSpacing: -0.4 },
  subtitle: { color: '#E3FFF0', fontFamily: AppFonts.medium, fontSize: 13, lineHeight: 19 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  tile: { width: '48%', minHeight: 116, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 18, backgroundColor: '#FFFFFF', borderColor: '#D6F5E1', borderWidth: 1, gap: 4, justifyContent: 'center' },
  tileTitle: { color: '#132C20', fontFamily: AppFonts.extraBold, fontSize: 17, lineHeight: 22 },
  tileDetail: { color: '#456356', fontFamily: AppFonts.medium, fontSize: 12, lineHeight: 17 },
  zipInput: { fontSize: 16, fontFamily: AppFonts.bold, color: '#0D3826', borderBottomWidth: 1, borderBottomColor: '#B1DDC2', minHeight: 30, paddingVertical: 1 },
  findButton: { minHeight: 62, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#F97316', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  findText: { color: '#FFFFFF', fontFamily: AppFonts.extraBold, fontSize: 20 },
  trustNote: { color: '#DEFBEA', fontFamily: AppFonts.medium, textAlign: 'center', fontSize: 11, lineHeight: 18 },
  momentButton: { minHeight: 88, backgroundColor: '#007447', borderRadius: 20, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  momentIcon: { width: 54, height: 54, borderRadius: 15, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  momentCopy: { flex: 1, gap: 4 },
  momentTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: AppFonts.extraBold },
  momentDetail: { color: '#E0FBE9', fontSize: 12, fontFamily: AppFonts.medium, lineHeight: 17 },
});
