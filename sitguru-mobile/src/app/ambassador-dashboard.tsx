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
  Alert.alert('Coming soon', `${label} will be available when Ambassador tools are connected.`);
}

export default function AmbassadorDashboardScreen() {
  const { isAuthenticated, user, profile, roles } = useAuth();
  const profileName = profile?.full_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'SitGuru member';
  const toolsActive = roles.includes('ambassador') && Boolean(profile?.avatar_url || profile?.full_name || profile?.first_name);

  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <RoleGate requiredRole="ambassador">
        <View style={styles.page}>
          <SitGuruDashboardHeader actionHref="/role-selection" actionLabel="Switch" icon="community" roleLabel="Ambassador Growth Hub" statusText={toolsActive ? 'Referral tools active' : 'Training in progress'} subtitle="Track referrals, follow up with leads, share links, complete training, and earn rewards." title="Grow SitGuru in your community" tone="danger" />

          {isAuthenticated ? <SitGuruRoleIdentityCard avatarUrl={profile?.avatar_url} email={user?.email ?? profile?.email} onPrimaryAction={() => router.push('/account')} onSecondaryAction={() => router.push('/role-selection')} primaryActionLabel="Account" profileName={profileName} roleLabel="Ambassador" secondaryActionLabel="Switch role" statusLabel={toolsActive ? 'Referral tools active' : 'Training in progress'} subtitle="Your action hub for referrals, leads, outreach, training, community growth, and rewards." title="Ambassador Growth Hub" tone="ambassador" /> : null}

          <View style={styles.ctaGrid}>
            <Pressable accessibilityRole="button" onPress={() => placeholder('Share Referral Link')} style={styles.primaryCta}><Text style={styles.primaryCtaText}>Share Referral Link</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => placeholder('Add or track lead')} style={styles.primaryCta}><Text style={styles.primaryCtaText}>Add/Track Lead</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push('/payments')} style={styles.secondaryCta}><Text style={styles.secondaryCtaText}>View Rewards</Text></Pressable>
          </View>

          <Section title="Referral command center" meta="Share & track">
            <View style={styles.commandPanel}>
              <View><Text style={styles.referralEyebrow}>Referral code</Text><Text style={styles.referralCode}>SITGURU</Text><Text style={styles.referralLink}>sitguru.app/join/SITGURU</Text></View>
              <View style={styles.commandStats}><Mini label="Signups this month" value="0" /><Mini label="Leads to follow up" value="4" /></View>
              <View style={styles.buttonRow}><Pressable onPress={() => placeholder('Copy referral link')} style={styles.smallButton}><Text style={styles.smallButtonText}>Copy link</Text></Pressable><Pressable onPress={() => placeholder('Share link')} style={styles.smallButton}><Text style={styles.smallButtonText}>Share</Text></Pressable><Pressable onPress={() => router.push('/support')} style={styles.smallButton}><Text style={styles.smallButtonText}>Support</Text></Pressable></View>
            </View>
          </Section>

          <Section title="Lead follow-up pipeline" meta="Outreach workflow">
            <View style={styles.pipelineGrid}>{['New prospects', 'Contacted', 'Signed up', 'Needs follow-up', 'Converted'].map((title, index) => <Pipeline key={title} title={title} value={String([6, 3, 1, 4, 0][index])} />)}</View>
          </Section>

          <Section title="Outreach toolkit" meta="Copy & connect">
            <View style={styles.actionGrid}>
              <SitGuruActionCard ctaLabel="Copy" description="A friendly message for pet parents who need trusted local care." onPress={() => placeholder('Facebook message template')} icon="message" title="Facebook message template" tone="danger" />
              <SitGuruActionCard ctaLabel="Copy" description="A community-safe post for local pet groups and neighborhood pages." onPress={() => placeholder('Local pet group post')} icon="outreach" title="Local pet group post" tone="danger" />
              <SitGuruActionCard ctaLabel="Save note" description="A short pitch for groomers, trainers, rescues, and pet events." onPress={() => placeholder('Vendor or event pitch')} icon="community" title="Vendor/event pitch" tone="danger" />
              <SitGuruActionCard ctaLabel="Intro" description="A warm introduction for vets and local pet-care partners." onPress={() => placeholder('Vet or partner intro')} icon="lead" title="Vet/partner intro" tone="danger" />
              <SitGuruActionCard ctaLabel="Preview" description="Business card and QR code sharing are preview placeholders." onPress={() => placeholder('Business card and QR code')} icon="reward" title="Business card/QR code" tone="danger" />
              <SitGuruActionCard ctaLabel="Ask support" description="Get help planning outreach without internal tools or test centers." href="/support" icon="message" title="Outreach support" tone="danger" />
            </View>
          </Section>

          <Section title="Training and confidence" meta="Learn then share">
            <View style={styles.actionGrid}>{['Ambassador basics', 'Referral conversation guide', 'Social sharing guide', 'Local event checklist', 'Certification/badge progress'].map((title, index) => <SitGuruActionCard key={title} ctaLabel={index === 4 ? 'Mark complete' : 'Open training'} description="Preview training keeps outreach clear, practical, friendly, and brand-safe." onPress={() => placeholder(title)} icon="training" title={title} />)}<SitGuruActionCard ctaLabel="Ask support" description="Ask SitGuru for help with a conversation, local event, or referral question." href="/support" icon="message" title="Training support" /></View>
          </Section>

          <Section title="Rewards and earnings tracker" meta="Preview rewards">
            <View style={styles.rewardGrid}><Mini label="Pending rewards" value="$0" /><Mini label="Approved rewards" value="$0" /><Mini label="Paid rewards" value="$0" /><Pressable accessibilityRole="button" onPress={() => router.push('/payments')} style={styles.nextStep}><Text style={styles.nextStepTitle}>Next payout step</Text><Text style={styles.nextStepText}>View payments/rewards preview →</Text></Pressable></View>
          </Section>

          <View style={styles.darkPanel}><View style={styles.sectionHeader}><Text style={[styles.sectionTitle, styles.darkTitle]}>Community growth</Text><Text style={styles.darkMeta}>Local impact</Text></View><View style={styles.actionGrid}><SitGuruActionCard ctaLabel="Add lead" description="Target local area, Pet Parent signups, Guru signups, and partner opportunities." onPress={() => placeholder('Add lead')} icon="compass" title="Target local area" tone="dark" /><SitGuruActionCard ctaLabel="Share" description="Invite Pet Parents and future Gurus with your referral link." onPress={() => placeholder('Share referral')} icon="lead" title="Pet Parent & Guru signups" tone="dark" /><SitGuruActionCard ctaLabel="Support" description="Track partner opportunities and follow-up reminders with support help." href="/support" icon="community" title="Partner opportunities" tone="dark" /></View></View>

          <SitGuruBottomNav items={[{ icon: 'home', label: 'Dashboard' }, { icon: 'lead', label: 'Referrals' }, { icon: 'outreach', label: 'Leads' }, { icon: 'reply', label: 'Alerts' }, { icon: 'account', label: 'Account' }]} tone="danger" />
        </View>
      </RoleGate>
    </SitGuruScreen>
  );
}

