import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type HelpCategory = { emoji: string; title: string; description: string; actionLabel: string; href?: Href; alert?: string };

const helpCategories: HelpCategory[] = [
  { emoji: '📅', title: 'Booking help', description: 'Review booking status, schedule details, care notes, and next steps.', actionLabel: 'Open Booking Details', href: '/booking-details' },
  { emoji: '💬', title: 'Messaging help', description: 'Get help with Pet Parent, Guru, and SitGuru support conversations.', actionLabel: 'Open Messages', href: '/conversation' },
  { emoji: '🐾', title: 'PawReport Live help', description: 'Understand live updates, visit timelines, and active care tracking.', actionLabel: 'Open PawReport Live', href: '/pawreport-live' },
  { emoji: '📘', title: 'Pet Passport help', description: 'Keep feeding, medication, routine, and comfort notes ready for care.', actionLabel: 'Open Pet Passports', href: '/pet-passports' },
  { emoji: '💸', title: 'Guru pricing/payout help', description: 'Review pricing, payout readiness, requests, and Guru workspace support.', actionLabel: 'Open Guru Pricing', href: '/guru-pricing' },
  { emoji: '📥', title: 'Guru request help', description: 'Get oriented around request review, booking acceptance, and care prep.', actionLabel: 'Open Guru Requests', href: '/guru-requests' },
  { emoji: '🎉', title: 'Ambassador/referral help', description: 'Find referral, rewards, training, and ambassador support guidance.', actionLabel: 'Open Ambassador Hub', href: '/ambassador-dashboard' },
  { emoji: '🔐', title: 'Account/security help', description: 'Manage profile, roles, privacy, security, and account preferences.', actionLabel: 'Open Account Settings', href: '/account' },
  { emoji: '🔔', title: 'Notifications help', description: 'Review booking alerts, message reminders, and PawReport updates.', actionLabel: 'Open Notifications', href: '/notifications' },
  { emoji: '⭐', title: 'Reviews help', description: 'Review completed care and understand feedback flows.', actionLabel: 'Open Reviews', href: '/reviews' },
  { emoji: '💳', title: 'Payment/Payout Help', description: 'Get visual guidance for payment method, promo code, PawPerks credit, referral credit, refund question, Guru payout setup, and Ambassador rewards.', actionLabel: 'Open Payments & Payouts', href: '/payments' },
  { emoji: '🛠️', title: 'Admin Operations Preview', description: 'Open the visual-only operations hub. This does not grant real admin support permissions.', actionLabel: 'Open Admin Operations Preview', href: '/admin-operations' },
  { emoji: '🧩', title: 'Backend Readiness', description: 'Review the visual-only production wiring checklist for auth, data, payments, notifications, storage, and admin operations.', actionLabel: 'Open Backend Readiness', href: '/backend-readiness' },
  { emoji: '🚦', title: 'Release Readiness', description: 'Review the internal visual checklist for launch preparation without implying public release is ready.', actionLabel: 'Open Release Readiness', href: '/release-readiness' },
  { emoji: '✅', title: 'QA Test Center', description: 'Open the internal visual-only QA checklist for route, button, mobile layout, and release blocker review.', actionLabel: 'Open QA Test Center', href: '/qa-test-center' },
];

const supportTopics = ['Booking', 'Payment method', 'Promo code', 'PawPerks credit', 'Referral credit', 'Refund question', 'Guru payout setup', 'Ambassador rewards', 'PawReport', 'Safety', 'Account', 'Other'];

const faqs = [
  ['How do bookings work?', 'Pet Parents request care, Gurus review details, and Booking Details becomes the care hub once accepted.'],
  ['When does payment happen?', 'Payment happens after the Guru accepts. This preview does not charge the Pet Parent. Final amount is confirmed before payment.'],
  ['How does PawReport Live work?', 'PawReport Live shows active visit progress and care updates during booked care only.'],
  ['How do Gurus set pricing?', 'Gurus use the Guru Pricing Workspace for rates, discounts, availability, and payout readiness.'],
  ['How do Pet Passports help?', 'Pet Passports keep routines, care notes, comfort details, and safety reminders easy to review.'],
  ['How do referrals and PawPerks work?', 'Ambassador referrals and PawPerks rewards are shown as friendly visual previews in this build.'],
];

function showSupportAlert(message: string) {
  Alert.alert('SitGuru support preview', message);
}

function openCategory(category: HelpCategory) {
  if (category.href) {
    router.push(category.href);
    return;
  }
  showSupportAlert(category.alert ?? `${category.title} is a safe visual-only support action.`);
}

function Pill({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.topicChip, active ? styles.topicChipActive : null]}><Text style={[styles.topicChipText, active ? styles.topicChipTextActive : null]}>{label}</Text></Pressable>;
}

function Button({ label, href, onPress, primary = false }: { label: string; href?: Href; onPress?: () => void; primary?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress ?? (() => href ? router.push(href) : undefined)} style={[styles.button, primary ? styles.primaryButton : null]}><Text style={[styles.buttonText, primary ? styles.primaryButtonText : null]}>{label}</Text></Pressable>;
}

