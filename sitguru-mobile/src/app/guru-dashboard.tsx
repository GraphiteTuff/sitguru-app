import { StyleSheet, Text, View } from 'react-native';

import SitGuruActionCard from '@/components/SitGuruActionCard';
import SitGuruBottomNav from '@/components/SitGuruBottomNav';
import SitGuruCard from '@/components/SitGuruCard';
import SitGuruDashboardHeader from '@/components/SitGuruDashboardHeader';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruStatCard from '@/components/SitGuruStatCard';
import { SitGuruColors } from '@/constants/colors';

export default function GuruDashboardScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <SitGuruDashboardHeader
          actionHref="/role-selection"
          actionLabel="Switch"
          icon="service"
          roleLabel="Pet Guru"
          statusText="Guru dashboard"
          subtitle="Manage your profile, service area, requests, messages, visits, earnings, and payout readiness."
          title="Run your Guru business"
          tone="warning"
        />

        <View style={styles.photoReadyPanel}>
          <View style={styles.photoSlot}>
            <Text style={styles.photoIcon}>🏡</Text>
            <Text style={styles.photoTitle}>Guru photo area</Text>
            <Text style={styles.photoText}>
              Add a real Guru profile, pet care, walking, boarding, or visit photo here.
            </Text>
          </View>

          <View style={styles.photoFloatingCard}>
            <Text style={styles.photoFloatingTitle}>Profile visibility</Text>
            <Text style={styles.photoFloatingText}>
              Complete your profile, location, service area, and services to appear in search.
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <SitGuruStatCard
            detail="Pet Parent conversations"
            label="Messages"
            tone="warning"
            value="0"
          />

          <SitGuruStatCard
            detail="Pending care requests"
            label="Requests"
            tone="warning"
            value="0"
          />

          <SitGuruStatCard
            detail="Profile setup progress"
            label="Readiness"
            value="0%"
            wide
          />
        </View>

        <View style={styles.businessPanel}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, styles.darkSectionTitle]}>
              Priority actions
            </Text>
            <Text style={styles.sectionMeta}>Start here</Text>
          </View>

          <View style={styles.actionGrid}>
            <SitGuruActionCard
              ctaLabel="Update"
              description="Add your profile photo, display name, bio, services, and trust details."
              icon="profile"
              meta="Profile"
              title="Complete profile"
              tone="dark"
            />

            <SitGuruActionCard
              ctaLabel="Set area"
              description="Add city, state, ZIP code, service area, and service ZIP codes."
              icon="availability"
              meta="Location"
              title="Service area"
              tone="dark"
            />

            <SitGuruActionCard
              ctaLabel="Reply"
              description="Answer Pet Parent questions and keep care requests moving."
              icon="message"
              meta="Messages"
              title="Reply quickly"
              tone="dark"
            />

            <SitGuruActionCard
              ctaLabel="Review"
              description="Review pets, dates, routines, notes, and expectations before accepting."
              icon="request"
              meta="Requests"
              title="Review requests"
              tone="dark"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Guru setup</Text>
            <Text style={styles.sectionMetaLight}>Visibility</Text>
          </View>

          <View style={styles.progressPanel}>
            <View style={styles.progressRow}>
              <Text style={styles.checkIcon}>•</Text>
              <Text style={styles.progressText}>Complete your public profile</Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.checkIcon}>•</Text>
              <Text style={styles.progressText}>Set your service area</Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.checkIcon}>•</Text>
              <Text style={styles.progressText}>Add services and pricing</Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.checkIcon}>•</Text>
              <Text style={styles.progressText}>Complete Trust & Safety readiness</Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.checkIcon}>•</Text>
              <Text style={styles.progressText}>Complete Guru onboarding</Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.checkIcon}>•</Text>
              <Text style={styles.progressText}>Prepare payout setup</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Availability and visits</Text>
            <Text style={styles.sectionMetaLight}>Care</Text>
          </View>

          <View style={styles.actionGrid}>
            <SitGuruActionCard
              ctaLabel="Open"
              description="Show when you can take walks, drop-ins, house sitting, boarding, or repeat care."
              icon="availability"
              meta="Schedule"
              title="Availability"
              tone="warning"
            />

            <SitGuruActionCard
              ctaLabel="Prep"
              description="Confirmed visits will show timing, pet notes, routines, and Pet Parent expectations."
              icon="visit"
              meta="Visits"
              title="Visit prep"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Requests and bookings</Text>
            <Text style={styles.sectionMetaLight}>Work</Text>
          </View>

          <View style={styles.cardStack}>
            <SitGuruCard
              description="Care requests collect dates, pets, routines, service details, and Pet Parent expectations."
              icon="request"
              size="compact"
              title="New requests"
              tone="warning"
            />

            <SitGuruCard
              description="Accepted bookings will show visit timing, care notes, messages, and PawReport™ details."
              icon="visit"
              size="compact"
              title="Confirmed visits"
            />
          </View>
        </View>

        <View style={styles.earningsPanel}>
          <View style={styles.earningsHeader}>
            <Text style={styles.earningsEyebrow}>Earnings</Text>
            <Text style={styles.earningsBadge}>Coming soon</Text>
          </View>

          <Text style={styles.earningsTitle}>Track completed care and payouts.</Text>

          <Text style={styles.earningsText}>
            Once bookings are completed, this area will show earnings, pending payouts,
            paid payouts, fees, and booking-by-booking payout details.
          </Text>

          <View style={styles.earningsGrid}>
            <View style={styles.earningsMiniCard}>
              <Text style={styles.earningsMiniValue}>$0</Text>
              <Text style={styles.earningsMiniLabel}>This month</Text>
            </View>

            <View style={styles.earningsMiniCard}>
              <Text style={styles.earningsMiniValue}>$0</Text>
              <Text style={styles.earningsMiniLabel}>Pending</Text>
            </View>

            <View style={styles.earningsMiniCard}>
              <Text style={styles.earningsMiniValue}>$0</Text>
              <Text style={styles.earningsMiniLabel}>Paid out</Text>
            </View>
          </View>
        </View>

        <SitGuruCard
          description="Pet Parents look for clear profiles, real photos, thoughtful care notes, fast replies, and reliable communication."
          icon="trust"
          size="compact"
          title="Trust signals"
          tone="warning"
        />

        <SitGuruBottomNav
          items={[
            { icon: 'home', label: 'Home' },
            { icon: 'message', label: 'Messages' },
            { icon: 'request', label: 'Requests' },
            { icon: 'payout', label: 'Earnings' },
          ]}
          tone="warning"
        />
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 16,
    paddingBottom: 4,
    paddingVertical: 4,
  },
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
    maxWidth: 270,
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
  businessPanel: {
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
    color: '#F8DEC8',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionMetaLight: {
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
  cardStack: {
    gap: 10,
  },
  earningsPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 13,
    padding: 18,
  },
  earningsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  earningsEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  earningsBadge: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  earningsTitle: {
    color: SitGuruColors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 29,
  },
  earningsText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  earningsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  earningsMiniCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    padding: 13,
  },
  earningsMiniValue: {
    color: SitGuruColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  earningsMiniLabel: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});