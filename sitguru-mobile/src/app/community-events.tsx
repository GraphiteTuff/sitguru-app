import { router } from "expo-router";
import { CalendarDays, ChevronLeft, MapPin, PawPrint } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import SitGuruScreen from "@/components/SitGuruScreen";
import { AppFonts } from "@/constants/fonts";
import {
  useCommunityEvents,
  type MobileCommunityEvent,
} from "@/hooks/data/useCommunityEvents";

function formatWhen(event: MobileCommunityEvent) {
  const start = new Date(event.start_at);
  return start.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getImage(event: MobileCommunityEvent) {
  return event.image_card_url || event.image_hero_url || event.image_original_url;
}

export default function CommunityEventsScreen() {
  const [query, setQuery] = useState("");
  const { events, loading, error } = useCommunityEvents({ q: query });

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

      <Text style={styles.eyebrow}>SitGuru Community</Text>
        <Text style={styles.title}>Pet-friendly events near you</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search events"
          style={styles.search}
          placeholderTextColor="#64748b"
        />

        {loading ? <ActivityIndicator color="#0D5C3A" style={{ marginTop: 24 }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && sorted.length === 0 ? (
          <Text style={styles.empty}>No upcoming events yet. Check back soon.</Text>
        ) : null}

        {sorted.map((event) => {
          const imageUrl = getImage(event);
          return (
            <Pressable
              key={event.id}
              style={styles.card}
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
                  <PawPrint color="#0D5C3A" size={28} />
                </View>
              )}

              <View style={styles.cardBody}>
                <View style={styles.tagRow}>
                  {event.is_free ? <Text style={styles.tag}>Free</Text> : null}
                  {event.pet_friendly ? <Text style={styles.tag}>Pet Friendly</Text> : null}
                </View>
                <Text style={styles.cardTitle}>{event.title}</Text>
                <Text style={styles.cardPartner}>{event.partners?.business_name || "Partner"}</Text>
                <View style={styles.metaRow}>
                  <CalendarDays color="#0D5C3A" size={16} />
                  <Text style={styles.metaText}>{formatWhen(event)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <MapPin color="#0D5C3A" size={16} />
                  <Text style={styles.metaText}>
                    {[event.venue_name, event.city, event.state].filter(Boolean).join(", ")}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 40,
  },
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
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#0D5C3A",
  },
  title: {
    fontFamily: AppFonts.extraBold,
    fontSize: 28,
    color: "#0f172a",
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
  },
  error: {
    color: "#b91c1c",
    fontFamily: AppFonts.semiBold,
  },
  empty: {
    color: "#64748b",
    fontFamily: AppFonts.semiBold,
    marginTop: 12,
  },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardImage: {
    width: "100%",
    height: 180,
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
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
    fontSize: 22,
    color: "#0f172a",
  },
  cardPartner: {
    fontFamily: AppFonts.semiBold,
    color: "#475569",
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
