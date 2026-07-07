import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';
import {
  formatGuruLocation,
  formatGuruRate,
  getGuruBookingStatusLabel,
  guruBookingStatusOptions,
  guruDirectory,
  isGuruBookingEligible,
  isGuruPubliclyListed,
  type GuruBookingStatus,
  type GuruRow,
} from '@/constants/gurus';

type StatusTone = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

const statusTones: Record<GuruBookingStatus, StatusTone> = {
  bookable: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    textColor: SitGuruColors.primary,
  },
  requestable: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    textColor: SitGuruColors.warning,
  },
  listed_only: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    textColor: SitGuruColors.textMuted,
  },
  not_listed: {
    backgroundColor: '#FEF3F2',
    borderColor: '#FECDCA',
    textColor: SitGuruColors.danger,
  },
};

export default function AdminDashboardScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const [gurus, setGurus] = useState<GuruRow[]>(guruDirectory);

  const totals = useMemo(
    () => ({
      bookable: gurus.filter((guru) => guru.booking_status === 'bookable').length,
      public: gurus.filter(isGuruPubliclyListed).length,
      requestable: gurus.filter(isGuruBookingEligible).length,
      total: gurus.length,
    }),
    [gurus],
  );

  function updateGuruBookingStatus(guruId: string, booking_status: GuruBookingStatus) {
    setGurus((currentGurus) =>
      currentGurus.map((guru) => (guru.id === guruId ? { ...guru, booking_status } : guru)),
    );
  }

  return (
    <SitGuruScreen scroll center={false} maxWidth={920}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <SitGuruLogo size="small" variant="symbol" />

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/guru-dashboard')}
            style={styles.topLinkButton}>
            <Text style={styles.topLinkText}>Guru Dashboard</Text>
          </Pressable>
        </View>

        <View style={[styles.heroPanel, isWide && styles.heroPanelWide]}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Admin dashboard</Text>
            <Text style={styles.title}>Guru booking status controls.</Text>
            <Text style={styles.subtitle}>
              Change each Guru booking_status while keeping public search and profile CTAs aligned
              with the current Supabase gurus columns.
            </Text>
          </View>

          <View style={styles.summaryGrid}>
            <SummaryStat label="Total Gurus" value={String(totals.total)} />
            <SummaryStat label="Public results" value={String(totals.public)} />
            <SummaryStat label="Requestable" value={String(totals.requestable)} />
            <SummaryStat label="Bookable" value={String(totals.bookable)} />
          </View>
        </View>

        <View style={styles.statusLegend}>
          {guruBookingStatusOptions.map((option) => {
            const tone = statusTones[option.value];

            return (
              <View key={option.value} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: tone.textColor }]} />
                <View style={styles.legendCopy}>
                  <Text style={styles.legendTitle}>{option.label}</Text>
                  <Text style={styles.legendText}>{option.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.guruList}>
          {gurus.map((guru) => (
            <GuruStatusCard
              guru={guru}
              isWide={isWide}
              key={guru.id}
              onChangeStatus={(booking_status) => updateGuruBookingStatus(guru.id, booking_status)}
            />
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </View>
    </SitGuruScreen>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function GuruStatusCard({
  guru,
  isWide,
  onChangeStatus,
}: {
  guru: GuruRow;
  isWide: boolean;
  onChangeStatus: (booking_status: GuruBookingStatus) => void;
}) {
  const statusTone = statusTones[guru.booking_status];
  const bookingEligible = isGuruBookingEligible(guru);
  const publicListed = isGuruPubliclyListed(guru);

  return (
    <View style={styles.guruCard}>
      <View style={[styles.guruHeader, isWide && styles.guruHeaderWide]}>
        <View style={styles.guruIdentity}>
          <View style={styles.guruAvatar}>
            <Text style={styles.guruAvatarText}>
              {guru.name
                .split(' ')
                .slice(0, 2)
                .map((part) => part.charAt(0))
                .join('')
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.guruNameBlock}>
            <Text style={styles.guruName}>{guru.name}</Text>
            <Text style={styles.guruRole}>{guru.role}</Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusTone.backgroundColor,
              borderColor: statusTone.borderColor,
            },
          ]}>
          <Text style={[styles.statusBadgeText, { color: statusTone.textColor }]}>
            {getGuruBookingStatusLabel(guru.booking_status)}
          </Text>
        </View>
      </View>

      <View style={[styles.detailGrid, isWide && styles.detailGridWide]}>
        <Detail label="profile_completed" value={guru.profile_completed ? 'true' : 'false'} />
        <Detail label="is_active" value={guru.is_active ? 'true' : 'false'} />
        <Detail label="rate" value={formatGuruRate(guru)} />
        <Detail label="service_area_enabled" value={guru.service_area_enabled ? 'true' : 'false'} />
        <Detail label="service_city" value={guru.service_city} />
        <Detail label="service_state" value={guru.service_state} />
        <Detail label="service_zip" value={guru.service_zip} />
        <Detail label="service_area" value={formatGuruLocation(guru)} wide />
      </View>

      <View style={styles.readinessRow}>
        <Text style={styles.readinessText}>
          {bookingEligible ? 'Booking eligible' : 'Not booking eligible'}
        </Text>
        <Text style={styles.readinessText}>
          {publicListed ? 'Visible publicly' : 'Hidden from public results'}
        </Text>
      </View>

      <View style={styles.controlGroup}>
        <Text style={styles.controlLabel}>booking_status</Text>
        <View style={styles.statusControl}>
          {guruBookingStatusOptions.map((option) => {
            const selected = guru.booking_status === option.value;
            const tone = statusTones[option.value];

            return (
              <Pressable
                accessibilityRole="button"
                key={option.value}
                onPress={() => onChangeStatus(option.value)}
                style={[
                  styles.statusButton,
                  selected && {
                    backgroundColor: tone.backgroundColor,
                    borderColor: tone.borderColor,
                  },
                ]}>
                <Text style={[styles.statusButtonText, selected && { color: tone.textColor }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.detailCard, wide && styles.detailCardWide]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 16,
    paddingBottom: 14,
    paddingVertical: 4,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topLinkButton: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  topLinkText: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heroPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 16,
    padding: 18,
  },
  heroPanelWide: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  heroCopy: {
    flex: 1,
    gap: 8,
  },
  heroEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  title: {
    color: SitGuruColors.text,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 37,
  },
  subtitle: {
    color: SitGuruColors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  summaryGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    minWidth: 120,
    padding: 13,
  },
  summaryValue: {
    color: SitGuruColors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  summaryLabel: {
    color: SitGuruColors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusLegend: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 26,
    gap: 12,
    padding: 16,
  },
  legendItem: {
    flexDirection: 'row',
    gap: 10,
  },
  legendDot: {
    borderRadius: 999,
    height: 10,
    marginTop: 5,
    width: 10,
  },
  legendCopy: {
    flex: 1,
    gap: 2,
  },
  legendTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  legendText: {
    color: '#DCEFE2',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  guruList: {
    gap: 12,
  },
  guruCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 2,
    gap: 13,
    padding: 14,
  },
  guruHeader: {
    gap: 10,
  },
  guruHeaderWide: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  guruIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 10,
  },
  guruAvatar: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  guruAvatarText: {
    color: SitGuruColors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  guruNameBlock: {
    flex: 1,
    gap: 2,
  },
  guruName: {
    color: SitGuruColors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  guruRole: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailGrid: {
    gap: 8,
  },
  detailGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    minWidth: 150,
    padding: 10,
  },
  detailCardWide: {
    minWidth: 300,
  },
  detailLabel: {
    color: SitGuruColors.primary,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  readinessRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  readinessText: {
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
  controlGroup: {
    gap: 8,
  },
  controlLabel: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  statusControl: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  statusButtonText: {
    color: SitGuruColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  bottomSpacer: {
    height: 24,
  },
});