function Section({ title, meta, children }: { title: string; meta: string; children: React.ReactNode }) { return <View style={styles.section}><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionMeta}>{meta}</Text></View>{children}</View>; }
function Mini({ label, value }: { label: string; value: string }) { return <View style={styles.miniCard}><Text style={styles.miniValue}>{value}</Text><Text style={styles.miniLabel}>{label}</Text></View>; }
function Pipeline({ title, value }: { title: string; value: string }) { return <Pressable accessibilityRole="button" onPress={() => placeholder(title)} style={styles.pipelineCard}><Text style={styles.pipelineValue}>{value}</Text><Text style={styles.pipelineTitle}>{title}</Text><Text style={styles.pipelineAction}>Message/call • Add note • Mark followed up</Text></Pressable>; }

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 18, paddingTop: 6 },
  ctaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primaryCta: { alignItems: 'center', backgroundColor: SitGuruColors.danger, borderRadius: 999, flexGrow: 1, justifyContent: 'center', minHeight: 52, paddingHorizontal: 16 },
  primaryCtaText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  secondaryCta: { alignItems: 'center', backgroundColor: '#FFF1F0', borderColor: 'rgba(180, 35, 24, 0.18)', borderRadius: 999, borderWidth: 1, flexGrow: 1, justifyContent: 'center', minHeight: 52, paddingHorizontal: 16 },
  secondaryCtaText: { color: SitGuruColors.danger, fontSize: 14, fontWeight: '900' },
  section: { gap: 10 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  sectionTitle: { color: SitGuruColors.text, flex: 1, fontSize: 21, fontWeight: '900', letterSpacing: -0.3, lineHeight: 26 },
  sectionMeta: { color: SitGuruColors.danger, fontSize: 12, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  commandPanel: { backgroundColor: SitGuruColors.surface, borderColor: 'rgba(180, 35, 24, 0.18)', borderRadius: 28, borderWidth: 1, elevation: 3, gap: 14, padding: 18 },
  referralEyebrow: { color: SitGuruColors.danger, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  referralCode: { color: SitGuruColors.text, fontSize: 32, fontWeight: '900', letterSpacing: 1.4 },
  referralLink: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '800' },
  commandStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  miniCard: { backgroundColor: '#FFF8F7', borderColor: 'rgba(180, 35, 24, 0.12)', borderRadius: 20, borderWidth: 1, flex: 1, minWidth: 140, padding: 14 },
  miniValue: { color: SitGuruColors.danger, fontSize: 26, fontWeight: '900' },
  miniLabel: { color: SitGuruColors.textMuted, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  smallButton: { backgroundColor: SitGuruColors.danger, borderRadius: 999, minHeight: 46, justifyContent: 'center', paddingHorizontal: 16 },
  smallButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  pipelineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pipelineCard: { backgroundColor: SitGuruColors.surface, borderColor: 'rgba(180, 35, 24, 0.18)', borderRadius: 22, borderWidth: 1, flexBasis: '47%', flexGrow: 1, gap: 6, minHeight: 138, padding: 16 },
  pipelineValue: { color: SitGuruColors.danger, fontSize: 30, fontWeight: '900' },
  pipelineTitle: { color: SitGuruColors.text, fontSize: 15, fontWeight: '900' },
  pipelineAction: { color: SitGuruColors.textMuted, flex: 1, fontSize: 12, fontWeight: '800', lineHeight: 17 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rewardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  nextStep: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.border, borderRadius: 20, borderWidth: 1, flex: 1, minWidth: 170, padding: 14 },
  nextStepTitle: { color: SitGuruColors.text, fontSize: 16, fontWeight: '900' },
  nextStepText: { color: SitGuruColors.danger, fontSize: 13, fontWeight: '900', marginTop: 6 },
  darkPanel: { backgroundColor: SitGuruColors.primaryDark, borderRadius: 30, gap: 14, padding: 18 },
  darkTitle: { color: '#FFFFFF' },
  darkMeta: { color: '#FFD9D5', fontSize: 12, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
});
