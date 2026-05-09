"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Loader2,
  PawPrint,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type CareNotesProfile = {
  id: string;
  email: string | null;
  care_preferences: string | null;
  access_instructions: string | null;
  feeding_notes: string | null;
  medication_notes: string | null;
  behavior_notes: string | null;
  house_rules: string | null;
};

type CareNotesForm = {
  care_preferences: string;
  access_instructions: string;
  feeding_notes: string;
  medication_notes: string;
  behavior_notes: string;
  house_rules: string;
};

type RawProfileRow = {
  care_preferences?: string | null;
  preferences?: string | null;
  notes?: string | null;
  access_instructions?: string | null;
  entry_notes?: string | null;
  feeding_notes?: string | null;
  medication_notes?: string | null;
  behavior_notes?: string | null;
  house_rules?: string | null;
};

type SupabaseUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type SetupStatus = {
  basicInfoComplete: boolean;
  serviceLocationComplete: boolean;
  petPassportsComplete: boolean;
  careNotesComplete: boolean;
  emergencyContactComplete: boolean;
  notificationsComplete: boolean;
};

type SetupStepStatus = "complete" | "required" | "recommended" | "optional";

const routes = {
  setupHub: "/customer/dashboard/profile",
  basicInfo: "/customer/dashboard/profile/basic-info",
  serviceLocation: "/customer/dashboard/profile/service-location",
  pets: "/customer/pets",
  careNotes: "/customer/dashboard/profile/care-notes",
  emergencyContact: "/customer/dashboard/profile/emergency-contact",
  notifications: "/customer/dashboard/profile/notifications",
  savedGurus: "/customer/dashboard/profile/saved-gurus",
  login: "/login",
};

const initialForm: CareNotesForm = {
  care_preferences: "",
  access_instructions: "",
  feeding_notes: "",
  medication_notes: "",
  behavior_notes: "",
  house_rules: "",
};

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[],
) {
  for (const key of keys) {
    const value = readString(metadata?.[key]);

    if (value) return value;
  }

  return null;
}

function buildCareNotesProfile(
  row: RawProfileRow | null,
  user: SupabaseUserLike,
): CareNotesProfile {
  const metadata = user.user_metadata ?? null;

  return {
    id: user.id,
    email: user.email ?? null,
    care_preferences:
      readString(row?.care_preferences) ||
      readString(row?.preferences) ||
      readString(row?.notes) ||
      readMetadataString(metadata, [
        "care_preferences",
        "preferences",
        "notes",
      ]) ||
      null,
    access_instructions:
      readString(row?.access_instructions) ||
      readString(row?.entry_notes) ||
      readMetadataString(metadata, ["access_instructions", "entry_notes"]) ||
      null,
    feeding_notes:
      readString(row?.feeding_notes) ||
      readMetadataString(metadata, ["feeding_notes"]) ||
      null,
    medication_notes:
      readString(row?.medication_notes) ||
      readMetadataString(metadata, ["medication_notes"]) ||
      null,
    behavior_notes:
      readString(row?.behavior_notes) ||
      readMetadataString(metadata, ["behavior_notes"]) ||
      null,
    house_rules:
      readString(row?.house_rules) ||
      readMetadataString(metadata, ["house_rules"]) ||
      null,
  };
}

function profileToForm(profile: CareNotesProfile | null): CareNotesForm {
  return {
    care_preferences: profile?.care_preferences || "",
    access_instructions: profile?.access_instructions || "",
    feeding_notes: profile?.feeding_notes || "",
    medication_notes: profile?.medication_notes || "",
    behavior_notes: profile?.behavior_notes || "",
    house_rules: profile?.house_rules || "",
  };
}

function getStepBadgeClassName(status: SetupStepStatus) {
  if (status === "complete") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "required") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "recommended") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

async function fetchCareNotesProfile(user: SupabaseUserLike) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "care_preferences, access_instructions, feeding_notes, medication_notes, behavior_notes, house_rules",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!error) {
    return buildCareNotesProfile((data as RawProfileRow | null) ?? null, user);
  }

  throw new Error(
    `Care Notes could not load: ${error.message}. Make sure the profiles table has care_preferences, access_instructions, feeding_notes, medication_notes, behavior_notes, and house_rules columns.`,
  );
}

