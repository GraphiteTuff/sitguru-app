import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Share2, BarChart3 } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import PartnerEventMessageButton from "@/components/community/PartnerEventMessageButton";
import SitGuruScreen from "@/components/SitGuruScreen";
import { AppFonts } from "@/constants/fonts";
import { fetchPartnerEvent } from "@/hooks/data/usePartnerCommunityEvents";
import { getSitGuruApiBaseUrl, sitguruApiFetch } from "@/lib/data/api";
import { trackMobileEvent } from "@/lib/analytics/track";

type PromotionStats = {
  views: number;
  shares: number;
  clicks: number;
};

export default function PartnerCommunityEventPromoteScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const eventId = String(params.id || "");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PromotionStats>({ views: 0, shares: 0, clicks: 0 });
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!eventId) return;
      setLoading(true);
      const eventResult = await fetchPartnerEvent(eventId);
      if (cancelled) return;

      if (eventResult.event) {
        setTitle(eventResult.event.title);
        setSlug(eventResult.event.slug);
        setStatus(eventResult.event.status);
      }

      const statsResult = await sitguruApiFetch<{ stats?: PromotionStats }>(
        `/api/partners/events/${eventId}/analytics`,
      );

      if (!cancelled && statsResult.data?.stats) {
        setStats(statsResult.data.stats);
      }

      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function shareEvent() {
    const base = getSitGuruApiBaseUrl() || "https://www.sitguru.com";
    const url = `${base}/events/${slug}`;
    const shareMessage = `Join us for ${title} on SitGuru: ${url}`;

    await Share.share({ title, message: shareMessage, url });
    setMessage("Thanks for sharing!");

    void trackMobileEvent({
      eventName: "event_share",
      source: "mobile_partner_promote",
      metadata: { eventId, slug },
    });
  }

  if (loading) {
    return (
      <SitGuruScreen scroll center={false}>
        <ActivityIndicator color="#0D5C3A" style={{ marginTop: 40 }} />
      </SitGuruScreen>
    );
  }

  return (
    <SitGuruScreen scroll center={false}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <ChevronLeft color="#0D5C3A" size={22} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.eyebrow}>Promote</Text>
      <Text style={styles.title}>{title || "Event"}</Text>
      <Text style={styles.status}>Status: {status.replace(/_/g, " ")}</Text>

      <View style={styles.metricsRow}>
        <MetricCard label="Views" value={stats.views} />
        <MetricCard label="Shares" value={stats.shares} />
        <MetricCard label="Clicks" value={stats.clicks} />
      </View>

      <View style={styles.card}>
        <BarChart3 color="#0D5C3A" size={20} />
        <Text style={styles.cardTitle}>Share your event</Text>
        <Text style={styles.cardText}>
          Post the public SitGuru link on social, email, or in-store. Stats update as pet parents
          view and share.
        </Text>
      </View>

      <PartnerEventMessageButton eventId={eventId} eventTitle={title || "Event"} />

      <Pressable style={styles.primaryButton} onPress={() => void shareEvent()}>
        <Share2 color="#fff" size={18} />
        <Text style={styles.primaryButtonText}>Share event link</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() =>
          router.push({
            pathname: "/partner-community-event-edit",
            params: { id: eventId },
          })
        }
      >
        <Text style={styles.secondaryButtonText}>Edit event details</Text>
      </Pressable>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </SitGuruScreen>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value.toLocaleString()}</Text>
    </View>
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
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 11,
  },
  title: {
    fontFamily: AppFonts.extraBold,
    fontSize: 28,
    color: "#0f172a",
  },
  status: {
    fontFamily: AppFonts.semiBold,
    color: "#64748b",
    textTransform: "capitalize",
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    padding: 12,
  },
  metricLabel: {
    fontFamily: AppFonts.bold,
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
  },
  metricValue: {
    fontFamily: AppFonts.extraBold,
    fontSize: 22,
    color: "#0f172a",
    marginTop: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1fae5",
    backgroundColor: "#f0fdf4",
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: AppFonts.extraBold,
    fontSize: 18,
    color: "#0f172a",
  },
  cardText: {
    fontFamily: AppFonts.medium,
    color: "#475569",
    lineHeight: 22,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#0D5C3A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontFamily: AppFonts.bold,
    fontSize: 16,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  secondaryButtonText: {
    fontFamily: AppFonts.bold,
    color: "#334155",
  },
  message: {
    fontFamily: AppFonts.semiBold,
    color: "#0D5C3A",
    marginTop: 8,
  },
});
