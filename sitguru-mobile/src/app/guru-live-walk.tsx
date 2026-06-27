import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruBottomNav from '@/components/SitGuruBottomNav';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type WalkStatus = 'Not started' | 'Walking' | 'Paused' | 'Completed';

type TimelineItem = {
  id: string;
  emoji: string;
  label: string;
  meta: string;
  text: string;
};

const quickUpdates = [
  { label: 'Potty', emoji: '💩' },
  { label: 'Water', emoji: '💧' },
  { label: 'Food', emoji: '🥣' },
  { label: 'Photo', emoji: '📸' },
  { label: 'Note', emoji: '📝' },
];

const startingTimeline: TimelineItem[] = [
  {
    id: 'ready',
    emoji: '⏱️',
    label: 'Ready to start',
    meta: 'Preview',
    text: 'Start the walk when booked care begins.',
  },
  {
    id: 'booking',
    emoji: '🐕',
    label: 'Booking reviewed',
    meta: 'Care prep',
    text: 'Scout’s walk details, notes, and Pet Parent expectations are ready.',
  },
  {
    id: 'safety',
    emoji: '🛡️',
    label: 'Safety reminder',
    meta: 'Required',
    text: 'Only track location during active booked care.',
  },
];

function showPlaceholder(label: string) {
  Alert.alert(
    `${label} placeholder`,
    'This visual foundation is not connected to backend, GPS, camera, or booking data yet.',
  );
}

