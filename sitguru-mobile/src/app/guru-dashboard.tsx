import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruActionCard from '@/components/SitGuruActionCard';
import SitGuruBottomNav from '@/components/SitGuruBottomNav';
import SitGuruCard from '@/components/SitGuruCard';
import SitGuruDashboardHeader from '@/components/SitGuruDashboardHeader';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruStatCard from '@/components/SitGuruStatCard';
import { SitGuruColors } from '@/constants/colors';

const adminDashboardHref = '/admin-dashboard' as Href;

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
          subtitle="Manage your profile, service area, requests, messages, visits, pricing, earnings, and payout readiness."
          title="Run your Guru business"
          tone="warning"
        />

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
          onPress={() => router.push('/notifications')}
          style={styles.notificationsPanel}
        >
          <View style={styles.notificationsIconBadge}>
            <Text style={styles.notificationsIcon}>🔔</Text>
          </View>
          <View style={styles.notificationsCopy}>
            <Text style={styles.notificationsEyebrow}>Guru alerts</Text>
            <Text style={styles.notificationsTitle}>New care requests, Pet Parent messages, live walk reminders, and pricing/payout reminders</Text>
            <Text style={styles.notificationsText}>Open Notifications to prioritize today’s care updates.</Text>
          </View>
          <Text style={styles.notificationsChevron}>›</Text>
        </Pressable>

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
              Complete your profile, location, service area, services, and pricing to appear in search.
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

          <Pressable accessibilityRole="button" onPress={() => router.push('/guru-requests')} style={styles.statLink}>
            <SitGuruStatCard
              detail="Pending care requests"
              label="Requests"
              tone="warning"
              value="3"
            />
          </Pressable>

          <SitGuruStatCard
            detail="Rates and calendar"
            label="Pricing"
            value="Ready"
            wide
          />
        </View>

        <View style={styles.adminControlPanel}>
          <View style={styles.adminControlHeader}>
            <View>
              <Text style={styles.adminControlEyebrow}>Admin controls</Text>
              <Text style={styles.adminControlTitle}>
                Manage Guru booking status.
              </Text>
            </View>

            <Text style={styles.adminControlBadge}>booking_status</Text>
          </View>

          <Text style={styles.adminControlText}>
            Update each Guru as listed_only, requestable, bookable, or not_listed
            from the admin dashboard.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(adminDashboardHref)}
            style={styles.adminControlButton}
          >
            <Text style={styles.adminControlButtonText}>Open Admin Dashboard</Text>
          </Pressable>
        </View>

        <View style={styles.requestsHeroPanel}>
          <View style={styles.pricingHeroHeader}>
            <View>
              <Text style={styles.pricingEyebrow}>Care Requests</Text>
              <Text style={styles.pricingTitle}>Review requests before accepting care.</Text>
            </View>
            <View style={styles.pricingBadge}>
              <Text style={styles.pricingBadgeText}>Inbox</Text>
            </View>
          </View>
          <Text style={styles.pricingText}>Open your Guru request inbox to review pet notes, Pet Parent expectations, estimated pricing, and next steps.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/guru-requests')} style={styles.primaryPricingButton}>
            <Text style={styles.primaryPricingButtonText}>Open Care Requests</Text>
          </Pressable>
        </View>

        <View style={styles.pricingHeroPanel}>
          <View style={styles.pricingHeroHeader}>
            <View>
              <Text style={styles.pricingEyebrow}>Pricing Calendar</Text>
              <Text style={styles.pricingTitle}>
                Control rates, discounts, and availability.
              </Text>
            </View>

            <View style={styles.pricingBadge}>
              <Text style={styles.pricingBadgeText}>New</Text>
            </View>
          </View>

          <Text style={styles.pricingText}>
            Set service rates, additional-pet fees, multi-pet discounts, long-stay
            savings, custom date pricing, busy days, and booking rules from one
            mobile-friendly pricing flow.
          </Text>

          <View style={styles.pricingMiniGrid}>
            <View style={styles.pricingMiniCard}>
              <Text style={styles.pricingMiniValue}>$25+</Text>
              <Text style={styles.pricingMiniLabel}>service rates</Text>
            </View>

            <View style={styles.pricingMiniCard}>
              <Text style={styles.pricingMiniValue}>10%</Text>
              <Text style={styles.pricingMiniLabel}>multi-pet savings</Text>
            </View>

            <View style={styles.pricingMiniCard}>
              <Text style={styles.pricingMiniValue}>180</Text>
              <Text style={styles.pricingMiniLabel}>days ahead</Text>
            </View>
          </View>

          <View style={styles.pricingActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/guru-pricing')}
              style={styles.primaryPricingButton}
            >
              <Text style={styles.primaryPricingButtonText}>Open Pricing Calendar</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/guru-pricing')}
              style={styles.secondaryPricingButton}
            >
              <Text style={styles.secondaryPricingButtonText}>Review Guru Pricing</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.liveWalkPanel}>
          <View style={styles.liveWalkHeader}>
            <View>
              <Text style={styles.liveWalkEyebrow}>PawReport controls</Text>
              <Text style={styles.liveWalkTitle}>Live Walk Controls</Text>
            </View>

            <Text style={styles.liveWalkBadge}>Ready</Text>
          </View>

          <Text style={styles.liveWalkText}>
            Start walks, add updates, send PawReport notes, and complete visits.
          </Text>

          <View style={styles.liveWalkPreviewCard}>
            <View style={styles.liveWalkPreviewIcon}>
              <Text style={styles.liveWalkPreviewIconText}>🐕</Text>
            </View>

            <View style={styles.liveWalkPreviewCopy}>
              <Text style={styles.liveWalkBooking}>Scout • Dog Walking • Today</Text>
              <Text style={styles.liveWalkStatus}>Ready to start</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/guru-live-walk')}
            style={styles.liveWalkButton}
          >
            <Text style={styles.liveWalkButtonText}>Start Live Walk</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/booking-details')}
            style={styles.liveWalkButton}
          >
            <Text style={styles.liveWalkButtonText}>View Booking Details</Text>
          </Pressable>
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
              ctaLabel="Rates"
              description="Set service rates, multi-pet savings, long-stay discounts, and calendar pricing."
              icon="payment"
              meta="Pricing"
              title="Pricing calendar"
              tone="dark"
            />

            <SitGuruActionCard
              ctaLabel="Review"
              onPress={() => router.push('/guru-requests')}
              description="Review pets, dates, routines, notes, expectations, and estimated pricing before accepting."
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
              <Text style={styles.progressText}>Set pricing calendar and discounts</Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.checkIcon}>•</Text>
              <Text style={styles.progressText}>Complete Trust & Safety readiness</Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.checkIcon}>•</Text>
              <Text style={styles.progressText}>Prepare payout setup</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Availability, pricing, and visits</Text>
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
              ctaLabel="Rates"
              description="Adjust service rates, custom dates, busy days, extra pets, and long-stay savings."
              icon="payment"
              meta="Pricing"
              title="Rates"
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
              description="Care requests collect dates, pets, routines, service details, Pet Parent expectations, and estimated pricing."
              icon="request"
              size="compact"
              title="New requests"
              tone="warning"
            />

            <SitGuruCard
              description="Accepted bookings will show visit timing, care notes, messages, pricing details, and PawReport™ updates."
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
            Once bookings are completed, this area will show earnings, pending
            payouts, paid payouts, fees, and booking-by-booking payout details.
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

        <Pressable accessibilityRole="button" onPress={() => router.push('/reviews')} style={styles.reviewsPanel}>
          <Text style={styles.reviewsEyebrow}>Reviews / Trust Signals</Text>
          <Text style={styles.reviewsTitle}>4.9 rating preview</Text>
          <Text style={styles.reviewsText}>Completed care feedback and trust-building reviews help Pet Parents book confidently.</Text>
          <Text style={styles.reviewsButtonText}>Open Reviews & Ratings</Text>
        </Pressable>

        <SitGuruCard
          description="Pet Parents look for clear profiles, real photos, thoughtful care notes, fast replies, fair pricing, reliable communication, and completed care feedback."
          icon="trust"
          size="compact"
          title="Trust signals"
          tone="warning"
        />

        <SitGuruBottomNav
          items={[
            { icon: 'home', label: 'Home' },
            { icon: 'message', label: 'Messages' },
            { icon: 'payment', label: 'Pricing' },
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
  statLink: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 150,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  adminControlPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 13,
    padding: 18,
  },
  adminControlHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  adminControlEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  adminControlTitle: {
    color: SitGuruColors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 29,
    marginTop: 3,
  },
  adminControlBadge: {
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
  adminControlText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  adminControlButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  adminControlButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  requestsHeroPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 14,
    padding: 18,
  },
  pricingHeroPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 14,
    padding: 18,
  },
  pricingHeroHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  pricingEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  pricingTitle: {
    color: SitGuruColors.text,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.7,
    lineHeight: 32,
    marginTop: 3,
  },
  pricingBadge: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pricingBadgeText: {
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pricingText: {
    color: SitGuruColors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  pricingMiniGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  pricingMiniCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    padding: 13,
  },
  pricingMiniValue: {
    color: SitGuruColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  pricingMiniLabel: {
    color: SitGuruColors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pricingActions: {
    gap: 10,
  },
  primaryPricingButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  primaryPricingButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryPricingButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  secondaryPricingButtonText: {
    color: SitGuruColors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  liveWalkPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 14,
    padding: 18,
  },
  liveWalkHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  liveWalkEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  liveWalkTitle: {
    color: SitGuruColors.text,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.7,
    lineHeight: 32,
    marginTop: 3,
  },
  liveWalkBadge: {
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
  liveWalkText: {
    color: SitGuruColors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  liveWalkPreviewCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  liveWalkPreviewIcon: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 16,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  liveWalkPreviewIconText: {
    fontSize: 24,
  },
  liveWalkPreviewCopy: {
    flex: 1,
    gap: 3,
  },
  liveWalkBooking: {
    color: SitGuruColors.text,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
  },
  liveWalkStatus: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  liveWalkButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  liveWalkButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
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
  notificationsPanel: { alignItems: 'center', backgroundColor: SitGuruColors.surface, borderColor: 'rgba(181, 71, 8, 0.25)', borderRadius: 26, borderWidth: 1, elevation: 3, flexDirection: 'row', gap: 12, padding: 16 },
  notificationsIconBadge: { alignItems: 'center', backgroundColor: 'rgba(181, 71, 8, 0.10)', borderRadius: 18, height: 52, justifyContent: 'center', width: 52 },
  notificationsIcon: { fontSize: 24 },
  notificationsCopy: { flex: 1, gap: 3 },
  notificationsEyebrow: { color: SitGuruColors.warning, fontSize: 11, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  notificationsTitle: { color: SitGuruColors.text, fontSize: 17, fontWeight: '900', lineHeight: 22 },
  notificationsText: { color: SitGuruColors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  notificationsChevron: { color: SitGuruColors.warning, fontSize: 30, fontWeight: '900' },

  reviewsPanel: { backgroundColor: SitGuruColors.surface, borderColor: SitGuruColors.primaryLight, borderRadius: 28, borderWidth: 1, elevation: 3, gap: 8, padding: 18 },
  reviewsEyebrow: { color: SitGuruColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  reviewsTitle: { color: SitGuruColors.text, fontSize: 24, fontWeight: '900' },
  reviewsText: { color: SitGuruColors.textMuted, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  reviewsButtonText: { color: SitGuruColors.primary, fontSize: 15, fontWeight: '900', marginTop: 4 },
});
