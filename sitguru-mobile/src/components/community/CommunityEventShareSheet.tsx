import { Check, Copy, Download, Link2, Share2, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppFonts } from "@/constants/fonts";
import { trackMobileEvent } from "@/lib/analytics/track";
import { getSitGuruApiBaseUrl } from "@/lib/data/api";

const SITGURU_OFFICIAL = [
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/SitGuruOfficial" },
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/SitGuruOfficial" },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@SitGuruOfficial" },
  { id: "x", label: "X", href: "https://x.com/SitGuruOfficial" },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@SitGuruOfficial" },
] as const;

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
        weekday: "short",
        month: "short",
        day: "numeric",
      });
  const cityState = [event.city, event.state].filter(Boolean).join(", ");
  const teaser = event.short_description?.trim();
  if (teaser) {
    return `🐾 ${event.title} on ${dateLabel}${cityState ? ` in ${cityState}` : ""}. ${teaser}\nGoing? Tap Yes, Maybe, or No on SitGuru.\nSitGuru Events — @SitGuruOfficial`;
  }
  return `🐾 ${event.title} on ${dateLabel}${cityState ? ` in ${cityState}` : ""}!\nGoing? Tap Yes, Maybe, or No on SitGuru.\nSitGuru Events — @SitGuruOfficial`;
}

export default function CommunityEventShareSheet({
  open,
  onClose,
  event,
}: CommunityEventShareSheetProps) {
  const [caption, setCaption] = useState("");
  const [copied, setCopied] = useState<"link" | "caption" | null>(null);
  const [hint, setHint] = useState("");

  const url = useMemo(() => {
    if (!event) return "";
    const base = (getSitGuruApiBaseUrl() || "https://www.sitguru.com").replace(/\/$/, "");
    return `${base}/events/${event.slug}`;
  }, [event]);

  const previewImage = event?.image_card_url || event?.image_hero_url || null;
  const displayUrl = url.replace(/^https?:\/\//, "");

  useEffect(() => {
    if (!event) return;
    setCaption(buildCaption(event));
    setCopied(null);
    setHint("");
  }, [event]);

  if (!event) return null;

  async function copyValue(value: string, kind: "link" | "caption") {
    try {
      await Share.share({
        title: kind === "link" ? "SitGuru event link" : "SitGuru event caption",
        message: value,
      });
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
      void trackMobileEvent({
        eventName: kind === "caption" ? "event_share" : "event_link_copy",
        source: "mobile_community_event_share_sheet",
        metadata: { eventId: event.id, slug: event.slug, kind },
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
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>SitGuru Pet Events</Text>
              <Text style={styles.title} numberOfLines={2}>
                Share &ldquo;{event.title}&rdquo;
              </Text>
              <Text style={styles.subtitle}>
                Help pet parents discover this event!
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X color="#475569" size={20} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.previewCard}>
              {previewImage ? (
                <Image source={{ uri: previewImage }} style={styles.previewImage} />
              ) : (
                <View style={[styles.previewImage, styles.previewFallback]} />
              )}
              <View style={styles.previewCopy}>
                <Text style={styles.previewCaption} numberOfLines={4}>
                  {caption}
                </Text>
                <Text style={styles.previewUrl} numberOfLines={1}>
                  {displayUrl}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Share to</Text>
            <View style={styles.iconRow}>
              <Pressable style={styles.iconItem} onPress={() => void nativeShare()}>
                <View style={[styles.iconBubble, { backgroundColor: "#0D5C3A" }]}>
                  <Share2 color="#fff" size={20} />
                </View>
                <Text style={styles.iconLabel}>Share</Text>
              </Pressable>
              <Pressable
                style={styles.iconItem}
                onPress={() => void copyValue(caption, "caption")}
              >
                <View
                  style={[
                    styles.iconBubble,
                    {
                      backgroundColor: "#db2777",
                    },
                  ]}
                >
                  <Copy color="#fff" size={20} />
                </View>
                <Text style={styles.iconLabel}>Caption</Text>
              </Pressable>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                style={styles.actionButton}
                onPress={() => void copyValue(url, "link")}
              >
                {copied === "link" ? (
                  <Check color="#0D5C3A" size={18} />
                ) : (
                  <Link2 color="#0D5C3A" size={18} />
                )}
                <Text style={styles.actionButtonText}>
                  {copied === "link" ? "Copied" : "Copy Link"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  setHint("Use Share to post the SitGuru link + caption");
                  setTimeout(() => setHint(""), 2200);
                  void nativeShare();
                }}
              >
                <Download color="#0D5C3A" size={18} />
                <Text style={styles.actionButtonText}>Share Graphic</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>Suggested caption</Text>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              multiline
              style={styles.captionInput}
            />
            {hint ? <Text style={styles.hint}>{hint}</Text> : null}

            <View style={styles.sitguruBox}>
              <Text style={styles.sitguruEyebrow}>SitGuru Pet Events</Text>
              <Text style={styles.sitguruCopy}>
                Tag @SitGuruOfficial so the pack can amplify your post.
              </Text>
              <View style={styles.sitguruLinks}>
                {SITGURU_OFFICIAL.map((platform) => (
                  <Pressable
                    key={platform.id}
                    style={styles.sitguruChip}
                    onPress={() => void Linking.openURL(platform.href)}
                  >
                    <Text style={styles.sitguruChipText}>{platform.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
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
    maxHeight: "92%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontFamily: AppFonts.extraBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#0D5C3A",
  },
  title: {
    fontFamily: AppFonts.extraBold,
    fontSize: 22,
    color: "#0f172a",
  },
  subtitle: {
    fontFamily: AppFonts.semiBold,
    fontSize: 14,
    color: "#64748b",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 20,
    gap: 14,
    paddingBottom: 36,
  },
  previewCard: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    padding: 12,
  },
  previewImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  previewFallback: {
    backgroundColor: "#d1fae5",
  },
  previewCopy: {
    flex: 1,
    gap: 8,
  },
  previewCaption: {
    fontFamily: AppFonts.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: "#1e293b",
  },
  previewUrl: {
    fontFamily: AppFonts.extraBold,
    fontSize: 12,
    color: "#0D5C3A",
  },
  sectionLabel: {
    fontFamily: AppFonts.extraBold,
    fontSize: 14,
    color: "#0f172a",
  },
  iconRow: {
    flexDirection: "row",
    gap: 18,
  },
  iconItem: {
    alignItems: "center",
    gap: 6,
    width: 72,
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  iconLabel: {
    fontFamily: AppFonts.bold,
    fontSize: 11,
    color: "#334155",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
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
  actionButtonText: {
    fontFamily: AppFonts.extraBold,
    fontSize: 14,
    color: "#0f172a",
  },
  captionInput: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: AppFonts.medium,
    fontSize: 14,
    color: "#334155",
    textAlignVertical: "top",
  },
  hint: {
    fontFamily: AppFonts.extraBold,
    fontSize: 12,
    color: "#0D5C3A",
  },
  sitguruBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    backgroundColor: "#ecfdf5",
    padding: 14,
    gap: 8,
  },
  sitguruEyebrow: {
    fontFamily: AppFonts.extraBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#047857",
  },
  sitguruCopy: {
    fontFamily: AppFonts.semiBold,
    fontSize: 13,
    color: "#064e3b",
    lineHeight: 18,
  },
  sitguruLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sitguruChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sitguruChipText: {
    fontFamily: AppFonts.extraBold,
    fontSize: 11,
    color: "#065f46",
  },
});
