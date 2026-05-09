"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  HeartPulse,
  Loader2,
  PawPrint,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type EmergencyProfile = {
  id: string;
  email: string | null;
  emergency_contact: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  emergency_vet_name: string | null;
  emergency_vet_phone: string | null;
  emergency_notes: string | null;
};

type EmergencyForm = {
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  emergency_vet_name: string;
  emergency_vet_phone: string;
  emergency_notes: string;
};

type RawProfileRow = {
  emergency_contact?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  emergency_vet_name?: string | null;
  emergency_vet_phone?: string | null;
  emergency_notes?: string | null;
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

const initialForm: EmergencyForm = {
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relationship: "",
  emergency_vet_name: "",
  emergency_vet_phone: "",
  emergency_notes: "",
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

function formatPhoneWithDashes(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;

  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function buildEmergencyContactSummary(form: EmergencyForm) {
  const name = form.emergency_contact_name.trim();
  const phone = formatPhoneWithDashes(form.emergency_contact_phone);
  const relationship = form.emergency_contact_relationship.trim();

  return [name, relationship, phone].filter(Boolean).join(" • ");
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

function buildEmergencyProfile(
  row: RawProfileRow | null,
  user: SupabaseUserLike,
): EmergencyProfile {
  const metadata = user.user_metadata ?? null;

  return {
    id: user.id,
    email: user.email ?? null,
    emergency_contact:
      readString(row?.emergency_contact) ||
      readMetadataString(metadata, ["emergency_contact"]) ||
      null,
    emergency_contact_name:
      readString(row?.emergency_contact_name) ||
      readMetadataString(metadata, ["emergency_contact_name"]) ||
      null,
    emergency_contact_phone:
      readString(row?.emergency_contact_phone) ||
      readMetadataString(metadata, ["emergency_contact_phone"]) ||
      null,
    emergency_contact_relationship:
      readString(row?.emergency_contact_relationship) ||
      readMetadataString(metadata, ["emergency_contact_relationship"]) ||
      null,
    emergency_vet_name:
      readString(row?.emergency_vet_name) ||
      readMetadataString(metadata, ["emergency_vet_name"]) ||
      null,
    emergency_vet_phone:
      readString(row?.emergency_vet_phone) ||
      readMetadataString(metadata, ["emergency_vet_phone"]) ||
      null,
    emergency_notes:
      readString(row?.emergency_notes) ||
      readMetadataString(metadata, ["emergency_notes"]) ||
      null,
  };
}

function profileToForm(profile: EmergencyProfile | null): EmergencyForm {
  return {
    emergency_contact_name: profile?.emergency_contact_name || "",
    emergency_contact_phone: formatPhoneWithDashes(
      profile?.emergency_contact_phone || "",
    ),
    emergency_contact_relationship:
      profile?.emergency_contact_relationship || "",
    emergency_vet_name: profile?.emergency_vet_name || "",
    emergency_vet_phone: formatPhoneWithDashes(
      profile?.emergency_vet_phone || "",
    ),
    emergency_notes: profile?.emergency_notes || "",
  };
}

async function fetchEmergencyProfile(user: SupabaseUserLike) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "emergency_contact, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, emergency_vet_name, emergency_vet_phone, emergency_notes",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!error) {
    return buildEmergencyProfile((data as RawProfileRow | null) ?? null, user);
  }

  throw new Error(
    `Emergency Contact could not load: ${error.message}. Make sure the profiles table has emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, emergency_vet_name, emergency_vet_phone, and emergency_notes columns.`,
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

async function saveEmergencyContact(userId: string, form: EmergencyForm) {
  const emergencyContactSummary = buildEmergencyContactSummary(form);

  const payload = {
    emergency_contact: emergencyContactSummary || null,
    emergency_contact_name: form.emergency_contact_name.trim() || null,
    emergency_contact_phone:
      formatPhoneWithDashes(form.emergency_contact_phone) || null,
    emergency_contact_relationship:
      form.emergency_contact_relationship.trim() || null,
    emergency_vet_name: form.emergency_vet_name.trim() || null,
    emergency_vet_phone: formatPhoneWithDashes(form.emergency_vet_phone) || null,
    emergency_notes: form.emergency_notes.trim() || null,
  };

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId);

  if (error) {
    throw new Error(`Emergency Contact did not save: ${error.message}`);
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
        const active = step.number === 5;

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

function FieldInput({
  id,
  label,
  helper,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  helper: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label htmlFor={id} className="grid gap-2">
      <span className="text-sm font-black text-slate-950">{label}</span>
      <input
        id={id}
        type={type}
        inputMode={type === "tel" ? "tel" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 text-sm font-bold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
      />
      <span className="text-xs font-semibold leading-5 text-slate-500">
        {helper}
      </span>
    </label>
  );
}

function FieldTextarea({
  id,
  label,
  helper,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  helper: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label htmlFor={id} className="grid gap-2">
      <span className="text-sm font-black text-slate-950">{label}</span>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 text-sm font-semibold leading-6 text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
      />
      <span className="text-xs font-semibold leading-5 text-slate-500">
        {helper}
      </span>
    </label>
  );
}

export default function CustomerEmergencyContactPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);
  const [form, setForm] = useState<EmergencyForm>(initialForm);
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

  const emergencyContactComplete = useMemo(() => {
    return Boolean(
      form.emergency_contact_name.trim() &&
        form.emergency_contact_phone.trim(),
    );
  }, [form.emergency_contact_name, form.emergency_contact_phone]);

  const completionCount = useMemo(() => {
    return [
      form.emergency_contact_name,
      form.emergency_contact_phone,
      form.emergency_contact_relationship,
      form.emergency_vet_name,
      form.emergency_vet_phone,
      form.emergency_notes,
    ].filter((value) => value.trim()).length;
  }, [form]);

  const statusLabel = emergencyContactComplete ? "Complete" : "Recommended";
  const statusTone = emergencyContactComplete
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
        fetchEmergencyProfile(user),
        fetchSetupStatus(user.id),
      ]);

      setProfile(profileData);
      setForm(profileToForm(profileData));
      setSetupStatus(setupData);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not load your Emergency Contact.",
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

    if (!form.emergency_contact_name.trim()) {
      setErrorMessage("Please enter an emergency contact name.");
      setSaving(false);
      return false;
    }

    if (!form.emergency_contact_phone.trim()) {
      setErrorMessage("Please enter an emergency contact phone number.");
      setSaving(false);
      return false;
    }

    try {
      await saveEmergencyContact(profile.id, form);

      const [profileData, setupData] = await Promise.all([
        fetchEmergencyProfile({
          id: profile.id,
          email: profile.email,
          user_metadata: {},
        }),
        fetchSetupStatus(profile.id),
      ]);

      setProfile(profileData);
      setForm(profileToForm(profileData));
      setSetupStatus(setupData);
      setMessage("Emergency Contact saved. Step 5 is complete.");
      router.refresh();
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not save your Emergency Contact.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndContinue() {
    const saved = await handleSave();

    if (saved) {
      router.push(routes.notifications);
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
              Loading Emergency Contact...
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
            Step 5 · {statusLabel}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="bg-[linear-gradient(120deg,#10b981_0%,#34d399_52%,#a7f3d0_100%)] px-6 py-8 sm:px-8 lg:px-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-950/80">
              Pet Parent Setup · Step 5 of 7
            </p>

            <h1 className="mt-4 text-5xl font-black tracking-[-0.065em] text-slate-950 md:text-6xl">
              Emergency Contact
            </h1>

            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-800/75">
              Add a trusted backup contact and optional vet details so SitGuru
              and your Guru have the right information if something urgent comes
              up.
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
                      <HeartPulse className="h-6 w-6" />
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
                        Safety readiness
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-slate-950">
                        {emergencyContactComplete
                          ? "Contact Ready"
                          : "Recommended"}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-950">
                      Details completed
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {completionCount}/6 emergency detail sections have
                      information.
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
                      [
                        "Contact Name",
                        Boolean(form.emergency_contact_name.trim()),
                      ],
                      [
                        "Contact Phone",
                        Boolean(form.emergency_contact_phone.trim()),
                      ],
                      [
                        "Relationship",
                        Boolean(form.emergency_contact_relationship.trim()),
                      ],
                      ["Vet Name", Boolean(form.emergency_vet_name.trim())],
                      ["Vet Phone", Boolean(form.emergency_vet_phone.trim())],
                      ["Notes", Boolean(form.emergency_notes.trim())],
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
                    Emergency details help support booking safety, Guru care
                    context, admin support, and future urgent care workflows.
                    Your Guru should never have to guess who to contact.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSave}
                className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <UserRound className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-950">
                      Backup Contact Details
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      Choose someone who can help make care decisions or be
                      reached if you are unavailable.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5">
                  <div className="grid gap-5 lg:grid-cols-2">
                    <FieldInput
                      id="emergency_contact_name"
                      label="Emergency contact name"
                      helper="This is the primary backup person for urgent care situations."
                      value={form.emergency_contact_name}
                      onChange={(value) =>
                        setForm({
                          ...form,
                          emergency_contact_name: value,
                        })
                      }
                      placeholder="Example: Jane Smith"
                    />

                    <FieldInput
                      id="emergency_contact_phone"
                      label="Emergency contact phone"
                      helper="Dashes are added automatically."
                      value={form.emergency_contact_phone}
                      onChange={(value) =>
                        setForm({
                          ...form,
                          emergency_contact_phone:
                            formatPhoneWithDashes(value),
                        })
                      }
                      placeholder="Example: 555-555-5555"
                      type="tel"
                    />
                  </div>

                  <FieldInput
                    id="emergency_contact_relationship"
                    label="Relationship"
                    helper="Examples: spouse, parent, friend, neighbor, roommate, or family member."
                    value={form.emergency_contact_relationship}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        emergency_contact_relationship: value,
                      })
                    }
                    placeholder="Example: Spouse, neighbor, parent, friend"
                  />

                  <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <Phone className="h-5 w-5 text-emerald-700" />
                      <div>
                        <p className="text-sm font-black text-slate-950">
                          Optional vet details
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-600">
                          Helpful for future emergency workflows and Guru
                          context.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <FieldInput
                        id="emergency_vet_name"
                        label="Veterinarian or clinic"
                        helper="Add your preferred vet, clinic, or animal hospital."
                        value={form.emergency_vet_name}
                        onChange={(value) =>
                          setForm({
                            ...form,
                            emergency_vet_name: value,
                          })
                        }
                        placeholder="Example: SitGuru Animal Hospital"
                      />

                      <FieldInput
                        id="emergency_vet_phone"
                        label="Vet phone"
                        helper="Dashes are added automatically."
                        value={form.emergency_vet_phone}
                        onChange={(value) =>
                          setForm({
                            ...form,
                            emergency_vet_phone:
                              formatPhoneWithDashes(value),
                          })
                        }
                        placeholder="Example: 555-555-5555"
                        type="tel"
                      />
                    </div>
                  </div>

                  <FieldTextarea
                    id="emergency_notes"
                    label="Emergency notes"
                    helper="Add anything SitGuru, your Guru, or a backup contact should know."
                    value={form.emergency_notes}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        emergency_notes: value,
                      })
                    }
                    placeholder="Example: If I cannot be reached, call my emergency contact first. My vet is approved for urgent care decisions if needed."
                  />

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-center gap-3">
                      <PawPrint className="h-5 w-5 text-emerald-700" />
                      <p className="text-sm font-black text-slate-950">
                        SitGuru safety impact
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      Emergency contact information can support booking safety,
                      urgent communication, admin help, and care coordination
                      when a Pet Parent is unavailable.
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
                      {saving ? "Saving..." : "Save Emergency Contact"}
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
                      href={routes.careNotes}
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous: Care Notes
                    </Link>

                    <Link
                      href={routes.notifications}
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Next: Notifications
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
                    Step 5 summary
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">
                    Emergency details support safer care coordination.
                  </h3>
                  <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-700">
                    This step gives SitGuru and your Guru a backup contact and
                    optional vet details to reference if something urgent needs
                    attention during a booking.
                  </p>
                </div>

                <Link
                  href={routes.notifications}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  Continue to Step 6
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}