import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import RoleGate from '@/components/RoleGate';
import SitGuruActionCard from '@/components/SitGuruActionCard';
import SitGuruBottomNav from '@/components/SitGuruBottomNav';
import SitGuruDashboardHeader from '@/components/SitGuruDashboardHeader';
import SitGuruRoleIdentityCard from '@/components/SitGuruRoleIdentityCard';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';

function placeholder(label: string) {
  Alert.alert('Coming soon', `${label} will be available when this workspace action is connected.`);
}

export default function GuruDashboardScreen() {
  const { isAuthenticated, user, profile, roles } = useAuth();
  const profileName = profile?.full_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'SitGuru member';
  const isReady = roles.includes('guru') && Boolean(profile?.avatar_url || profile?.full_name || profile?.first_name);

  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <RoleGate requiredRole="guru">
        <View style={styles.page}>
          <SitGuruDashboardHeader
            actionHref="/role-selection"
            actionLabel="Switch"
            icon="service"
            roleLabel="Guru Workstation"
            statusText={isReady ? 'Ready to receive requests' : 'Profile setup in progress'}
            subtitle="Manage requests, bookings, messages, pricing, visits, and service quality."
            title="Run your SitGuru care business"
            tone="warning"
          />

          {isAuthenticated ? (
            <SitGuruRoleIdentityCard
              avatarUrl={profile?.avatar_url}
              email={user?.email ?? profile?.email}
              onPrimaryAction={() => router.push('/account')}
              onSecondaryAction={() => router.push('/role-selection')}
              primaryActionLabel="Account"
              profileName={profileName}
              roleLabel="Guru"
              secondaryActionLabel="Switch role"
              statusLabel={isReady ? 'Ready to receive requests' : 'Profile setup in progress'}
              subtitle="Your action center for care requests, visits, replies, pricing, and service quality."
              title="Guru Workstation"
              tone="guru"
            />
          ) : null}

          <View style={styles.ctaGrid}>
            <Pressable accessibilityRole="button" onPress={() => router.push('/guru-requests')} style={styles.primaryCta}><Text style={styles.primaryCtaText}>View Requests</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push('/conversation')} style={styles.primaryCta}><Text style={styles.primaryCtaText}>Open Messages</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push('/guru-pricing')} style={styles.secondaryCta}><Text style={styles.secondaryCtaText}>Update Availability</Text></Pressable>
          </View>

          <Section title="Today’s care workstation" meta="Preview queue">
            <View style={styles.actionGrid}>
              <SitGuruActionCard ctaLabel="View Booking" description="Preview: Scout’s afternoon walk is the next visit on your care board." href="/booking-details" icon="booking" meta="Upcoming" title="Upcoming visit" tone="warning" />
              <SitGuruActionCard ctaLabel="Start Live Walk" description="Preview: Start PawReport Live when care begins and send visit updates." href="/guru-live-walk" icon="paw" meta="PawReport" title="Active PawReport / Live Walk" tone="warning" />
              <SitGuruActionCard ctaLabel="Review Request" description="Preview: Luna’s drop-in request is waiting for your response." href="/guru-requests" icon="request" meta="Pending" title="Pending request" tone="warning" />
              <SitGuruActionCard ctaLabel="Reply" description="A Pet Parent conversation needs a fast, friendly reply." href="/conversation" icon="message" meta="Message" title="Message waiting" tone="warning" />
            </View>
          </Section>

          <Section title="Request pipeline" meta="Move work forward">
            <View style={styles.pipelineGrid}>
              <Pipeline title="New requests" value="3" action="Review" onPress={() => router.push('/guru-requests')} />
              <Pipeline title="Awaiting Pet Parent reply" value="1" action="Message" onPress={() => router.push('/conversation')} />
              <Pipeline title="Accepted / upcoming" value="2" action="Prep" onPress={() => router.push('/booking-details')} />
              <Pipeline title="Completed / review needed" value="1" action="Reviews" onPress={() => router.push('/reviews')} />
            </View>
          </Section>

          <Section title="Pricing and availability workspace" meta="Business controls">
            <View style={styles.actionGrid}>
              <SitGuruActionCard ctaLabel="Open" description="Adjust service rates, date overrides, and calendar pricing." href="/guru-pricing" icon="calendar" meta="Pricing" title="Pricing Calendar" tone="warning" />
              <SitGuruActionCard ctaLabel="Edit" description="Set the days, times, and care types you want to receive." href="/guru-pricing" icon="availability" meta="Rules" title="Availability rules" tone="warning" />
              <SitGuruActionCard ctaLabel="Block dates" description="Protect personal time and mark busy days before requests arrive." href="/guru-pricing" icon="checklist" meta="Calendar" title="Busy days" tone="warning" />
              <SitGuruActionCard ctaLabel="Manage" description="Choose walks, drop-ins, boarding, house sitting, or repeat care." onPress={() => placeholder('Services offered')} icon="service" meta="Services" title="Services offered" tone="warning" />
              <SitGuruActionCard ctaLabel="Review" description="Preview payout readiness and next payment setup steps." href="/payments" icon="payout" meta="Payouts" title="Payout readiness" tone="warning" />
            </View>
          </Section>

          <Section title="Service quality tools" meta="Better care">
            <View style={styles.actionGrid}>
              <SitGuruActionCard ctaLabel="Update" description="Send PawReport notes, photos, timing, and care progress." href="/guru-live-walk" icon="paw" title="PawReport updates" />
              <SitGuruActionCard ctaLabel="Open" description="Review routines, meds, access notes, and visit expectations." href="/booking-details" icon="checklist" title="Care notes checklist" />
              <SitGuruActionCard ctaLabel="Remind me" description="Preview reminder to share clear visit photos during care." onPress={() => placeholder('Photo update reminders')} icon="care" title="Photo update reminder" />
              <SitGuruActionCard ctaLabel="Reply now" description="Keep a fast response-time goal to win more requests." href="/conversation" icon="reply" title="Response-time goal" />
              <SitGuruActionCard ctaLabel="Request review" description="After care, ask for feedback to build marketplace trust." href="/reviews" icon="trust" title="Review request after care" />
              <SitGuruActionCard ctaLabel="Ask support" description="Get help with a visit, Pet Parent concern, or quality question." href="/support" icon="message" title="Care support" />
            </View>
          </Section>

          <View style={styles.darkPanel}>
            <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, styles.darkTitle]}>Business growth / marketplace performance</Text><Text style={styles.darkMeta}>Grow</Text></View>
            <View style={styles.actionGrid}>
              <SitGuruActionCard ctaLabel="Improve profile" description="Profile visibility improves with complete photos, bio, services, and area." href="/guru-profile" icon="profile" meta="Visibility" title="Profile visibility" tone="dark" />
              <SitGuruActionCard ctaLabel="Review pricing" description="Booking-ready score improves when pricing and availability are current." href="/guru-pricing" icon="payment" meta="Ready" title="Booking-ready score" tone="dark" />
              <SitGuruActionCard ctaLabel="View reviews" description="Reviews and trust signals help Pet Parents book confidently." href="/reviews" icon="trust" meta="Trust" title="Reviews / trust" tone="dark" />
              <SitGuruActionCard ctaLabel="Get support" description="Keep repeat clients, response speed, and service area readiness on track." href="/support" icon="community" meta="Growth" title="Repeat clients & area" tone="dark" />
            </View>
          </View>

          <SitGuruBottomNav items={[{ icon: 'home', label: 'Dashboard' }, { icon: 'request', label: 'Requests' }, { icon: 'message', label: 'Messages' }, { icon: 'reply', label: 'Alerts' }, { icon: 'account', label: 'Account' }]} tone="warning" />
        </View>
      </RoleGate>
    </SitGuruScreen>
  );
}

