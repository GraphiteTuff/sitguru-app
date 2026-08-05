"use client";

/**
 * Responsive Partner / Contact routing form.
 * Path cards tailor fields; submits through /api/contact.
 */

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Lightbulb,
  LineChart,
  PawPrint,
  Rocket,
  ShieldAlert,
  UsersRound,
  Zap,
} from "lucide-react";
import { VETERANS_MILITARY_FAMILIES_PROGRAM } from "@/lib/programs/veterans-military-families";

export type PartnerType = "parent" | "guru" | "ambassador" | "investor";

type ContactFormState = {
  fullName: string;
  email: string;
  zipCode: string;
  ambassadorCode: string;
  organization: string;
  programInterest: string;
  message: string;
  urgentMedia: boolean;
  source: string;
};

const initialForm: ContactFormState = {
  fullName: "",
  email: "",
  zipCode: "",
  ambassadorCode: "",
  organization: "",
  programInterest: "",
  message: "",
  urgentMedia: false,
  source: "contact-page",
};

const partnerPaths: Array<{
  id: PartnerType;
  label: string;
  icon: typeof PawPrint;
}> = [
  { id: "parent", label: "Pet Parent Help", icon: PawPrint },
  { id: "guru", label: "Guru Support", icon: UsersRound },
  { id: "ambassador", label: "Ambassador", icon: Rocket },
  { id: "investor", label: "Investor / Press", icon: LineChart },
];

const programOptions = [
  "Student Hire Program",
  "Community Hire Program",
  VETERANS_MILITARY_FAMILIES_PROGRAM.displayName,
  "Ambassador Program",
  "Not sure yet",
];

const BRAND = "#0D5C3A";

function detectSourceFromUrl() {
  if (typeof window === "undefined") return "contact-page";
  const params = new URLSearchParams(window.location.search);
  return (
    (
      params.get("source") ||
      params.get("utm_source") ||
      params.get("ref") ||
      "contact-page"
    )
      .trim()
      .toLowerCase() || "contact-page"
  );
}

function partnerToTopic(partnerType: PartnerType) {
  if (partnerType === "parent") return "pet-parent";
  if (partnerType === "guru") return "guru";
  if (partnerType === "ambassador") return "ambassadors";
  return "investors";
}

function openRogueChat() {
  const launcher = document.querySelector(
    ".homepage-chat-launcher",
  ) as HTMLButtonElement | null;
  if (launcher) {
    launcher.click();
    return;
  }
  window.dispatchEvent(new CustomEvent("sitguru:open-rogue-chat"));
}

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600";

