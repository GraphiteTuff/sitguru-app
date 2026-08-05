"use client";

/**
 * SitGuru Partners landing — B2B partnership explainer + validated inquiry form.
 * Track selection switches Scout / Taco / Rogue via AIScoutCompanion modes.
 */

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  Check,
  Handshake,
  HeartPulse,
  Network,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { AIScoutCompanion } from "@/components/officers/AIScoutCompanion";
import type { CompanionLayoutMode } from "@/lib/companions/bot-config";
import { submitPartnershipInquiry } from "@/lib/contact/partner-api";

const BRAND = "#0D5C3A";
const BRAND_DEEP = "#09462C";

export type PartnerTrack = "wellness" | "community" | "corporate" | "investor";

interface PartnerFields {
  companyName: string;
  contactName: string;
  email: string;
  trackDetails: string;
  wellnessFocus: string;
  hasAppIntegration: boolean;
}

interface ValidationErrors {
  companyName?: string;
  contactName?: string;
  email?: string;
  trackDetails?: string;
}

const TRACKS: Array<{
  id: PartnerTrack;
  label: string;
  hint: string;
  icon: ReactNode;
}> = [
  {
    id: "wellness",
    label: "Pet Wellness Provider",
    hint: "Vets, trainers, groomers, care clinics",
    icon: <HeartPulse className="h-5 w-5" aria-hidden />,
  },
  {
    id: "community",
    label: "Local Community Group",
    hint: "Neighborhoods, rescues, campuses",
    icon: <UsersRound className="h-5 w-5" aria-hidden />,
  },
  {
    id: "corporate",
    label: "Corporate Sponsor",
    hint: "Brands, retail, multi-location teams",
    icon: <Building2 className="h-5 w-5" aria-hidden />,
  },
  {
    id: "investor",
    label: "Investor / Growth",
    hint: "Firms, press, strategic partners",
    icon: <Network className="h-5 w-5" aria-hidden />,
  },
];

const WELLNESS_FOCUS_OPTIONS = [
  "Preventative Health Operations",
  "Nutritional Science Alignment",
  "Behavioral Therapy & Coaching",
  "Veterinary Clinical Logistics",
] as const;

const BENEFITS = [
  {
    title: "Preventative Wellness Engine",
    description:
      "Promote preventative wellness checkups, veterinary tracking sync, and activity logs through partner tools built for pet care teams.",
    icon: <ShieldCheck className="h-6 w-6" aria-hidden />,
  },
  {
    title: "Synchronized Cross-App Reach",
    description:
      "Connect services with SitGuru dashboards, web surfaces, and native mobile workflows so partners meet pet families where they already are.",
    icon: <Activity className="h-6 w-6" aria-hidden />,
  },
  {
    title: "Localized Community Reach",
    description:
      "Deploy tailored updates to neighborhood pet networks, campus chapters, and authorized corporate audiences with clear partner pathways.",
    icon: <Handshake className="h-6 w-6" aria-hidden />,
  },
] as const;

function companionModeForTrack(track: PartnerTrack): CompanionLayoutMode {
  if (track === "investor") return "public-investor";
  if (track === "corporate" || track === "community") {
    return "public-ambassador";
  }
  return "public-guru";
}

function apiPartnerTypeForTrack(
  track: PartnerTrack,
): "parent" | "guru" | "ambassador" | "investor" {
  if (track === "investor") return "investor";
  if (track === "corporate" || track === "community") return "ambassador";
  return "guru";
}

function fieldClass(hasError: boolean) {
  return [
    "min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:ring-4",
    hasError
      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
      : "border-slate-200 focus:border-[#0D5C3A] focus:ring-emerald-100",
  ].join(" ");
}