export default function GuruLiveWalkScreen() {
  const [status, setStatus] = useState<WalkStatus>('Not started');
  const [timelineItems, setTimelineItems] =
    useState<TimelineItem[]>(startingTimeline);

  const primaryActions = useMemo(() => {
    if (status === 'Not started') {
      return [{ label: 'Start Walk', next: 'Walking' as WalkStatus, danger: false }];
    }

    if (status === 'Walking') {
      return [
        { label: 'Pause Walk', next: 'Paused' as WalkStatus, danger: false },
        { label: 'End Walk', next: 'Completed' as WalkStatus, danger: true },
      ];
    }

    if (status === 'Paused') {
      return [
        { label: 'Resume Walk', next: 'Walking' as WalkStatus, danger: false },
        { label: 'End Walk', next: 'Completed' as WalkStatus, danger: true },
      ];
    }

    return [{ label: 'Walk Completed', next: 'Completed' as WalkStatus, danger: false }];
  }, [status]);

  function updateStatus(nextStatus: WalkStatus) {
    if (status === 'Completed') return;

    setStatus(nextStatus);

    const statusText =
      nextStatus === 'Walking'
        ? 'Live walk started.'
        : nextStatus === 'Paused'
          ? 'Live walk paused.'
          : nextStatus === 'Completed'
            ? 'Walk completed. Final PawReport can be sent after review.'
            : 'Walk status updated.';

    setTimelineItems((current) => [
      {
        id: `status-${Date.now()}`,
        emoji: nextStatus === 'Completed' ? '✅' : '📍',
        label: nextStatus,
        meta: 'Status',
        text: statusText,
      },
      ...current,
    ]);
  }

  function addQuickUpdate(label: string, emoji: string) {
    const updateText =
      label === 'Potty'
        ? 'Potty update added to the PawReport timeline.'
        : label === 'Water'
          ? 'Water update added to the PawReport timeline.'
          : label === 'Food'
            ? 'Food update added to the PawReport timeline.'
            : label === 'Photo'
              ? 'Photo placeholder added for a future PawReport image.'
              : 'Care note placeholder added to the PawReport timeline.';

    setTimelineItems((current) => [
      {
        id: `${label}-${Date.now()}`,
        emoji,
        label,
        meta: status === 'Not started' ? 'Preview' : 'Now',
        text: updateText,
      },
      ...current,
    ]);

    showPlaceholder(label);
  }

  return (
    <SitGuruScreen scroll center={false} maxWidth={760}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/guru-dashboard')}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>‹ Back</Text>
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Guru tools</Text>
            <Text style={styles.title}>Live Walk Controls</Text>
            <Text style={styles.subtitle}>
              Start, pause, update, and complete active booked care from one
              thumb-friendly PawReport screen.
            </Text>
          </View>
        </View>

        <View style={styles.bookingCard}>
          <Text style={styles.petAvatar}>🐕</Text>
          <View style={styles.cardCopy}>
            <Text style={styles.cardLabel}>Today’s booking</Text>
            <Text style={styles.cardTitle}>Scout • 30-minute walk</Text>
            <Text style={styles.cardText}>
              12:30 PM–1:00 PM • Easy pace, avoid busy streets, offer water after walk.
            </Text>
          </View>
        </View>

        <View style={styles.parentCard}>
          <Text style={styles.parentAvatar}>🐶</Text>
          <View style={styles.cardCopy}>
            <Text style={styles.cardLabel}>Pet Parent</Text>
            <Text style={styles.cardTitle}>Jordan P.</Text>
            <Text style={styles.cardText}>
              Prefers PawReport updates during the walk. Message only through SitGuru.
            </Text>
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Active walk map preview</Text>
            <Text style={styles.mapBadge}>No GPS yet</Text>
          </View>

          <View style={styles.mapCanvas}>
            <View style={styles.mapBlockOne} />
            <View style={styles.mapBlockTwo} />
            <View style={styles.mapPark} />
            <View style={[styles.routeLine, styles.routeOne]} />
            <View style={[styles.routeLine, styles.routeTwo]} />
            <View style={[styles.routeLine, styles.routeThree]} />
            <View style={[styles.routeNode, styles.nodeStart]} />
            <View style={[styles.routeNode, styles.nodeEnd]} />
            <View style={styles.walkerPin}>
              <Text style={styles.walkerPinText}>🐾</Text>
            </View>
            <Text style={styles.mapLabel}>Placeholder route line</Text>
          </View>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Walk status</Text>
          <Text style={styles.statusTitle}>{status}</Text>
          <Text style={styles.statusText}>
            Location tracking should only run during an active booked walk.
          </Text>
        </View>

        <View style={styles.primaryActions}>
          {primaryActions.map((action) => {
            const disabled = status === 'Completed';

            return (
              <Pressable
                accessibilityRole="button"
                disabled={disabled}
                key={action.label}
                onPress={() => updateStatus(action.next)}
                style={({ pressed }) => [
                  styles.mainAction,
                  action.danger && styles.dangerMainAction,
                  disabled && styles.disabledAction,
                  pressed && !disabled && styles.pressedAction,
                ]}
              >
                <Text style={styles.mainActionText}>{action.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick updates</Text>

          <View style={styles.quickGrid}>
            {quickUpdates.map((item) => (
              <Pressable
                accessibilityRole="button"
                key={item.label}
                onPress={() => addQuickUpdate(item.label, item.emoji)}
                style={styles.quickButton}
              >
                <Text style={styles.quickEmoji}>{item.emoji}</Text>
                <Text style={styles.quickButtonText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PawReport update timeline</Text>

          <View style={styles.timelineList}>
            {timelineItems.map((item) => (
              <View key={item.id} style={styles.timelineItem}>
                <Text style={styles.timelineEmoji}>{item.emoji}</Text>

                <View style={styles.timelineCopy}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineTitle}>{item.label}</Text>
                    <Text style={styles.timelineMeta}>{item.meta}</Text>
                  </View>

                  <Text style={styles.timelineText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Care notes preview</Text>
          <Text style={styles.notesText}>
            Scout likes a steady pace and responds well to cheerful check-ins.
            Keep leash short near crosswalks and avoid crowded dog meetups.
          </Text>
        </View>

        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Safety reminder</Text>
          <Text style={styles.safetyText}>
            Only track location during active booked care.
          </Text>
          <Text style={styles.safetyText}>
            End the walk when care is complete.
          </Text>
        </View>

        <View style={styles.actionStack}>
          <PrimaryButton
            label="Message Pet Parent"
            onPress={() => router.push('/conversation')}
          />

          <SecondaryButton
            label="Send Final PawReport"
            onPress={() => showPlaceholder('Final PawReport')}
          />

          <SecondaryButton
            label="Dashboard"
            onPress={() => router.push('/guru-dashboard')}
          />
        </View>

        <SitGuruBottomNav
          items={[
            { icon: 'home', label: 'Home' },
            { icon: 'message', label: 'Message' },
            { icon: 'request', label: 'Updates' },
            { icon: 'booking', label: 'End Walk' },
          ]}
          tone="warning"
        />
      </View>
    </SitGuruScreen>
  );
}

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.primaryButton}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.secondaryButton}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 16,
    paddingBottom: 4,
    paddingVertical: 4,
  },
  header: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 28,
    gap: 14,
    padding: 18,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  headerCopy: {
    gap: 6,
  },
  eyebrow: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
  },
  subtitle: {
    color: '#DDEDE2',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  bookingCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  parentCard: {
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  petAvatar: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 22,
    fontSize: 34,
    overflow: 'hidden',
    padding: 12,
  },
  parentAvatar: {
    backgroundColor: '#FEF3C7',
    borderRadius: 22,
    fontSize: 34,
    overflow: 'hidden',
    padding: 12,
  },
  cardCopy: {
    flex: 1,
    gap: 3,
  },
  cardLabel: {
    color: SitGuruColors.warning,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: SitGuruColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  cardText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  mapCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 30,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  mapHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mapTitle: {
    color: SitGuruColors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  mapBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    color: SitGuruColors.warning,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  mapCanvas: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderRadius: 24,
    borderWidth: 1,
    height: 270,
    overflow: 'hidden',
    position: 'relative',
  },
  mapBlockOne: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    height: 72,
    left: 24,
    position: 'absolute',
    top: 24,
    width: 112,
  },
  mapBlockTwo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    bottom: 28,
    height: 92,
    position: 'absolute',
    right: 28,
    width: 128,
  },
  mapPark: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    height: 116,
    position: 'absolute',
    right: 34,
    top: 34,
    width: 116,
  },
  routeLine: {
    backgroundColor: SitGuruColors.warning,
    borderRadius: 999,
    height: 10,
    position: 'absolute',
  },
  routeOne: {
    left: 48,
    top: 82,
    transform: [{ rotate: '14deg' }],
    width: 120,
  },
  routeTwo: {
    left: 148,
    top: 122,
    transform: [{ rotate: '45deg' }],
    width: 105,
  },
  routeThree: {
    right: 50,
    top: 178,
    transform: [{ rotate: '7deg' }],
    width: 112,
  },
  routeNode: {
    backgroundColor: SitGuruColors.warning,
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 4,
    height: 28,
    position: 'absolute',
    width: 28,
    zIndex: 2,
  },
  nodeStart: {
    left: 34,
    top: 70,
  },
  nodeEnd: {
    right: 38,
    top: 176,
  },
  walkerPin: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: SitGuruColors.warning,
    borderRadius: 999,
    borderWidth: 3,
    height: 54,
    justifyContent: 'center',
    left: '50%',
    position: 'absolute',
    top: 118,
    width: 54,
    zIndex: 3,
  },
  walkerPinText: {
    fontSize: 25,
  },
  mapLabel: {
    bottom: 18,
    color: SitGuruColors.textSoft,
    fontSize: 12,
    fontWeight: '900',
    left: 22,
    position: 'absolute',
  },
  statusCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  statusLabel: {
    color: SitGuruColors.warning,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusTitle: {
    color: SitGuruColors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  statusText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  primaryActions: {
    gap: 10,
  },
  mainAction: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.warning,
    borderRadius: 22,
    justifyContent: 'center',
    minHeight: 68,
    padding: 18,
  },
  dangerMainAction: {
    backgroundColor: SitGuruColors.danger,
  },
  disabledAction: {
    opacity: 0.55,
  },
  pressedAction: {
    opacity: 0.86,
    transform: [{ translateY: 1 }],
  },
  mainActionText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  section: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 26,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  sectionTitle: {
    color: SitGuruColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickButton: {
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: 18,
    borderWidth: 1,
    flexGrow: 1,
    gap: 4,
    justifyContent: 'center',
    minHeight: 64,
    minWidth: 96,
    padding: 12,
  },
  quickEmoji: {
    fontSize: 20,
  },
  quickButtonText: {
    color: SitGuruColors.warning,
    fontSize: 15,
    fontWeight: '900',
  },
  timelineList: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineEmoji: {
    fontSize: 24,
    width: 34,
  },
  timelineCopy: {
    flex: 1,
    gap: 4,
  },
  timelineHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineTitle: {
    color: SitGuruColors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  timelineMeta: {
    color: SitGuruColors.textSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  timelineText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  notesCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  notesTitle: {
    color: SitGuruColors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  notesText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  safetyCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  safetyTitle: {
    color: SitGuruColors.danger,
    fontSize: 14,
    fontWeight: '900',
  },
  safetyText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  actionStack: {
    gap: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 56,
    padding: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    padding: 15,
  },
  secondaryButtonText: {
    color: SitGuruColors.warning,
    fontSize: 15,
    fontWeight: '900',
  },
});