export function ContactPartnerForm() {
  const [partnerType, setPartnerType] = useState<PartnerType>("parent");
  const [form, setForm] = useState<ContactFormState>(() => ({
    ...initialForm,
    source: detectSourceFromUrl(),
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const selectedPath = useMemo(
    () => partnerPaths.find((item) => item.id === partnerType) || partnerPaths[0],
    [partnerType],
  );

  function updateField<K extends keyof ContactFormState>(
    key: K,
    value: ContactFormState[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (formError) setFormError("");
    if (formSuccess) setFormSuccess("");
  }

  function selectPartner(next: PartnerType) {
    setPartnerType(next);
    setFormError("");
    setFormSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setFormSuccess("");

    const topic = partnerToTopic(partnerType);
    const displayName =
      partnerType === "investor"
        ? form.organization.trim() || form.fullName.trim()
        : form.fullName.trim();

    const messageParts = [form.message.trim()];
    if (partnerType === "parent" && form.zipCode.trim()) {
      messageParts.push(`ZIP: ${form.zipCode.trim()}`);
    }
    if (partnerType === "ambassador") {
      if (form.ambassadorCode.trim()) {
        messageParts.push(`Ambassador code preference: ${form.ambassadorCode.trim()}`);
      }
      if (form.organization.trim()) {
        messageParts.push(`Organization/School: ${form.organization.trim()}`);
      }
    }
    if (partnerType === "investor") {
      if (form.organization.trim()) {
        messageParts.push(`Organization / Firm: ${form.organization.trim()}`);
      }
      if (form.urgentMedia) {
        messageParts.push("URGENT MEDIA DEADLINE requested");
      }
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: displayName,
          email: form.email.trim(),
          phone: form.zipCode.trim() || undefined,
          topic,
          programInterest:
            partnerType === "ambassador" ? form.programInterest : "",
          message: messageParts.filter(Boolean).join("\n\n"),
          source: form.source || "contact-page",
          pagePath:
            typeof window !== "undefined" ? window.location.pathname : "/contact",
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload?.error || "Unable to submit your message right now.",
        );
      }

      setFormSuccess(
        "Thanks — your partnership request was routed to the right SitGuru team.",
      );
      setForm((previous) => ({
        ...initialForm,
        source: previous.source,
      }));
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen px-4 py-8 sm:px-6 md:py-16 lg:px-8"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(13,92,58,0.08), transparent 40%), linear-gradient(180deg, #f7fbf9 0%, #eef6f1 45%, #f8fafc 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center md:mb-12">
          <p
            className="text-[11px] font-black uppercase tracking-[0.18em]"
            style={{ color: BRAND }}
          >
            Contact SitGuru
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Partner with SitGuru
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-500 sm:text-lg">
            Pick a path—we&apos;ll display only the tailored options that match
            your goals.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside
            className="h-fit rounded-2xl p-6 text-white shadow-xl lg:sticky lg:top-8 lg:col-span-4"
            style={{
              backgroundImage: `linear-gradient(145deg, ${BRAND} 0%, #09462c 55%, #0f766e 100%)`,
            }}
          >
            <h2 className="text-xl font-bold">Why Partner?</h2>
            <p className="mt-2 text-sm text-emerald-100">
              Join a modern ecosystem built on reliable pet logistics,
              interactive AI companion tooling, and streamlined rewards.
            </p>
            <div className="mt-6 space-y-4 text-xs text-emerald-50">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white/20 p-2">
                  <Zap className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span>Real-time companion matching dashboards</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white/20 p-2">
                  <LineChart className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span>Optimized ledger tracking tools</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white/20 p-2">
                  <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span>Guru, Ambassador, and Parent support paths</span>
              </div>
            </div>

            <button
              type="button"
              onClick={openRogueChat}
              className="mt-8 flex w-full items-start gap-3 rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-left transition hover:bg-white/15"
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/20">
                <Lightbulb className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-5">
                  Need a quick answer?
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-emerald-100">
                  Chat with Rogue · {selectedPath.label}
                </span>
              </span>
            </button>
          </aside>

          <div
            id="contact-form"
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8 lg:col-span-8"
          >
            <div className="space-y-6">
              <label className="block text-sm font-semibold text-slate-700">
                Select Your Partnership Path
              </label>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {partnerPaths.map((item) => {
                  const selected = partnerType === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectPartner(item.id)}
                      aria-pressed={selected}
                      className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all duration-200 ${
                        selected
                          ? "border-emerald-600 bg-emerald-50/50 text-emerald-800 ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <Icon
                        className={`mb-2 h-6 w-6 ${
                          selected ? "text-emerald-700" : "text-slate-400"
                        }`}
                      />
                      <span className="text-xs font-medium tracking-tight sm:text-sm">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {partnerType === "parent" ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <p className="flex items-center gap-2 text-sm font-bold text-rose-900">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    Emergency Guardrail
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-rose-800 sm:text-sm">
                    For urgent pet safety or medical emergencies, contact your
                    veterinarian or local emergency services first — SitGuru
                    support is not an emergency line.
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="partner-name">
                    Your Name
                  </label>
                  <input
                    id="partner-name"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="Jason Graff"
                    className={fieldClass}
                    required
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="partner-email">
                    Email Address
                  </label>
                  <input
                    id="partner-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="you@example.com"
                    className={fieldClass}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {partnerType === "parent" ? (
                <div>
                  <label className={labelClass} htmlFor="partner-zip">
                    Zip Code
                  </label>
                  <input
                    id="partner-zip"
                    value={form.zipCode}
                    onChange={(e) => updateField("zipCode", e.target.value)}
                    placeholder="12345"
                    className={fieldClass}
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                </div>
              ) : null}

              {partnerType === "guru" ? (
                <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <Link
                    href="/become-a-guru"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-800 px-3 text-xs font-bold text-white transition hover:bg-emerald-900"
                  >
                    Become a Guru
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/guru/dashboard"
                    className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                  >
                    Guru dashboard
                  </Link>
                </div>
              ) : null}

              {partnerType === "ambassador" ? (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <label className={labelClass} htmlFor="partner-code">
                      Ambassador Code Preference
                    </label>
                    <input
                      id="partner-code"
                      type="text"
                      value={form.ambassadorCode}
                      onChange={(e) =>
                        updateField("ambassadorCode", e.target.value)
                      }
                      placeholder="e.g., JASONTEST"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="partner-org-amb">
                      Organization / School
                    </label>
                    <input
                      id="partner-org-amb"
                      type="text"
                      value={form.organization}
                      onChange={(e) =>
                        updateField("organization", e.target.value)
                      }
                      placeholder="Campus, club, or community group"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="partner-program">
                      Program Interest
                    </label>
                    <select
                      id="partner-program"
                      value={form.programInterest}
                      onChange={(e) =>
                        updateField("programInterest", e.target.value)
                      }
                      className={fieldClass}
                    >
                      <option value="">Select a program</option>
                      {programOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Link
                    href="/ambassadors"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline"
                  >
                    Explore Ambassador program
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : null}

              {partnerType === "investor" ? (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <label className={labelClass} htmlFor="partner-org">
                      Organization / Firm
                    </label>
                    <input
                      id="partner-org"
                      type="text"
                      value={form.organization}
                      onChange={(e) =>
                        updateField("organization", e.target.value)
                      }
                      placeholder="Company Name"
                      className={fieldClass}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.urgentMedia}
                      onChange={(e) =>
                        updateField("urgentMedia", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                    />
                    Urgent media deadline
                  </label>
                </div>
              ) : null}

              <div>
                <label className={labelClass} htmlFor="partner-message">
                  How can we help?
                </label>
                <textarea
                  id="partner-message"
                  rows={4}
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  placeholder="Describe your inquiry details…"
                  className={`${fieldClass} resize-y`}
                  required
                />
              </div>

              {formError ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
                  {formError}
                </p>
              ) : null}
              {formSuccess ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
                  {formSuccess}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-center text-sm font-bold text-white shadow-md transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: BRAND,
                  boxShadow: "0 10px 20px rgba(13, 92, 58, 0.12)",
                }}
              >
                {isSubmitting
                  ? "Sending…"
                  : "Send Partnership Request"}
                {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
              </button>

              <p className="text-center text-[11px] font-semibold text-slate-400">
                Routed as {partnerToTopic(partnerType).replace(/-/g, " ")} · No
                spam — SitGuru team only
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPartnerForm;
