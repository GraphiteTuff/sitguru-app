import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { CalendarDays, ChevronLeft, MapPin, PawPrint, Share2, Users } from "lucide-react-native";
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

const PENDING_RSVP_KEY = "sitguru_pending_event_rsvp";

export default function CommunityEventDetailScreen() {
  const params = useLocalSearchParams<{ slug?: string; rsvp?: string }>();
  const slug = String(params.slug || "");
  const autoRsvp = String(params.rsvp || "") === "1";
  const [event, setEvent] = useState<MobileCommunityEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [rsvpPending, setRsvpPending] = useState(false);
  const [needsSignup, setNeedsSignup] = useState(false);

  const { counts, going, setAttendance, reload } = useEventAttendance(event?.id);

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

  useEffect(() => {
    if (!event?.id || !autoRsvp || going) return;

    let cancelled = false;

    async function finishRsvp() {
      setRsvpPending(true);
      const result = await setAttendance("going");
      if (cancelled) return;
      setRsvpPending(false);
      if (!result.ok) {
        if (result.error.toLowerCase().includes("sign in")) {
          setNeedsSignup(true);
          setRsvpMessage("Join free as a Pet Parent to finish saying you're going.");
          return;
        }
        setRsvpMessage(result.error);
        return;
      }
      await AsyncStorage.removeItem(PENDING_RSVP_KEY).catch(() => undefined);
      setNeedsSignup(false);
      setRsvpMessage("You're going! Welcome to the SitGuru community.");
      void reload();
    }

    void finishRsvp();

    return () => {
      cancelled = true;
    };
  }, [autoRsvp, event?.id, going, reload, setAttendance]);

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

  async function goToCommunitySignup(
    intent: "pet-parent" | "guru" | "ambassador" = "pet-parent",
  ) {
    if (!event) return;
    await AsyncStorage.setItem(
      PENDING_RSVP_KEY,
      JSON.stringify({
        eventId: event.id,
        slug: event.slug,
        savedAt: Date.now(),
      }),
    ).catch(() => undefined);

    router.push({
      pathname: "/signup",
      params: {
        intent,
        next: `/community-event-detail?slug=${encodeURIComponent(event.slug)}&rsvp=1`,
        source: "community_event_im_going",
      },
    });
  }

  async function toggleGoing() {
    setRsvpPending(true);
    setRsvpMessage("");
    const next = going ? "cancelled" : "going";
    const result = await setAttendance(next);
    setRsvpPending(false);
    if (!result.ok) {
      if (result.error.toLowerCase().includes("sign in")) {
        setNeedsSignup(true);
        setRsvpMessage("Join free — pick Pet Parent, Guru, or Ambassador below.");
        return;
      }
      setRsvpMessage(result.error);
      return;
    }
    setNeedsSignup(false);
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

      {needsSignup ? (
        <View style={styles.joinOptions}>
          <Text style={styles.joinTitle}>Join free & say I&apos;m Going</Text>
          <Text style={styles.joinSubtitle}>
            Pick your path — we&apos;ll bring you right back to this event.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => void goToCommunitySignup("pet-parent")}
          >
            <PawPrint color="#fff" size={18} />
            <Text style={styles.primaryButtonText}>Pet Parent</Text>
          </Pressable>
          <Pressable
            style={styles.roleButton}
            onPress={() => void goToCommunitySignup("guru")}
          >
            <Text style={styles.roleButtonText}>Pet Guru</Text>
          </Pressable>
          <Pressable
            style={styles.roleButton}
            onPress={() => void goToCommunitySignup("ambassador")}
          >
            <Text style={styles.roleButtonText}>Ambassador</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.primaryButton, going ? styles.goingButton : null]}
          disabled={rsvpPending}
          onPress={() => void toggleGoing()}
        >
          <Users color={going ? "#0D5C3A" : "#fff"} size={18} />
          <Text
            style={[styles.primaryButtonText, going ? styles.goingButtonText : null]}
          >
            {rsvpPending ? "Saving…" : going ? "You're Going" : "I'm Going"}
          </Text>
        </Pressable>
      )}

      <View style={styles.countRow}>
        <Text style={styles.countChip}>{counts.petParents} Pet Parents</Text>
        <Text style={styles.countChip}>{counts.gurus} Gurus</Text>
        <Text style={styles.countChip}>{counts.ambassadors} Ambassadors</Text>
      </View>

      {rsvpMessage ? <Text style={styles.rsvpMessage}>{rsvpMessage}</Text> : null}

      <View style={styles.joinHintRow}>
        <Pressable onPress={() => void goToCommunitySignup("pet-parent")}>
          <Text style={styles.joinHintText}>Pet Parent</Text>
        </Pressable>
        <Text style={styles.joinHintDivider}>·</Text>
        <Pressable onPress={() => void goToCommunitySignup("guru")}>
          <Text style={styles.joinHintText}>Guru</Text>
        </Pressable>
        <Text style={styles.joinHintDivider}>·</Text>
        <Pressable onPress={() => void goToCommunitySignup("ambassador")}>
          <Text style={styles.joinHintText}>Ambassador</Text>
        </Pressable>
      </View>

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
  joinHintRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  joinHintText: {
    fontFamily: AppFonts.semiBold,
    color: "#0D5C3A",
    fontSize: 13,
  },
  joinHintDivider: {
    fontFamily: AppFonts.bold,
    color: "#94a3b8",
  },
  joinOptions: {
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    backgroundColor: "#ecfdf5",
    padding: 14,
  },
  joinTitle: {
    fontFamily: AppFonts.extraBold,
    color: "#065f46",
    fontSize: 16,
  },
  joinSubtitle: {
    fontFamily: AppFonts.medium,
    color: "#047857",
    fontSize: 13,
    marginBottom: 4,
  },
  roleButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  roleButtonText: {
    fontFamily: AppFonts.bold,
    color: "#0D5C3A",
    fontSize: 15,
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
