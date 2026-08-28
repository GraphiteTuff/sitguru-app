import { router, useLocalSearchParams } from "expo-router";
import { CalendarDays, ChevronLeft, MapPin, Share2 } from "lucide-react-native";
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
  type MobileCommunityEvent,
} from "@/hooks/data/useCommunityEvents";

function getApiBaseUrl() {
  return (
    process.env.EXPO_PUBLIC_SITGURU_API_URL ||
    process.env.EXPO_PUBLIC_SITGURU_WEB_URL ||
    "https://www.sitguru.com"
  ).replace(/\/$/, "");
}

export default function CommunityEventDetailScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = String(params.slug || "");
  const [event, setEvent] = useState<MobileCommunityEvent | null>(null);
  const [loading, setLoading] = useState(true);

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

    const url = `${getApiBaseUrl()}/community/events/${event.slug}`;
    const message = `Join us for ${event.title} on SitGuru: ${url}`;

    await Share.share({
      title: event.title,
      message,
      url,
    });
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
        <Text style={styles.partner}>{event.partners?.business_name || "SitGuru Partner"}</Text>

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

        <Pressable style={styles.primaryButton} onPress={() => void shareEvent()}>
          <Share2 color="#fff" size={18} />
          <Text style={styles.primaryButtonText}>Share Event</Text>
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
  content: {
    gap: 16,
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
  primaryButtonText: {
    color: "#fff",
    fontFamily: AppFonts.bold,
    fontSize: 16,
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
