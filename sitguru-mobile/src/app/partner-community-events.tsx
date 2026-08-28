import { router } from "expo-router";
import { ChevronLeft, Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import SitGuruScreen from "@/components/SitGuruScreen";
import { AppFonts } from "@/constants/fonts";
import {
  usePartnerCommunityEvents,
  type PartnerMobileEvent,
} from "@/hooks/data/usePartnerCommunityEvents";

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "drafts", label: "Drafts" },
  { id: "pending", label: "Pending" },
  { id: "published", label: "Published" },
  { id: "past", label: "Past" },
] as const;

function formatWhen(event: PartnerMobileEvent) {
  return new Date(event.start_at).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PartnerCommunityEventsScreen() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("upcoming");
  const { events, partner, loading, error, reload } = usePartnerCommunityEvents(tab);

  const sorted = useMemo(
    () => [...events].sort((a, b) => a.start_at.localeCompare(b.start_at)),
    [events],
  );

  return (
    <SitGuruScreen scroll center={false}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <ChevronLeft color="#0D5C3A" size={22} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.eyebrow}>Partner Community</Text>
      <Text style={styles.title}>
        {partner?.business_name || "Your community events"}
      </Text>
      <Text style={styles.subtitle}>
        Create, edit, and submit events for SitGuru review — same system as the web dashboard.
      </Text>

      <Pressable
        style={styles.createButton}
        onPress={() =>
          router.push({
            pathname: "/partner-community-event-edit",
            params: { mode: "create" },
          })
        }
      >
        <Plus color="#fff" size={18} />
        <Text style={styles.createButtonText}>Create event</Text>
      </Pressable>

      <View style={styles.tabs}>
        {TABS.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.tab, tab === item.id ? styles.tabActive : null]}
            onPress={() => setTab(item.id)}
          >
            <Text
              style={[styles.tabText, tab === item.id ? styles.tabTextActive : null]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? <ActivityIndicator color="#0D5C3A" style={{ marginTop: 24 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && sorted.length === 0 && !error ? (
        <Text style={styles.empty}>No events in this tab yet.</Text>
      ) : null}

      {sorted.map((event) => (
        <Pressable
          key={event.id}
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: "/partner-community-event-edit",
              params: { id: event.id },
            })
          }
        >
          <Text style={styles.cardTitle}>{event.title}</Text>
          <Text style={styles.cardMeta}>{formatWhen(event)}</Text>
          <Text style={styles.cardMeta}>
            {[event.venue_name, event.city, event.state].filter(Boolean).join(", ") ||
              "Location TBD"}
          </Text>
          <Text style={styles.status}>{event.status.replace(/_/g, " ")}</Text>
          {event.status === "published" ? (
            <Pressable
              style={styles.promoteLink}
              onPress={() =>
                router.push({
                  pathname: "/partner-community-event-promote",
                  params: { id: event.id },
                })
              }
            >
              <Text style={styles.promoteLinkText}>Promote & stats</Text>
            </Pressable>
          ) : null}
        </Pressable>
      ))}

      {!loading && error ? (
        <Pressable style={styles.retry} onPress={() => void reload()}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  backText: {
    fontFamily: AppFonts.bold,
    color: "#0D5C3A",
    fontSize: 16,
  },
  eyebrow: {
    fontFamily: AppFonts.bold,
    color: "#0D5C3A",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: AppFonts.extraBold,
    fontSize: 28,
    color: "#0f172a",
  },
  subtitle: {
    fontFamily: AppFonts.medium,
    color: "#64748b",
    lineHeight: 22,
  },
  createButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#0D5C3A",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  createButtonText: {
    color: "#fff",
    fontFamily: AppFonts.bold,
    fontSize: 15,
  },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tab: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f1f5f9",
  },
  tabActive: {
    backgroundColor: "#0D5C3A",
  },
  tabText: {
    fontFamily: AppFonts.bold,
    fontSize: 12,
    color: "#475569",
  },
  tabTextActive: {
    color: "#fff",
  },
  card: {
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    padding: 16,
    gap: 4,
  },
  cardTitle: {
    fontFamily: AppFonts.extraBold,
    fontSize: 18,
    color: "#0f172a",
  },
  cardMeta: {
    fontFamily: AppFonts.medium,
    color: "#64748b",
    fontSize: 13,
  },
  status: {
    marginTop: 6,
    alignSelf: "flex-start",
    fontFamily: AppFonts.bold,
    fontSize: 11,
    color: "#0D5C3A",
    textTransform: "capitalize",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  promoteLink: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  promoteLinkText: {
    fontFamily: AppFonts.bold,
    color: "#0D5C3A",
    fontSize: 13,
  },
  empty: {
    fontFamily: AppFonts.semiBold,
    color: "#64748b",
    paddingVertical: 20,
  },
  error: {
    fontFamily: AppFonts.semiBold,
    color: "#b91c1c",
    marginTop: 8,
  },
  retry: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  retryText: {
    fontFamily: AppFonts.bold,
    color: "#0D5C3A",
  },
});
