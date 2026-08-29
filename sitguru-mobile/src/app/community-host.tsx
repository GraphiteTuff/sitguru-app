import { router } from "expo-router";
import {
  CalendarPlus,
  ChevronLeft,
  ClipboardList,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import { useWindowDimensions, Pressable, StyleSheet, Text, View } from "react-native";

import SitGuruScreen from "@/components/SitGuruScreen";
import { AppFonts } from "@/constants/fonts";

const steps = [
  {
    icon: CalendarPlus,
    title: "Create your event",
    body: "Add the name, photo, date, place, and a short description — ready in a couple of minutes.",
  },
  {
    icon: ShieldCheck,
    title: "Quick SitGuru review",
    body: "Partner listings are checked before they go live so Pet Parents see clear, trustworthy details.",
  },
  {
    icon: HeartHandshake,
    title: "Reach the local pack",
    body: "Published Partner Events show on Community with top priority — photos, time, and interest buttons included.",
  },
];

export default function CommunityHostScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  return (
    <SitGuruScreen scroll center={false}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <ChevronLeft color="#0D5C3A" size={22} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.eyebrow}>Pet Event Planners & Managers</Text>
      <Text style={styles.title}>Put your pet event on SitGuru</Text>
      <Text style={styles.subtitle}>
        Publish adoption days, meetups, and festivals so Pet Parents nearby can
        find the real gathering — not just a social post.
      </Text>

      <View style={[styles.ctaRow, isWide && styles.ctaRowWide]}>
        <Pressable
          style={[styles.ctaPrimary, isWide && styles.ctaHalf]}
          onPress={() => router.push("/partner-community-events")}
        >
          <ClipboardList color="#fff" size={18} />
          <Text style={styles.ctaPrimaryText}>Open Event Manager</Text>
        </Pressable>
        <Pressable
          style={[styles.ctaSecondary, isWide && styles.ctaHalf]}
          onPress={() => router.push("/community-events")}
        >
          <Text style={styles.ctaSecondaryText}>Browse Pet Events</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>How hosting works</Text>
      <View style={[styles.stepGrid, isWide && styles.stepGridWide]}>
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <View key={step.title} style={[styles.stepCard, isWide && styles.stepCardWide]}>
              <Icon color="#0D5C3A" size={20} />
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.compareCard}>
        <View style={styles.compareHeader}>
          <ClipboardList color="#0D5C3A" size={18} />
          <Text style={styles.compareEyebrow}>SitGuru Partner Event</Text>
        </View>
        <Text style={styles.compareBody}>
          You create and update the listing. Partner Events always show first on
          Community.
        </Text>
      </View>

      <View style={[styles.compareCard, styles.compareCardMuted]}>
        <View style={styles.compareHeader}>
          <Sparkles color="#0D5C3A" size={18} />
          <Text style={styles.compareEyebrow}>Pet Event</Text>
        </View>
        <Text style={styles.compareBodyMuted}>
          Extra local pet gatherings SitGuru surfaces so the map stays full. Claim
          yours as a Partner Event for full control.
        </Text>
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  backText: {
    fontFamily: AppFonts.extraBold,
    fontSize: 15,
    color: "#0D5C3A",
  },
  eyebrow: {
    fontFamily: AppFonts.extraBold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#0D5C3A",
  },
  title: {
    marginTop: 8,
    fontFamily: AppFonts.extraBold,
    fontSize: 28,
    lineHeight: 34,
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 10,
    fontFamily: AppFonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
  },
  ctaRow: {
    marginTop: 18,
    gap: 10,
  },
  ctaRowWide: {
    flexDirection: "row",
  },
  ctaPrimary: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#0D5C3A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  ctaSecondary: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  ctaHalf: {
    flex: 1,
  },
  ctaPrimaryText: {
    fontFamily: AppFonts.extraBold,
    fontSize: 14,
    color: "#fff",
  },
  ctaSecondaryText: {
    fontFamily: AppFonts.extraBold,
    fontSize: 14,
    color: "#0f172a",
  },
  sectionLabel: {
    marginTop: 28,
    marginBottom: 12,
    fontFamily: AppFonts.extraBold,
    fontSize: 18,
    color: "#0f172a",
  },
  stepGrid: {
    gap: 10,
  },
  stepGridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  stepCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    padding: 16,
  },
  stepCardWide: {
    width: "31.5%",
    flexGrow: 1,
  },
  stepTitle: {
    marginTop: 10,
    fontFamily: AppFonts.extraBold,
    fontSize: 16,
    color: "#0f172a",
  },
  stepBody: {
    marginTop: 6,
    fontFamily: AppFonts.semiBold,
    fontSize: 13,
    lineHeight: 19,
    color: "#475569",
  },
  compareCard: {
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    backgroundColor: "#ecfdf5",
    padding: 16,
  },
  compareCardMuted: {
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  compareHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compareEyebrow: {
    fontFamily: AppFonts.extraBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#064e3b",
  },
  compareBody: {
    marginTop: 8,
    fontFamily: AppFonts.semiBold,
    fontSize: 14,
    lineHeight: 21,
    color: "#064e3b",
  },
  compareBodyMuted: {
    marginTop: 8,
    fontFamily: AppFonts.semiBold,
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
  },
});
