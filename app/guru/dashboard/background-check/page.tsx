"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  Lock,
  MailCheck,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type GuruProfile = {
  id?: string | number | null;
  user_id?: string | null;
  email?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  name?: string | null;

  background_check_status?: string | null;
  checkr_status?: string | null;
  checkr_candidate_id?: string | null;
  checkr_invitation_id?: string | null;
  checkr_invitation_url?: string | null;
  checkr_report_id?: string | null;
  checkr_report_status?: string | null;
  checkr_adjudication?: string | null;
  checkr_package?: string | null;
  checkr_created_at?: string | null;
  checkr_updated_at?: string | null;

  background_check_fee_amount?: number | string | null;
  background_check_fee_status?: string | null;
  background_check_fee_paid_at?: string | null;
  background_check_fee_payment_option?: string | null;
  background_check_fee_payment_intent_id?: string | null;
  background_check_fee_checkout_session_id?: string | null;
  background_check_payment_plan_status?: string | null;
  background_check_stripe_subscription_id?: string | null;
  background_check_reimbursement_balance?: number | string | null;
  background_check_reimbursement_status?: string | null;
};

type CheckrApiResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  invitation_url?: string;
  invitationUrl?: string;
  url?: string;
  checkr_invitation_url?: string;
  invitation_id?: string;
  invitationId?: string;
  candidate_id?: string;
  candidateId?: string;
  status?: string;
};

type FriendlyStatus = {
  label: string;
  tone: "complete" | "pending" | "needs_action";
  title: string;
  description: string;
  helper: string;
};

const routes = {
  dashboard: "/guru/dashboard",
  profile: "/guru/dashboard/profile",
  messages: "/guru/dashboard/messages",
  login: "/guru/login",
};

const TRUST_SAFETY_WAIVER_END_DISPLAY = "December 31, 2026";
const TRUST_SAFETY_WAIVER_LABEL = "Waived Through 2026";
const TRUST_SAFETY_WAIVER_PLAN_LABEL = "2026 Launch Year Waiver";


const textDark = {
  color: "#07132f",
  WebkitTextFillColor: "#07132f",
};

const textSlate = {
  color: "#334155",
  WebkitTextFillColor: "#334155",
};

const textMuted = {
  color: "#64748b",
  WebkitTextFillColor: "#64748b",
};

const textWhite = {
  color: "#ffffff",
  WebkitTextFillColor: "#ffffff",
};

function stringifyError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function getDisplayName(profile: GuruProfile | null, email?: string | null) {
  return (
    profile?.display_name ||
    profile?.full_name ||
    profile?.name ||
    email?.split("@")[0] ||
    "Guru"
  );
}

function getFirstName(profile: GuruProfile | null, email?: string | null) {
  const displayName = getDisplayName(profile, email);
  return displayName.trim().split(/\s+/)[0] || "Guru";
}

function parseMoney(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
}

