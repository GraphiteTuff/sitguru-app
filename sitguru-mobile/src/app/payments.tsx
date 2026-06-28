import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type Action = { label: string; href?: Href; alert?: string };
type MethodStatus = 'Available' | 'Coming soon' | 'Saved' | 'Needs setup' | 'Credit available';

type PaymentMethod = {
  icon: string;
  name: string;
  description: string;
  status: MethodStatus;
  action: 'Add' | 'Manage' | 'Apply' | 'Learn more';
};

const paymentMethods: PaymentMethod[] = [
  { icon: '💳', name: 'Credit / debit card', description: 'Use a card on file after Guru acceptance. Placeholder ending 4242 only.', status: 'Needs setup', action: 'Add' },
  { icon: '🍎', name: 'Apple Pay', description: 'Wallet option preview for eligible devices. Payment happens after Guru acceptance.', status: 'Coming soon', action: 'Learn more' },
  { icon: '🤖', name: 'Google Pay', description: 'Wallet option preview for eligible devices. No charge from this screen.', status: 'Coming soon', action: 'Learn more' },
  { icon: '🔗', name: 'Link by Stripe', description: 'Future fast checkout option preview. No real Stripe setup is connected yet.', status: 'Coming soon', action: 'Learn more' },
  { icon: '✅', name: 'Saved payment method', description: 'Visual-only saved method using placeholder card ending 4242.', status: 'Saved', action: 'Manage' },
  { icon: '🏦', name: 'ACH / bank account placeholder', description: 'Future bank payment placeholder. No bank details are collected or stored.', status: 'Coming soon', action: 'Learn more' },
  { icon: '🐾', name: 'PawPerks credit', description: 'Apply earned SitGuru credits before the final amount is confirmed.', status: 'Credit available', action: 'Apply' },
  { icon: '🎁', name: 'Referral credit', description: 'Referral credit preview that may reduce an eligible booking estimate.', status: 'Credit available', action: 'Apply' },
  { icon: '🏷️', name: 'Promo code', description: 'Promo code placeholder. Final amount is confirmed before payment.', status: 'Available', action: 'Apply' },
  { icon: '💌', name: 'Gift card / SitGuru credit placeholder', description: 'Future SitGuru credit balance preview with no real gift card collection.', status: 'Coming soon', action: 'Learn more' },
  { icon: '⭐', name: 'Tip after completed care', description: 'Optional tip preview after care is completed; tips are not charged now.', status: 'Available', action: 'Learn more' },
];

const estimateRows = [
  ['Service rate', '$25'],
  ['Additional pet fee', '$10'],
  ['Multi-pet savings', '-$1'],
  ['PawPerks credit', '-$5'],
  ['Referral credit', '-$5'],
  ['Promo code placeholder', 'Review later'],
  ['Tip after completed care placeholder', 'Optional later'],
  ['Estimated total', '$24'],
] as const;

const payoutSteps = ['Complete Guru profile', 'Set pricing calendar', 'Accept completed booking', 'Connect payout account'];
const supportTopics = ['Refund request placeholder', 'Price adjustment placeholder', 'Payment failed placeholder', 'Payout delay placeholder', 'Promo code issue placeholder'];
const timeline = ['Request created', 'Guru review pending', 'Payment not charged', 'PawPerks credit available', 'Payment method ready', 'Payout setup needed'];

function showPlaceholder(label: string) {
  Alert.alert('Visual-only preview', `${label} is a safe placeholder. No real payment, payout, wallet, card, bank, or Stripe action is connected.`);
}

function openAction(action: Action) {
  if (action.href) {
    router.push(action.href);
    return;
  }
  showPlaceholder(action.alert ?? action.label);
}

