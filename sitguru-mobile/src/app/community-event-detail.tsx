import { router, useLocalSearchParams } from "expo-router";
import { CalendarDays, ChevronLeft, MapPin, Share2, Users } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import SitGuruScreen from "@/components/SitGuruScreen";
import { AppFonts } from "@/constants/fonts";
import {
  fetchCommunityEventBySlug,
  useEventAttendance,
  type MobileCommunityEvent,
} from "@/hooks/data/useCommunityEvents";
import { getSitGuruApiBaseUrl } from "@/lib/data/api";

export default function CommunityEventDetailScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = String(params.slug || "");
  const [event, setEvent] = useState<MobileCommunityEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [rsvpPending, setRsvpPending] = useState(false);

  const {
    counts,
    going,
    setAttendance,
  } = useEventAttendance(event?.id);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await fetchCommunityEventBySlug(slug);
      if (!cancelled) {
        setEvent(result);
        setLoading(false);
      }
    }

    if (slug) void load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function shareEvent() {
    if (!event) return;

    const base = getSitGuruApiBaseUrl() || "https://www.sitguru.com";
    const url = `${base}/community/events/${event.slug}`;
    const message = `Join us for ${event.title} on SitGuru: ${url}`;

    await Share.share({
      title: event.title,
      message,
      url,
    });
  }

  async function toggleGoing() {
    setRsvpPending(true);
    setRsvpMessage("");
    const next = going ? "cancelled" : "going";
    const result = await setAttendance(next);
    setRsvpPending(false);
    if (!result.ok) {
      setRsvpMessage(result.error);
      return;
    }
    setRsvpMessage(next === "going" ? "You're going!" : "RSVP cancelled");
  }

  if (loading) {
    return (
      <SitGuruScreen scroll center={false}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <ChevronLeft color="#0D5C3A" size={22} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <ActivityIndicator color="#0D5C3A" style={{ marginTop: 40 }} />
      </SitGuruScreen>
    );
  }

  if (!event) {
    return (
      <SitGuruScreen scroll center={false}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <ChevronLeft color="#0D5C3A" size={22} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.empty}>Event not found.</Text>
      </SitGuruScreen>
    );
  }

  const imageUrl =
    event.image_hero_url || event.image_original_url || event.image_card_url;

  return (
    <SitGuruScreen scroll center={false}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <ChevronLeft color="#0D5C3A" size={22} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.hero} /> : null}

      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.partner}>
        {event.partners?.business_name || "SitGuru Partner"}
      </Text>

      <View style={styles.metaBlock}>
        <View style={styles.metaRow}>
          <CalendarDays color="#0D5C3A" size={18} />
          <Text style={styles.metaText}>
            {new Date(event.start_at).toLocaleString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MapPin color="#0D5C3A" size={18} />
          <Text style={styles.metaText}>
            {[event.venue_name, event.city, event.state].filter(Boolean).join(", ")}
          </Text>
        </View>
      </View>

      {event.short_description ? (
        <Text style={styles.description}>{event.short_description}</Text>
      ) : null}

      <Pressable
        style={[styles.primaryButton, going ? styles.goingButton : null]}
        disabled={rsvpPending}
        onPress={() => void toggleGoing()}
      >
        <Users color={going ? "#0D5C3A" : "#fff"} size={18} />
        <Text style={[styles.primaryButtonText, going ? styles.goingButtonText : null]}>
          {rsvpPending ? "Saving…" : going ? "You're Going" : "I'm Going"}
        </Text>
      </Pressable>

      <View style={styles.countRow}>
        <Text style={styles.countChip}>{counts.petParents} Pet Parents</Text>
        <Text style={styles.countChip}>{counts.gurus} Gurus</Text>
        <Text style={styles.countChip}>{counts.ambassadors} Ambassadors</Text>
      </View>

      {rsvpMessage ? <Text style={styles.rsvpMessage}>{rsvpMessage}</Text> : null}

      <Pressable style={styles.shareButton} onPress={() => void shareEvent()}>
        <Share2 color="#0D5C3A" size={18} />
        <Text style={styles.shareButtonText}>Share Event</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.push("/community-events")}
      >
        <Text style={styles.secondaryButtonText}>Browse more events</Text>
      </Pressable>
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
  hero: {
    width: "100%",
    height: 240,
    borderRadius: 24,
  },
  title: {
    fontFamily: AppFonts.extraBold,
    fontSize: 30,
    color: "#0f172a",
  },
  partner: {
    fontFamily: AppFonts.semiBold,
    color: "#475569",
  },
  metaBlock: {
    gap: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    padding: 16,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  metaText: {
    flex: 1,
    fontFamily: AppFonts.semiBold,
    color: "#334155",
    lineHeight: 22,
  },
  description: {
    fontFamily: AppFonts.medium,
    color: "#475569",
    lineHeight: 24,
    fontSize: 16,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#0D5C3A",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  goingButton: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  primaryButtonText: {
    color: "#fff",
    fontFamily: AppFonts.bold,
    fontSize: 16,
  },
  goingButtonText: {
    color: "#0D5C3A",
  },
  countRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  countChip: {
    fontFamily: AppFonts.bold,
    fontSize: 12,
    color: "#334155",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  rsvpMessage: {
    fontFamily: AppFonts.bold,
    color: "#0D5C3A",
    fontSize: 13,
  },
  shareButton: {
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  shareButtonText: {
    color: "#0D5C3A",
    fontFamily: AppFonts.bold,
    fontSize: 15,
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#0D5C3A",
    fontFamily: AppFonts.bold,
  },
  empty: {
    padding: 20,
    fontFamily: AppFonts.semiBold,
    color: "#64748b",
  },
});
