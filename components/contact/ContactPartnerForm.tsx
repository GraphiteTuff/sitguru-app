"use client";

/**
 * Partner / Contact form — validated, responsive, companion-aware.
 * Path cards switch Scout / Taco / Rogue via AIScoutCompanion modes.
 */

import Link from "next/link";
import {
  FormEvent,
  useId,
  useMemo,
  useState,
  type ChangeEvent,
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
import { AIScoutCompanion } from "@/components/officers/AIScoutCompanion";
import {
  companionModeFromPartnerType,
  type CompanionLayoutMode,
} from "@/lib/companions/bot-config";
import { submitPartnershipInquiry } from "@/lib/contact/partner-api";

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

type FormErrors = {
  fullName?: string;
  email?: string;
  zipCode?: string;
  message?: string;
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
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

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
  "min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:ring-4";

const fieldOkClass =
  "border-slate-200 focus:border-[#0D5C3A] focus:ring-emerald-100";

const fieldErrClass =
  "border-rose-400 focus:border-rose-500 focus:ring-rose-100";

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
          className="animate-fadeIn rounded-2xl border border-emerald-100 bg-[linear-gradient(180deg,#f7fffb_0%,#ffffff_100%)] p-4 sm:p-5"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function validateForm(
  fields: ContactFormState,
  partnerType: PartnerType,
): FormErrors {
  const next: FormErrors = {};
  if (!fields.fullName.trim()) {
    next.fullName = "Please provide your full name.";
  }
  if (!EMAIL_REGEX.test(fields.email.trim())) {
    next.email = "Please provide a valid email address.";
  }
  if (partnerType === "parent" && fields.zipCode.trim()) {
    if (!ZIP_REGEX.test(fields.zipCode.trim())) {
      next.zipCode = "ZIP must be a valid 5-digit code.";
    }
  }
  if (fields.message.trim().length < 10) {
    next.message = "Please share at least 10 characters about your inquiry.";
  }
  return next;
}

export function ContactPartnerForm() {
  const formId = useId();
  const pathGroupId = `${formId}-path`;
  const ambassadorPanelId = `${formId}-ambassador-label`;
  const investorPanelId = `${formId}-investor-label`;

  const [partnerType, setPartnerType] = useState<PartnerType>("parent");
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<ContactFormState>(() => ({
    ...initialForm,
    source: detectSourceFromUrl(),
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const selectedPath = useMemo(
    () => partnerPaths.find((item) => item.id === partnerType) || partnerPaths[0],
    [partnerType],
  );

  const companionMode: CompanionLayoutMode =
    companionModeFromPartnerType(partnerType);

  const showAmbassador = partnerType === "ambassador";
  const showInvestor = partnerType === "investor";
  const showParent = partnerType === "parent";
  const showGuru = partnerType === "guru";
  const showSuccess = Boolean(formSuccess) && !formError;

  function updateField<K extends keyof ContactFormState>(
    key: K,
    value: ContactFormState[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (key in errors) {
      setErrors((previous) => ({ ...previous, [key]: undefined }));
    }
    if (formError) setFormError("");
    if (formSuccess) setFormSuccess("");
  }

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = event.target;
    if (type === "checkbox" && event.target instanceof HTMLInputElement) {
      updateField(name as keyof ContactFormState, event.target.checked as never);
      return;
    }
    updateField(name as keyof ContactFormState, value as never);
  }

  function selectPartner(next: PartnerType) {
    setPartnerType(next);
    setErrors({});
    setFormError("");
    setFormSuccess("");
    setStep(2);
  }

  function goToPathStep() {
    setStep(1);
    setErrors({});
    setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(form, partnerType);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const result = await submitPartnershipInquiry({
        partnerType,
        fullName: form.fullName,
        email: form.email,
        zipCode: form.zipCode,
        message: form.message,
        ambassadorCode: form.ambassadorCode,
        organization: form.organization,
        programInterest: form.programInterest,
        urgentMedia: form.urgentMedia,
        source: form.source || "contact-page",
        pagePath:
          typeof window !== "undefined"
            ? window.location.pathname
            : "/contact",
      });

      if (!result.success) {
        throw new Error(result.error || "Unable to submit your message right now.");
      }

      setFormSuccess(
        "Thanks — your partnership request was routed to the right SitGuru team.",
      );
      setForm((previous) => ({
        ...initialForm,
        source: previous.source,
      }));
      setErrors({});
      setStep(1);
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
            Select your track below. The form elements rewrite themselves and
            call your matching AI assistant.
          </p>
        </header>

        <div className="flex flex-col gap-5 sm:gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
          <aside
            aria-labelledby={`${formId}-why-title`}
            data-brand-green
            className="public-dark-section order-1 overflow-hidden rounded-2xl text-white shadow-xl shadow-emerald-900/15 lg:sticky lg:top-6 lg:order-none lg:col-span-4 lg:self-start"
            style={{
              backgroundImage: `linear-gradient(155deg, ${BRAND} 0%, ${BRAND_DEEP} 52%, #0f766e 100%)`,
              color: "#ffffff",
            }}
          >
            <div className="p-5 sm:p-6">
              <h2
                id={`${formId}-why-title`}
                className="text-lg font-black tracking-tight !text-white sm:text-xl"
                style={{ color: "#ffffff" }}
              >
                Why Partner?
              </h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-emerald-50/95">
                An interconnected platform supporting unified pet care mechanics
                across web applications, native desktop modules, and client
                mobile targets.
              </p>

              <ul className="mt-5 space-y-3 text-xs font-semibold text-emerald-50 sm:mt-6 sm:text-[13px]">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15">
                    <Zap className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="pt-1.5 leading-snug">
                    Automated context tracking companion shifting
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15">
                    <LineChart className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="pt-1.5 leading-snug">
                    Smooth layout transforms across every viewport
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15">
                    <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="pt-1.5 leading-snug">
                    Scout for Gurus · Taco for Ambassadors · Rogue for Parents
                  </span>
                </li>
              </ul>

              {companionMode === "public-parent" ||
              companionMode === "public-investor" ? (
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
              ) : (
                <div className="mt-6 rounded-xl border border-white/20 bg-white/10 px-3 py-3 sm:mt-8">
                  <p className="text-sm font-black leading-5">
                    {companionMode === "public-guru"
                      ? "Scout is ready"
                      : "Taco is ready"}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-emerald-100">
                    Open the companion bubble in the corner for instant help.
                  </p>
                </div>
              )}
            </div>
          </aside>

          <section
            id="contact-form"
            aria-labelledby={`${formId}-form-title`}
            className="order-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6 md:p-8 lg:order-none lg:col-span-8"
          >
            <h2 id={`${formId}-form-title`} className="sr-only">
              Partnership request form
            </h2>

            {!showSuccess ? (
              <nav
                aria-label="Partnership form steps"
                className="mb-5 flex items-center gap-2 sm:mb-6"
              >
                <button
                  type="button"
                  onClick={goToPathStep}
                  className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${
                    step === 1
                      ? "bg-[#0D5C3A] text-white"
                      : "bg-emerald-50 text-[#0D5C3A] hover:bg-emerald-100"
                  }`}
                >
                  1 · Path
                </button>
                <span className="h-px flex-1 bg-slate-200" aria-hidden />
                <span
                  className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-black ${
                    step === 2
                      ? "bg-[#0D5C3A] text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  2 · Details
                </span>
              </nav>
            ) : null}

            {showSuccess ? (
              <div
                id={`${formId}-success`}
                role="status"
                className="animate-fadeIn py-10 text-center sm:py-12"
              >
                <span
                  className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-[#0D5C3A]"
                  aria-hidden
                >
                  <Check className="h-7 w-7" strokeWidth={2.5} />
                </span>
                <h3 className="mt-4 text-xl font-black text-slate-900">
                  Inquiry Received Successfully!
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm font-semibold text-slate-500">
                  Your route context payload has been verified and stored for
                  the SitGuru team.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormSuccess("");
                    setForm((previous) => ({
                      ...initialForm,
                      source: previous.source,
                    }));
                    setErrors({});
                    setStep(1);
                  }}
                  className="mt-6 text-sm font-black text-[#0D5C3A] transition hover:text-[#09462C] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                >
                  ← Submit another operational request
                </button>
              </div>
            ) : (
              <>
                <div
                  role="radiogroup"
                  aria-labelledby={pathGroupId}
                  className={`space-y-3 sm:space-y-4 ${step === 2 ? "mb-5" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                      id={pathGroupId}
                      className="text-sm font-black tracking-tight text-slate-800"
                    >
                      {step === 1
                        ? "Select Your Partnership Path"
                        : `Path · ${selectedPath.label}`}
                    </p>
                    {step === 2 ? (
                      <button
                        type="button"
                        onClick={goToPathStep}
                        className="text-xs font-black text-[#0D5C3A] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                      >
                        Change path
                      </button>
                    ) : null}
                  </div>

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
                                <Check
                                  className="h-3 w-3"
                                  strokeWidth={3}
                                  aria-hidden
                                />
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
                              <span className="hidden sm:inline">
                                {item.label}
                              </span>
                            </span>
                            <span
                              className={`mt-0.5 hidden text-[10px] font-semibold leading-snug sm:block ${
                                selected
                                  ? "text-emerald-800/80"
                                  : "text-slate-400"
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

                {step === 1 ? (
                  <p className="mt-6 animate-fadeIn rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm font-semibold text-emerald-900">
                    Choose a path to continue. We&apos;ll tailor the fields and
                    load your matching AI companion.
                  </p>
                ) : (
                <form
                  className="mt-6 animate-fadeIn space-y-4 sm:mt-8 sm:space-y-5"
                  onSubmit={handleSubmit}
                  noValidate
                  aria-describedby={
                    formError ? `${formId}-error` : undefined
                  }
                >
                  <RevealPanel
                    open={showParent}
                    labelledBy={`${formId}-parent-note`}
                  >
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
                        name="fullName"
                        type="text"
                        value={form.fullName}
                        onChange={handleInputChange}
                        placeholder="Jason Graff"
                        className={`${fieldClass} ${errors.fullName ? fieldErrClass : fieldOkClass}`}
                        autoComplete="name"
                        aria-invalid={Boolean(errors.fullName)}
                      />
                      {errors.fullName ? (
                        <p className="mt-1 animate-fadeIn text-xs font-semibold text-rose-600">
                          {errors.fullName}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label className={labelClass} htmlFor={`${formId}-email`}>
                        Email Address
                      </label>
                      <input
                        id={`${formId}-email`}
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleInputChange}
                        placeholder="you@example.com"
                        className={`${fieldClass} ${errors.email ? fieldErrClass : fieldOkClass}`}
                        autoComplete="email"
                        aria-invalid={Boolean(errors.email)}
                      />
                      {errors.email ? (
                        <p className="mt-1 animate-fadeIn text-xs font-semibold text-rose-600">
                          {errors.email}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <RevealPanel
                    open={showParent}
                    labelledBy={`${formId}-zip-label`}
                  >
                    <label
                      className={labelClass}
                      htmlFor={`${formId}-zip`}
                      id={`${formId}-zip-label`}
                    >
                      Zip Code
                    </label>
                    <input
                      id={`${formId}-zip`}
                      name="zipCode"
                      value={form.zipCode}
                      onChange={handleInputChange}
                      placeholder="12345"
                      maxLength={10}
                      className={`${fieldClass} ${errors.zipCode ? fieldErrClass : fieldOkClass}`}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      tabIndex={showParent ? 0 : -1}
                      aria-invalid={Boolean(errors.zipCode)}
                    />
                    {errors.zipCode ? (
                      <p className="mt-1 animate-fadeIn text-xs font-semibold text-rose-600">
                        {errors.zipCode}
                      </p>
                    ) : null}
                  </RevealPanel>

                  <RevealPanel
                    open={showGuru}
                    labelledBy={`${formId}-guru-links`}
                  >
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

                  <RevealPanel
                    open={showAmbassador}
                    labelledBy={ambassadorPanelId}
                  >
                    <p
                      id={ambassadorPanelId}
                      className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#0D5C3A]"
                    >
                      Ambassador details
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label
                          className={labelClass}
                          htmlFor={`${formId}-code`}
                        >
                          Ambassador Code Preference
                        </label>
                        <input
                          id={`${formId}-code`}
                          name="ambassadorCode"
                          type="text"
                          value={form.ambassadorCode}
                          onChange={handleInputChange}
                          placeholder="e.g., JASONTEST"
                          className={`${fieldClass} ${fieldOkClass}`}
                          tabIndex={showAmbassador ? 0 : -1}
                        />
                      </div>
                      <div>
                        <label
                          className={labelClass}
                          htmlFor={`${formId}-org-amb`}
                        >
                          Organization / School
                        </label>
                        <input
                          id={`${formId}-org-amb`}
                          name="organization"
                          type="text"
                          value={form.organization}
                          onChange={handleInputChange}
                          placeholder="Campus, club, or community group"
                          className={`${fieldClass} ${fieldOkClass}`}
                          tabIndex={showAmbassador ? 0 : -1}
                        />
                      </div>
                      <div>
                        <label
                          className={labelClass}
                          htmlFor={`${formId}-program`}
                        >
                          Program Interest
                        </label>
                        <select
                          id={`${formId}-program`}
                          name="programInterest"
                          value={form.programInterest}
                          onChange={handleInputChange}
                          className={`${fieldClass} ${fieldOkClass}`}
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
                          name="organization"
                          type="text"
                          value={form.organization}
                          onChange={handleInputChange}
                          placeholder="Company Name"
                          className={`${fieldClass} ${fieldOkClass}`}
                          tabIndex={showInvestor ? 0 : -1}
                        />
                      </div>
                      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:border-emerald-200">
                        <input
                          type="checkbox"
                          name="urgentMedia"
                          checked={form.urgentMedia}
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-slate-300 text-[#0D5C3A] focus:ring-[#0D5C3A]"
                          tabIndex={showInvestor ? 0 : -1}
                        />
                        Urgent media deadline
                      </label>
                    </div>
                  </RevealPanel>

                  <div>
                    <label
                      className={labelClass}
                      htmlFor={`${formId}-message`}
                    >
                      How can we help?
                    </label>
                    <textarea
                      id={`${formId}-message`}
                      name="message"
                      rows={4}
                      value={form.message}
                      onChange={handleInputChange}
                      placeholder="Describe your inquiry details…"
                      className={`${fieldClass} min-h-[7.5rem] resize-y ${errors.message ? fieldErrClass : fieldOkClass}`}
                      aria-invalid={Boolean(errors.message)}
                    />
                    {errors.message ? (
                      <p className="mt-1 animate-fadeIn text-xs font-semibold text-rose-600">
                        {errors.message}
                      </p>
                    ) : null}
                  </div>

                  {formError ? (
                    <p
                      id={`${formId}-error`}
                      role="alert"
                      className="animate-fadeIn rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-800"
                    >
                      {formError}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={premiumButtonClass}
                  >
                    {isSubmitting
                      ? "Validating Payload…"
                      : "Send Partnership Request"}
                    {!isSubmitting ? (
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    ) : null}
                  </button>

                  <p className="text-center text-[11px] font-semibold text-slate-400">
                    Routed as {partnerToTopic(partnerType).replace(/-/g, " ")} ·
                    Companion:{" "}
                    {companionMode === "public-guru"
                      ? "Scout"
                      : companionMode === "public-ambassador"
                        ? "Taco"
                        : "Rogue"}{" "}
                    · No spam — SitGuru team only
                  </p>
                </form>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      <AIScoutCompanion key={companionMode} mode={companionMode} />
    </div>
  );
}

export default ContactPartnerForm;
