import { router } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { AppFonts } from "@/constants/fonts";
import { sitguruApiFetch } from "@/lib/data/api";

export default function PartnerEventMessageButton({
  eventId,
  eventTitle,
  label = "Message SitGuru",
}: {
  eventId: string;
  eventTitle: string;
  label?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function openThread() {
    setPending(true);
    setError("");

    const result = await sitguruApiFetch<{
      ok?: boolean;
      conversationId?: string;
      hrefPartner?: string;
      error?: string;
    }>("/api/messaging/ensure-event-conversation", {
      method: "POST",
      body: {
        eventId,
        opener: `Partner opened coordination for ${eventTitle}.`,
      },
    });

    setPending(false);

    if (!result.data?.conversationId) {
      setError(result.data?.error || result.error || "Unable to open messages.");
      return;
    }

    router.push(`/conversation?conversationId=${encodeURIComponent(result.data.conversationId)}`);
  }

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.button} disabled={pending} onPress={() => void openThread()}>
        {pending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <MessageCircle color="#fff" size={18} />
        )}
        <Text style={styles.buttonText}>{pending ? "Opening…" : label}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  button: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#0D5C3A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontFamily: AppFonts.bold,
    fontSize: 15,
  },
  error: {
    fontFamily: AppFonts.semiBold,
    color: "#b91c1c",
    fontSize: 13,
  },
});
