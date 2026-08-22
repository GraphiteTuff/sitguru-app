import { router } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Gift,
  Link2,
  Share2,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import RoleGate from '@/components/RoleGate';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruTabBar from '@/components/SitGuruTabBar';
import { AppFonts } from '@/constants/fonts';
import { TOUCH_MIN } from '@/constants/mobile-layout';
import {
  PAWPERKS_POINTS_PER_DOLLAR,
  usePawPerks,
  type PawPerkLedgerEntry,
  type PawPerksReferralActivity,
} from '@/hooks/data';
import { useThemeMode } from '@/hooks/use-theme';

const BRAND_GREEN = '#0D5C3A';

export default function PawPerksScreen() {
  const isDark = useThemeMode() === 'dark';
  const isWebPreview = Platform.OS === 'web';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const {
    vault,
    vaultError,
    ledger,
    referral,
    referralError,
    referralActivity,
    badge,
    loading,
    refreshing,
    refresh,
  } = usePawPerks();

  const hasAnySection =
    Boolean(vault) ||
    Boolean(referral) ||
    ledger !== null ||
    referralActivity !== null;

  async function copyValue(value: string, label: string) {
    try {
      const clipboard = (
        globalThis as unknown as {
          navigator?: {
            clipboard?: {
              writeText: (text: string) => Promise<void>;
            };
          };
        }
      ).navigator?.clipboard;

      if (Platform.OS === 'web' && clipboard) {
        await clipboard.writeText(value);
        Alert.alert('Copied', `${label} copied to your clipboard.`);
        return;
      }

      await Share.share({ message: value });
    } catch {
      Alert.alert(
        'Unable to share',
        'SitGuru could not open the sharing options on this device.',
      );
    }
  }

  async function shareReferral() {
    if (!referral) return;

    try {
      await Share.share({
        title: 'Join me on SitGuru',
        message: `Join SitGuru with my PawPerks code ${referral.referralCode}: ${referral.referralLink}`,
        url: referral.referralLink,
      });
    } catch {
      Alert.alert(
        'Unable to share',
        'SitGuru could not open the sharing options on this device.',
      );
    }
  }

  return (
    <SitGuruScreen center={isWebPreview} maxWidth={620}>
      <RoleGate requiredRole="pet_parent">
        <View
          style={[
            styles.previewCanvas,
            !isWebPreview && styles.previewCanvasNative,
          ]}
        >
          <View
            style={[
              styles.deviceFrame,
              !isWebPreview && styles.deviceFrameNative,
            ]}
          >
            <View
              style={[
                styles.phoneShell,
                !isWebPreview && styles.phoneShellNative,
              ]}
            >
              <View style={styles.screen}>
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={() => void refresh()}
                      tintColor={palette.primary}
                      colors={[palette.primary]}
                    />
                  }
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.header}>
                    <BubblePressable
                      accessibilityLabel="Back to Pet Parent Dashboard"
                      accessibilityRole="button"
                      onPress={() => router.push('/pet-parent-dashboard')}
                      scaleTo={0.88}
                      style={styles.headerIconButton}
                    >
                      <ChevronLeft
                        color={palette.title}
                        size={22}
                        strokeWidth={2.4}
                      />
                    </BubblePressable>

                    <View style={styles.headerCopy}>
                      <Text style={styles.title}>PawPerks</Text>
                      <Text style={styles.subtitle}>
                        Earn points, redeem at checkout, and share SitGuru.
                      </Text>
                    </View>
                  </View>

                  {vaultError ? (
                    <View style={styles.notice}>
                      <Text style={styles.noticeText}>{vaultError}</Text>
                    </View>
                  ) : null}

                  {referralError ? (
                    <View style={styles.notice}>
                      <Text style={styles.noticeText}>{referralError}</Text>
                    </View>
                  ) : null}

                  {loading && !hasAnySection ? (
                    <View style={styles.loadingCard}>
                      <View style={styles.loadingLineLarge} />
                      <View style={styles.loadingLineMedium} />
                      <View style={styles.loadingLineSmall} />
                    </View>
                  ) : null}

                  {vault ? (
                    <View style={styles.heroCard}>
                      <View style={styles.heroTop}>
                        <View style={styles.heroIcon}>
                          <Gift color="#FFFFFF" size={24} strokeWidth={2.4} />
                        </View>

                        <View style={styles.heroCopy}>
                          <Text style={styles.heroEyebrow}>YOUR VAULT</Text>
                          <Text style={styles.heroPoints}>
                            {vault.pointsBalance.toLocaleString()} pts
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.heroText}>
                        {vault.hasVaultRow
                          ? `${currency(vault.usdValue)} ready at checkout · ${vault.lifetimeEarned.toLocaleString()} lifetime points.`
                          : `Your vault starts when you earn your first PawPerks. ${PAWPERKS_POINTS_PER_DOLLAR} points = $1.00 at checkout.`}
                      </Text>

                      <View style={styles.heroStats}>
                        <HeroStat
                          label="Balance"
                          value={vault.pointsBalance.toLocaleString()}
                          styles={styles}
                        />
                        <HeroStat
                          label="USD value"
                          value={currency(vault.usdValue)}
                          styles={styles}
                        />
                        <HeroStat
                          label="Lifetime"
                          value={vault.lifetimeEarned.toLocaleString()}
                          styles={styles}
                        />
                      </View>

                      <BubblePressable
                        accessibilityRole="button"
                        onPress={() => router.push('/find-care')}
                        style={styles.heroPrimaryButton}
                      >
                        <Text style={styles.heroPrimaryText}>
                          {vault.pointsBalance > 0
                            ? 'Redeem at checkout'
                            : 'Book care to earn'}
                        </Text>
                        <ChevronRight
                          color={BRAND_GREEN}
                          size={17}
                          strokeWidth={2.3}
                        />
                      </BubblePressable>
                    </View>
                  ) : null}

                  {vault ? (
                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeading}>
                          <Text style={styles.cardEyebrow}>BADGE</Text>
                          <Text style={styles.cardTitle}>
                            {badge.current.emoji} {badge.current.label}
                          </Text>
                        </View>

                        <View style={styles.badgePill}>
                          <Trophy
                            color={palette.primary}
                            size={14}
                            strokeWidth={2.4}
                          />
                          <Text style={styles.badgePillText}>
                            {badge.next
                              ? `${badge.progressPct}%`
                              : 'Max'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.cardBody}>{badge.current.blurb}</Text>

                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${badge.progressPct}%` as `${number}%`,
                            },
                          ]}
                        />
                      </View>

                      <Text style={styles.progressHint}>
                        {badge.next
                          ? `${badge.pointsToNext.toLocaleString()} points to ${badge.next.label}`
                          : 'Legend status unlocked. Keep booking to stay on top.'}
                      </Text>
                    </View>
                  ) : null}

                  {referral ? (
                    <>
                      <View style={styles.heroCard}>
                        <View style={styles.heroTop}>
                          <View style={styles.heroIcon}>
                            <Sparkles
                              color="#FFFFFF"
                              size={22}
                              strokeWidth={2.4}
                            />
                          </View>

                          <View style={styles.heroCopy}>
                            <Text style={styles.heroEyebrow}>
                              YOUR REFERRAL CODE
                            </Text>
                            <Text style={styles.heroCode} selectable>
                              {referral.referralCode}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.heroText}>
                          Invite friends and family. Eligible completed care can
                          earn future SitGuru credits.
                        </Text>

                        <View style={styles.heroActions}>
                          <BubblePressable
                            accessibilityRole="button"
                            onPress={() =>
                              void copyValue(
                                referral.referralCode,
                                'Referral code',
                              )
                            }
                            style={styles.heroSecondaryButton}
                          >
                            <Copy
                              color="#FFFFFF"
                              size={16}
                              strokeWidth={2.3}
                            />
                            <Text style={styles.heroSecondaryText}>
                              Copy Code
                            </Text>
                          </BubblePressable>

                          <BubblePressable
                            accessibilityRole="button"
                            onPress={() => void shareReferral()}
                            style={styles.heroPrimaryButton}
                          >
                            <Share2
                              color={BRAND_GREEN}
                              size={16}
                              strokeWidth={2.3}
                            />
                            <Text style={styles.heroPrimaryText}>
                              Share Link
                            </Text>
                          </BubblePressable>
                        </View>
                      </View>

                      <View style={styles.linkCard}>
                        <View style={styles.linkIcon}>
                          <Link2
                            color={palette.primary}
                            size={19}
                            strokeWidth={2.3}
                          />
                        </View>

                        <View style={styles.linkCopy}>
                          <Text style={styles.linkLabel}>
                            Your referral link
                          </Text>
                          <Text
                            numberOfLines={1}
                            selectable
                            style={styles.linkValue}
                          >
                            {referral.referralLink}
                          </Text>
                        </View>

                        <BubblePressable
                          accessibilityLabel="Copy referral link"
                          accessibilityRole="button"
                          onPress={() =>
                            void copyValue(
                              referral.referralLink,
                              'Referral link',
                            )
                          }
                          scaleTo={0.88}
                          style={styles.copyButton}
                        >
                          <Copy
                            color={palette.primary}
                            size={17}
                            strokeWidth={2.3}
                          />
                        </BubblePressable>
                      </View>

                      <View style={styles.metricGrid}>
                        <MetricCard
                          icon={
                            <Users
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                          }
                          label="Invites"
                          styles={styles}
                          value={String(referral.totalInvites)}
                        />
                        <MetricCard
                          icon={
                            <Gift
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                          }
                          label="Qualified"
                          styles={styles}
                          value={String(referral.completedReferrals)}
                        />
                        <MetricCard
                          icon={
                            <Sparkles
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                          }
                          label="Pending"
                          styles={styles}
                          value={currency(referral.pendingRewards)}
                        />
                        <MetricCard
                          icon={
                            <Trophy
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                          }
                          label="Credit"
                          styles={styles}
                          value={currency(referral.availableCredit)}
                        />
                      </View>
                    </>
                  ) : null}

                  {ledger !== null ? (
                    <View style={styles.activityCard}>
                      <View style={styles.activityHeader}>
                        <Text style={styles.cardEyebrow}>LEDGER</Text>
                        <Text style={styles.cardTitle}>PawPerks history</Text>
                      </View>

                      {ledger.length ? (
                        ledger.map((entry, index) => (
                          <LedgerRow
                            entry={entry}
                            key={entry.id}
                            last={index === ledger.length - 1}
                            styles={styles}
                          />
                        ))
                      ) : (
                        <View style={styles.emptyActivity}>
                          <Text style={styles.emptyActivityTitle}>
                            No ledger entries yet
                          </Text>
                          <Text style={styles.emptyActivityText}>
                            Points from bookings, bonuses, and redemptions will
                            show here once they are recorded.
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : null}

                  {referralActivity !== null ? (
                    <View style={styles.activityCard}>
                      <View style={styles.activityHeader}>
                        <Text style={styles.cardEyebrow}>REFERRALS</Text>
                        <Text style={styles.cardTitle}>Invite activity</Text>
                      </View>

                      {referralActivity.length ? (
                        referralActivity.map((row, index) => (
                          <ReferralRow
                            key={row.id}
                            last={index === referralActivity.length - 1}
                            row={row}
                            styles={styles}
                          />
                        ))
                      ) : (
                        <View style={styles.emptyActivity}>
                          <Text style={styles.emptyActivityTitle}>
                            No referral activity yet
                          </Text>
                          <Text style={styles.emptyActivityText}>
                            Share your code or link to start inviting friends
                            and family.
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : null}

                  {referral ? (
                    <View style={styles.card}>
                      <Text style={styles.cardEyebrow}>SHARE TOOLS</Text>
                      <Text style={styles.cardTitle}>Make inviting easy</Text>

                      <View style={styles.shareToolsGrid}>
                        <ShareTool
                          icon={
                            <Share2
                              color={palette.primary}
                              size={20}
                              strokeWidth={2.3}
                            />
                          }
                          label="Share"
                          onPress={() => void shareReferral()}
                          styles={styles}
                        />
                        <ShareTool
                          icon={
                            <Copy
                              color={palette.primary}
                              size={20}
                              strokeWidth={2.3}
                            />
                          }
                          label="Copy link"
                          onPress={() =>
                            void copyValue(
                              referral.referralLink,
                              'Referral link',
                            )
                          }
                          styles={styles}
                        />
                        <ShareTool
                          icon={
                            <Copy
                              color={palette.primary}
                              size={20}
                              strokeWidth={2.3}
                            />
                          }
                          label="Copy code"
                          onPress={() =>
                            void copyValue(
                              referral.referralCode,
                              'Referral code',
                            )
                          }
                          styles={styles}
                        />
                      </View>
                    </View>
                  ) : null}

                  {!loading && !hasAnySection ? (
                    <View style={styles.emptyActivity}>
                      <Text style={styles.emptyActivityTitle}>
                        PawPerks is unavailable
                      </Text>
                      <Text style={styles.emptyActivityText}>
                        Pull down to refresh. Vault, history, and referral
                        details appear only when SitGuru can read them.
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.card}>
                    <Text style={styles.cardEyebrow}>HOW IT WORKS</Text>
                    <Text style={styles.cardTitle}>Earn and redeem</Text>

                    {[
                      `${PAWPERKS_POINTS_PER_DOLLAR} PawPerks = $1.00 off eligible SitGuru checkout.`,
                      'Book care on SitGuru to earn points into your vault.',
                      'Share your code so friends can join as Pet Parents.',
                      'Credits apply on SitGuru bookings — not cash or off-platform payments.',
                    ].map((rule, index) => (
                      <View key={rule} style={styles.ruleRow}>
                        <View style={styles.ruleNumber}>
                          <Text style={styles.ruleNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.ruleText}>{rule}</Text>
                      </View>
                    ))}

                    <BubblePressable
                      accessibilityRole="button"
                      onPress={() => router.push('/find-care')}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>Find Care</Text>
                      <ChevronRight
                        color={palette.primary}
                        size={17}
                        strokeWidth={2.3}
                      />
                    </BubblePressable>
                  </View>
                </ScrollView>

                <SitGuruTabBar active="profile" role="petParent" />
              </View>
            </View>
          </View>
        </View>
      </RoleGate>
    </SitGuruScreen>
  );
}

function HeroStat({
  label,
  styles,
  value,
}: {
  label: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatLabel}>{label}</Text>
      <Text style={styles.heroStatValue}>{value}</Text>
    </View>
  );
}

function MetricCard({
  icon,
  label,
  styles,
  value,
}: {
  icon: ReactNode;
  label: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>{icon}</View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function LedgerRow({
  entry,
  last,
  styles,
}: {
  entry: PawPerkLedgerEntry;
  last: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  const positive = entry.pointsDelta >= 0;

  return (
    <View style={[styles.activityRow, last && styles.activityRowLast]}>
      <View style={styles.activityAvatar}>
        <Text style={styles.activityAvatarText}>{positive ? '+' : '−'}</Text>
      </View>

      <View style={styles.activityCopy}>
        <Text style={styles.activityName}>{entry.sourceLabel}</Text>
        <Text style={styles.activityMeta}>
          {[entry.memo, shortDate(entry.createdAt)].filter(Boolean).join(' • ')}
        </Text>
      </View>

      <Text
        style={[
          styles.activityRewardValue,
          positive ? styles.deltaPositive : styles.deltaNegative,
        ]}
      >
        {positive ? '+' : ''}
        {entry.pointsDelta.toLocaleString()}
      </Text>
    </View>
  );
}

function ReferralRow({
  last,
  row,
  styles,
}: {
  last: boolean;
  row: PawPerksReferralActivity;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={[styles.activityRow, last && styles.activityRowLast]}>
      <View style={styles.activityAvatar}>
        <Text style={styles.activityAvatarText}>
          {initials(row.label || 'Friend')}
        </Text>
      </View>

      <View style={styles.activityCopy}>
        <Text style={styles.activityName}>{row.label}</Text>
        <Text style={styles.activityMeta}>
          {[row.status, row.referralType, shortDate(row.createdAt)]
            .filter(Boolean)
            .join(' • ')}
        </Text>
      </View>

      <Text style={styles.activityRewardValue}>
        {row.rewardAmount ? currency(row.rewardAmount) : '—'}
      </Text>
    </View>
  );
}

function ShareTool({
  icon,
  label,
  onPress,
  styles,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <BubblePressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.shareTool}
    >
      <View style={styles.shareToolIcon}>{icon}</View>
      <Text style={styles.shareToolLabel}>{label}</Text>
    </BubblePressable>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function shortDate(date: Date | null) {
  if (!date) return 'Recently';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'PP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getPalette(isDark: boolean) {
  return {
    background: isDark ? '#06140F' : '#FFF9F1',
    surface: isDark ? '#0B2118' : '#FFFEFA',
    surfaceSoft: isDark ? '#102D21' : '#FFF6E9',
    border: isDark ? '#234B38' : '#EADDCB',
    title: isDark ? '#FFF5E8' : '#123F31',
    text: isDark ? '#E8EEE9' : '#27483E',
    muted: isDark ? '#9DB0A5' : '#738078',
    primary: isDark ? '#39D982' : '#087449',
    primarySoft: isDark ? '#123E2A' : '#E4F5E9',
    shadow: '#000000',
  };
}

function createStyles(isDark: boolean) {
  const palette = getPalette(isDark);

  return StyleSheet.create({
    previewCanvas: {
      alignItems: 'center',
      minHeight: 930,
      paddingHorizontal: 16,
      paddingVertical: 22,
      width: '100%',
    },
    previewCanvasNative: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    deviceFrame: {
      backgroundColor: '#111713',
      borderColor: '#2E3631',
      borderRadius: 42,
      borderWidth: 2,
      maxWidth: 430,
      overflow: 'hidden',
      paddingBottom: 15,
      paddingHorizontal: 8,
      paddingTop: 10,
      width: '100%',
    },
    deviceFrameNative: {
      backgroundColor: 'transparent',
      borderRadius: 0,
      borderWidth: 0,
      flex: 1,
      maxWidth: '100%',
      paddingBottom: 0,
      paddingHorizontal: 0,
      paddingTop: 0,
    },
    phoneShell: {
      backgroundColor: palette.background,
      borderColor: palette.border,
      borderRadius: 34,
      borderWidth: 1,
      height: 844,
      overflow: 'hidden',
      width: '100%',
    },
    phoneShellNative: {
      borderRadius: 0,
      borderWidth: 0,
      flex: 1,
      height: '100%',
    },
    screen: { backgroundColor: palette.background, flex: 1 },
    scrollContent: {
      gap: 13,
      paddingBottom: 16,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 9,
    },
    headerCopy: { flex: 1 },
    title: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 20,
      letterSpacing: -0.4,
    },
    subtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      marginTop: 2,
    },
    headerIconButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: TOUCH_MIN,
      justifyContent: 'center',
      width: TOUCH_MIN,
    },
    notice: {
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 14,
      borderWidth: 1,
      padding: 12,
    },
    noticeText: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 12,
      lineHeight: 18,
    },
    loadingCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 8,
      padding: 14,
    },
    loadingLineLarge: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 11,
      width: '54%',
    },
    loadingLineMedium: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 8,
      width: '82%',
    },
    loadingLineSmall: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 8,
      width: '38%',
    },
    heroCard: {
      backgroundColor: BRAND_GREEN,
      borderRadius: 22,
      gap: 11,
      padding: 15,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 9 },
      shadowOpacity: isDark ? 0.26 : 0.13,
      shadowRadius: 17,
    },
    heroTop: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    heroIcon: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: 14,
      height: TOUCH_MIN,
      justifyContent: 'center',
      width: TOUCH_MIN,
    },
    heroCopy: { flex: 1, gap: 2 },
    heroEyebrow: {
      color: 'rgba(255,255,255,0.82)',
      fontFamily: AppFonts.bold,
      fontSize: 10,
      letterSpacing: 0.75,
    },
    heroPoints: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 26,
      letterSpacing: -0.4,
    },
    heroCode: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 22,
      letterSpacing: 1,
    },
    heroText: {
      color: 'rgba(255,255,255,0.9)',
      fontFamily: AppFonts.medium,
      fontSize: 13,
      lineHeight: 18,
    },
    heroStats: {
      flexDirection: 'row',
      gap: 8,
    },
    heroStat: {
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 14,
      flex: 1,
      gap: 2,
      paddingHorizontal: 8,
      paddingVertical: 10,
    },
    heroStatLabel: {
      color: 'rgba(255,255,255,0.78)',
      fontFamily: AppFonts.bold,
      fontSize: 9,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    heroStatValue: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    heroActions: { flexDirection: 'row', gap: 8 },
    heroSecondaryButton: {
      alignItems: 'center',
      borderColor: 'rgba(255,255,255,0.55)',
      borderRadius: 999,
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: TOUCH_MIN,
    },
    heroSecondaryText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    heroPrimaryButton: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 999,
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: TOUCH_MIN,
      paddingHorizontal: 12,
    },
    heroPrimaryText: {
      color: BRAND_GREEN,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    linkCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 9,
      padding: 11,
    },
    linkIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 11,
      height: TOUCH_MIN,
      justifyContent: 'center',
      width: TOUCH_MIN,
    },
    linkCopy: { flex: 1, gap: 2 },
    linkLabel: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 13,
    },
    linkValue: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
    },
    copyButton: {
      alignItems: 'center',
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: TOUCH_MIN,
      justifyContent: 'center',
      width: TOUCH_MIN,
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    metricCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 17,
      borderWidth: 1,
      flexBasis: '47%',
      flexGrow: 1,
      gap: 3,
      minHeight: 92,
      padding: 11,
    },
    metricIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 10,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    metricValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
      marginTop: 4,
    },
    metricLabel: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 12,
    },
    card: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      padding: 13,
    },
    cardHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    cardHeading: { flex: 1 },
    cardEyebrow: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 10,
      letterSpacing: 0.75,
    },
    cardTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 16,
      marginTop: 2,
    },
    cardBody: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 13,
      lineHeight: 18,
    },
    badgePill: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 12,
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    badgePillText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    progressTrack: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 8,
      overflow: 'hidden',
    },
    progressFill: {
      backgroundColor: BRAND_GREEN,
      borderRadius: 999,
      height: '100%',
    },
    progressHint: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 12,
    },
    activityCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
      paddingTop: 13,
    },
    activityHeader: {
      paddingHorizontal: 13,
      paddingBottom: 4,
    },
    activityRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 9,
      paddingHorizontal: 13,
      paddingVertical: 12,
    },
    activityRowLast: { borderBottomWidth: 0 },
    activityAvatar: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: TOUCH_MIN,
      justifyContent: 'center',
      width: TOUCH_MIN,
    },
    activityAvatarText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    activityCopy: { flex: 1, gap: 2 },
    activityName: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 14,
    },
    activityMeta: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 12,
    },
    activityRewardValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    deltaPositive: {
      color: palette.primary,
    },
    deltaNegative: {
      color: '#D94A4A',
    },
    emptyActivity: {
      gap: 4,
      paddingHorizontal: 13,
      paddingVertical: 22,
    },
    emptyActivityTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
      textAlign: 'center',
    },
    emptyActivityText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 12,
      lineHeight: 17,
      textAlign: 'center',
    },
    shareToolsGrid: { flexDirection: 'row', gap: 8 },
    shareTool: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 14,
      flex: 1,
      gap: 6,
      justifyContent: 'center',
      minHeight: 84,
      padding: 8,
    },
    shareToolIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: TOUCH_MIN,
      justifyContent: 'center',
      width: TOUCH_MIN,
    },
    shareToolLabel: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 12,
    },
    ruleRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 8,
    },
    ruleNumber: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 22,
      justifyContent: 'center',
      width: 22,
    },
    ruleNumberText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    ruleText: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 13,
      lineHeight: 18,
    },
    secondaryButton: {
      alignItems: 'center',
      borderColor: palette.primary,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: TOUCH_MIN,
      paddingHorizontal: 13,
    },
    secondaryButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
  });
}
