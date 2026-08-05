"use client";

/**
 * Responsive Partner / Contact routing form.
 * Desktop: sticky sidebar + form. Mobile/webapp: single-column stack.
 * Path selectors toggle Ambassador / Investor custom fields smoothly.
 */

import Link from "next/link";
import {
  FormEvent,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
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
  shortLabel: string;
  description: string;
  icon: typeof PawPrint;
}> = [
  {
    id: "parent",
    label: "Pet Parent Help",
    shortLabel: "Parent",
    description: "Bookings, care, account help",
    icon: PawPrint,
  },
  {
    id: "guru",
    label: "Guru Support",
    shortLabel: "Guru",
    description: "Provider tools & payouts",
    icon: UsersRound,
  },
  {
    id: "ambassador",
    label: "Ambassador",
    shortLabel: "Ambassador",
    description: "Codes, referrals, programs",
    icon: Rocket,
  },
  {
    id: "investor",
    label: "Investor / Press",
    shortLabel: "Investor",
    description: "Firm, media, partnerships",
    icon: LineChart,
  },
];

const programOptions = [
  "Student Hire Program",
  "Community Hire Program",
  VETERANS_MILITARY_FAMILIES_PROGRAM.displayName,
  "Ambassador Program",
  "Not sure yet",
];

const BRAND = "#0D5C3A";
const BRAND_DEEP = "#09462C";

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
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#0D5C3A] focus:ring-4 focus:ring-emerald-100";

const labelClass =
  "mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-600";

