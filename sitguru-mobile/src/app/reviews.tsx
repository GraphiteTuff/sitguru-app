import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

const ratingLabels: Record<number, string> = {
  5: 'Excellent care',
  4: 'Great care',
  3: 'Good care',
  2: 'Needs improvement',
  1: 'Poor experience',
};
const categories = ['Communication', 'Reliability', 'Pet care quality', 'PawReport updates', 'Safety/trust'];
const categoryOptions = ['Excellent', 'Good', 'Needs work'];
const praiseChips = ['Great communication', 'On time', 'Sent helpful updates', 'My pet was happy', 'Followed care notes', 'Would book again'];
const reviews = [
  ['Pet Parent A.', 'Scout came home happy, calm, and ready for a nap. The updates were clear and thoughtful.'],
  ['Pet Parent B.', 'Reliable timing, friendly handoff, and a helpful PawReport summary after care.'],
  ['Pet Parent C.', 'I appreciated the care notes and would feel confident booking this Guru again.'],
];

function showPlaceholder(action: string) {
  Alert.alert('Visual-only preview', `${action} is a safe placeholder and is not submitted anywhere yet.`);
}

function routeTo(href: Href) {
  router.push(href);
}

export default function ReviewsScreen() {
  const [rating, setRating] = useState(5);
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string>>({});
  const [selectedPraise, setSelectedPraise] = useState<string[]>([]);
  const [review, setReview] = useState('');

  function togglePraise(chip: string) {
    setSelectedPraise((current) => current.includes(chip) ? current.filter((item) => item !== chip) : [...current, chip]);
  }

  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.hero}>
          <Pressable accessibilityRole="button" onPress={() => routeTo('/booking-details')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Booking Details</Text>
          </Pressable>
          <Text style={styles.eyebrow}>Post-care feedback</Text>
          <Text style={styles.title}>Reviews & Ratings</Text>
          <Text style={styles.subtitle}>Share care feedback, recognize great Gurus, and help future Pet Parents book confidently.</Text>
        </View>

        <View style={styles.summaryCard}>
          <View><Text style={styles.summaryTitle}>Scout</Text><Text style={styles.summaryText}>Dog Walking • Completed today</Text></View>
          <View style={styles.summaryBadge}><Text style={styles.summaryBadgeText}>PawReport completed</Text></View>
          <Text style={styles.summaryText}>Guru: Local Guru</Text>
        </View>

        <Card title="Rate this care">
          <View style={styles.stars}>{[1, 2, 3, 4, 5].map((star) => <Pressable key={star} accessibilityRole="button" onPress={() => setRating(star)} hitSlop={8}><Text style={[styles.star, star <= rating && styles.starActive]}>★</Text></Pressable>)}</View>
          <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
        </Card>

        <Card title="Care categories">
          {categories.map((category) => <View key={category} style={styles.categoryRow}><Text style={styles.categoryTitle}>{category}</Text><View style={styles.chipRow}>{categoryOptions.map((option) => { const active = selectedCategories[category] === option; return <Pressable key={option} accessibilityRole="button" onPress={() => setSelectedCategories((current) => ({ ...current, [category]: option }))} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text></Pressable>; })}</View></View>)}
        </Card>

        <Card title="Written review">
          <TextInput multiline value={review} onChangeText={setReview} placeholder="Share what went well, how your pet did, and what future Pet Parents should know." placeholderTextColor={SitGuruColors.textSoft} style={styles.reviewInput} />
        </Card>

        <Card title="Quick praise">
          <View style={styles.chipRow}>{praiseChips.map((chip) => { const active = selectedPraise.includes(chip); return <Pressable key={chip} accessibilityRole="button" onPress={() => togglePraise(chip)} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{chip}</Text></Pressable>; })}</View>
        </Card>

        <Card title="Private feedback">
          <Text style={styles.body}>Need to tell SitGuru privately?</Text>
          <View style={styles.buttonRow}><Button label="Report concern" onPress={() => showPlaceholder('Report concern')} secondary /><Button label="Contact support" onPress={() => routeTo('/conversation')} /></View>
        </Card>

        <Card title="Existing reviews">
          <View style={styles.metrics}><Metric value="4.9" label="Overall rating" /><Metric value="12" label="Completed reviews" /><Metric value="7" label="Repeat Pet Parents" /></View>
          {reviews.map(([name, text]) => <View key={name} style={styles.reviewCard}><Text style={styles.reviewName}>{name}</Text><Text style={styles.body}>{text}</Text></View>)}
        </Card>

        <Card title="What Gurus see">
          <Text style={styles.body}>Rating average, review highlights, repeat care signals, PawReport completion, and trust-building reviews help Gurus preview their public reputation.</Text>
          <View style={styles.metrics}><Metric value="4.9" label="Average" /><Metric value="6" label="Highlights" /><Metric value="Safe" label="Trust signals" /></View>
          <Button label="View Guru Profile" onPress={() => routeTo('/guru-profile')} />
        </Card>

        <View style={styles.buttonStack}>
          <Button label="Submit Review" onPress={() => showPlaceholder('Submit Review')} />
          <Button label="Back to Booking Details" onPress={() => routeTo('/booking-details')} secondary />
          <Button label="Message Guru" onPress={() => routeTo('/conversation')} secondary />
          <Button label="View PawReport Live" onPress={() => routeTo('/pawreport-live')} secondary />
        </View>

        <View style={styles.bottomDock}>{[['Booking', '/booking-details'], ['Message', '/conversation'], ['Guru', '/guru-profile'], ['Account', '/account']].map(([label, href]) => <Pressable key={label} accessibilityRole="button" onPress={() => routeTo(href as Href)} style={styles.dockButton}><Text style={styles.dockText}>{label}</Text></Pressable>)}</View>
      </View>
    </SitGuruScreen>
  );
}

