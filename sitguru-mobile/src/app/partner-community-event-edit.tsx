import type { ReactNode } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import PartnerEventMessageButton from "@/components/community/PartnerEventMessageButton";
import SitGuruScreen from "@/components/SitGuruScreen";
import { AppFonts } from "@/constants/fonts";
import {
  createPartnerEvent,
  fetchPartnerEvent,
  partnerEventAction,
  savePartnerEvent,
  type PartnerMobileEvent,
} from "@/hooks/data/usePartnerCommunityEvents";

type FormState = {
  title: string;
  short_description: string;
  description: string;
  start_at: string;
  venue_name: string;
  address_line_1: string;
  city: string;
  state: string;
  postal_code: string;
  image_original_url: string;
  pet_friendly: boolean;
  is_free: boolean;
};

const emptyForm: FormState = {
  title: "",
  short_description: "",
  description: "",
  start_at: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
  venue_name: "",
  address_line_1: "",
  city: "",
  state: "",
  postal_code: "",
  image_original_url: "",
  pet_friendly: true,
  is_free: true,
};

function toLocalInput(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return emptyForm.start_at;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function eventToForm(event: PartnerMobileEvent): FormState {
  return {
    title: event.title || "",
    short_description: event.short_description || "",
    description: event.description || "",
    start_at: toLocalInput(event.start_at),
    venue_name: event.venue_name || "",
    address_line_1: event.address_line_1 || "",
    city: event.city || "",
    state: event.state || "",
    postal_code: event.postal_code || "",
    image_original_url: event.image_original_url || "",
    pet_friendly: event.pet_friendly,
    is_free: event.is_free,
  };
}

export default function PartnerCommunityEventEditScreen() {
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const eventId = params.id ? String(params.id) : "";
  const isCreate = !eventId || params.mode === "create";

  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!eventId || isCreate) return;
      setLoading(true);
      const result = await fetchPartnerEvent(eventId);
      if (cancelled) return;
      if (!result.event) {
        setError(result.error || "Event not found.");
        setLoading(false);
        return;
      }
      setForm(eventToForm(result.event));
      setStatus(result.event.status);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId, isCreate]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function payloadFromForm() {
    return {
      title: form.title,
      short_description: form.short_description,
      description: form.description,
      start_at: fromLocalInput(form.start_at),
      venue_name: form.venue_name,
      address_line_1: form.address_line_1,
      city: form.city,
      state: form.state,
      postal_code: form.postal_code,
      image_original_url: form.image_original_url || null,
      pet_friendly: form.pet_friendly,
      is_free: form.is_free,
    };
  }

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");

    if (isCreate) {
      const result = await createPartnerEvent(payloadFromForm());
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace({
        pathname: "/partner-community-event-edit",
        params: { id: result.event.id },
      });
      setMessage("Draft created.");
      return;
    }

    const result = await savePartnerEvent(eventId, payloadFromForm());
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStatus(result.event.status);
    setMessage("Saved.");
  }

  async function submitForReview() {
    if (!eventId) return;
    setSaving(true);
    setError("");
    const saveResult = await savePartnerEvent(eventId, payloadFromForm());
    if (!saveResult.ok) {
      setSaving(false);
      setError(saveResult.error);
      return;
    }
    const result = await partnerEventAction(eventId, "submit");
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStatus("pending_review");
    setMessage("Submitted for SitGuru review.");
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
      <Pressable
        style={styles.backRow}
        onPress={() => router.push("/partner-community-events")}
      >
        <ChevronLeft color="#0D5C3A" size={22} />
        <Text style={styles.backText}>My events</Text>
      </Pressable>

      <Text style={styles.title}>{isCreate ? "Create event" : "Edit event"}</Text>
      <Text style={styles.status}>Status: {status.replace(/_/g, " ")}</Text>

      <Field label="Event name">
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={(value) => update("title", value)}
          placeholder="Adoption Saturday"
          placeholderTextColor="#94a3b8"
        />
      </Field>

      <Field label="Short description">
        <TextInput
          style={[styles.input, styles.multiline]}
          value={form.short_description}
          onChangeText={(value) => update("short_description", value)}
          placeholder="One-line tease for the card"
          placeholderTextColor="#94a3b8"
          multiline
        />
      </Field>

      <Field label="Full description">
        <TextInput
          style={[styles.input, styles.multilineTall]}
          value={form.description}
          onChangeText={(value) => update("description", value)}
          placeholder="Details for pet parents"
          placeholderTextColor="#94a3b8"
          multiline
        />
      </Field>

      <Field label="Starts (local)">
        <TextInput
          style={styles.input}
          value={form.start_at}
          onChangeText={(value) => update("start_at", value)}
          placeholder="YYYY-MM-DDTHH:mm"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
        />
      </Field>

      <Field label="Venue">
        <TextInput
          style={styles.input}
          value={form.venue_name}
          onChangeText={(value) => update("venue_name", value)}
          placeholder="Business or park name"
          placeholderTextColor="#94a3b8"
        />
      </Field>

      <Field label="Address">
        <TextInput
          style={styles.input}
          value={form.address_line_1}
          onChangeText={(value) => update("address_line_1", value)}
          placeholder="Street address"
          placeholderTextColor="#94a3b8"
        />
      </Field>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field label="City">
            <TextInput
              style={styles.input}
              value={form.city}
              onChangeText={(value) => update("city", value)}
              placeholderTextColor="#94a3b8"
            />
          </Field>
        </View>
        <View style={{ width: 80 }}>
          <Field label="State">
            <TextInput
              style={styles.input}
              value={form.state}
              onChangeText={(value) => update("state", value)}
              autoCapitalize="characters"
              placeholderTextColor="#94a3b8"
            />
          </Field>
        </View>
      </View>

      <Field label="ZIP">
        <TextInput
          style={styles.input}
          value={form.postal_code}
          onChangeText={(value) => update("postal_code", value)}
          keyboardType="number-pad"
          placeholderTextColor="#94a3b8"
        />
      </Field>

      <Field label="Image URL">
        <TextInput
          style={styles.input}
          value={form.image_original_url}
          onChangeText={(value) => update("image_original_url", value)}
          placeholder="https://…"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
        />
      </Field>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Pet friendly</Text>
        <Switch
          value={form.pet_friendly}
          onValueChange={(value) => update("pet_friendly", value)}
          trackColor={{ true: "#0D5C3A", false: "#cbd5e1" }}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Free event</Text>
        <Switch
          value={form.is_free}
          onValueChange={(value) => update("is_free", value)}
          trackColor={{ true: "#0D5C3A", false: "#cbd5e1" }}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable
        style={styles.primaryButton}
        disabled={saving}
        onPress={() => void save()}
      >
        <Text style={styles.primaryButtonText}>
          {saving ? "Saving…" : isCreate ? "Create draft" : "Save changes"}
        </Text>
      </Pressable>

      {!isCreate ? (
        <>
          <PartnerEventMessageButton eventId={eventId} eventTitle={form.title || "Event"} />
          <Pressable
            style={styles.secondaryButton}
            disabled={saving || status === "pending_review"}
            onPress={() => void submitForReview()}
          >
            <Text style={styles.secondaryButtonText}>Submit for review</Text>
          </Pressable>
          {status === "published" ? (
            <Pressable
              style={styles.secondaryButton}
              onPress={() =>
                router.push({
                  pathname: "/partner-community-event-promote",
                  params: { id: eventId },
                })
              }
            >
              <Text style={styles.secondaryButtonText}>Promote & share</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </SitGuruScreen>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
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
  title: {
    fontFamily: AppFonts.extraBold,
    fontSize: 28,
    color: "#0f172a",
  },
  status: {
    fontFamily: AppFonts.semiBold,
    color: "#64748b",
    textTransform: "capitalize",
    marginBottom: 8,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: AppFonts.bold,
    color: "#334155",
    fontSize: 13,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    fontFamily: AppFonts.medium,
    color: "#0f172a",
  },
  multiline: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  multilineTall: {
    minHeight: 120,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  switchLabel: {
    fontFamily: AppFonts.bold,
    color: "#334155",
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#0D5C3A",
    alignItems: "center",
    justifyContent: "center",
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
    borderColor: "#a7f3d0",
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#0D5C3A",
    fontFamily: AppFonts.bold,
  },
  error: {
    fontFamily: AppFonts.semiBold,
    color: "#b91c1c",
  },
  message: {
    fontFamily: AppFonts.semiBold,
    color: "#0D5C3A",
  },
});
