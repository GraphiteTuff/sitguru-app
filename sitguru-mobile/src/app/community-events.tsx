import { router } from "expo-router";
import {
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  MapPin,
  PawPrint,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import ConvertActionBar from "@/components/mobile/ConvertActionBar";
import MobileScreen from "@/components/mobile/MobileScreen";
import MobileTabFooter from "@/components/mobile/MobileTabFooter";
import SitGuruFeatureChips from "@/components/mobile/SitGuruFeatureChips";
import { AppFonts } from "@/constants/fonts";
import {
  EVENT_SCREEN_EXPERIENCES,
  MOBILE_CONVERT,
} from "@/constants/mobile-experiences";
import { SitGuruBrand } from "@/constants/role-palettes";
import {
  useCommunityEvents,
  type MobileCommunityEvent,
} from "@/hooks/data/useCommunityEvents";
import { useMobileTabContext } from "@/hooks/useMobileTabContext";
import { trackMobileEvent } from "@/lib/analytics/track";

const BRAND = SitGuruBrand.petParent;

function formatParts(event: MobileCommunityEvent) {
  const start = new Date(event.start_at);
  return {
    month: start.toLocaleString(undefined, { month: "short" }).toUpperCase(),
    day: String(start.getDate()),
    when: start.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function getImage(event: MobileCommunityEvent) {
  return event.image_card_url || event.image_hero_url || event.image_original_url;
}

function getBlurb(event: MobileCommunityEvent) {
  const text = (event.short_description || event.description || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  return text.length > 110 ? `${text.slice(0, 107).trim()}…` : text;
}

export default function CommunityEventsScreen() {
  const [query, setQuery] = useState("");
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const { events, loading, error } = useCommunityEvents({ q: query });
  const { tabRole } = useMobileTabContext();

  const sorted = useMemo(
    () => [...events].sort((a, b) => a.start_at.localeCompare(b.start_at)),
    [events],
  );

  useEffect(() => {
    void trackMobileEvent({
      eventName: "community_events_list_view",
      source: "mobile_community_events",
      pagePath: "/events",
      metadata: { query, count: sorted.length },
    });
  }, [query, sorted.length]);

  return (
    <MobileScreen
      scrollBottomInset={120}
      footer={
        <MobileTabFooter
          active="events"
          role={tabRole}
          sticky={
            <ConvertActionBar
              embedded
              helper="Going to an event? Book a Guru for the outing."
              label={MOBILE_CONVERT.bookLabel}
              onPress={() => router.push(MOBILE_CONVERT.exploreHref)}
              showTrust
            />
          }
        />
      }
    >
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <ChevronLeft color={BRAND} size={22} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.eyebrow}>SitGuru Pet Events</Text>
      <Text style={styles.title}>Pet friendly events near you</Text>
      <Text style={styles.subtitle}>
        Partner Events lead the list. Browse nearby pet gatherings, or host your
        own with Event Manager.
      </Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search events"
        style={styles.search}
        placeholderTextColor="#64748b"
      />

      <View style={[styles.ctaRow, isWide && styles.ctaRowWide]}>
        <Pressable
          style={[styles.ctaPrimary, isWide && styles.ctaHalf]}
          onPress={() => router.push("/community-host")}
        >
          <ClipboardList color="#fff" size={18} />
          <Text style={styles.ctaPrimaryText}>Host an event</Text>
        </Pressable>
        <Pressable
          style={[styles.ctaSecondary, isWide && styles.ctaHalf]}
          onPress={() => router.push("/partner-community-events")}
        >
          <Text style={styles.ctaSecondaryText}>Manage my events</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.delilahChat}
        onPress={() =>
          router.push({
            pathname: "/ai-companion",
            params: { id: "delilah" },
          })
        }
      >
        <Text style={styles.delilahChatText}>
          Chat with Delilah · Pet Event Coordinator
        </Text>
      </Pressable>

      <SitGuruFeatureChips
        chips={EVENT_SCREEN_EXPERIENCES}
        title="Plan care around your outing"
      />

      {loading ? (
        <ActivityIndicator color={BRAND} style={{ marginTop: 24 }} />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && sorted.length === 0 ? (
        <Text style={styles.empty}>No upcoming events yet. Check back soon.</Text>
      ) : null}

      <View style={[styles.list, isWide && styles.listWide]}>
        {sorted.map((event) => {
          const imageUrl = getImage(event);
          const parts = formatParts(event);
          const blurb = getBlurb(event);
          const sourceLabel =
            event.partners?.business_name === "Pet Event" ||
            event.partners?.business_name === "Community Event" ||
            (event.partners?.business_name || "").startsWith("Google")
              ? "Pet Event"
              : "SitGuru Partner Event";

          return (
            <Pressable
              key={event.id}
              style={[styles.card, isWide && styles.cardWide]}
              onPress={() =>
                router.push({
                  pathname: "/community-event-detail",
                  params: { slug: event.slug },
                })
              }
            >
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, styles.cardImageFallback]}>
                  <PawPrint color={BRAND} size={28} />
                </View>
              )}

              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderText}>
                    <View style={styles.tagRow}>
                      <Text style={styles.sourceTag}>{sourceLabel}</Text>
                      {event.is_free ? <Text style={styles.tag}>Free</Text> : null}
                      {event.pet_friendly ? (
                        <Text style={styles.tag}>Pet Friendly</Text>
                      ) : null}
                    </View>
                    <Text style={styles.cardTitle}>{event.title}</Text>
                    {blurb ? <Text style={styles.blurb}>{blurb}</Text> : null}
                  </View>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateMonth}>{parts.month}</Text>
                    <Text style={styles.dateDay}>{parts.day}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <CalendarDays color={BRAND} size={16} />
                  <Text style={styles.metaText}>{parts.when}</Text>
                </View>
                <View style={styles.metaRow}>
                  <MapPin color={BRAND} size={16} />
                  <Text style={styles.metaText}>
                    {[event.venue_name, event.city, event.state]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
    minHeight: 44,
  },
  backText: {
    fontFamily: AppFonts.bold,
    color: BRAND,
    fontSize: 16,
  },
  eyebrow: {
    fontFamily: AppFonts.bold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: BRAND,
  },
  title: {
    fontFamily: AppFonts.extraBold,
    fontSize: 28,
    color: "#0f172a",
    marginTop: 4,
  },
  subtitle: {
    fontFamily: AppFonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
    marginTop: 6,
    marginBottom: 8,
  },
  search: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 16,
    paddingHorizontal: 16,
    fontFamily: AppFonts.semiBold,
    fontSize: 16,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  ctaRow: {
    gap: 8,
    marginTop: 12,
  },
  ctaRowWide: {
    flexDirection: "row",
  },
  ctaHalf: {
    flex: 1,
  },
  ctaPrimary: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  ctaPrimaryText: {
    fontFamily: AppFonts.bold,
    color: "#fff",
    fontSize: 14,
  },
  ctaSecondary: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  ctaSecondaryText: {
    fontFamily: AppFonts.bold,
    color: "#0f172a",
    fontSize: 14,
  },
  delilahChat: {
    minHeight: 48,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  delilahChatText: {
    fontFamily: AppFonts.bold,
    color: BRAND,
    fontSize: 14,
  },
  error: {
    color: "#b91c1c",
    fontFamily: AppFonts.semiBold,
    marginTop: 12,
  },
  empty: {
    color: "#64748b",
    fontFamily: AppFonts.semiBold,
    marginTop: 12,
  },
  list: {
    gap: 12,
    marginTop: 12,
    paddingBottom: 40,
  },
  listWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    width: "100%",
  },
  cardWide: {
    width: "48.5%",
  },
  cardImage: {
    width: "100%",
    height: 168,
  },
  cardImageFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ecfdf5",
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  cardHeaderText: {
    flex: 1,
    gap: 6,
  },
  dateBadge: {
    minWidth: 64,
    borderRadius: 16,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  dateMonth: {
    fontFamily: AppFonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    color: "#047857",
  },
  dateDay: {
    fontFamily: AppFonts.extraBold,
    fontSize: 26,
    lineHeight: 28,
    color: "#0f172a",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sourceTag: {
    backgroundColor: "#0f172a",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    fontFamily: AppFonts.bold,
    fontSize: 11,
  },
  tag: {
    backgroundColor: "#ecfdf5",
    color: "#065f46",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    fontFamily: AppFonts.bold,
    fontSize: 12,
  },
  cardTitle: {
    fontFamily: AppFonts.extraBold,
    fontSize: 20,
    color: "#0f172a",
  },
  blurb: {
    fontFamily: AppFonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    flex: 1,
    fontFamily: AppFonts.semiBold,
    color: "#475569",
  },
});
