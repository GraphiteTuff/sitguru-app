import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import RoleGate from '@/components/RoleGate';
import SitGuruActionCard from '@/components/SitGuruActionCard';
import SitGuruBottomNav from '@/components/SitGuruBottomNav';
import SitGuruCard from '@/components/SitGuruCard';
import SitGuruDashboardHeader from '@/components/SitGuruDashboardHeader';
import SitGuruRoleIdentityCard from '@/components/SitGuruRoleIdentityCard';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruStatCard from '@/components/SitGuruStatCard';
import { SitGuruColors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { roleLabel } from '@/types/auth';

export default function AmbassadorDashboardScreen() {
  const { isAuthenticated, user, profile, roles } = useAuth();
  const profileName = profile?.full_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'SitGuru member';
  const loadedRoleText = roles.includes('ambassador') ? 'Ambassador role loaded' : roles.length ? `Loaded roles: ${roles.map(roleLabel).join(', ')}` : 'Role status loading';

  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <RoleGate requiredRole="ambassador">
        <View style={styles.page}>
        <SitGuruDashboardHeader
          actionHref="/role-selection"
          actionLabel="Switch"
          icon="community"
          roleLabel="Ambassador"
          statusText="Ambassador dashboard"
          subtitle="Share SitGuru, track referrals, complete training, view rewards, and support local pet care growth."
          title="Grow local SitGuru trust"
          tone="danger"
        />

        {isAuthenticated ? (
          <SitGuruRoleIdentityCard
            avatarUrl={profile?.avatar_url}
            email={user?.email ?? profile?.email}
            onPrimaryAction={() => router.push('/account')}
            onSecondaryAction={() => router.push('/role-selection')}
            primaryActionLabel="Account"
            profileName={profileName}
            roleLabel="Ambassador"
            secondaryActionLabel="Role Selection"
            statusLabel={loadedRoleText}
            subtitle="Your profile photo, role, and account identity are shown in a premium controlled frame."
            title="Signed-in Ambassador identity"
            tone="ambassador"
          />
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/account')}
          style={styles.accountPanel}
        >
          <View style={styles.accountIconBadge}>
            <Text style={styles.accountIcon}>⚙️</Text>
          </View>
          <View style={styles.accountCopy}>
            <Text style={styles.accountEyebrow}>Account & Settings</Text>
            <Text style={styles.accountTitle}>Manage profile, roles, alerts, privacy, and support</Text>
          </View>
          <Text style={styles.accountChevron}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/support')}
          style={styles.accountPanel}
        >
          <View style={styles.accountIconBadge}>
            <Text style={styles.accountIcon}>🛟</Text>
          </View>
          <View style={styles.accountCopy}>
            <Text style={styles.accountEyebrow}>Help & Support</Text>
            <Text style={styles.accountTitle}>Ambassador help for referrals, rewards, training, and support requests</Text>
          </View>
          <Text style={styles.accountChevron}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/payments')}
          style={styles.accountPanel}
        >
          <View style={styles.accountIconBadge}>
            <Text style={styles.accountIcon}>🎁</Text>
          </View>
          <View style={styles.accountCopy}>
            <Text style={styles.accountEyebrow}>Rewards / Payments</Text>
            <Text style={styles.accountTitle}>Track pending rewards, approved rewards, paid rewards, and referral tracking</Text>
          </View>
          <Text style={styles.accountChevron}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/notifications')}
          style={styles.notificationsPanel}
        >
          <View style={styles.notificationsIconBadge}>
            <Text style={styles.notificationsIcon}>🔔</Text>
          </View>
          <View style={styles.notificationsCopy}>
            <Text style={styles.notificationsEyebrow}>Ambassador alerts</Text>
            <Text style={styles.notificationsTitle}>Referral updates, training reminders, support messages, and reward status</Text>
            <Text style={styles.notificationsText}>Open Notifications to review community growth updates.</Text>
          </View>
          <Text style={styles.notificationsChevron}>›</Text>
        </Pressable>

        <View style={styles.photoReadyPanel}>
          <View style={styles.photoSlot}>
            <Text style={styles.photoIcon}>🌟</Text>
            <Text style={styles.photoTitle}>Ambassador photo area</Text>
            <Text style={styles.photoText}>
              Add a real Ambassador, local event, partner, or community outreach
              photo here.
            </Text>
          </View>

          <View style={styles.photoFloatingCard}>
            <Text style={styles.photoFloatingTitle}>Community growth</Text>
            <Text style={styles.photoFloatingText}>
              Invite Pet Parents, future Gurus, businesses, and local partners.
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <SitGuruStatCard
            detail="Pet Parent, Guru, or business leads"
            label="Referrals"
            tone="danger"
            value="0"
          />

          <SitGuruStatCard
            detail="Ambassador Academy"
            label="Training"
            tone="danger"
            value="0%"
          />

          <SitGuruStatCard
            detail="Pending, approved, and paid"
            label="Rewards"
            value="$0"
            wide
          />
        </View>

        <View style={styles.referralCodePanel}>
          <View>
            <Text style={styles.referralEyebrow}>Your referral code</Text>
            <Text style={styles.referralCode}>SITGURU</Text>
          </View>

          <View style={styles.referralBadge}>
            <Text style={styles.referralBadgeText}>Ready to share</Text>
          </View>
        </View>

        <View style={styles.referralPanel}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, styles.darkSectionTitle]}>
              Community actions
            </Text>
            <Text style={styles.sectionMeta}>Start here</Text>
          </View>

          <View style={styles.actionGrid}>
            <SitGuruActionCard
              ctaLabel="Share"
              description="Invite Pet Parents, future Gurus, and local partners to join SitGuru."
              icon="lead"
              meta="Referral"
              title="Share SitGuru"
              tone="dark"
            />

            <SitGuruActionCard
              ctaLabel="Track"
              description="Keep referral conversations organized by next step and role fit."
              href="/notifications"
              icon="outreach"
              meta="Outreach"
              title="Track outreach"
              tone="dark"
            />

            <SitGuruActionCard
              ctaLabel="Train"
              description="Review approved talking points, Ambassador basics, and community guidance."
              icon="training"
              meta="Training"
              title="Complete training"
              tone="dark"
            />

            <SitGuruActionCard
              ctaLabel="Support"
              description="Ask SitGuru for help with referrals, training, local outreach, or partner ideas."
              href="/support"
              icon="message"
              meta="Help"
              title="Message support"
              tone="dark"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Referral links</Text>
            <Text style={styles.sectionMetaLight}>Share</Text>
          </View>

          <View style={styles.cardStack}>
            <SitGuruCard
              description="Share with Pet Parents who need trusted local pet care."
              icon="care"
              size="compact"
              title="Pet Parent referral link"
              tone="danger"
            />

            <SitGuruCard
              description="Share with future Pet Gurus who want to offer independent local care."
              icon="service"
              size="compact"
              title="Guru referral link"
            />

            <SitGuruCard
              description="Use for vets, groomers, trainers, rescues, local businesses, and community groups."
              icon="community"
              size="compact"
              title="Business and community referrals"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Onboarding</Text>
            <Text style={styles.sectionMetaLight}>Readiness</Text>
          </View>

          <View style={styles.progressPanel}>
            <View style={styles.progressRow}>
              <Text style={styles.checkIcon}>•</Text>
              <Text style={styles.progressText}>Confirm Ambassador profile</Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.checkIcon}>•</Text>
              <Text style={styles.progressText}>Review referral expectations</Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.checkIcon}>•</Text>
              <Text style={styles.progressText}>Complete Ambassador Academy</Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.checkIcon}>•</Text>
              <Text style={styles.progressText}>Prepare sharing tools</Text>
            </View>
          </View>
        </View>

        <View style={styles.trainingPanel}>
          <View style={styles.trainingHeader}>
            <Text style={styles.trainingEyebrow}>Training</Text>
            <Text style={styles.trainingBadge}>Academy</Text>
          </View>

          <Text style={styles.trainingTitle}>Learn the SitGuru story.</Text>

          <Text style={styles.trainingText}>
            Ambassador training keeps outreach simple, friendly, and consistent:
            what SitGuru is, who it helps, how referrals work, and how to talk
            about trusted local pet care.
          </Text>

          <View style={styles.trainingList}>
            <View style={styles.trainingItem}>
              <Text style={styles.trainingCheck}>✓</Text>
              <Text style={styles.trainingItemText}>SitGuru basics</Text>
            </View>

            <View style={styles.trainingItem}>
              <Text style={styles.trainingCheck}>•</Text>
              <Text style={styles.trainingItemText}>Referral talking points</Text>
            </View>

            <View style={styles.trainingItem}>
              <Text style={styles.trainingCheck}>•</Text>
              <Text style={styles.trainingItemText}>Community outreach guidance</Text>
            </View>

            <View style={styles.trainingItem}>
              <Text style={styles.trainingCheck}>•</Text>
              <Text style={styles.trainingItemText}>Ambassador certification</Text>
            </View>
          </View>
        </View>

        <View style={styles.rewardsPanel}>
          <View style={styles.rewardsHeader}>
            <Text style={styles.rewardsEyebrow}>Rewards</Text>
            <Text style={styles.rewardsBadge}>Track progress</Text>
          </View>

          <Text style={styles.rewardsTitle}>Referral rewards made easy.</Text>

          <Text style={styles.rewardsText}>
            Rewards will appear here as referrals move through signup, activity,
            approval, and payout milestones.
          </Text>

          <View style={styles.rewardsGrid}>
            <View style={styles.rewardMiniCard}>
              <Text style={styles.rewardMiniValue}>$0</Text>
              <Text style={styles.rewardMiniLabel}>Pending</Text>
            </View>

            <View style={styles.rewardMiniCard}>
              <Text style={styles.rewardMiniValue}>$0</Text>
              <Text style={styles.rewardMiniLabel}>Approved</Text>
            </View>

            <View style={styles.rewardMiniCard}>
              <Text style={styles.rewardMiniValue}>$0</Text>
              <Text style={styles.rewardMiniLabel}>Paid</Text>
            </View>
          </View>
        </View>

        <SitGuruCard
          description="Use Support for referral questions, training help, local outreach ideas, or partner introductions."
          icon="message"
          size="compact"
          title="Ambassador support"
          tone="danger"
        />

        <SitGuruBottomNav
          items={[
            { icon: 'home', label: 'Home' },
            { icon: 'lead', label: 'Referrals' },
            { icon: 'training', label: 'Training' },
            { icon: 'reward', label: 'Rewards' },
          ]}
          tone="danger"
        />
        </View>
      </RoleGate>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 16,
    paddingBottom: 18,
    paddingTop: 6,
  },

  accountPanel: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 26,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  accountIconBadge: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  accountIcon: { fontSize: 25 },
  accountCopy: { flex: 1, gap: 3 },
  accountEyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  accountTitle: { color: SitGuruColors.text, fontSize: 16, fontWeight: '900', lineHeight: 21 },
  accountChevron: { color: SitGuruColors.primary, fontSize: 34, fontWeight: '900' },
  photoReadyPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: 'rgba(180, 35, 24, 0.18)',
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    minHeight: 260,
    overflow: 'hidden',
    padding: 14,
    position: 'relative',
  },
  photoSlot: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    minHeight: 230,
    padding: 22,
  },
  photoIcon: {
    fontSize: 44,
  },
  photoTitle: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  photoText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    maxWidth: 280,
    textAlign: 'center',
  },
  photoFloatingCard: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 22,
    bottom: 28,
    gap: 4,
    left: 28,
    padding: 14,
    position: 'absolute',
    right: 28,
  },
  photoFloatingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  photoFloatingText: {
    color: '#DCEFE2',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  referralCodePanel: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: 'rgba(180, 35, 24, 0.18)',
    borderRadius: 28,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    padding: 18,
  },
  referralEyebrow: {
    color: SitGuruColors.danger,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  referralCode: {
    color: SitGuruColors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1.6,
    lineHeight: 35,
  },
  referralBadge: {
    backgroundColor: '#FFF1F0',
    borderColor: 'rgba(180, 35, 24, 0.18)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  referralBadgeText: {
    color: SitGuruColors.danger,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  referralPanel: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 30,
    gap: 14,
    padding: 18,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: SitGuruColors.text,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  darkSectionTitle: {
    color: '#FFFFFF',
  },
  sectionMeta: {
    color: '#FFD9D5',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionMetaLight: {
    color: SitGuruColors.danger,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cardStack: {
    gap: 10,
  },
  progressPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: 'rgba(180, 35, 24, 0.18)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  checkIcon: {
    color: SitGuruColors.danger,
    fontSize: 18,
    fontWeight: '900',
    width: 22,
  },
  progressText: {
    color: SitGuruColors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  trainingPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: 'rgba(180, 35, 24, 0.18)',
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 13,
    padding: 18,
  },
  trainingHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  trainingEyebrow: {
    color: SitGuruColors.danger,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  trainingBadge: {
    backgroundColor: '#FFF1F0',
    borderColor: 'rgba(180, 35, 24, 0.18)',
    borderRadius: 999,
    borderWidth: 1,
    color: SitGuruColors.danger,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  trainingTitle: {
    color: SitGuruColors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 29,
  },
  trainingText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  trainingList: {
    gap: 9,
  },
  trainingItem: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  trainingCheck: {
    color: SitGuruColors.danger,
    fontSize: 16,
    fontWeight: '900',
    width: 20,
  },
  trainingItemText: {
    color: SitGuruColors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  rewardsPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 13,
    padding: 18,
  },
  rewardsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  rewardsEyebrow: {
    color: SitGuruColors.danger,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  rewardsBadge: {
    backgroundColor: '#FFF1F0',
    borderColor: 'rgba(180, 35, 24, 0.18)',
    borderRadius: 999,
    borderWidth: 1,
    color: SitGuruColors.danger,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  rewardsTitle: {
    color: SitGuruColors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 29,
  },
  rewardsText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  rewardsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  rewardMiniCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    padding: 13,
  },
  rewardMiniValue: {
    color: SitGuruColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  rewardMiniLabel: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  identityPanel: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 26, borderWidth: 1, elevation: 3, flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 14 }, identityCopy: { flex: 1, gap: 3, minWidth: 170 }, identityEyebrow: { color: SitGuruColors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' }, identityName: { color: SitGuruColors.text, fontSize: 18, fontWeight: '900' }, identityText: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '800', lineHeight: 18 }, identityActions: { flexDirection: 'row', gap: 8 }, identityButton: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 999, justifyContent: 'center', minHeight: 42, paddingHorizontal: 13 }, identityButtonSecondary: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderWidth: 1 }, identityButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' }, identityButtonTextSecondary: { color: SitGuruColors.primary },
  notificationsPanel: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: 'rgba(180, 35, 24, 0.20)', borderRadius: 26, borderWidth: 1, elevation: 3, flexDirection: 'row', gap: 12, padding: 16 },
  notificationsIconBadge: { alignItems: 'center', backgroundColor: 'rgba(180, 35, 24, 0.08)', borderRadius: 18, height: 52, justifyContent: 'center', width: 52 },
  notificationsIcon: { fontSize: 24 },
  notificationsCopy: { flex: 1, gap: 3 },
  notificationsEyebrow: { color: SitGuruColors.danger, fontSize: 11, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  notificationsTitle: { color: SitGuruColors.text, fontSize: 17, fontWeight: '900', lineHeight: 22 },
  notificationsText: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  notificationsChevron: { color: SitGuruColors.danger, fontSize: 30, fontWeight: '900' },

});