function Card({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Button({ action, primary = false }: { action: Action; primary?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => openAction(action)} style={[styles.button, primary && styles.primaryButton]}>
      <Text style={[styles.buttonText, primary && styles.primaryButtonText]}>{action.label}</Text>
    </Pressable>
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

export default function PaymentsScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/account')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Account</Text>
          </Pressable>
          <SitGuruLogo size="small" variant="symbol" />
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>Money hub preview</Text>
          <Text style={styles.title}>Payments & Payouts</Text>
          <Text style={styles.subtitle}>Review booking payment status, ways to pay, Guru payout readiness, rewards, credits, and future Stripe setup.</Text>
        </View>

        <Card title="Release readiness note" eyebrow="Visual-only payments">
          <Text style={styles.note}>Payments are visual-only until Stripe is wired. No real card, wallet, bank, payment, payout, or Stripe action is connected in this preview.</Text>
          <Button action={{ label: 'Open Release Readiness', href: '/release-readiness' }} primary />
        </Card>

        <Card title="Payment happens after the Guru accepts" eyebrow="Important payment rule">
          <Text style={styles.body}>This preview does not charge the Pet Parent.</Text>
          <Text style={styles.body}>Payment happens after the Guru accepts.</Text>
          <Text style={styles.body}>Final pricing, tips, and payment timing are confirmed before payment. Final amount is confirmed before payment.</Text>
          <Text style={styles.body}>Keep payment activity inside SitGuru.</Text>
        </Card>

        <Card title="Ways to Pay" eyebrow="Pet Parents">
          <Text style={styles.note}>Payment happens after Guru acceptance.</Text>
          <View style={styles.methodGrid}>
            {paymentMethods.map((method) => (
              <View key={method.name} style={styles.methodCard}>
                <View style={styles.methodHeader}>
                  <Text style={styles.methodIcon}>{method.icon}</Text>
                  <Text style={styles.statusBadge}>{method.status}</Text>
                </View>
                <Text style={styles.methodTitle}>{method.name}</Text>
                <Text style={styles.methodDescription}>{method.description}</Text>
                <Button action={{ label: method.action, alert: method.name }} />
              </View>
            ))}
          </View>
        </Card>

        <Card title="Pet Parent payment status" eyebrow="Not charged">
          <InfoRow label="Payment method placeholder" value="Saved card ending 4242" />
          <InfoRow label="PawPerks credit preview" value="$5 available" />
          <InfoRow label="Referral credit preview" value="$5 available" />
          <InfoRow label="Booking payment status" value="Not charged • Waiting for Guru acceptance" />
          <View style={styles.buttonRow}>
            <Button action={{ label: 'Manage Payment Method', alert: 'Manage Payment Method' }} primary />
            <Button action={{ label: 'View Booking Details', href: '/booking-details' }} />
            <Button action={{ label: 'Help with Payment', href: '/support' }} />
          </View>
        </Card>

        <Card title="Booking estimate" eyebrow="Preview only">
          {estimateRows.map(([label, value]) => <InfoRow key={label} label={label} value={value} />)}
          <Text style={styles.note}>Final amount confirmed after Guru accepts.</Text>
        </Card>

        <Card title="Guru payout readiness" eyebrow="Stripe Connect placeholder">
          <InfoRow label="Status" value="Not connected / Needs setup" />
          <InfoRow label="Payout account placeholder" value="Ending STG-0000" />
          {payoutSteps.map((step) => <InfoRow key={step} label="Required step" value={step} />)}
          <View style={styles.buttonRow}>
            <Button action={{ label: 'Set Up Payouts', alert: 'Set Up Payouts' }} primary />
            <Button action={{ label: 'Open Guru Pricing', href: '/guru-pricing' }} />
            <Button action={{ label: 'View Guru Dashboard', href: '/guru-dashboard' }} />
          </View>
        </Card>

        <Card title="Guru earnings preview" eyebrow="Visual only">
          <InfoRow label="Completed bookings" value="0" />
          <InfoRow label="Pending payout" value="$0" />
          <InfoRow label="Paid out" value="$0" />
          <InfoRow label="Marketplace fee preview" value="Shown before final payment" />
          <Text style={styles.note}>Tips after completed care are shown as pass-through preview items before payout.</Text>
          <Button action={{ label: 'View Guru Dashboard', href: '/guru-dashboard' }} />
        </Card>

        <Card title="Ambassador rewards" eyebrow="Referral rewards preview">
          <InfoRow label="Pending rewards" value="$0" />
          <InfoRow label="Approved rewards" value="$0" />
          <InfoRow label="Paid rewards" value="$0" />
          <InfoRow label="Referral activity placeholder" value="No reward payment is connected in this preview" />
          <View style={styles.buttonRow}>
            <Button action={{ label: 'Ambassador Dashboard', href: '/ambassador-dashboard' }} primary />
            <Button action={{ label: 'Help with Rewards', href: '/support' }} />
          </View>
        </Card>

        <Card title="PawPerks and credits" eyebrow="Credits preview">
          <InfoRow label="Available credit" value="$10" />
          <InfoRow label="Lifetime PawPerks" value="$25" />
          <InfoRow label="Referral credits" value="$5" />
          <InfoRow label="Promo code placeholder" value="Apply later before payment" />
          <InfoRow label="Gift credit placeholder" value="Future SitGuru credit" />
          <View style={styles.buttonRow}>
            <Button action={{ label: 'Apply Credit', alert: 'Apply Credit' }} primary />
            <Button action={{ label: 'View Notifications', href: '/notifications' }} />
          </View>
        </Card>

        <Card title="Payment help and adjustments">
          {supportTopics.map((topic) => <InfoRow key={topic} label="Support topic" value={topic} />)}
          <Button action={{ label: 'Help & Support', href: '/support' }} primary />
        </Card>

        <Card title="Payment safety">
          <Text style={styles.body}>Keep payment, payout, refunds, booking, and care records inside SitGuru.</Text>
          <Text style={styles.safety}>For safety, keep booking payments inside SitGuru. Do not exchange off-platform payment details.</Text>
          <Text style={styles.body}>Support can help with payment or payout questions.</Text>
          <Text style={styles.body}>No emergency payments or cash handling inside the app preview.</Text>
        </Card>

        <Card title="Payment activity timeline">
          {timeline.map((item, index) => (
            <View key={item} style={styles.timelineRow}>
              <Text style={styles.timelineDot}>{index + 1}</Text>
              <Text style={styles.timelineText}>{item}</Text>
            </View>
          ))}
        </Card>

        <View style={styles.bottomDockSpacer} />
      </View>

      <View style={styles.bottomDock}>
        {[
          ['Account', '/account'],
          ['Booking', '/booking-details'],
          ['Alerts', '/notifications'],
          ['Support', '/support'],
        ].map(([label, href]) => (
          <Pressable key={label} accessibilityRole="button" onPress={() => router.push(href as Href)} style={styles.dockButton}>
            <Text style={styles.dockButtonText}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 8 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  backButton: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  backButtonText: { color: SitGuruColors.text, fontSize: 14, fontWeight: '900' },
  hero: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 30, gap: 8, padding: 22 },
  heroEyebrow: { color: '#C9F26D', fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', letterSpacing: -1, lineHeight: 38 },
  subtitle: { color: '#DCEFE2', fontSize: 15, fontWeight: '700', lineHeight: 22 },
  card: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 28, borderWidth: 1, gap: 12, padding: 18 },
  eyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  cardTitle: { color: SitGuruColors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  body: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '800', lineHeight: 21 },
  note: { backgroundColor: '#FFF8ED', borderColor: '#F8DEC8', borderRadius: 18, borderWidth: 1, color: SitGuruColors.text, fontSize: 14, fontWeight: '900', lineHeight: 20, padding: 14 },
  safety: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 18, borderWidth: 1, color: SitGuruColors.primaryDark, fontSize: 14, fontWeight: '900', lineHeight: 20, padding: 14 },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  methodCard: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 24, borderWidth: 1, flexBasis: 220, flexGrow: 1, gap: 9, padding: 15 },
  methodHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  methodIcon: { fontSize: 28 },
  statusBadge: { backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 999, color: SitGuruColors.primary, fontSize: 11, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 },
  methodTitle: { color: SitGuruColors.text, fontSize: 17, fontWeight: '900' },
  methodDescription: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  button: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderRadius: 999, borderWidth: 1, flexGrow: 1, justifyContent: 'center', minHeight: 46, paddingHorizontal: 14 },
  primaryButton: { backgroundColor: SitGuruColors.primary, borderColor: SitGuruColors.primary },
  buttonText: { color: SitGuruColors.primary, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  primaryButtonText: { color: '#FFFFFF' },
  infoRow: { backgroundColor: SitGuruColors.background, borderColor: SitGuruColors.border, borderRadius: 18, borderWidth: 1, gap: 4, padding: 13 },
  infoLabel: { color: SitGuruColors.text, fontSize: 14, fontWeight: '900' },
  infoValue: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  timelineRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  timelineDot: { backgroundColor: SitGuruColors.primary, borderRadius: 999, color: '#FFFFFF', fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5 },
  timelineText: { color: SitGuruColors.text, flex: 1, fontSize: 15, fontWeight: '800' },
  bottomDockSpacer: { height: 86 },
  bottomDock: { alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.96)', borderColor: SitGuruColors.border, borderRadius: 999, borderWidth: 1, bottom: 16, elevation: 8, flexDirection: 'row', gap: 6, left: 16, padding: 8, position: 'absolute', right: 16 },
  dockButton: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 999, flex: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 8 },
  dockButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