export default function SupportScreen() {
  const [topic, setTopic] = useState('Booking');
  const [details, setDetails] = useState('');

  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.hero}>
          <Button label="← Back to Account" href="/account" />
          <Text style={styles.eyebrow}>Support center</Text>
          <Text style={styles.title}>Help & Support</Text>
          <Text style={styles.subtitle}>Get help with bookings, messages, PawReport updates, payments, payouts, referrals, and safety concerns.</Text>
        </View>

        <View style={styles.urgentCard}>
          <Text style={styles.urgentTitle}>Need urgent help?</Text>
          <Text style={styles.urgentText}>For emergencies, contact local emergency services first. Use SitGuru support for booking, account, payment, and care support.</Text>
          <View style={styles.buttonRow}><Button label="Message SitGuru Support" href="/conversation" primary /><Button label="Report Safety Concern" onPress={() => showSupportAlert('Safety concern report placeholder. If there is an emergency, contact local emergency services first.')} /></View>
        </View>

        <View style={styles.section}><Text style={styles.sectionTitle}>Quick help categories</Text><View style={styles.categoryGrid}>{helpCategories.map((category) => <View key={category.title} style={styles.categoryCard}><Text style={styles.categoryEmoji}>{category.emoji}</Text><Text style={styles.categoryTitle}>{category.title}</Text><Text style={styles.body}>{category.description}</Text><Button label={category.actionLabel} onPress={() => openCategory(category)} /></View>)}</View></View>

        <View style={styles.card}><Text style={styles.sectionTitle}>Support request</Text><Text style={styles.body}>What do you need help with?</Text><View style={styles.topicGrid}>{supportTopics.map((item) => <Pill key={item} label={item} active={topic === item} onPress={() => setTopic(item)} />)}</View><TextInput multiline value={details} onChangeText={setDetails} placeholder="Tell SitGuru what happened or what you need help with." placeholderTextColor={SitGuruColors.textSoft} style={styles.textArea} /><Button label="Submit Support Request" primary onPress={() => showSupportAlert(`Support request placeholder submitted for ${topic}. No backend message was sent.`)} /></View>

        <View style={styles.section}><Text style={styles.sectionTitle}>FAQ</Text>{faqs.map(([question, answer]) => <View key={question} style={styles.faqCard}><Text style={styles.faqQuestion}>{question}</Text><Text style={styles.body}>{answer}</Text></View>)}</View>

        <View style={styles.safetyCard}><Text style={styles.sectionTitle}>Safety and privacy</Text><Text style={styles.body}>Keep messages, booking details, PawReport updates, and payments inside SitGuru.</Text><Text style={styles.body}>Live tracking only runs during active booked care.</Text><Text style={styles.body}>SitGuru support should only access details needed to help with care and account issues.</Text></View>

        <View style={styles.card}><Text style={styles.sectionTitle}>Contact options</Text><View style={styles.buttonRow}><Button label="Message support" href="/conversation" primary /><Button label="Notifications" href="/notifications" /><Button label="Account settings" href="/account" /><Button label="Admin Operations Preview" href="/admin-operations" /><Button label="Backend Readiness" href="/backend-readiness" /><Button label="Release Readiness" href="/release-readiness" /><Button label="QA Test Center" href="/qa-test-center" /></View></View>

        <View style={styles.bottomDockSpacer} />
      </View>
      <View style={styles.bottomDock}>{[['Account','/account'],['Messages','/conversation'],['Booking','/booking-details'],['Alerts','/notifications']].map(([label, href]) => <Pressable key={label} accessibilityRole="button" onPress={() => router.push(href as Href)} style={styles.dockButton}><Text style={styles.dockButtonText}>{label}</Text></Pressable>)}</View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 8 },
  hero: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 30, gap: 10, padding: 20 },
  eyebrow: { color: '#C9F26D', fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 36, fontWeight: '900', letterSpacing: -1, lineHeight: 40 },
  subtitle: { color: '#DCEFE2', fontSize: 15, fontWeight: '700', lineHeight: 22 },
  urgentCard: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA', borderRadius: 28, borderWidth: 1, gap: 12, padding: 18 },
  urgentTitle: { color: SitGuruColors.warning, fontSize: 22, fontWeight: '900' },
  urgentText: { color: SitGuruColors.text, fontSize: 15, fontWeight: '800', lineHeight: 22 },
  section: { gap: 12 },
  sectionTitle: { color: SitGuruColors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  card: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 12, padding: 18 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 24, borderWidth: 1, flexBasis: 230, flexGrow: 1, gap: 9, padding: 16 },
  categoryEmoji: { fontSize: 30 },
  categoryTitle: { color: SitGuruColors.text, fontSize: 18, fontWeight: '900' },
  body: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  button: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 999, borderWidth: 1, flexGrow: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
  primaryButton: { backgroundColor: SitGuruColors.primary, borderColor: SitGuruColors.primary },
  buttonText: { color: SitGuruColors.primary, fontSize: 14, fontWeight: '900' },
  primaryButtonText: { color: '#FFFFFF' },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  topicChipActive: { backgroundColor: SitGuruColors.primary, borderColor: SitGuruColors.primary },
  topicChipText: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '900' },
  topicChipTextActive: { color: '#FFFFFF' },
  textArea: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 20, borderWidth: 1, color: SitGuruColors.text, fontSize: 15, fontWeight: '700', minHeight: 130, padding: 14, textAlignVertical: 'top' },
  faqCard: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 22, borderWidth: 1, gap: 6, padding: 16 },
  faqQuestion: { color: SitGuruColors.text, fontSize: 16, fontWeight: '900' },
  safetyCard: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 26, borderWidth: 1, gap: 8, padding: 18 },
  bottomDockSpacer: { height: 82 },
  bottomDock: { alignSelf: 'center', backgroundColor: SitGuruColors.primaryDark, borderRadius: 999, bottom: 18, flexDirection: 'row', gap: 6, padding: 8, position: 'absolute' },
  dockButton: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10 },
  dockButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
