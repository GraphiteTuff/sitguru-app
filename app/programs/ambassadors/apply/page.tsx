"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Loader2,
  PawPrint,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type AmbassadorType =
  | "vet-tech"
  | "veterinarian"
  | "trainer"
  | "groomer"
  | "student"
  | "veteran-military"
  | "rescue-shelter"
  | "guru"
  | "community"
  | "pet-care-professional"
  | "medical-professional"
  | "other";

type ReferralFocus =
  | "gurus"
  | "pet-parents"
  | "both"
  | "partners"
  | "community-awareness"
  | "not-sure";

type ZipLookupResult = {
  city: string;
  state: string;
  stateAbbreviation: string;
};

type ZipLookupStatus = "idle" | "loading" | "found" | "not-found" | "error";

type SubmitStatus = "idle" | "success" | "error";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  ambassadorType: AmbassadorType;
  profession: string;
  organizationName: string;
  referralFocus: ReferralFocus;
  communityReach: string;
  whyInterested: string;
  referralCode: string;
  referredByCode: string;
  consentToFeature: boolean;
  consentToContact: boolean;
};

const ambassadorTypeOptions: { value: AmbassadorType; label: string }[] = [
  { value: "vet-tech", label: "Vet Tech Ambassador" },
  { value: "veterinarian", label: "Veterinarian Ambassador" },
  { value: "trainer", label: "Trainer Ambassador" },
  { value: "groomer", label: "Groomer Ambassador" },
  { value: "student", label: "Student Ambassador" },
  { value: "veteran-military", label: "Veteran Ambassador" },
  { value: "rescue-shelter", label: "Rescue & Shelter Ambassador" },
  { value: "guru", label: "Guru Ambassador" },
  { value: "community", label: "Community Ambassador" },
  { value: "pet-care-professional", label: "Pet Care Professional" },
  { value: "medical-professional", label: "Medical Professional" },
  { value: "other", label: "Other / Not Sure Yet" },
];

const referralFocusOptions: { value: ReferralFocus; label: string }[] = [
  { value: "both", label: "Both Pet Parents and Gurus" },
  { value: "pet-parents", label: "Pet Parents who need trusted care" },
  { value: "gurus", label: "Great people who may become Gurus" },
  { value: "partners", label: "Local partners and community groups" },
  { value: "community-awareness", label: "Community awareness" },
  { value: "not-sure", label: "Not sure yet" },
];

const zipCodeFallbackMap: Record<
  string,
  { city: string; state: string; stateAbbreviation: string }