async function fetchSetupStatus(userId: string): Promise<SetupStatus> {
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, first_name, phone, service_address, service_city, service_state, service_zip, care_preferences, emergency_contact, emergency_contact_name, emergency_contact_phone, email_notifications, push_notifications, text_notifications",
    )
    .eq("id", userId)
    .maybeSingle();

  const { data: pets } = await supabase
    .from("pets")
    .select("id")
    .eq("owner_id", userId)
    .limit(1);

  return {
    basicInfoComplete: Boolean(
      profile && (profile.full_name || profile.first_name) && profile.phone,
    ),
    serviceLocationComplete: Boolean(
      profile &&
        profile.service_address &&
        profile.service_city &&
        profile.service_state &&
        profile.service_zip,
    ),
    petPassportsComplete: Boolean(pets && pets.length > 0),
    careNotesComplete: Boolean(profile?.care_preferences),
    emergencyContactComplete: Boolean(
      profile?.emergency_contact ||
        (profile?.emergency_contact_name && profile?.emergency_contact_phone),
    ),
    notificationsComplete: Boolean(
      profile?.email_notifications ||
        profile?.push_notifications ||
        profile?.text_notifications,
    ),
  };
}

async function saveCareNotes(userId: string, form: CareNotesForm) {
  const payload = {
    care_preferences: form.care_preferences.trim() || null,
    access_instructions: form.access_instructions.trim() || null,
    feeding_notes: form.feeding_notes.trim() || null,
    medication_notes: form.medication_notes.trim() || null,
    behavior_notes: form.behavior_notes.trim() || null,
    house_rules: form.house_rules.trim() || null,
  };

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId);

  if (error) {
    throw new Error(`Care Notes did not save: ${error.message}`);
  }
}