function formatMoney(value: number | string | null | undefined) {
  const amount = parseMoney(value);

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function normalizeCheckrStatus(profile: GuruProfile | null): FriendlyStatus {
  const raw = String(
    profile?.background_check_status ||
      profile?.checkr_report_status ||
      profile?.checkr_status ||
      "",
  )
    .trim()
    .toLowerCase();

  if (
    raw.includes("clear") ||
    raw.includes("complete") ||
    raw.includes("approved") ||
    raw.includes("passed")
  ) {
    return {
      label: "Complete",
      tone: "complete",
      title: "Your Trust & Safety Screening is complete",
      description:
        "Great job. Your Trust & Safety Screening is marked complete, and this trust step is now finished.",
      helper:
        "You can return to your dashboard and continue with the next setup step.",
    };
  }

  if (
    raw.includes("pending") ||
    raw.includes("invited") ||
    raw.includes("created") ||
    raw.includes("review") ||
    raw.includes("consider") ||
    Boolean(profile?.checkr_invitation_id || profile?.checkr_candidate_id)
  ) {
    return {
      label: "In Progress",
      tone: "pending",
      title: "Your Trust & Safety Screening is in progress",
      description:
        "Your Trust & Safety Screening has already been started. If Checkr still needs anything from you, use the button below to continue your secure screening form.",
      helper:
        "If you already completed the secure screening form, you can refresh your status or return to the dashboard.",
    };
  }

  return {
    label: "Ready to Begin",
    tone: "needs_action",
    title: "A quick trust-and-safety step before you start booking",
    description:
      "Every Guru completes this standard Trust & Safety Screening step. It helps pet parents feel more confident and supports a safer marketplace for everyone.",
    helper:
      "This is not meant to feel uncomfortable or personal. It is simply part of SitGuru’s normal Trust & Safety process.",
  };
}

function getStatusClasses(tone: "complete" | "pending" | "needs_action") {
  if (tone === "complete") {
    return {
      shell: "border-emerald-200 bg-emerald-50",
      badge: "bg-emerald-600",
      iconWrap: "bg-emerald-100 text-emerald-700",
      button: "bg-emerald-600 hover:bg-emerald-700",
      highlight: "border-emerald-200 bg-white",
    };
  }

  if (tone === "pending") {
    return {
      shell: "border-amber-200 bg-amber-50",
      badge: "bg-amber-500",
      iconWrap: "bg-amber-100 text-amber-700",
      button: "bg-emerald-600 hover:bg-emerald-700",
      highlight: "border-amber-200 bg-white",
    };
  }

  return {
    shell: "border-sky-200 bg-sky-50",
    badge: "bg-sky-600",
    iconWrap: "bg-sky-100 text-sky-700",
    button: "bg-emerald-600 hover:bg-emerald-700",
    highlight: "border-sky-200 bg-white",
  };
}

function getFeeBadgeClass(tone: "complete" | "pending" | "needs_action") {
  if (tone === "complete") return "bg-emerald-600";
  if (tone === "pending") return "bg-amber-500";
  return "bg-sky-600";
}

function getSelectedPlanLabel(value?: string | null) {
  if (
    value === "waived_2026" ||
    value === "launch_waived" ||
    value === "launch_year_waiver"
  ) {
    return TRUST_SAFETY_WAIVER_PLAN_LABEL;
  }

  if (value === "pay_full_today") return "Paw in Full";
  if (value === "pay_15_three_monthly") return "Pawstep Plan";
  if (value === "pay_15_booking_deductions") return "Book & Bark Plan";

  return TRUST_SAFETY_WAIVER_PLAN_LABEL;
}

function PawPrint({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <ellipse cx="18" cy="18" rx="5.5" ry="8" />
      <ellipse cx="30" cy="12.5" rx="5.5" ry="8" />
      <ellipse cx="42.5" cy="18" rx="5.5" ry="8" />
      <ellipse cx="49.5" cy="30" rx="4.8" ry="7" />
      <path d="M31 49c-10 0-17-6.7-17-14.2 0-6.8 5.8-11 10.4-12.2 3.8-1 8.1-1 10.6 0C39.6 23.8 48 28 48 34.8 48 42.3 40.8 49 31 49Z" />
    </svg>
  );
}

function HeroPawDecor() {
  return (
    <>
      <div className="pointer-events-none absolute right-6 top-8 hidden select-none md:block">
        <div className="flex items-start gap-2 opacity-25">
          <PawPrint className="h-8 w-8 rotate-[8deg] text-emerald-500" />
          <PawPrint className="mt-8 h-6 w-6 -rotate-[10deg] text-sky-500" />
          <PawPrint className="mt-16 h-8 w-8 rotate-[12deg] text-emerald-400" />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-6 hidden select-none lg:block">
        <div className="flex items-end gap-2 opacity-20">
          <PawPrint className="h-5 w-5 -rotate-[10deg] text-sky-500" />
          <PawPrint className="h-7 w-7 rotate-[8deg] text-emerald-500" />
          <PawPrint className="h-5 w-5 rotate-[18deg] text-emerald-400" />
        </div>
      </div>
    </>
  );
}


async function applyTrustSafetyLaunchWaiver(profile: GuruProfile | null) {
  if (!profile?.id) return profile;

  const currentFeeStatus = String(profile.background_check_fee_status || "")
    .trim()
    .toLowerCase();
  const currentPaymentOption = String(
    profile.background_check_fee_payment_option || "",
  )
    .trim()
    .toLowerCase();

  const alreadyWaived =
    currentFeeStatus === "waived_2026" ||
    currentFeeStatus === "launch_waived" ||
    currentFeeStatus === "launch_year_waiver" ||
    currentPaymentOption === "waived_2026" ||
    currentPaymentOption === "launch_waived" ||
    currentPaymentOption === "launch_year_waiver";

  const waiverPayload = {
    background_check_fee_amount: 0,
    background_check_fee_status: "waived_2026",
    background_check_fee_payment_option: "waived_2026",
    background_check_payment_plan_status: "waived_2026",
    background_check_reimbursement_balance: 0,
    background_check_reimbursement_status: "waived_2026",
  };

  if (alreadyWaived) {
    return {
      ...profile,
      ...waiverPayload,
    };
  }

  const { data, error } = await supabase
    .from("gurus")
    .update(waiverPayload)
    .eq("id", profile.id)
    .select("*")
    .single();

  if (error) {
    console.warn("Could not persist 2026 Trust & Safety fee waiver:", error);

    return {
      ...profile,
      ...waiverPayload,
    };
  }

  return (data as GuruProfile) || {
    ...profile,
    ...waiverPayload,
  };
}

async function loadGuruProfile(userId: string, email?: string | null) {
  const byUserId = await supabase
    .from("gurus")
    .select("*")
    .eq("user_id", userId)
    .limit(1);

  if (!byUserId.error && byUserId.data?.[0]) {
    return byUserId.data[0] as GuruProfile;
  }

  if (email) {
    const byEmail = await supabase
      .from("gurus")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (!byEmail.error && byEmail.data?.[0]) {
      return byEmail.data[0] as GuruProfile;
    }
  }

  return null;
}

export default function GuruBackgroundCheckPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<GuruProfile | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const status = useMemo(() => normalizeCheckrStatus(profile), [profile]);
  const classes = getStatusClasses(status.tone);
  const firstName = getFirstName(profile, email);
  const invitationUrl = profile?.checkr_invitation_url || "";

  const reimbursementBalance = parseMoney(
    profile?.background_check_reimbursement_balance,
  );

  const feeStatus = {
    label: TRUST_SAFETY_WAIVER_LABEL,
    paid: true,
    tone: "complete" as const,
  };
  const selectedPlanLabel = getSelectedPlanLabel(
    profile?.background_check_fee_payment_option,
  );

  const canStartCheckr = true;

  async function loadPage() {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace(routes.login);
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");

      const guruProfile = await loadGuruProfile(user.id, user.email);
      const launchWaivedProfile = await applyTrustSafetyLaunchWaiver(guruProfile);

      setProfile(launchWaivedProfile);
    } catch (error) {
      setErrorMessage(
        `Could not load Trust & Safety Screening status: ${stringifyError(error)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshStatus() {
    try {
      setRefreshing(true);
      setErrorMessage("");
      setSuccessMessage("");

      const guruProfile = await loadGuruProfile(userId, email);
      const launchWaivedProfile = await applyTrustSafetyLaunchWaiver(guruProfile);

      setProfile(launchWaivedProfile);

      setSuccessMessage("Trust & Safety Screening status refreshed.");
    } catch (error) {
      setErrorMessage(`Could not refresh status: ${stringifyError(error)}`);
    } finally {
      setRefreshing(false);
    }
  }

  async function startBackgroundCheck() {
    try {
      setStarting(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (!profile?.id) {
        throw new Error(
          "Missing Guru profile ID. Return to the dashboard and try again.",
        );
      }

      const response = await fetch("/api/checkr/create-invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guruId: String(profile.id),
        }),
      });

      const result = (await response.json().catch(() => ({}))) as CheckrApiResponse;

      if (!response.ok || result.error) {
        throw new Error(
          result.error ||
            result.message ||
            "Could not start the secure screening invitation.",
        );
      }

      const nextInvitationUrl =
        result.invitation_url ||
        result.invitationUrl ||
        result.checkr_invitation_url ||
        result.url ||
        "";

      setSuccessMessage(
        "Your secure screening invitation is ready. Opening it now so you can complete Step 4.",
      );

      await refreshStatus();

      if (nextInvitationUrl) {
        window.location.href = nextInvitationUrl;
        return;
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        `Could not start Trust & Safety Screening: ${stringifyError(error)}`,
      );
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <main
        className="min-h-screen bg-[linear-gradient(180deg,#f8fffc_0%,#f2fbf8_40%,#eef8f5_100%)] px-4 py-10 font-light"
        style={textDark}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-center">
          <div className="rounded-[2rem] border border-emerald-100 bg-white px-8 py-6 text-center shadow-sm">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-600" />
            <p className="mt-3 text-base font-semibold" style={textSlate}>
              Loading Step 4 Trust & Safety Screening...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[linear-gradient(180deg,#f8fffc_0%,#f2fbf8_40%,#eef8f5_100%)] font-light"
      style={textDark}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="relative bg-[radial-gradient(circle_at_82%_14%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(135deg,#d9fff3_0%,#b9f3e6_36%,#d8eefc_100%)] px-6 py-8 md:px-10 md:py-12">
            <HeroPawDecor />

            <div className="relative z-10 mb-5 flex flex-wrap items-center gap-3">
              <Link
                href={routes.dashboard}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                style={textDark}
              >
                <ArrowLeft className="h-4 w-4" />
                <span style={textDark}>Back to Guru Dashboard</span>
              </Link>

              <span
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold shadow-sm ring-1 ring-emerald-100"
                style={{ color: "#047857", WebkitTextFillColor: "#047857" }}
              >
                <ShieldCheck className="h-4 w-4" />
                Step 4 Trust & Safety Screening
              </span>
            </div>

            <p
              className="relative z-10 inline-flex rounded-full bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] shadow-sm ring-1 ring-emerald-100"
              style={{ color: "#047857", WebkitTextFillColor: "#047857" }}
            >
              SitGuru Trust & Safety
            </p>

            <h1
              className="relative z-10 mt-5 max-w-4xl text-4xl font-extrabold tracking-[-0.045em] md:text-6xl lg:text-7xl"
              style={textDark}
            >
              Step 4: Trust & Safety Screening Fee Waived Through 2026
            </h1>

            <p
              className="relative z-10 mt-5 max-w-3xl text-base font-bold leading-8 md:text-xl"
              style={textSlate}
            >
              Hi {firstName}. SitGuru is waiving the Trust & Safety
              Screening fee for all Gurus through {TRUST_SAFETY_WAIVER_END_DISPLAY}
              as part of our launch year. You can continue building your Guru
              profile and onboarding without paying this fee.
            </p>

            <div className="relative z-10 mt-6 rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold" style={textDark}>
                    A quick note
                  </p>
                  <p
                    className="mt-1 text-sm font-semibold leading-6"
                    style={textSlate}
                  >
                    No payment is due for this step during the 2026 launch
                    year waiver. SitGuru may still require normal Trust & Safety
                    review steps before certain marketplace features are enabled.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-4 rounded-[1.5rem] border border-sky-100 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-sky-100 p-2 text-sky-700">
                  <MailCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold" style={textDark}>
                    Watch your email, dashboard, and SitGuru messages
                  </p>
                  <p
                    className="mt-1 text-sm font-semibold leading-6"
                    style={textSlate}
                  >
                    SitGuru may email you updates about your screening status or
                    any next steps. Please also check your Guru dashboard and
                    SitGuru message inbox regularly, because your setup status,
                    booking readiness, and important team messages will be
                    updated there.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link
                      href={routes.dashboard}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold shadow-sm transition hover:bg-slate-50"
                      style={textDark}
                    >
                      Check Dashboard
                    </Link>

                    <Link
                      href={routes.messages}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-extrabold shadow-sm transition hover:bg-sky-100"
                      style={{ color: "#0369a1", WebkitTextFillColor: "#0369a1" }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Open SitGuru Messages
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 bg-white px-6 py-6 sm:grid-cols-2 xl:grid-cols-4 md:px-8">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold" style={textMuted}>
                Step
              </p>
              <p className="mt-2 text-3xl font-extrabold" style={textDark}>
                4
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold" style={textMuted}>
                Status
              </p>
              <p className="mt-2 text-3xl font-extrabold" style={textDark}>
                {status.label}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold" style={textMuted}>
                Fee status
              </p>
              <p
                className="mt-2 text-2xl font-extrabold leading-tight"
                style={{ color: "#047857", WebkitTextFillColor: "#047857" }}
              >
                {feeStatus.label}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold" style={textMuted}>
                Selected plan
              </p>
              <p
                className="mt-2 text-2xl font-extrabold leading-tight"
                style={textDark}
              >
                {selectedPlanLabel}
              </p>
            </div>
          </div>
        </section>

        {!!errorMessage && (
          <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <p
                  className="font-extrabold"
                  style={{ color: "#881337", WebkitTextFillColor: "#881337" }}
                >
                  We ran into a problem
                </p>
                <p
                  className="mt-1 text-sm font-semibold leading-6"
                  style={{ color: "#9f1239", WebkitTextFillColor: "#9f1239" }}
                >
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {!!successMessage && (
          <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p
                  className="font-extrabold"
                  style={{ color: "#064e3b", WebkitTextFillColor: "#064e3b" }}
                >
                  Success
                </p>
                <p
                  className="mt-1 text-sm font-semibold leading-6"
                  style={{ color: "#065f46", WebkitTextFillColor: "#065f46" }}
                >
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        <section
          className={`mt-6 rounded-[2rem] border p-4 shadow-sm sm:p-6 ${classes.shell}`}
        >
          <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="w-full min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className={`rounded-2xl p-3 ${classes.iconWrap}`}>
                  {status.tone === "complete" ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : status.tone === "pending" ? (
                    <Clock3 className="h-6 w-6" />
                  ) : (
                    <ShieldCheck className="h-6 w-6" />
                  )}
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${classes.badge}`}
                  style={textWhite}
                >
                  {status.label}
                </span>
              </div>

              <h2
                className="mt-5 flex flex-wrap items-center gap-3 text-3xl font-extrabold tracking-tight"
                style={textDark}
              >
                <span>
                  {status.tone === "complete"
                    ? status.title
                    : "Your 2026 Trust & Safety fee is waived"}
                </span>

                {status.tone !== "complete" ? (
                  <span className="inline-flex items-center gap-1 opacity-40">
                    <PawPrint className="h-5 w-5 rotate-[10deg] text-emerald-500" />
                    <PawPrint className="h-4 w-4 -rotate-[8deg] text-sky-500" />
                  </span>
                ) : null}
              </h2>

              <p
                className="mt-3 max-w-4xl text-base font-bold leading-7"
                style={textSlate}
              >
                {status.tone === "complete"
                  ? status.description
                  : `SitGuru is waiving the Trust & Safety Screening fee for all Gurus through ${TRUST_SAFETY_WAIVER_END_DISPLAY}. No payment is due today, and this page will not send you to Stripe checkout.`}
              </p>

              <p
                className="mt-3 max-w-4xl text-sm font-semibold leading-6"
                style={textMuted}
              >
                {status.tone === "complete"
                  ? status.helper
                  : "Continue your Guru onboarding by completing your profile, services, availability, payout setup, and any secure Trust & Safety review steps SitGuru requires."}
              </p>

              {status.tone !== "complete" ? (
                <div className="mt-6 rounded-[1.5rem] border-2 border-emerald-300 bg-white p-5 shadow-[0_18px_40px_rgba(16,185,129,0.14)]">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                        <ShieldCheck className="h-6 w-6" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black uppercase tracking-[0.12em]"
                            style={textWhite}
                          >
                            Launch Year Waiver
                          </span>

                          <span
                            className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ring-1 ring-emerald-200"
                            style={{
                              color: "#047857",
                              WebkitTextFillColor: "#047857",
                            }}
                          >
                            No Payment Due
                          </span>
                        </div>

                        <h3 className="mt-4 text-2xl font-extrabold" style={textDark}>
                          2026 Trust & Safety Screening Fee Waived
                        </h3>

                        <p
                          className="mt-3 text-sm font-semibold leading-7"
                          style={textSlate}
                        >
                          SitGuru is waiving the Trust & Safety Screening fee for
                          all Gurus through {TRUST_SAFETY_WAIVER_END_DISPLAY} as
                          part of our launch year. There is no Stripe payment,
                          no plan selection, no monthly payment, and no booking
                          payout deduction required for this step during 2026.
                        </p>

                        <p
                          className="mt-3 text-sm font-extrabold leading-6"
                          style={textDark}
                        >
                          Keep moving forward by completing your Guru profile,
                          services, availability, Stripe payout setup, and any
                          secure Trust & Safety review steps SitGuru requires.
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:w-[280px] lg:flex-col">
                      {status.tone === "needs_action" ? (
                        <button
                          type="button"
                          onClick={startBackgroundCheck}
                          disabled={starting}
                          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-extrabold shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70 ${classes.button}`}
                          style={textWhite}
                        >
                          {starting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                          <span style={textWhite}>
                            {starting
                              ? "Starting secure screening..."
                              : "Start Secure Screening"}
                          </span>
                        </button>
                      ) : null}

                      <Link
                        href={routes.dashboard}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-extrabold shadow-sm transition hover:bg-slate-50"
                        style={textDark}
                      >
                        <span style={textDark}>Continue Guru Onboarding</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-extrabold" style={textDark}>
                        Trust & Safety Screening complete
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6" style={textSlate}>
                        This step is complete. SitGuru is also waiving the Trust
                        & Safety Screening fee through {TRUST_SAFETY_WAIVER_END_DISPLAY}.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${getFeeBadgeClass(
                            feeStatus.tone,
                          )}`}
                          style={textWhite}
                        >
                          {feeStatus.label}
                        </span>

                        <span
                          className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black ring-1 ring-slate-200"
                          style={textDark}
                        >
                          {selectedPlanLabel}
                        </span>

                        {reimbursementBalance > 0 ? (
                          <span
                            className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black ring-1 ring-amber-200"
                            style={{
                              color: "#92400e",
                              WebkitTextFillColor: "#92400e",
                            }}
                          >
                            Previous Balance: {formatMoney(reimbursementBalance)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {canStartCheckr ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className={`rounded-2xl border p-4 ${classes.highlight}`}>
                    <p
                      className="text-xs font-black uppercase tracking-[0.16em]"
                      style={textMuted}
                    >
                      Screening Candidate
                    </p>
                    <p
                      className="mt-2 break-all text-sm font-extrabold"
                      style={textDark}
                    >
                      {profile?.checkr_candidate_id || "Not created yet"}
                    </p>
                  </div>

                  <div className={`rounded-2xl border p-4 ${classes.highlight}`}>
                    <p
                      className="text-xs font-black uppercase tracking-[0.16em]"
                      style={textMuted}
                    >
                      Screening Invitation
                    </p>
                    <p
                      className="mt-2 break-all text-sm font-extrabold"
                      style={textDark}
                    >
                      {profile?.checkr_invitation_id || "Not created yet"}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold" style={textDark}>
                      Your privacy matters
                    </p>
                    <p
                      className="mt-1 text-sm font-semibold leading-6"
                      style={textSlate}
                    >
                      The secure screening form is handled through Checkr.
                      SitGuru uses the status updates to track onboarding progress
                      and help maintain a safe marketplace.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-sky-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-sky-100 p-2 text-sky-700">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold" style={textDark}>
                      Status updates and messages
                    </p>
                    <p
                      className="mt-1 text-sm font-semibold leading-6"
                      style={textSlate}
                    >
                      SitGuru will communicate important status updates by email
                      when needed, and we may also contact you through your
                      SitGuru message inbox. Your dashboard is still the main
                      place to confirm your current step status, so please check
                      your dashboard and messages regularly while your screening
                      is pending.
                    </p>

                    <div className="mt-3">
                      <Link
                        href={routes.messages}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-extrabold shadow-sm transition hover:bg-sky-100"
                        style={{
                          color: "#0369a1",
                          WebkitTextFillColor: "#0369a1",
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Open SitGuru Messages
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 2xl:w-[310px]">
              {canStartCheckr && status.tone === "needs_action" ? (
                <button
                  type="button"
                  onClick={startBackgroundCheck}
                  disabled={starting}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-extrabold shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70 ${classes.button}`}
                  style={textWhite}
                >
                  {starting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  <span style={textWhite}>
                    {starting
                      ? "Starting secure screening..."
                      : "Start Secure Screening"}
                  </span>
                </button>
              ) : null}

              {invitationUrl ? (
                <a
                  href={invitationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-extrabold shadow-lg transition hover:bg-slate-800"
                  style={textWhite}
                >
                  <span style={textWhite}>Continue Secure Screening</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}

              <button
                type="button"
                onClick={refreshStatus}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-extrabold shadow-sm transition hover:bg-slate-50 disabled:opacity-70"
                style={textDark}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                <span style={textDark}>Refresh Status</span>
              </button>

              <Link
                href={routes.messages}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-6 py-4 text-sm font-extrabold shadow-sm transition hover:bg-sky-100"
                style={{ color: "#0369a1", WebkitTextFillColor: "#0369a1" }}
              >
                <MessageCircle className="h-4 w-4" />
                <span
                  style={{
                    color: "#0369a1",
                    WebkitTextFillColor: "#0369a1",
                  }}
                >
                  Check Messages
                </span>
              </Link>

              <Link
                href={routes.dashboard}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-extrabold shadow-sm transition hover:bg-slate-50"
                style={textDark}
              >
                <span style={textDark}>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p
              className="text-xs font-extrabold uppercase tracking-[0.18em]"
              style={{ color: "#047857", WebkitTextFillColor: "#047857" }}
            >
              Why this step matters
            </p>
            <h3 className="mt-3 text-2xl font-extrabold" style={textDark}>
              It builds trust with pet parents
            </h3>
            <p className="mt-3 text-sm font-semibold leading-7" style={textSlate}>
              Completing a Trust & Safety Screening helps show that SitGuru takes trust
              and safety seriously for everyone using the platform.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p
              className="text-xs font-extrabold uppercase tracking-[0.18em]"
              style={{ color: "#047857", WebkitTextFillColor: "#047857" }}
            >
              What to expect
            </p>
            <h3 className="mt-3 text-2xl font-extrabold" style={textDark}>
              A normal secure screening process
            </h3>
            <p className="mt-3 text-sm font-semibold leading-7" style={textSlate}>
              During the 2026 launch waiver, no payment plan is needed before
              starting the secure screening form. Checkr may ask for identifying
              details so they can complete the screening. Most Gurus can monitor
              status from their dashboard.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p
              className="text-xs font-extrabold uppercase tracking-[0.18em]"
              style={{ color: "#047857", WebkitTextFillColor: "#047857" }}
            >
              Fee waiver, support, and privacy
            </p>
            <h3 className="mt-3 text-2xl font-extrabold" style={textDark}>
              Simple and transparent
            </h3>
            <p className="mt-3 text-sm font-semibold leading-7" style={textSlate}>
              The Trust & Safety Screening fee is waived for Gurus through
              {TRUST_SAFETY_WAIVER_END_DISPLAY}. SitGuru may contact you by
              email or SitGuru Messages while this step is pending, and your
              dashboard will show your current setup progress.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