> = {
  "08030": {
    city: "Camden",
    state: "New Jersey",
    stateAbbreviation: "NJ",
  },
  "18018": {
    city: "Bethlehem",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
  "18101": {
    city: "Allentown",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
  "18951": {
    city: "Quakertown",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
  "19103": {
    city: "Philadelphia",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
};

const defaultFormState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  zipCode: "",
  ambassadorType: "community",
  profession: "",
  organizationName: "",
  referralFocus: "both",
  communityReach: "",
  whyInterested: "",
  referralCode: "",
  referredByCode: "",
  consentToFeature: false,
  consentToContact: true,
};

const confettiPieces = Array.from({ length: 42 }, (_, index) => ({
  id: index,
  left: `${(index * 19) % 100}%`,
  delay: `${(index % 9) * 0.11}s`,
  duration: `${2.4 + (index % 6) * 0.2}s`,
  emoji: ["🐾", "🎉", "💚", "✨", "🦴", "🐶", "🐱"][index % 7],
  size: `${18 + (index % 5) * 4}px`,
}));

function getAllowedAmbassadorType(value: string | null): AmbassadorType {
  const allowed = ambassadorTypeOptions.map((option) => option.value);

  if (value && allowed.includes(value as AmbassadorType)) {
    return value as AmbassadorType;
  }

  return "community";
}

function cleanText(value: string) {
  return value.trim();
}

function normalizeZipCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;

  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

async function lookupZipCode(zipCode: string): Promise<ZipLookupResult | null> {
  const normalizedZip = normalizeZipCode(zipCode);

  if (normalizedZip.length !== 5) return null;

  const fallback = zipCodeFallbackMap[normalizedZip];

  if (fallback) return fallback;

  const response = await fetch(`https://api.zippopotam.us/us/${normalizedZip}`);

  if (!response.ok) return null;

  const payload = await response.json();
  const place = payload?.places?.[0];

  if (!place) return null;

  return {
    city: String(place["place name"] || "").trim(),
    state: String(place.state || "").trim(),
    stateAbbreviation: String(place["state abbreviation"] || "").trim(),
  };
}

function FieldLabel({
  htmlFor,
  children,
  required = false,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm font-black uppercase tracking-[0.08em] text-green-900"
    >
      {children}
      {required ? <span className="text-rose-600"> *</span> : null}
    </label>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  inputMode,
  maxLength,
}: {
  id: keyof FormState;
  value: string;
  onChange: (field: keyof FormState, value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
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
    <input
      id={id}
      name={id}
      type={type}
      value={value}
      required={required}
      placeholder={placeholder}
      inputMode={inputMode}
      maxLength={maxLength}
      onChange={(event) => onChange(id, event.target.value)}
      className="min-h-[52px] rounded-2xl border border-green-100 bg-white px-4 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
    />
  );
}

function SelectInput<T extends string>({
  id,
  value,
  onChange,
  options,
}: {
  id: keyof FormState;
  value: T;
  onChange: (field: keyof FormState, value: string) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      id={id}
      name={id}
      value={value}
      onChange={(event) => onChange(id, event.target.value)}
      className="min-h-[52px] rounded-2xl border border-green-100 bg-white px-4 text-base font-semibold text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function TextAreaInput({
  id,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  id: keyof FormState;
  value: string;
  onChange: (field: keyof FormState, value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <textarea
      id={id}
      name={id}
      value={value}
      required={required}
      placeholder={placeholder}
      onChange={(event) => onChange(id, event.target.value)}
      rows={5}
      className="rounded-2xl border border-green-100 bg-white px-4 py-3 text-base font-semibold leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
    />
  );
}

function AmbassadorApplyPageContent() {
  const searchParams = useSearchParams();

  const startingAmbassadorType = useMemo(
    () => getAllowedAmbassadorType(searchParams.get("type")),
    [searchParams],
  );

  const [form, setForm] = useState<FormState>({
    ...defaultFormState,
    ambassadorType: startingAmbassadorType,
    referralCode: searchParams.get("ref") || "",
    referredByCode: searchParams.get("referredByCode") || "",
  });

  const [zipLookupStatus, setZipLookupStatus] =
    useState<ZipLookupStatus>("idle");
  const [zipLookupMessage, setZipLookupMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const normalizedZip = normalizeZipCode(form.zipCode);

    if (!normalizedZip) {
      setZipLookupStatus("idle");
      setZipLookupMessage("");
      return;
    }

    if (normalizedZip.length < 5) {
      setZipLookupStatus("idle");
      setZipLookupMessage("Enter a 5-digit ZIP code to autofill city and state.");
      return;
    }

    let isMounted = true;

    async function runLookup() {
      setZipLookupStatus("loading");
      setZipLookupMessage("Looking up ZIP code...");

      try {
        const result = await lookupZipCode(normalizedZip);

        if (!isMounted) return;

        if (!result?.city || !result?.state) {
          setZipLookupStatus("not-found");
          setZipLookupMessage(
            "We could not autofill that ZIP code. You can still enter city and state manually.",
          );
          return;
        }

        setForm((current) => ({
          ...current,
          zipCode: normalizedZip,
          city: result.city,
          state: result.state,
        }));

        setZipLookupStatus("found");
        setZipLookupMessage(
          `Autofilled ${result.city}, ${
            result.stateAbbreviation || result.state
          }.`,
        );
      } catch (error) {
        if (!isMounted) return;

        console.error("Ambassador ZIP lookup failed:", error);
        setZipLookupStatus("error");
        setZipLookupMessage(
          "ZIP autofill is unavailable right now. You can still enter city and state manually.",
        );
      }
    }

    const timeout = window.setTimeout(runLookup, 350);

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [form.zipCode]);

  useEffect(() => {
    if (!showConfetti) return;

    const timeout = window.setTimeout(() => {
      setShowConfetti(false);
    }, 4300);

    return () => window.clearTimeout(timeout);
  }, [showConfetti]);

  function updateField(field: keyof FormState, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]:
        field === "phone"
          ? formatPhoneNumber(String(value))
          : field === "zipCode"
            ? normalizeZipCode(String(value))
            : value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setMessage("");
    setApplicationId("");

    const payload = {
      fullName: cleanText(form.fullName),
      email: cleanText(form.email),
      phone: cleanText(form.phone),
      city: cleanText(form.city),
      state: cleanText(form.state),
      zipCode: cleanText(form.zipCode),
      ambassadorType: form.ambassadorType,
      profession: cleanText(form.profession),
      organizationName: cleanText(form.organizationName),
      referralFocus: form.referralFocus,
      communityReach: cleanText(form.communityReach),
      whyInterested: cleanText(form.whyInterested),
      referralCode: cleanText(form.referralCode),
      referredByCode: cleanText(form.referredByCode),
      consentToFeature: form.consentToFeature,
      consentToContact: form.consentToContact,
      sourceUrl:
        typeof window !== "undefined" ? window.location.href : undefined,
      utmSource: searchParams.get("utm_source") || undefined,
      utmMedium: searchParams.get("utm_medium") || undefined,
      utmCampaign: searchParams.get("utm_campaign") || undefined,
      utmContent: searchParams.get("utm_content") || undefined,
      utmTerm: searchParams.get("utm_term") || undefined,
    };

    try {
      const response = await fetch("/api/programs/ambassadors/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        applicationId?: string;
        application?: {
          id?: string;
        };
      };

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error ||
            "We could not submit your Ambassador application. Please try again.",
        );
      }

      setSubmitStatus("success");
      setApplicationId(result.applicationId || result.application?.id || "");
      setShowConfetti(true);
      setMessage(
        result.message ||
          "Your SitGuru Ambassador application has been submitted successfully.",
      );

      setForm({
        ...defaultFormState,
        ambassadorType: startingAmbassadorType,
        referralCode: searchParams.get("ref") || "",
        referredByCode: searchParams.get("referredByCode") || "",
      });

      setZipLookupStatus("idle");
      setZipLookupMessage("");

      window.setTimeout(() => {
        document
          .getElementById("ambassador-submit-message")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
    } catch (error) {
      setSubmitStatus("error");
      setApplicationId("");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting your Ambassador application.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7faf7]">
      <style jsx global>{`
        @keyframes sitguru-confetti-fall {
          0% {
            transform: translate3d(0, -20vh, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translate3d(24px, 110vh, 0) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes sitguru-success-pop {
          0% {
            transform: scale(0.96);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .sitguru-success-pop {
          animation: sitguru-success-pop 0.28s ease-out both;
        }
      `}</style>

      {showConfetti ? (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="absolute top-0 inline-block select-none"
              style={{
                left: piece.left,
                fontSize: piece.size,
                animation: `sitguru-confetti-fall ${piece.duration} linear ${piece.delay} forwards`,
              }}
            >
              {piece.emoji}
            </span>
          ))}
        </div>
      ) : null}

      <section className="mx-auto max-w-[1350px] px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/programs/ambassadors"
          className="inline-flex items-center gap-2 text-sm font-black text-green-900 transition hover:text-green-700"
        >
          <ArrowLeft size={16} />
          Back to Ambassador Program
        </Link>

        <div className="mt-5 overflow-hidden rounded-[32px] border border-[#cfe2d2] bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 p-6 !text-white sm:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] !text-white">
                <HeartHandshake size={16} />
                Join the Pack
              </div>

              <h1 className="mt-6 text-4xl font-black leading-[0.95] tracking-tight !text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)] sm:text-5xl">
                Become a SitGuru Ambassador.
              </h1>

              <p className="mt-5 text-base font-semibold leading-8 !text-green-50">
                Help Pet Parents find trusted care, help great people become
                Gurus, and help SitGuru grow as a true pet care community — not
                just another booking service.
              </p>

              <div className="mt-8 grid gap-4">
                {[
                  {
                    icon: PawPrint,
                    title: "Support Pet Parents",
                    text: "Introduce families to trusted local care for pets they love.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Grow trusted Gurus",
                    text: "Help responsible pet lovers discover flexible ways to serve their community.",
                  },
                  {
                    icon: Sparkles,
                    title: "Earn recognition",
                    text: "Ambassadors may be eligible for rewards, recognition, and Pack Leader highlights as the community grows.",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-green-950">
                          <Icon size={20} />
                        </div>
                        <div>
                          <h2 className="text-lg font-black !text-white">
                            {item.title}
                          </h2>
                          <p className="mt-1 text-sm font-semibold leading-6 !text-green-50">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 rounded-[24px] border border-white/20 bg-white/10 p-4">
                <p className="text-sm font-semibold leading-7 !text-green-50">
                  Rewards, commissions, recognition, program eligibility, and
                  public features may vary and are not guaranteed. SitGuru will
                  always seek permission before publicly featuring an
                  Ambassador’s name, photo, story, or performance highlights.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
                  Ambassador Application
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Tell us how you want to help grow the Pack.
                </h2>

                <p className="mt-3 text-sm font-semibold leading-7 text-slate-700 sm:text-base">
                  This helps SitGuru understand your community, your background,
                  and the Ambassador path that fits you best.
                </p>
              </div>

              {submitStatus === "success" ? (
                <div
                  id="ambassador-submit-message"
                  className="sitguru-success-pop mt-6 rounded-[26px] border border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-5 text-green-950 shadow-sm"
                  aria-live="polite"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-800 !text-white shadow-lg shadow-green-900/15">
                      <CheckCircle2 size={28} />
                    </div>

                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                        Application submitted
                      </p>

                      <h3 className="mt-2 text-2xl font-black tracking-tight text-green-950">
                        Thank you for your interest in joining the Pack!
                      </h3>

                      <p className="mt-2 text-sm font-bold leading-7 text-slate-700">
                        Your SitGuru Ambassador application has been submitted.
                        We’re excited to learn more about your community reach,
                        referral goals, and how you want to help SitGuru grow.
                      </p>

                      {applicationId ? (
                        <p className="mt-3 rounded-2xl border border-green-200 bg-white px-4 py-3 text-xs font-black text-green-900">
                          Application ID: {applicationId}
                        </p>
                      ) : null}

                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-xs font-bold leading-6 text-amber-900">
                          What happens next: SitGuru will review your Ambassador
                          application, community background, and referral
                          interests. If there is a next step, we may contact you
                          with follow-up questions, guidance, or onboarding
                          details.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : submitStatus === "error" ? (
                <div
                  id="ambassador-submit-message"
                  className="mt-6 rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-rose-950"
                  aria-live="assertive"
                >
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 shrink-0" size={20} />
                    <p className="text-sm font-bold leading-6">{message}</p>
                  </div>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-7 space-y-7">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="fullName" required>
                      Full name
                    </FieldLabel>
                    <TextInput
                      id="fullName"
                      value={form.fullName}
                      required
                      placeholder="Your full name"
                      onChange={updateField}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="email" required>
                      Email
                    </FieldLabel>
                    <TextInput
                      id="email"
                      type="email"
                      value={form.email}
                      required
                      placeholder="you@example.com"
                      onChange={updateField}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="phone">Phone</FieldLabel>
                    <TextInput
                      id="phone"
                      type="tel"
                      value={form.phone}
                      placeholder="Optional, example: 253-455-5256"
                      inputMode="tel"
                      maxLength={12}
                      onChange={updateField}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="zipCode" required>
                      ZIP code
                    </FieldLabel>
                    <TextInput
                      id="zipCode"
                      value={form.zipCode}
                      required
                      placeholder="Local service area"
                      inputMode="numeric"
                      maxLength={5}
                      onChange={updateField}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="city" required>
                      City
                    </FieldLabel>
                    <TextInput
                      id="city"
                      value={form.city}
                      required
                      placeholder="City"
                      onChange={updateField}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="state" required>
                      State
                    </FieldLabel>
                    <TextInput
                      id="state"
                      value={form.state}
                      required
                      placeholder="State"
                      onChange={updateField}
                    />
                  </div>
                </div>

                {zipLookupMessage ? (
                  <p
                    className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                      zipLookupStatus === "found"
                        ? "border border-green-200 bg-green-50 text-green-800"
                        : zipLookupStatus === "loading"
                          ? "border border-slate-200 bg-slate-50 text-slate-600"
                          : "border border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    {zipLookupMessage}
                  </p>
                ) : null}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="ambassadorType" required>
                      Ambassador path
                    </FieldLabel>
                    <SelectInput
                      id="ambassadorType"
                      value={form.ambassadorType}
                      options={ambassadorTypeOptions}
                      onChange={updateField}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="referralFocus" required>
                      Who do you want to help most?
                    </FieldLabel>
                    <SelectInput
                      id="referralFocus"
                      value={form.referralFocus}
                      options={referralFocusOptions}
                      onChange={updateField}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="profession">
                      Profession / background
                    </FieldLabel>
                    <TextInput
                      id="profession"
                      value={form.profession}
                      placeholder="Vet Tech, student, trainer, veteran, etc."
                      onChange={updateField}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="organizationName">
                      Organization / school / business
                    </FieldLabel>
                    <TextInput
                      id="organizationName"
                      value={form.organizationName}
                      placeholder="Optional"
                      onChange={updateField}
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="referralCode">
                      Your preferred referral code
                    </FieldLabel>
                    <TextInput
                      id="referralCode"
                      value={form.referralCode}
                      placeholder="Optional, example: JASONPACK"
                      onChange={updateField}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="referredByCode">
                      Were you referred by someone?
                    </FieldLabel>
                    <TextInput
                      id="referredByCode"
                      value={form.referredByCode}
                      placeholder="Optional referral code"
                      onChange={updateField}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="communityReach">
                    Tell us about your community reach
                  </FieldLabel>
                  <TextAreaInput
                    id="communityReach"
                    value={form.communityReach}
                    placeholder="Examples: veterinary clinic clients, campus groups, local Pet Parents, training clients, rescue network, military community, social groups, neighborhood groups..."
                    onChange={updateField}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="whyInterested" required>
                    Why do you want to become a SitGuru Ambassador?
                  </FieldLabel>
                  <TextAreaInput
                    id="whyInterested"
                    value={form.whyInterested}
                    required
                    placeholder="Tell us why SitGuru's pet community mission matters to you."
                    onChange={updateField}
                  />
                </div>

                <div className="space-y-4 rounded-[24px] border border-green-100 bg-[#f8faf7] p-5">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.consentToContact}
                      onChange={(event) =>
                        updateField("consentToContact", event.target.checked)
                      }
                      className="mt-1 h-5 w-5 rounded border-green-300 text-green-800 focus:ring-green-500"
                    />
                    <span className="text-sm font-semibold leading-6 text-slate-700">
                      SitGuru may contact me about my Ambassador application,
                      program updates, and next steps.
                    </span>
                  </label>

                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.consentToFeature}
                      onChange={(event) =>
                        updateField("consentToFeature", event.target.checked)
                      }
                      className="mt-1 h-5 w-5 rounded border-green-300 text-green-800 focus:ring-green-500"
                    />
                    <span className="text-sm font-semibold leading-6 text-slate-700">
                      I am open to being considered for future SitGuru
                      Ambassador recognition, Pack Leader highlights, or
                      community features. SitGuru will seek permission before
                      publicly featuring my name, photo, story, or performance
                      highlights.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-6 py-4 text-base font-black !text-white shadow-lg shadow-green-900/10 transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={19} />
                      Submitting application...
                    </>
                  ) : (
                    <>
                      Submit Ambassador Application
                      <ArrowRight size={19} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function AmbassadorApplyPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7faf7] px-4 py-10">
          <div className="mx-auto max-w-[900px] rounded-[28px] border border-green-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-900">
              <Loader2 className="animate-spin" size={24} />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-950">
              Loading Ambassador application...
            </h1>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Preparing your SitGuru Ambassador application.
            </p>
          </div>
        </main>
      }
    >
      <AmbassadorApplyPageContent />
    </Suspense>
  );
}