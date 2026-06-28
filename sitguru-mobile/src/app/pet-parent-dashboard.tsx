import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruActionCard from '@/components/SitGuruActionCard';
import SitGuruBottomNav from '@/components/SitGuruBottomNav';
import SitGuruCard from '@/components/SitGuruCard';
import SitGuruDashboardHeader from '@/components/SitGuruDashboardHeader';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruStatCard from '@/components/SitGuruStatCard';
import { SitGuruColors } from '@/constants/colors';

export default function PetParentDashboardScreen() {
  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
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
              icon="search"
              meta="Find"
              title="Browse Gurus"
              tone="primary"
            />

            <SitGuruActionCard
              ctaLabel="Message"
              description="Ask a question before sending a care request."
              icon="message"
              meta="Chat"
              title="Message first"
            />

            <SitGuruActionCard
              ctaLabel="Request"
              description="Send pet details, dates, notes, and expectations in one place."
              icon="booking"
              meta="Booking"
              title="Request care"
              tone="primary"
            />

            <SitGuruActionCard
              ctaLabel="Track"
              description="View booking status, visit timing, care notes, and updates."
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
});