function SetupNavigation({ setupStatus }: { setupStatus: SetupStatus }) {
  const steps = [
    {
      number: 1,
      label: "Basic Info",
      href: routes.basicInfo,
      status: setupStatus.basicInfoComplete ? "complete" : "required",
    },
    {
      number: 2,
      label: "Service Location",
      href: routes.serviceLocation,
      status: setupStatus.serviceLocationComplete ? "complete" : "required",
    },
    {
      number: 3,
      label: "Pet Passports",
      href: routes.pets,
      status: setupStatus.petPassportsComplete ? "complete" : "required",
    },
    {
      number: 4,
      label: "Care Notes",
      href: routes.careNotes,
      status: setupStatus.careNotesComplete ? "complete" : "recommended",
    },
    {
      number: 5,
      label: "Emergency",
      href: routes.emergencyContact,
      status: setupStatus.emergencyContactComplete
        ? "complete"
        : "recommended",
    },
    {
      number: 6,
      label: "Notifications",
      href: routes.notifications,
      status: setupStatus.notificationsComplete ? "complete" : "recommended",
    },
    {
      number: 7,
      label: "Saved Gurus",
      href: routes.savedGurus,
      status: "optional",
    },
  ] satisfies Array<{
    number: number;
    label: string;
    href: string;
    status: SetupStepStatus;
  }>;

  return (
    <div className="grid gap-2 md:grid-cols-7">
      {steps.map((step) => {
        const active = step.number === 4;

        return (
          <Link
            key={step.number}
            href={step.href}
            className={`rounded-2xl border px-3 py-3 text-center transition hover:-translate-y-0.5 ${
              active
                ? "border-emerald-300 bg-emerald-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
            }`}
          >
            <span
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black ${getStepBadgeClassName(
                step.status,
              )}`}
            >
              {step.status === "complete" ? "✓" : step.number}
            </span>
            <span className="mt-2 block text-xs font-black text-slate-800">
              {step.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function FieldTextarea({
  id,
  label,
  helper,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  id: string;
  label: string;
  helper: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <label htmlFor={id} className="grid gap-2">
      <span className="text-sm font-black text-slate-950">{label}</span>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 text-sm font-semibold leading-6 text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
      />
      <span className="text-xs font-semibold leading-5 text-slate-500">
        {helper}
      </span>
    </label>
  );
}

export default function CustomerCareNotesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CareNotesProfile | null>(null);
  const [form, setForm] = useState<CareNotesForm>(initialForm);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    basicInfoComplete: false,
    serviceLocationComplete: false,
    petPassportsComplete: false,
    careNotesComplete: false,
    emergencyContactComplete: false,
    notificationsComplete: false,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const careNotesComplete = useMemo(() => {
    return Boolean(
      form.care_preferences.trim() ||
        form.access_instructions.trim() ||
        form.feeding_notes.trim() ||
        form.medication_notes.trim() ||
        form.behavior_notes.trim() ||
        form.house_rules.trim(),
    );
  }, [form]);

  const completionCount = useMemo(() => {
    return [
      form.care_preferences,
      form.access_instructions,
      form.feeding_notes,
      form.medication_notes,
      form.behavior_notes,
      form.house_rules,
    ].filter((value) => value.trim()).length;
  }, [form]);

  const statusLabel = careNotesComplete ? "Complete" : "Recommended";
  const statusTone = careNotesComplete
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-800";

  const loadPage = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    try {
      const [profileData, setupData] = await Promise.all([
        fetchCareNotesProfile(user),
        fetchSetupStatus(user.id),
      ]);

      setProfile(profileData);
      setForm(profileToForm(profileData));
      setSetupStatus(setupData);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not load your Care Notes.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadPage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace(routes.login);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadPage, router]);

  async function handleSave(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!profile?.id || saving) return false;

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      await saveCareNotes(profile.id, form);

      const [profileData, setupData] = await Promise.all([
        fetchCareNotesProfile({
          id: profile.id,
          email: profile.email,
          user_metadata: {},
        }),
        fetchSetupStatus(profile.id),
      ]);

      setProfile(profileData);
      setForm(profileToForm(profileData));
      setSetupStatus(setupData);
      setMessage("Care Notes saved. Step 4 is complete.");
      router.refresh();
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not save your Care Notes.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndContinue() {
    const saved = await handleSave();

    if (saved) {
      router.push(routes.emergencyContact);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_45%,#ecfdf5_100%)]">
        <Header />
        <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-16">
          <div className="rounded-[2rem] border border-emerald-100 bg-white px-8 py-6 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-3 text-base font-bold text-slate-700">
              Loading Care Notes...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] text-slate-950">
      <Header />

      <section className="mx-auto max-w-[1350px] px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={routes.setupHub}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Setup Hub
          </Link>

          <div
            className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${statusTone}`}
          >
            Step 4 · {statusLabel}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="bg-[linear-gradient(120deg,#10b981_0%,#34d399_52%,#a7f3d0_100%)] px-6 py-8 sm:px-8 lg:px-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-950/80">
              Pet Parent Setup · Step 4 of 7
            </p>

            <h1 className="mt-4 text-5xl font-black tracking-[-0.065em] text-slate-950 md:text-6xl">
              Care Notes
            </h1>

            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-800/75">
              Add the home, routine, feeding, medication, behavior, and house
              notes that help Gurus arrive prepared.
            </p>
          </div>

          <div className="p-5 sm:p-6 lg:p-8">
            <SetupNavigation setupStatus={setupStatus} />

            {message || errorMessage ? (
              <div
                className={`mt-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-black ${
                  errorMessage
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {errorMessage ? (
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                )}
                {errorMessage || message}
              </div>
            ) : null}

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
              <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6">
                <div className="rounded-[1.7rem] border border-emerald-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <ClipboardList className="h-6 w-6" />
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
                        Care readiness
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-slate-950">
                        {careNotesComplete ? "Notes Added" : "Recommended"}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-950">
                      Notes completed
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {completionCount}/6 note sections have details.
                    </p>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${Math.round((completionCount / 6) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2">
                    {[
                      ["Overall Care", Boolean(form.care_preferences.trim())],
                      ["Access", Boolean(form.access_instructions.trim())],
                      ["Feeding", Boolean(form.feeding_notes.trim())],
                      ["Medication", Boolean(form.medication_notes.trim())],
                      ["Behavior", Boolean(form.behavior_notes.trim())],
                      ["House Rules", Boolean(form.house_rules.trim())],
                    ].map(([label, complete]) => (
                      <div
                        key={String(label)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-black ${
                          complete
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-amber-200 bg-amber-50 text-amber-800"
                        }`}
                      >
                        {complete ? "✓" : "!"} {String(label)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-700" />
                    <p className="text-sm font-black text-slate-950">
                      Why this step matters
                    </p>
                  </div>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    Care Notes help Gurus understand your home routine before
                    the booking starts. They can reduce confusion around access,
                    feeding, medication, behavior, allergies, and house rules.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSave}
                className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <PawPrint className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-950">
                      Shared Care Instructions
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      These notes can support future bookings and Guru
                      preparation across SitGuru.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5">
                  <FieldTextarea
                    id="care_preferences"
                    label="Overall care preferences"
                    helper="Use this for broad expectations and the most important things your Guru should know."
                    value={form.care_preferences}
                    onChange={(value) =>
                      setForm({ ...form, care_preferences: value })
                    }
                    placeholder="Example: Please keep visits calm, send a message after feeding, and make sure both pets have fresh water before leaving."
                    rows={6}
                  />

                  <FieldTextarea
                    id="access_instructions"
                    label="Access instructions"
                    helper="Add parking, entry, key, gate, apartment, alarm, or lockbox details."
                    value={form.access_instructions}
                    onChange={(value) =>
                      setForm({ ...form, access_instructions: value })
                    }
                    placeholder="Example: Park in the driveway, use the side gate, lockbox is by the back door, and please relock the gate when leaving."
                  />

                  <div className="grid gap-5 lg:grid-cols-2">
                    <FieldTextarea
                      id="feeding_notes"
                      label="Feeding notes"
                      helper="Add feeding amounts, timing, treat limits, water, and food storage location."
                      value={form.feeding_notes}
                      onChange={(value) =>
                        setForm({ ...form, feeding_notes: value })
                      }
                      placeholder="Example: Feed 1 cup at 7 AM and 1 cup at 6 PM. Food is in the pantry. No table scraps."
                    />

                    <FieldTextarea
                      id="medication_notes"
                      label="Medication notes"
                      helper="Add medication schedule, allergies, restrictions, or special health details."
                      value={form.medication_notes}
                      onChange={(value) =>
                        setForm({ ...form, medication_notes: value })
                      }
                      placeholder="Example: Give allergy pill with dinner. Avoid chicken treats. Call me if coughing or limping."
                    />
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <FieldTextarea
                      id="behavior_notes"
                      label="Behavior and routine notes"
                      helper="Add anxiety triggers, walk routine, potty routine, hiding spots, escape risk, or social preferences."
                      value={form.behavior_notes}
                      onChange={(value) =>
                        setForm({ ...form, behavior_notes: value })
                      }
                      placeholder="Example: Gets nervous around loud trucks. Use the shorter walk route. Cat may hide under the bed."
                    />

                    <FieldTextarea
                      id="house_rules"
                      label="House rules"
                      helper="Add restricted rooms, crate rules, furniture rules, cleaning notes, and anything off limits."
                      value={form.house_rules}
                      onChange={(value) =>
                        setForm({ ...form, house_rules: value })
                      }
                      placeholder="Example: Keep basement door closed. Dogs are allowed on the couch but not upstairs. Please wipe paws if raining."
                    />
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-center gap-3">
                      <UtensilsCrossed className="h-5 w-5 text-emerald-700" />
                      <p className="text-sm font-black text-slate-950">
                        SitGuru care impact
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      These notes can support booking details, Guru preparation,
                      care instructions, messages, and admin support context.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {saving ? "Saving..." : "Save Care Notes"}
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSaveAndContinue}
                      className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60"
                    >
                      Save & Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap justify-between gap-3 border-t border-emerald-50 pt-5">
                    <Link
                      href={routes.pets}
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous: Pet Passports
                    </Link>

                    <Link
                      href={routes.emergencyContact}
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Next: Emergency Contact
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </form>
            </div>

            <section className="mt-6 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                    Step 4 summary
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">
                    Care Notes help every booking feel more prepared.
                  </h3>
                  <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-700">
                    Pet Passports explain each pet. Care Notes explain the home,
                    routine, access, and shared instructions that may apply
                    across bookings.
                  </p>
                </div>

                <Link
                  href={routes.emergencyContact}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  Continue to Step 5
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}