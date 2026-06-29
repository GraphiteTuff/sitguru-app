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

export default function PetParentDashboardScreen() {
  const { isAuthenticated, user, profile, roles } = useAuth();
  const profileName = profile?.full_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'SitGuru member';
  const loadedRoleText = roles.includes('pet_parent') ? 'Dashboard access active' : 'Dashboard access ready';

  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <RoleGate requiredRole="pet_parent">
        <View style={styles.page}>
        <SitGuruDashboardHeader
          actionHref="/role-selection"
          actionLabel="Switch"
          icon="care"
          roleLabel="Pet Parent"
          statusText="Pet Parent dashboard"
          subtitle="Find local Gurus, message before booking, organize pet details, and request trusted care."
          title="Book trusted care faster"
          tone="primary"
        />

        {isAuthenticated ? (
          <SitGuruRoleIdentityCard
            avatarUrl={profile?.avatar_url}
            email={user?.email ?? profile?.email}
            onPrimaryAction={() => router.push('/account')}
            onSecondaryAction={() => router.push('/role-selection')}
            primaryActionLabel="Account"
            profileName={profileName}
            roleLabel="Pet Parent"
            secondaryActionLabel="Switch role"
            statusLabel={loadedRoleText}
            subtitle="Manage today’s SitGuru activity from a profile built for trust."
            title="Your Pet Parent dashboard"
            tone="petParent"
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
            <Text style={styles.accountTitle}>Booking, messaging, PawReport, payment, and safety help</Text>
          </View>
          <Text style={styles.accountChevron}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/payments')}
          style={styles.accountPanel}
        >
          <View style={styles.accountIconBadge}>
            <Text style={styles.accountIcon}>💳</Text>
          </View>
          <View style={styles.accountCopy}>
            <Text style={styles.accountEyebrow}>Payments / Credits</Text>
            <Text style={styles.accountTitle}>Review booking payment status, ways to pay, PawPerks credits, referral credits, and promo codes</Text>
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
            <Text style={styles.notificationsEyebrow}>Notifications</Text>
            <Text style={styles.notificationsTitle}>Booking alerts, messages, and PawReport Live updates</Text>
            <Text style={styles.notificationsText}>Open your alert center to review care reminders and account notices.</Text>
          </View>
          <Text style={styles.notificationsChevron}>›</Text>
        </Pressable>

        <View style={styles.photoReadyPanel}>
          <View style={styles.photoSlot}>
            <Text style={styles.photoIcon}>🐶</Text>
            <Text style={styles.photoTitle}>Pet Parent photo area</Text>
            <Text style={styles.photoText}>
              Add a real Pet Parent, pet, or home-care lifestyle photo here.
            </Text>
          </View>

          <View style={styles.photoFloatingCard}>
            <Text style={styles.photoFloatingTitle}>Care starts here</Text>
            <Text style={styles.photoFloatingText}>
              Search, message, request, and keep pet care organized.
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <SitGuruStatCard
            detail="Unread conversations"
            label="Messages"
            tone="primary"
            value="0"
          />

          <SitGuruStatCard
            detail="Pending or upcoming"
            label="Requests"
            value="0"
          />

          <SitGuruStatCard
            detail="Pet Passports"
            label="Pets"
            tone="primary"
            value="0"
            wide
          />
        </View>

        <View style={styles.actionPanel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Find care</Text>
            <Text style={styles.sectionMeta}>Start here</Text>
          </View>

          <View style={styles.actionGrid}>
            <SitGuruActionCard
              ctaLabel="Browse"
              description="Search local Gurus by service, location, and care fit."
              href="/find-care"
              icon="search"
              meta="Find"
              title="Browse Gurus"
              tone="primary"
            />

            <SitGuruActionCard
              ctaLabel="Message"
              description="Ask a question before sending a care request."
              href="/conversation"
              icon="message"
              meta="Chat"
              title="Message first"
            />

            <SitGuruActionCard
              ctaLabel="Request"
              description="Send pet details, dates, notes, and expectations in one place."
              href="/request-booking"
              icon="booking"
              meta="Booking"
              title="Request care"
              tone="primary"
            />

            <SitGuruActionCard
              ctaLabel="Track"
              description="View booking status, visit timing, care notes, and updates."
              href="/booking-details"
              icon="checklist"
              meta="Updates"
              title="Follow care"
              tone="primary"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pet Passports</Text>
            <Text style={styles.sectionMeta}>Profile</Text>
          </View>

          <View style={styles.cardStack}>
            <SitGuruCard
              description="Add feeding, walk routines, medication, personality notes, and comfort details."
              icon="profile"
              size="compact"
              title="Complete pet profiles"
              tone="primary"
            />

            <SitGuruCard
              description="Keep care instructions easy for Gurus to review before every visit."
              icon="checklist"
              size="compact"
              title="Care handoff checklist"
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/pet-passports')}
            style={styles.petPassportButton}
          >
            <Text style={styles.petPassportButtonText}>Manage Pet Passports</Text>
          </Pressable>
        </View>

        <View style={styles.livePawReportPanel}>
          <View style={styles.livePawReportHeader}>
            <View style={styles.livePawReportIconBadge}>
              <Text style={styles.livePawReportIcon}>🐾</Text>
            </View>

            <View style={styles.livePawReportHeaderCopy}>
              <Text style={styles.livePawReportEyebrow}>Active walk</Text>
              <Text style={styles.livePawReportTitle}>PawReport Live</Text>
            </View>
          </View>

          <Text style={styles.livePawReportText}>
            Track active walks, visit updates, photos, potty notes, and care progress.
          </Text>

          <View style={styles.livePawReportStatusCard}>
            <Text style={styles.livePawReportStatusLabel}>Preview status</Text>
            <Text style={styles.livePawReportStatusText}>Scout’s walk is in progress</Text>
          </View>

          <View style={styles.livePawReportStatsGrid}>
            <View style={styles.livePawReportStatCard}>
              <Text style={styles.livePawReportStatValue}>18 min</Text>
              <Text style={styles.livePawReportStatLabel}>Elapsed</Text>
            </View>

            <View style={styles.livePawReportStatCard}>
              <Text style={styles.livePawReportStatValue}>0.8 mi</Text>
              <Text style={styles.livePawReportStatLabel}>Distance</Text>
            </View>

            <View style={styles.livePawReportStatCard}>
              <Text style={styles.livePawReportStatValue}>12 min</Text>
              <Text style={styles.livePawReportStatLabel}>ETA</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/pawreport-live')}
            style={styles.livePawReportButton}
          >
            <Text style={styles.livePawReportButtonText}>View Live PawReport</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/booking-details')}
            style={styles.livePawReportButton}
          >
            <Text style={styles.livePawReportButtonText}>View Booking Details</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/reviews')}
            style={styles.livePawReportButton}
          >
            <Text style={styles.livePawReportButtonText}>Review Completed Care</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming bookings</Text>
            <Text style={styles.sectionMeta}>Care</Text>
          </View>

          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>No active booking requests yet</Text>
            <Text style={styles.emptyText}>
              Once you request care, accepted bookings will show your Guru,
              pet details, visit timing, messages, and PawReport™ updates here.
            </Text>
          </View>
        </View>

        <View style={styles.pawReportPanel}>
          <View style={styles.pawReportPhotoSlot}>
            <Text style={styles.pawReportPhotoIcon}>🐾</Text>
            <Text style={styles.pawReportPhotoText}>Visit photo area</Text>
          </View>

          <View style={styles.pawReportCopy}>
            <Text style={styles.pawReportEyebrow}>PawReport™</Text>
            <Text style={styles.pawReportTitle}>
              Stay connected with every visit.
            </Text>
            <Text style={styles.pawReportText}>
              See photos, potty updates, food and water confirmations, care
              notes, visit timing, and a complete summary from your Guru.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PawPerks</Text>
            <Text style={styles.sectionMeta}>Rewards</Text>
          </View>

          <View style={styles.progressPanel}>
            <View style={styles.progressRow}>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={styles.progressText}>Create your account</Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.checkIcon}>•</Text>
              <Text style={styles.progressText}>Add your first Pet Passport</Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.checkIcon}>•</Text>
              <Text style={styles.progressText}>Send your first care request</Text>
            </View>
          </View>
        </View>

        <SitGuruCard
          description="SitGuru is designed around trusted profiles, better handoffs, clear messages, and fewer stressful surprises."
          icon="trust"
          size="compact"
          title="Trusted care, simplified"
          tone="primary"
        />

        <SitGuruBottomNav
          items={[
            { icon: 'home', label: 'Home' },
            { icon: 'message', label: 'Messages' },
            { icon: 'booking', label: 'Requests' },
            { icon: 'profile', label: 'Pets' },
          ]}
          tone="primary"
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
    borderColor: SitGuruColors.primaryLight,
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
    maxWidth: 260,
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
  actionPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 26,
    borderWidth: 1,
    elevation: 2,
    gap: 14,
    padding: 18,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: SitGuruColors.text,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  sectionMeta: {
    color: SitGuruColors.primary,
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
  petPassportButton: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 18, minHeight: 54, justifyContent: 'center', marginTop: 10, paddingHorizontal: 16, paddingVertical: 14 },
  petPassportButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  emptyPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 7,
    padding: 16,
  },
  emptyTitle: {
    color: SitGuruColors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  emptyText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  pawReportPanel: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 30,
    gap: 14,
    padding: 18,
  },
  pawReportPhotoSlot: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    justifyContent: 'center',
    minHeight: 190,
    padding: 20,
  },
  pawReportPhotoIcon: {
    fontSize: 42,
  },
  pawReportPhotoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  pawReportCopy: {
    gap: 9,
  },
  pawReportEyebrow: {
    color: '#C9F26D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  pawReportTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  pawReportText: {
    color: '#DCEFE2',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  livePawReportPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 14,
    padding: 18,
  },
  livePawReportHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  livePawReportIconBadge: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 18,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  livePawReportIcon: {
    fontSize: 26,
  },
  livePawReportHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  livePawReportEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  livePawReportTitle: {
    color: SitGuruColors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 31,
  },
  livePawReportText: {
    color: SitGuruColors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  livePawReportStatusCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  livePawReportStatusLabel: {
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  livePawReportStatusText: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
  },
  livePawReportStatsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  livePawReportStatCard: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    padding: 12,
  },
  livePawReportStatValue: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  livePawReportStatLabel: {
    color: SitGuruColors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  livePawReportButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  livePawReportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  progressPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
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
    color: SitGuruColors.primary,
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
  identityPanel: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 26, borderWidth: 1, elevation: 3, flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 14 }, identityCopy: { flex: 1, gap: 3, minWidth: 170 }, identityEyebrow: { color: SitGuruColors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' }, identityName: { color: SitGuruColors.text, fontSize: 18, fontWeight: '900' }, identityText: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '800', lineHeight: 18 }, identityActions: { flexDirection: 'row', gap: 8 }, identityButton: { alignItems: 'center', backgroundColor: SitGuruColors.primary, borderRadius: 999, justifyContent: 'center', minHeight: 42, paddingHorizontal: 13 }, identityButtonSecondary: { backgroundColor: SitGuruColors.surfaceSoft, borderColor: SitGuruColors.primaryLight, borderWidth: 1 }, identityButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' }, identityButtonTextSecondary: { color: SitGuruColors.primary },
  notificationsPanel: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 26, borderWidth: 1, elevation: 3, flexDirection: 'row', gap: 12, padding: 16 },
  notificationsIconBadge: { alignItems: 'center', backgroundColor: SitGuruColors.surfaceSoft, borderRadius: 18, height: 52, justifyContent: 'center', width: 52 },
  notificationsIcon: { fontSize: 24 },
  notificationsCopy: { flex: 1, gap: 3 },
  notificationsEyebrow: { color: SitGuruColors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  notificationsTitle: { color: SitGuruColors.text, fontSize: 17, fontWeight: '900', lineHeight: 22 },
  notificationsText: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  notificationsChevron: { color: SitGuruColors.primary, fontSize: 30, fontWeight: '900' },

});