const premiumButtonClass =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0D5C3A] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-[#09462C] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

type RevealPanelProps = {
  open: boolean;
  labelledBy: string;
  children: ReactNode;
};

function RevealPanel({ open, labelledBy, children }: RevealPanelProps) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      }`}
      aria-hidden={!open}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          role="region"
          aria-labelledby={labelledBy}
          className={`rounded-2xl border border-emerald-100 bg-[linear-gradient(180deg,#f7fffb_0%,#ffffff_100%)] p-4 sm:p-5 ${
            open ? "mt-0" : ""
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function ContactPartnerForm() {
  const formId = useId();
  const pathGroupId = `${formId}-path`;
  const ambassadorPanelId = `${formId}-ambassador-label`;
  const investorPanelId = `${formId}-investor-label`;

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

  const showAmbassador = partnerType === "ambassador";
  const showInvestor = partnerType === "investor";
  const showParent = partnerType === "parent";
  const showGuru = partnerType === "guru";

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
        messageParts.push(
          `Ambassador code preference: ${form.ambassadorCode.trim()}`,
        );
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
            typeof window !== "undefined"
              ? window.location.pathname
              : "/contact",
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
      className="min-h-[100dvh] px-4 py-6 sm:px-6 sm:py-10 md:py-14 lg:px-8"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 0% 0%, rgba(13,92,58,0.10), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(15,118,110,0.08), transparent 50%), linear-gradient(180deg, #f7fbf9 0%, #eef6f1 42%, #f8fafc 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 text-center sm:mb-8 md:mb-10 lg:mb-12">
          <p
            className="text-[11px] font-black uppercase tracking-[0.18em]"
            style={{ color: BRAND }}
          >
            Contact SitGuru
          </p>
          <h1 className="mt-2 text-balance text-3xl font-black tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Partner with SitGuru
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm font-semibold text-slate-500 sm:text-base md:text-lg">
            Pick a path—we&apos;ll display only the tailored options that match
            your goals.
          </p>
        </header>

        <div className="flex flex-col gap-5 sm:gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
          {/* Informative sidebar: stacks first on mobile, sticky on desktop */}
          <aside
            aria-labelledby={`${formId}-why-title`}
            className="order-1 overflow-hidden rounded-2xl text-white shadow-xl shadow-emerald-900/15 lg:sticky lg:top-6 lg:order-none lg:col-span-4 lg:self-start"
            style={{
              backgroundImage: `linear-gradient(155deg, ${BRAND} 0%, ${BRAND_DEEP} 52%, #0f766e 100%)`,
            }}
          >
            <div className="p-5 sm:p-6">
              <h2
                id={`${formId}-why-title`}
                className="text-lg font-black tracking-tight sm:text-xl"
              >
                Why Partner?
              </h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-emerald-50/95">
                Join a modern ecosystem built on reliable pet logistics,
                interactive AI companion tooling, and streamlined rewards.
              </p>

              <ul className="mt-5 space-y-3 text-xs font-semibold text-emerald-50 sm:mt-6 sm:text-[13px]">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15">
                    <Zap className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="pt-1.5 leading-snug">
                    Real-time companion matching dashboards
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15">
                    <LineChart className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="pt-1.5 leading-snug">
                    Optimized ledger tracking tools
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15">
                    <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="pt-1.5 leading-snug">
                    Guru, Ambassador, and Parent support paths
                  </span>
                </li>
              </ul>

              <button
                type="button"
                onClick={openRogueChat}
                className="mt-6 flex w-full items-start gap-3 rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-left transition hover:bg-white/15 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30 sm:mt-8"
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/20">
                  <Lightbulb className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black leading-5">
                    Need a quick answer?
                  </span>
                  <span className="mt-0.5 block text-[11px] font-semibold text-emerald-100">
                    Chat with Rogue · {selectedPath.label}
                  </span>
                </span>
              </button>
            </div>
          </aside>

          {/* Form panel */}
          <section
            id="contact-form"
            aria-labelledby={`${formId}-form-title`}
            className="order-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6 md:p-8 lg:order-none lg:col-span-8"
          >
            <h2 id={`${formId}-form-title`} className="sr-only">
              Partnership request form
            </h2>

            <div
              role="radiogroup"
              aria-labelledby={pathGroupId}
              className="space-y-3 sm:space-y-4"
            >
              <p
                id={pathGroupId}
                className="text-sm font-black tracking-tight text-slate-800"
              >
                Select Your Partnership Path
              </p>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                {partnerPaths.map((item) => {
                  const selected = partnerType === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => selectPartner(item.id)}
                      className={`group relative flex min-h-[5.5rem] flex-col items-start justify-between gap-2 rounded-2xl border p-3 text-left transition-all duration-200 sm:min-h-[6.25rem] sm:p-3.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${
                        selected
                          ? "border-[#0D5C3A] bg-emerald-50 shadow-md shadow-emerald-900/10 ring-2 ring-[#0D5C3A]/25"
                          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40"
                      }`}
                    >
                      <span className="flex w-full items-start justify-between gap-2">
                        <span
                          className={`grid h-9 w-9 place-items-center rounded-xl transition ${
                            selected
                              ? "bg-[#0D5C3A] text-white"
                              : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-800"
                          }`}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        {selected ? (
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-[#0D5C3A] text-white">
                            <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                          </span>
                        ) : (
                          <span
                            className="h-5 w-5 rounded-full border border-slate-200"
                            aria-hidden
                          />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block text-xs font-black leading-4 tracking-tight sm:text-sm sm:leading-5 ${
                            selected ? "text-[#0D5C3A]" : "text-slate-800"
                          }`}
                        >
                          <span className="sm:hidden">{item.shortLabel}</span>
                          <span className="hidden sm:inline">{item.label}</span>
                        </span>
                        <span
                          className={`mt-0.5 hidden text-[10px] font-semibold leading-snug sm:block ${
                            selected ? "text-emerald-800/80" : "text-slate-400"
                          }`}
                        >
                          {item.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form
              className="mt-6 space-y-4 sm:mt-8 sm:space-y-5"
              onSubmit={handleSubmit}
              noValidate={false}
              aria-describedby={
                formError
                  ? `${formId}-error`
                  : formSuccess
                    ? `${formId}-success`
                    : undefined
              }
            >
              <RevealPanel open={showParent} labelledBy={`${formId}-parent-note`}>
                <p
                  id={`${formId}-parent-note`}
                  className="flex items-center gap-2 text-sm font-black text-rose-900"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
                  Emergency Guardrail
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-rose-800 sm:text-sm">
                  For urgent pet safety or medical emergencies, contact your
                  veterinarian or local emergency services first — SitGuru
                  support is not an emergency line.
                </p>
              </RevealPanel>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor={`${formId}-name`}>
                    Your Name
                  </label>
                  <input
                    id={`${formId}-name`}
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
                  <label className={labelClass} htmlFor={`${formId}-email`}>
                    Email Address
                  </label>
                  <input
                    id={`${formId}-email`}
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

              <RevealPanel open={showParent} labelledBy={`${formId}-zip-label`}>
                <label className={labelClass} htmlFor={`${formId}-zip`} id={`${formId}-zip-label`}>
                  Zip Code
                </label>
                <input
                  id={`${formId}-zip`}
                  value={form.zipCode}
                  onChange={(e) => updateField("zipCode", e.target.value)}
                  placeholder="12345"
                  className={fieldClass}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  tabIndex={showParent ? 0 : -1}
                />
              </RevealPanel>

              <RevealPanel open={showGuru} labelledBy={`${formId}-guru-links`}>
                <p id={`${formId}-guru-links`} className="sr-only">
                  Guru quick links
                </p>
                <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/become-a-guru"
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0D5C3A] px-4 text-xs font-black text-white transition hover:bg-[#09462C] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 sm:flex-none"
                    tabIndex={showGuru ? 0 : -1}
                  >
                    Become a Guru
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                  <Link
                    href="/guru/dashboard"
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 sm:flex-none"
                    tabIndex={showGuru ? 0 : -1}
                  >
                    Guru dashboard
                  </Link>
                </div>
              </RevealPanel>

              <RevealPanel open={showAmbassador} labelledBy={ambassadorPanelId}>
                <p
                  id={ambassadorPanelId}
                  className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#0D5C3A]"
                >
                  Ambassador details
                </p>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass} htmlFor={`${formId}-code`}>
                      Ambassador Code Preference
                    </label>
                    <input
                      id={`${formId}-code`}
                      type="text"
                      value={form.ambassadorCode}
                      onChange={(e) =>
                        updateField("ambassadorCode", e.target.value)
                      }
                      placeholder="e.g., JASONTEST"
                      className={fieldClass}
                      tabIndex={showAmbassador ? 0 : -1}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`${formId}-org-amb`}>
                      Organization / School
                    </label>
                    <input
                      id={`${formId}-org-amb`}
                      type="text"
                      value={form.organization}
                      onChange={(e) =>
                        updateField("organization", e.target.value)
                      }
                      placeholder="Campus, club, or community group"
                      className={fieldClass}
                      tabIndex={showAmbassador ? 0 : -1}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`${formId}-program`}>
                      Program Interest
                    </label>
                    <select
                      id={`${formId}-program`}
                      value={form.programInterest}
                      onChange={(e) =>
                        updateField("programInterest", e.target.value)
                      }
                      className={fieldClass}
                      tabIndex={showAmbassador ? 0 : -1}
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
                    className="inline-flex items-center gap-1.5 text-xs font-black text-[#0D5C3A] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                    tabIndex={showAmbassador ? 0 : -1}
                  >
                    Explore Ambassador program
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </RevealPanel>

              <RevealPanel open={showInvestor} labelledBy={investorPanelId}>
                <p
                  id={investorPanelId}
                  className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#0D5C3A]"
                >
                  Investor / Press details
                </p>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass} htmlFor={`${formId}-org`}>
                      Organization / Firm
                    </label>
                    <input
                      id={`${formId}-org`}
                      type="text"
                      value={form.organization}
                      onChange={(e) =>
                        updateField("organization", e.target.value)
                      }
                      placeholder="Company Name"
                      className={fieldClass}
                      tabIndex={showInvestor ? 0 : -1}
                    />
                  </div>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:border-emerald-200">
                    <input
                      type="checkbox"
                      checked={form.urgentMedia}
                      onChange={(e) =>
                        updateField("urgentMedia", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#0D5C3A] focus:ring-[#0D5C3A]"
                      tabIndex={showInvestor ? 0 : -1}
                    />
                    Urgent media deadline
                  </label>
                </div>
              </RevealPanel>

              <div>
                <label className={labelClass} htmlFor={`${formId}-message`}>
                  How can we help?
                </label>
                <textarea
                  id={`${formId}-message`}
                  rows={4}
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  placeholder="Describe your inquiry details…"
                  className={`${fieldClass} min-h-[7.5rem] resize-y`}
                  required
                />
              </div>

              {formError ? (
                <p
                  id={`${formId}-error`}
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-800"
                >
                  {formError}
                </p>
              ) : null}
              {formSuccess ? (
                <p
                  id={`${formId}-success`}
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900"
                >
                  {formSuccess}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className={premiumButtonClass}
              >
                {isSubmitting ? "Sending…" : "Send Partnership Request"}
                {!isSubmitting ? (
                  <ArrowRight className="h-4 w-4" aria-hidden />
                ) : null}
              </button>

              <p className="text-center text-[11px] font-semibold text-slate-400">
                Routed as {partnerToTopic(partnerType).replace(/-/g, " ")} · No
                spam — SitGuru team only
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ContactPartnerForm;