function Section({ title, meta, children }: { title: string; meta: string; children: React.ReactNode }) {
  return <View style={styles.section}><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionMeta}>{meta}</Text></View>{children}</View>;
}

function Pipeline({ title, value, action, onPress }: { title: string; value: string; action: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.pipelineCard}><Text style={styles.pipelineValue}>{value}</Text><Text style={styles.pipelineTitle}>{title}</Text><Text style={styles.pipelineAction}>{action} →</Text></Pressable>;
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 18, paddingTop: 6 },
  ctaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primaryCta: { alignItems: 'center', backgroundColor: SitGuruColors.warning, borderRadius: 999, flexGrow: 1, minHeight: 52, justifyContent: 'center', paddingHorizontal: 16 },
  primaryCtaText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  secondaryCta: { alignItems: 'center', backgroundColor: '#FFF8ED', borderColor: 'rgba(181, 71, 8, 0.22)', borderRadius: 999, borderWidth: 1, flexGrow: 1, minHeight: 52, justifyContent: 'center', paddingHorizontal: 16 },
  secondaryCtaText: { color: SitGuruColors.warning, fontSize: 14, fontWeight: '900' },
  section: { gap: 10 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  sectionTitle: { color: SitGuruColors.text, flex: 1, fontSize: 21, fontWeight: '900', letterSpacing: -0.3, lineHeight: 26 },
  sectionMeta: { color: SitGuruColors.warning, fontSize: 12, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pipelineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pipelineCard: { backgroundColor: SitGuruColors.surface, borderColor: 'rgba(181, 71, 8, 0.22)', borderRadius: 22, borderWidth: 1, flexBasis: '47%', flexGrow: 1, gap: 6, minHeight: 132, padding: 16 },
  pipelineValue: { color: SitGuruColors.warning, fontSize: 30, fontWeight: '900' },
  pipelineTitle: { color: SitGuruColors.text, flex: 1, fontSize: 15, fontWeight: '900', lineHeight: 20 },
  pipelineAction: { color: SitGuruColors.warning, fontSize: 13, fontWeight: '900' },
  darkPanel: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 30, gap: 14, padding: 18 },
  darkTitle: { color: '#FFFFFF' },
  darkMeta: { color: '#DCEFE2', fontSize: 12, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
});
