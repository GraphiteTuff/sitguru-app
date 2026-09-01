import { Check, Link2, Share2, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppFonts } from "@/constants/fonts";
import { trackMobileEvent } from "@/lib/analytics/track";
import { getSitGuruApiBaseUrl } from "@/lib/data/api";

type CommunityEventShareSheetProps = {
  open: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    slug: string;
    start_at: string;
    city?: string | null;
    state?: string | null;
    short_description?: string | null;
    image_card_url?: string | null;
    image_hero_url?: string | null;
  } | null;
};

function buildCaption(event: NonNullable<CommunityEventShareSheetProps["event"]>) {
  const when = new Date(event.start_at);
  const dateLabel = Number.isNaN(when.getTime())
    ? "soon"
    : when.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
  const cityState = [event.city, event.state].filter(Boolean).join(", ");
  return `🐾 ${event.title}\n${dateLabel}${cityState ? ` · ${cityState}` : ""}\nRSVP on SitGuru`;
}

export default function CommunityEventShareSheet({
  open,
  onClose,
  event,
}: CommunityEventShareSheetProps) {
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    if (!event) return "";
    const base = (getSitGuruApiBaseUrl() || "https://www.sitguru.com").replace(/\/$/, "");
    return `${base}/events/${event.slug}`;
  }, [event]);

  const previewImage = event?.image_card_url || event?.image_hero_url || null;
  const displayUrl = url.replace(/^https?:\/\//, "");
  const caption = event ? buildCaption(event) : "";

  if (!event) return null;

  async function copyLink() {
    try {
      await Share.share({
        title: event.title,
        message: url,
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      void trackMobileEvent({
        eventName: "event_link_copy",
        source: "mobile_community_event_share_sheet",
        metadata: { eventId: event.id, slug: event.slug, kind: "link" },
      });
    } catch {
      // cancelled
    }
  }

  async function nativeShare() {
    try {
      await Share.share({
        title: event.title,
        message: `${caption}\n\n${url}`,
        url,
      });
      void trackMobileEvent({
        eventName: "event_share",
        source: "mobile_community_event_share_sheet",
        metadata: { eventId: event.id, slug: event.slug, channel: "native" },
      });
      onClose();
    } catch {
      // cancelled
    }
  }

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Share event</Text>
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <X color="#475569" size={20} />
            </Pressable>
          </View>

          <View style={styles.previewCard}>
            {previewImage ? (
              <Image source={{ uri: previewImage }} style={styles.previewImage} />
            ) : (
              <View style={[styles.previewImage, styles.previewFallback]} />
            )}
            <View style={styles.previewCopy}>
              <Text style={styles.previewTitle} numberOfLines={2}>
                {event.title}
              </Text>
              <Text style={styles.previewUrl} numberOfLines={1}>
                {displayUrl}
              </Text>
            </View>
          </View>

          <Pressable style={styles.primaryButton} onPress={() => void nativeShare()}>
            <Share2 color="#fff" size={18} />
            <Text style={styles.primaryButtonText}>Share</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => void copyLink()}>
            {copied ? <Check color="#0D5C3A" size={18} /> : <Link2 color="#0D5C3A" size={18} />}
            <Text style={styles.secondaryButtonText}>
              {copied ? "Link copied" : "Copy link"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  title: {
    fontFamily: AppFonts.extraBold,
    fontSize: 22,
    color: "#0f172a",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCard: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  previewFallback: {
    backgroundColor: "#d1fae5",
  },
  previewCopy: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  previewTitle: {
    fontFamily: AppFonts.extraBold,
    fontSize: 16,
    color: "#0f172a",
  },
  previewUrl: {
    fontFamily: AppFonts.bold,
    fontSize: 12,
    color: "#E85D04",
  },
  primaryButton: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#0D5C3A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    fontFamily: AppFonts.extraBold,
    fontSize: 15,
    color: "#fff",
  },
  secondaryButton: {
    marginTop: 10,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    fontFamily: AppFonts.extraBold,
    fontSize: 15,
    color: "#0f172a",
  },
});
