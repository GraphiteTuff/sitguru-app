import { StyleSheet, Text, View } from 'react-native';

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