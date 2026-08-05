/**
 * Role-independent Edit Profile Settings engine.
 * Identical shell for Pet Parent, Guru, and Ambassador.
 */

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BellRing,
  Check,
  KeyRound,
  Loader2,
  Lock,
  MapPin,
  Save,
  Shield,
  Smartphone,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatFlexiblePhone } from "@/lib/i18n/regional-config";
import { trackEvent } from "@/lib/analytics/track";
import AccountVisibilityWizard from "@/components/profile/AccountVisibilityWizard";
import {
  ROLE_DASHBOARD_HREF,
  ROLE_LABELS,
  ROLE_SERVICE_PROFILE_HREF,
  filterZipDigits,
  passwordStrength,
  type ProfileRole,
  type ProfileTabId,
  type UnifiedProfileDraft,
} from "@/components/profile/profile-types";

type UnifiedProfileSettingsProps = {
  role: ProfileRole;
  /** Optional shell chrome — customer pages pass Header outside. */
  showBackLink?: boolean;
};

const TABS: ReadonlyArray<{
  id: ProfileTabId;
  label: string;
  short: string;
  icon: ReactNode;
}> = [
  {
    id: "contact",
    label: "Contact Details",
    short: "Contact",
    icon: <UserRound className="h-4 w-4" />,
  },
  {
    id: "security",
    label: "Security & Access",
    short: "Security",
    icon: <KeyRound className="h-4 w-4" />,
  },
  {
    id: "ecosystem",
    label: "Ecosystem Rules",
    short: "Alerts",
    icon: <BellRing className="h-4 w-4" />,
  },
];

const EMPTY_DRAFT: UnifiedProfileDraft = {
  fullName: "",
  email: "",
  phone: "",
  zip: "",
  activitySyncLogs: true,
  urgentSmsFallback: false,
};

