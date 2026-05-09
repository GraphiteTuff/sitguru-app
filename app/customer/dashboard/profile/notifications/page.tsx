"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Heart,
  Loader2,
  Mail,
  Megaphone,
  MessageCircle,
  PawPrint,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type NotificationsProfile = {
  id: string;
  email: string | null;
  email_notifications: boolean;
  text_notifications: boolean;
  push_notifications: boolean;
  booking_reminders: boolean;
  care_updates: boolean;
  message_alerts: boolean;
  marketing_notifications: boolean;
};

type NotificationsForm = {
  email_notifications: boolean;
  text_notifications: boolean;
  push_notifications: boolean;
  booking_reminders: boolean;
  care_updates: boolean;
  message_alerts: boolean;
  marketing_notifications: boolean;
};

type RawProfileRow = {
  email_notifications?: boolean | null;
  text_notifications?: boolean | null;
  push_notifications?: boolean | null;
  booking_reminders?: boolean | null;
  care_updates?: boolean | null;
  message_alerts?: boolean | null;
  marketing_notifications?: boolean | null;
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

const initialForm: NotificationsForm = {
  email_notifications: true,
  text_notifications: false,
  push_notifications: false,
  booking_reminders: true,
  care_updates: true,
  message_alerts: true,
  marketing_notifications: false,
};

function readBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
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

function buildNotificationsProfile(
  row: RawProfileRow | null,
  user: SupabaseUserLike,
): NotificationsProfile {
  return {
    id: user.id,
    email: user.email ?? null,
    email_notifications: readBoolean(row?.email_notifications, true),
    text_notifications: readBoolean(row?.text_notifications),
    push_notifications: readBoolean(row?.push_notifications),
    booking_reminders: readBoolean(row?.booking_reminders, true),
    care_updates: readBoolean(row?.care_updates, true),
    message_alerts: readBoolean(row?.message_alerts, true),
    marketing_notifications: readBoolean(row?.marketing_notifications),
  };
}

function profileToForm(
  profile: NotificationsProfile | null,
): NotificationsForm {
  return {
    email_notifications: profile?.email_notifications ?? true,
    text_notifications: profile?.text_notifications ?? false,
    push_notifications: profile?.push_notifications ?? false,
    booking_reminders: profile?.booking_reminders ?? true,
    care_updates: profile?.care_updates ?? true,
    message_alerts: profile?.message_alerts ?? true,
    marketing_notifications: profile?.marketing_notifications ?? false,
  };
}

async function fetchNotificationsProfile(user: SupabaseUserLike) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "email_notifications, text_notifications, push_notifications, booking_reminders, care_updates, message_alerts, marketing_notifications",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!error) {
    return buildNotificationsProfile(
      (data as RawProfileRow | null) ?? null,
      user,
    );
  }

  throw new Error(
    `Notifications could not load: ${error.message}. Make sure the profiles table has email_notifications, text_notifications, push_notifications, booking_reminders, care_updates, message_alerts, and marketing_notifications columns.`,
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

async function saveNotifications(userId: string, form: NotificationsForm) {
  const payload = {
    email_notifications: form.email_notifications,
    text_notifications: form.text_notifications,
    push_notifications: form.push_notifications,
    booking_reminders: form.booking_reminders,
    care_updates: form.care_updates,
    message_alerts: form.message_alerts,
    marketing_notifications: form.marketing_notifications,
  };

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId);

  if (error) {
    throw new Error(`Notifications did not save: ${error.message}`);
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
        const active = step.number === 6;

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

function ToggleCard({
  icon,
  title,
  description,
  checked,
  onChange,
  recommended = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  recommended?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full rounded-[1.45rem] border p-4 text-left transition hover:-translate-y-0.5 ${
        checked
          ? "border-emerald-300 bg-emerald-50 shadow-[0_14px_34px_rgba(16,185,129,0.12)]"
          : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            checked
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-black text-slate-950">{title}</p>
            {recommended ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-amber-800">
                Recommended
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            {description}
          </p>
        </div>

        <div
          className={`mt-1 flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition ${
            checked ? "bg-emerald-600" : "bg-slate-300"
          }`}
          aria-hidden="true"
        >
          <div
            className={`h-6 w-6 rounded-full bg-white shadow-sm transition ${
              checked ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </div>
      </div>

      <div
        className={`mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${
          checked
            ? "bg-emerald-100 text-emerald-800"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {checked ? "Enabled" : "Disabled"}
      </div>
    </button>
  );
}

export default function CustomerNotificationsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<NotificationsProfile | null>(null);
  const [form, setForm] = useState<NotificationsForm>(initialForm);
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

  const notificationsComplete = useMemo(() => {
    return Boolean(
      form.email_notifications ||
        form.text_notifications ||
        form.push_notifications,
    );
  }, [
    form.email_notifications,
    form.text_notifications,
    form.push_notifications,
  ]);

  const channelCount = useMemo(() => {
    return [
      form.email_notifications,
      form.text_notifications,
      form.push_notifications,
    ].filter(Boolean).length;
  }, [
    form.email_notifications,
    form.text_notifications,
    form.push_notifications,
  ]);

  const preferenceCount = useMemo(() => {
    return [
      form.booking_reminders,
      form.care_updates,
      form.message_alerts,
      form.marketing_notifications,
    ].filter(Boolean).length;
  }, [
    form.booking_reminders,
    form.care_updates,
    form.message_alerts,
    form.marketing_notifications,
  ]);

  const statusLabel = notificationsComplete ? "Complete" : "Recommended";
  const statusTone = notificationsComplete
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
        fetchNotificationsProfile(user),
        fetchSetupStatus(user.id),
      ]);

      setProfile(profileData);
      setForm(profileToForm(profileData));
      setSetupStatus(setupData);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not load your Notification Preferences.",
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
      await saveNotifications(profile.id, form);

      const [profileData, setupData] = await Promise.all([
        fetchNotificationsProfile({
          id: profile.id,
          email: profile.email,
          user_metadata: {},
        }),
        fetchSetupStatus(profile.id),
      ]);

      setProfile(profileData);
      setForm(profileToForm(profileData));
      setSetupStatus(setupData);
      setMessage("Notification Preferences saved. Step 6 is complete.");
      router.refresh();
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not save your Notification Preferences.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndContinue() {
    const saved = await handleSave();

    if (saved) {
      router.push(routes.savedGurus);
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
              Loading Notification Preferences...
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
            Step 6 · {statusLabel}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="bg-[linear-gradient(120deg,#10b981_0%,#34d399_52%,#a7f3d0_100%)] px-6 py-8 sm:px-8 lg:px-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-950/80">
              Pet Parent Setup · Step 6 of 7
            </p>

            <h1 className="mt-4 text-5xl font-black tracking-[-0.065em] text-slate-950 md:text-6xl">
              Notifications
            </h1>

            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-800/75">
              Choose how SitGuru should keep you updated about bookings,
              messages, care updates, reminders, marketplace updates, and
              promotions. PawPerks enrollment is automatic for all Pet Parents.
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
                      <Bell className="h-6 w-6" />
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
                        Alert readiness
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-slate-950">
                        {notificationsComplete ? "Alerts Ready" : "Recommended"}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-950">
                      Notification channels
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {channelCount}/3 notification channels are enabled.
                    </p>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${Math.round((channelCount / 3) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-950">
                      Alert types
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {preferenceCount}/4 alert types are enabled.
                    </p>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${Math.round((preferenceCount / 4) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2">
                    {[
                      ["Email", form.email_notifications],
                      ["Text", form.text_notifications],
                      ["Push", form.push_notifications],
                      ["Bookings", form.booking_reminders],
                      ["Care Updates", form.care_updates],
                      ["Messages", form.message_alerts],
                      ["Marketplace", form.marketing_notifications],
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
                    Notification settings help SitGuru reach you about booking
                    requests, care updates, messages, reminders, safety-related
                    information, marketplace updates, and promotions. PawPerks is
                    automatic for Pet Parents and does not require notification
                    enrollment.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSave}
                className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Bell className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-950">
                      Notification Preferences
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      Pick the channels and alert types that should keep your Pet
                      Parent account updated. PawPerks is automatic and does not
                      need a toggle.
                    </p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <section>
                    <p className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
                      How SitGuru can contact you
                    </p>

                    <div className="grid gap-4">
                      <ToggleCard
                        icon={<Mail className="h-5 w-5" />}
                        title="Email notifications"
                        description="Receive booking confirmations, account updates, care updates, and important SitGuru messages by email."
                        checked={form.email_notifications}
                        recommended
                        onChange={(checked) =>
                          setForm({
                            ...form,
                            email_notifications: checked,
                          })
                        }
                      />

                      <ToggleCard
                        icon={<Smartphone className="h-5 w-5" />}
                        title="Text notifications"
                        description="Receive important booking and care reminders by text when phone messaging is available."
                        checked={form.text_notifications}
                        recommended
                        onChange={(checked) =>
                          setForm({
                            ...form,
                            text_notifications: checked,
                          })
                        }
                      />

                      <ToggleCard
                        icon={<Bell className="h-5 w-5" />}
                        title="Push notifications"
                        description="Receive app or browser alerts for future SitGuru updates when supported."
                        checked={form.push_notifications}
                        onChange={(checked) =>
                          setForm({
                            ...form,
                            push_notifications: checked,
                          })
                        }
                      />
                    </div>
                  </section>

                  <section>
                    <p className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
                      What SitGuru should notify you about
                    </p>

                    <div className="grid gap-4">
                      <ToggleCard
                        icon={<CalendarClock className="h-5 w-5" />}
                        title="Booking reminders"
                        description="Reminders for upcoming bookings, schedule changes, and booking-related actions."
                        checked={form.booking_reminders}
                        recommended
                        onChange={(checked) =>
                          setForm({
                            ...form,
                            booking_reminders: checked,
                          })
                        }
                      />

                      <ToggleCard
                        icon={<Heart className="h-5 w-5" />}
                        title="Care updates"
                        description="Updates from Gurus related to care activity, notes, and completed visits."
                        checked={form.care_updates}
                        recommended
                        onChange={(checked) =>
                          setForm({
                            ...form,
                            care_updates: checked,
                          })
                        }
                      />

                      <ToggleCard
                        icon={<MessageCircle className="h-5 w-5" />}
                        title="Message alerts"
                        description="Alerts when a Guru, Pet Parent, or SitGuru support sends an important message."
                        checked={form.message_alerts}
                        recommended
                        onChange={(checked) =>
                          setForm({
                            ...form,
                            message_alerts: checked,
                          })
                        }
                      />

                      <ToggleCard
                        icon={<Megaphone className="h-5 w-5" />}
                        title="Marketplace updates and promotions"
                        description="Optional updates about promotions, referral campaigns, marketplace news, local offers, and new SitGuru features."
                        checked={form.marketing_notifications}
                        onChange={(checked) =>
                          setForm({
                            ...form,
                            marketing_notifications: checked,
                          })
                        }
                      />
                    </div>
                  </section>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-center gap-3">
                      <PawPrint className="h-5 w-5 text-emerald-700" />
                      <p className="text-sm font-black text-slate-950">
                        SitGuru communication impact
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      Notification preferences can support booking updates,
                      message alerts, care reminders, safety communication,
                      customer support, marketplace engagement, and promotional
                      updates. PawPerks is automatically included for all Pet
                      Parents.
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
                      {saving ? "Saving..." : "Save Notifications"}
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
                      href={routes.emergencyContact}
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous: Emergency Contact
                    </Link>

                    <Link
                      href={routes.savedGurus}
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Next: Saved Gurus
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
                    Step 6 summary
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">
                    Notifications help you avoid missing care updates.
                  </h3>
                  <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-700">
                    Keep at least one channel enabled so SitGuru can reach you
                    for booking activity, Guru messages, reminders, care updates,
                    and account-related information. PawPerks is automatic for
                    every Pet Parent.
                  </p>
                </div>

                <Link
                  href={routes.savedGurus}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  Continue to Step 7
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}