function Card({ children, title }: { children: React.ReactNode; title: string }) { return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{children}</View>; }
function Button({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) { return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.button, secondary && styles.buttonSecondary]}><Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text></Pressable>; }
function Metric({ label, value }: { label: string; value: string }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 18 }, hero: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 30, borderWidth: 1, gap: 8, padding: 20 }, backButton: { alignSelf: 'flex-start', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }, backButtonText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900' }, eyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' }, title: { color: SitGuruColors.text, fontSize: 36, fontWeight: '900', lineHeight: 40 }, subtitle: { color: SitGuruColors.textMuted, fontSize: 16, fontWeight: '700', lineHeight: 23 }, summaryCard: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 28, gap: 10, padding: 20 }, summaryTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' }, summaryText: { color: '#DCEFE2', fontSize: 15, fontWeight: '800' }, summaryBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }, summaryBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' }, card: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 26, borderWidth: 1, gap: 13, padding: 17 }, cardTitle: { color: SitGuruColors.text, fontSize: 20, fontWeight: '900' }, stars: { flexDirection: 'row', gap: 7 }, star: { color: SitGuruColors.border, fontSize: 42, fontWeight: '900' }, starActive: { color: SitGuruColors.warning }, ratingLabel: { color: SitGuruColors.primaryDark, fontSize: 17, fontWeight: '900' }, categoryRow: { gap: 8 }, categoryTitle: { color: SitGuruColors.text, fontSize: 15, fontWeight: '900' }, chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, chip: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10 }, chipActive: { backgroundColor: SitGuruColors.primary, borderColor: SitGuruColors.primary }, chipText: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '900' }, chipTextActive: { color: '#FFFFFF' }, reviewInput: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 20, borderWidth: 1, color: SitGuruColors.text, fontSize: 15, minHeight: 130, padding: 14, textAlignVertical: 'top' }, body: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 21 }, buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, buttonStack: { gap: 10 }, button: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 999, minHeight: 52, justifyContent: 'center', paddingHorizontal: 16 }, buttonSecondary: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primary, borderWidth: 1 }, buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' }, buttonTextSecondary: { color: SitGuruColors.primary }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, metric: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 18, borderWidth: 1, flex: 1, minWidth: 125, padding: 13 }, metricValue: { color: SitGuruColors.primaryDark, fontSize: 23, fontWeight: '900' }, metricLabel: { color: SitGuruColors.textMuted, fontSize: 11, fontWeight: '900', marginTop: 3, textTransform: 'uppercase' }, reviewCard: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, gap: 5, padding: 13 }, reviewName: { color: SitGuruColors.primaryDark, fontSize: 14, fontWeight: '900' }, bottomDock: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 28, flexDirection: 'row', gap: 6, padding: 8 }, dockButton: { alignItems: 'center', borderRadius: 18, flex: 1, paddingVertical: 12 }, dockText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