/** GPU-composited section reveal (opacity + translate3d). */
function PartnerReveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      // Visibility is handled by CSS for reduced-motion; mark in for consistency.
      queueMicrotask(() => setVisible(true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`partner-reveal ${visible ? "partner-reveal--in" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

export default function PartnersLandingPage() {
  const [track, setTrack] = useState<PartnerTrack>("wellness");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fields, setFields] = useState<PartnerFields>({
    companyName: "",
    contactName: "",
    email: "",
    trackDetails: "",
    wellnessFocus: WELLNESS_FOCUS_OPTIONS[0],
    hasAppIntegration: false,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  const companionMode = companionModeForTrack(track);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFields((prev) => ({ ...prev, hasAppIntegration: e.target.checked }));
  };

  const validate = (): boolean => {
    const activeErrors: ValidationErrors = {};
    const emailCheck = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fields.companyName.trim()) {
      activeErrors.companyName = "Organization name is required.";
    }
    if (!fields.contactName.trim()) {
      activeErrors.contactName = "Please provide a primary contact name.";
    }
    if (!emailCheck.test(fields.email)) {
      activeErrors.email = "Provide a valid corporate email address.";
    }
    if (fields.trackDetails.trim().length < 15) {
      activeErrors.trackDetails =
        "Please share a brief strategy overview (min 15 characters).";
    }

    setErrors(activeErrors);
    return Object.keys(activeErrors).length === 0;
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const trackLabel =
        TRACKS.find((item) => item.id === track)?.label || track;
      const details = [
        fields.trackDetails.trim(),
        `Partnership track: ${trackLabel}`,
        track === "wellness" ? `Wellness focus: ${fields.wellnessFocus}` : null,
        `API / webhook integration intent: ${
          fields.hasAppIntegration ? "Yes" : "No"
        }`,
      ]
        .filter(Boolean)
        .join("\n");

      const result = await submitPartnershipInquiry({
        partnerType: apiPartnerTypeForTrack(track),
        fullName: fields.contactName.trim(),
        email: fields.email.trim(),
        organization: fields.companyName.trim(),
        message: details,
        source: "partners-landing",
        pagePath: "/partners",
      });

      if (!result.success) {
        setSubmitError(
          result.error || "Unable to submit right now. Please try again.",
        );
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Partnership ingestion failure:", err);
      setSubmitError("Unable to submit right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen font-sans antialiased text-slate-900"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 45% at 0% 0%, rgba(13,92,58,0.10), transparent 55%), radial-gradient(ellipse 55% 35% at 100% 8%, rgba(15,118,110,0.08), transparent 50%), linear-gradient(180deg, #f7fbf9 0%, #eef6f1 40%, #f8fafc 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
        <PartnerReveal className="mx-auto mb-14 max-w-3xl text-center md:mb-20">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-800">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Partner with SitGuru
          </p>
          <h1 className="mt-4 text-balance text-4xl font-black tracking-tight text-slate-950 sm:text-5xl md:text-6xl md:leading-[1.05]">
            The platform for{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(90deg, ${BRAND} 0%, #0f766e 100%)`,
              }}
            >
              pet wellness
            </span>{" "}
            partnerships
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base font-semibold leading-relaxed text-slate-500 sm:text-lg">
            SitGuru unifies pet logistics, preventative care pathways, and
            community engagement into one interactive partner framework — built
            for wellness providers, local groups, sponsors, and growth partners.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#partner-apply"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0D5C3A] px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-[#09462C]"
            >
              Start partnership request
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link
              href="/partners/apply"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-6 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
            >
              Full partner application
            </Link>
          </div>
        </PartnerReveal>

        <PartnerReveal className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:mb-20">
          {BENEFITS.map((benefit, index) => (
            <PartnerReveal
              key={benefit.title}
              delayMs={index * 80}
              className="rounded-2xl border border-emerald-100/80 bg-white/90 p-6 shadow-sm backdrop-blur-[2px] transition hover:border-emerald-200 hover:shadow-md"
            >
              <span
                className="grid h-11 w-11 place-items-center rounded-xl text-white"
                style={{ backgroundColor: BRAND }}
              >
                {benefit.icon}
              </span>
              <h2 className="mt-4 text-lg font-black tracking-tight text-slate-950">
                {benefit.title}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
                {benefit.description}
              </p>
            </PartnerReveal>
          ))}
        </PartnerReveal>

        <PartnerReveal className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <aside
            data-brand-green
            className="public-dark-section lg:sticky lg:top-8 lg:col-span-4 overflow-hidden rounded-2xl p-6 text-white shadow-xl shadow-emerald-950/20 sm:p-7"
            style={{
              backgroundImage: `linear-gradient(155deg, ${BRAND} 0%, ${BRAND_DEEP} 55%, #0f766e 100%)`,
              color: "#ffffff",
            }}
          >
            <h2
              className="text-xl font-black tracking-tight !text-white"
              style={{ color: "#ffffff" }}
            >
              Partner perks
            </h2>
            <p className="mt-1 text-sm font-semibold text-emerald-50/95">
              Operational utility out of the box — coordinated care, companion
              hand-offs, and shared growth.
            </p>

            <div className="mt-8 space-y-6">
              <div className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 text-emerald-100">
                  <Check className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h3
                    className="text-sm font-black !text-white"
                    style={{ color: "#ffffff" }}
                  >
                    Coordinated care operations
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold leading-relaxed text-emerald-100/90">
                    Align scheduling, referrals, and trusted care pathways with
                    SitGuru pet families and Gurus.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 text-emerald-100">
                  <Check className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h3
                    className="text-sm font-black !text-white"
                    style={{ color: "#ffffff" }}
                  >
                    AI context hand-offs
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold leading-relaxed text-emerald-100/90">
                    Scout, Taco, or Rogue switches with your track so the right
                    companion stays ready while you apply.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-2 border-t border-white/15 pt-6 text-xs font-semibold text-emerald-100/85">
              <p>
                Also explore{" "}
                <Link
                  href="/partners/local"
                  className="underline underline-offset-2"
                >
                  local
                </Link>
                ,{" "}
                <Link
                  href="/partners/national"
                  className="underline underline-offset-2"
                >
                  national
                </Link>
                ,{" "}
                <Link
                  href="/ambassadors"
                  className="underline underline-offset-2"
                >
                  ambassadors
                </Link>
                , and{" "}
                <Link
                  href="/affiliate-program"
                  className="underline underline-offset-2"
                >
                  affiliates
                </Link>
                .
              </p>
            </div>
          </aside>

          <section
            id="partner-apply"
            className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7 md:p-8"
          >
            {submitted ? (
              <div className="animate-fadeIn py-14 text-center">
                <span
                  className="mx-auto grid h-16 w-16 place-items-center rounded-full text-white"
                  style={{ backgroundColor: BRAND }}
                >
                  <Check className="h-8 w-8" aria-hidden />
                </span>
                <h2 className="mt-5 text-2xl font-black text-slate-950">
                  Application received
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm font-semibold text-slate-500">
                  Our alliances team is reviewing your partnership details.
                  Expect a response within one business day.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setSubmitError(null);
                  }}
                  className="mt-6 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-black text-[#0D5C3A] transition hover:bg-emerald-100"
                >
                  Submit another proposal
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleFormSubmit}
                className="space-y-6"
                noValidate
              >
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Select your synergy track
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {TRACKS.map((item) => {
                      const selected = track === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTrack(item.id)}
                          aria-pressed={selected}
                          className={`flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition ${
                            selected
                              ? "border-[#0D5C3A] bg-emerald-50 shadow-sm ring-2 ring-[#0D5C3A]/20"
                              : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40"
                          }`}
                        >
                          <span
                            className={`grid h-9 w-9 place-items-center rounded-lg ${
                              selected
                                ? "bg-[#0D5C3A] text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span
                            className={`text-xs font-black leading-tight ${
                              selected ? "text-[#0D5C3A]" : "text-slate-800"
                            }`}
                          >
                            {item.label}
                          </span>
                          <span className="text-[10px] font-semibold leading-snug text-slate-400">
                            {item.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="companyName"
                      className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-600"
                    >
                      Company / group name
                    </label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      autoComplete="organization"
                      value={fields.companyName}
                      onChange={handleInputChange}
                      placeholder="e.g., Healthy Paws Network"
                      className={fieldClass(Boolean(errors.companyName))}
                      aria-invalid={Boolean(errors.companyName)}
                    />
                    {errors.companyName ? (
                      <p className="mt-1.5 text-xs font-bold text-rose-600">
                        {errors.companyName}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="contactName"
                      className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-600"
                    >
                      Contact anchor name
                    </label>
                    <input
                      id="contactName"
                      name="contactName"
                      type="text"
                      autoComplete="name"
                      value={fields.contactName}
                      onChange={handleInputChange}
                      placeholder="Primary contact"
                      className={fieldClass(Boolean(errors.contactName))}
                      aria-invalid={Boolean(errors.contactName)}
                    />
                    {errors.contactName ? (
                      <p className="mt-1.5 text-xs font-bold text-rose-600">
                        {errors.contactName}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-600"
                  >
                    Corporate email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={fields.email}
                    onChange={handleInputChange}
                    placeholder="partnerships@company.com"
                    className={fieldClass(Boolean(errors.email))}
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email ? (
                    <p className="mt-1.5 text-xs font-bold text-rose-600">
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                {track === "wellness" ? (
                  <div className="animate-fadeIn">
                    <label
                      htmlFor="wellnessFocus"
                      className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-600"
                    >
                      Primary wellness discipline
                    </label>
                    <select
                      id="wellnessFocus"
                      name="wellnessFocus"
                      value={fields.wellnessFocus}
                      onChange={handleInputChange}
                      className={fieldClass(false)}
                    >
                      {WELLNESS_FOCUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:border-emerald-200">
                  <input
                    type="checkbox"
                    checked={fields.hasAppIntegration}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-slate-300 text-[#0D5C3A] focus:ring-[#0D5C3A]"
                  />
                  We intend to link services via SitGuru webhooks / developer
                  API
                </label>

                <div>
                  <label
                    htmlFor="trackDetails"
                    className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-600"
                  >
                    Partnership strategic proposal
                  </label>
                  <textarea
                    id="trackDetails"
                    name="trackDetails"
                    rows={4}
                    value={fields.trackDetails}
                    onChange={handleInputChange}
                    placeholder="Tell us how we can collaborate to elevate wellness and expand our communities together..."
                    className={fieldClass(Boolean(errors.trackDetails))}
                    aria-invalid={Boolean(errors.trackDetails)}
                  />
                  {errors.trackDetails ? (
                    <p className="mt-1.5 text-xs font-bold text-rose-600">
                      {errors.trackDetails}
                    </p>
                  ) : null}
                </div>

                {submitError ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                  >
                    {submitError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0D5C3A] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-[#09462C] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Submitting partnership request..."
                    : "Deploy partnership request"}
                  {!loading ? (
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  ) : null}
                </button>

                <p className="text-center text-[11px] font-semibold text-slate-400">
                  Prefer the full packet?{" "}
                  <Link
                    href="/partners/apply"
                    className="font-black text-[#0D5C3A] hover:underline"
                  >
                    Open partner application
                  </Link>
                </p>
              </form>
            )}
          </section>
        </PartnerReveal>
      </div>

      <AIScoutCompanion mode={companionMode} currentPath="/partners" />
    </div>
  );
}