export default function UnifiedProfileSettings({
  role,
  showBackLink = true,
}: UnifiedProfileSettingsProps) {
  const [tab, setTab] = useState<ProfileTabId>("contact");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<UnifiedProfileDraft>(EMPTY_DRAFT);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const strength = useMemo(
    () => passwordStrength(newPassword),
    [newPassword],
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Please sign in to edit your profile settings.");
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "full_name,first_name,email,phone,service_zip,zip_code,postal_code,email_notifications,text_notifications,push_notifications,booking_reminders,care_updates,message_alerts",
        )
        .eq("id", user.id)
        .maybeSingle();

      const row = (profile || {}) as Record<string, unknown>;
      const fullName =
        String(row.full_name || "").trim() ||
        String(row.first_name || "").trim() ||
        String(user.user_metadata?.full_name || "").trim() ||
        "";
      const zip = filterZipDigits(
        String(
          row.service_zip || row.zip_code || row.postal_code || "",
        ),
      );

      setDraft({
        fullName,
        email: String(row.email || user.email || ""),
        phone: formatFlexiblePhone(String(row.phone || "")),
        zip,
        activitySyncLogs:
          row.email_notifications !== false &&
          row.push_notifications !== false,
        urgentSmsFallback: Boolean(
          row.text_notifications || row.message_alerts,
        ),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load profile settings.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#account-visibility") {
      setWizardOpen(true);
    }
  }, []);

  function patchDraft<K extends keyof UnifiedProfileDraft>(
    key: K,
    value: UnifiedProfileDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveContact() {
    if (!userId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const zip = filterZipDigits(draft.zip);
      if (zip && zip.length !== 5) {
        throw new Error("ZIP code must be exactly 5 digits.");
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: draft.fullName.trim(),
          phone: draft.phone.trim() || null,
          service_zip: zip || null,
          zip_code: zip || null,
          postal_code: zip || null,
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      if (draft.email.trim() && draft.email !== "") {
        const { error: emailError } = await supabase.auth.updateUser({
          email: draft.email.trim(),
        });
        if (emailError) {
          // Email change may require confirmation — surface softly.
          setMessage(
            `Contact details saved. ${emailError.message}`,
          );
        } else {
          setMessage("Contact details saved.");
        }
      } else {
        setMessage("Contact details saved.");
      }

      await trackEvent({
        eventName: "profile_contact_saved",
        eventType: "settings",
        role,
        source: "unified_profile_settings",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save contact.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSecurity() {
    if (!userId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (!strength.meetsMinimum) {
        throw new Error("New password must be at least 8 characters.");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("New password and confirmation do not match.");
      }
      if (!currentPassword) {
        throw new Error("Enter your current password to continue.");
      }

      const email = draft.email || undefined;
      if (!email) {
        throw new Error("Missing account email for verification.");
      }

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (reauthError) {
        throw new Error("Current password is incorrect.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated successfully.");

      await trackEvent({
        eventName: "profile_password_updated",
        eventType: "settings",
        role,
        source: "unified_profile_settings",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update password.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveEcosystem() {
    if (!userId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          email_notifications: draft.activitySyncLogs,
          push_notifications: draft.activitySyncLogs,
          booking_reminders: draft.activitySyncLogs,
          care_updates: draft.activitySyncLogs,
          text_notifications: draft.urgentSmsFallback,
          message_alerts: draft.urgentSmsFallback,
        })
        .eq("id", userId);

      if (updateError) throw updateError;
      setMessage("Ecosystem notification rules saved.");

      await trackEvent({
        eventName: "profile_ecosystem_saved",
        eventType: "settings",
        role,
        source: "unified_profile_settings",
        metadata: {
          activitySyncLogs: draft.activitySyncLogs,
          urgentSmsFallback: draft.urgentSmsFallback,
        },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save notification rules.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (tab === "contact") return saveContact();
    if (tab === "security") return saveSecurity();
    return saveEcosystem();
  }

  const serviceHref = ROLE_SERVICE_PROFILE_HREF[role];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {showBackLink ? (
        <Link
          href={ROLE_DASHBOARD_HREF[role]}
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 transition hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {ROLE_LABELS[role]} dashboard
        </Link>
      ) : null}

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            {ROLE_LABELS[role]} · Settings
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
            Edit Profile Settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
            Manage contact details, security, and ecosystem alerts in one place —
            identical across every SitGuru role.
          </p>
        </div>
        {serviceHref ? (
          <Link
            href={serviceHref}
            className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
          >
            {role === "guru" ? "Guru service profile" : "Profile setup checklist"}
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center rounded-3xl border border-emerald-100 bg-white py-16 shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:items-start">
          {/* Desktop sticky tab rail · Mobile swipe row */}
          <aside className="lg:sticky lg:top-24">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
              {TABS.map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTab(item.id);
                      setError("");
                      setMessage("");
                    }}
                    className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border px-4 text-sm font-black transition lg:w-full ${
                      active
                        ? "border-[#0D5C3A] bg-[#0D5C3A] text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    {item.icon}
                    <span className="lg:hidden">{item.short}</span>
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="space-y-5">
            <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              {error ? (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
                  {error}
                </div>
              ) : null}
              {message ? (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                  {message}
                </div>
              ) : null}

              {tab === "contact" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    value={draft.fullName}
                    onChange={(value) => patchDraft("fullName", value)}
                    icon={<UserRound className="h-4 w-4" />}
                    autoComplete="name"
                  />
                  <Field
                    label="Email"
                    type="email"
                    value={draft.email}
                    onChange={(value) => patchDraft("email", value)}
                    icon={<Shield className="h-4 w-4" />}
                    autoComplete="email"
                  />
                  <Field
                    label="Mobile phone"
                    value={draft.phone}
                    onChange={(value) =>
                      patchDraft("phone", formatFlexiblePhone(value))
                    }
                    icon={<Smartphone className="h-4 w-4" />}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                  <Field
                    label="ZIP code"
                    value={draft.zip}
                    onChange={(value) =>
                      patchDraft("zip", filterZipDigits(value))
                    }
                    icon={<MapPin className="h-4 w-4" />}
                    inputMode="numeric"
                    maxLength={5}
                    hint="5-digit US ZIP"
                  />
                </div>
              ) : null}

              {tab === "security" ? (
                <div className="grid max-w-xl gap-4">
                  <Field
                    label="Current password"
                    type="password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    icon={<Lock className="h-4 w-4" />}
                    autoComplete="current-password"
                  />
                  <Field
                    label="New password"
                    type="password"
                    value={newPassword}
                    onChange={setNewPassword}
                    icon={<KeyRound className="h-4 w-4" />}
                    autoComplete="new-password"
                  />
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">Strength meter</span>
                      <span
                        className={
                          strength.meetsMinimum
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }
                      >
                        {newPassword
                          ? `${strength.label} · ${strength.meetsMinimum ? "8+ ok" : "need 8 chars"}`
                          : "8 character minimum"}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#0D5C3A] transition-[width] duration-300 ease-out"
                        style={{
                          width: `${newPassword ? Math.max(8, strength.pct) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <Field
                    label="Confirm password"
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    icon={<Check className="h-4 w-4" />}
                    autoComplete="new-password"
                  />
                </div>
              ) : null}

              {tab === "ecosystem" ? (
                <div className="grid gap-3">
                  <ToggleCard
                    title="Daily activity tracking sync logs"
                    description="Email and push digests when bookings, visits, and dashboard activity sync."
                    checked={draft.activitySyncLogs}
                    onChange={(value) => patchDraft("activitySyncLogs", value)}
                  />
                  <ToggleCard
                    title="Urgent SMS system fallbacks"
                    description="Text message alerts for time-sensitive care, payment, or support escalations."
                    checked={draft.urgentSmsFallback}
                    onChange={(value) => patchDraft("urgentSmsFallback", value)}
                  />
                </div>
              ) : null}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0D5C3A] px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#09462C] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save {tab === "contact" ? "contact" : tab === "security" ? "security" : "alerts"}
                </button>
              </div>
            </section>

            <section
              id="account-visibility"
              className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Account Visibility Controls
                  </p>
                  <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">
                    Pause or leave SitGuru
                  </h2>
                  <p className="mt-1 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                    Open the retention wizard to pause visibility or permanently
                    delete — feedback is captured before any database mutation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWizardOpen(true)}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Manage visibility
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      <AccountVisibilityWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        role={role}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  icon,
  hint,
  autoComplete,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  icon?: ReactNode;
  hint?: string;
  autoComplete?: string;
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
  maxLength?: number;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <span className="relative mt-1.5 block">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        ) : null}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-50 ${
            icon ? "pl-10 pr-4" : "px-4"
          }`}
        />
      </span>
      {hint ? (
        <span className="mt-1 block text-[11px] font-semibold text-slate-400">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function ToggleCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-start justify-between gap-4 rounded-2xl border p-4 text-left transition ${
        checked
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          {description}
        </p>
      </div>
      <span
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-[#0D5C3A]" : "bg-slate-300"
        }`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
