"use client";

/**
 * Smart contact routing panel — persona cards drive contextual form matrices.
 */

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { VETERANS_MILITARY_FAMILIES_PROGRAM } from "@/lib/programs/veterans-military-families";
import {
  BriefcaseBusiness,
  Lightbulb,
  PawPrint,
  Rocket,
  Send,
  ShieldAlert,
  UsersRound,
} from "lucide-react";

type ContactPersona =
  | "pet-parent"
  | "guru"
  | "ambassador"
  | "investor-press";

type ContactFormState = {
  fullName: string;
  email: string;
  zipCode: string;
  organization: string;
  companyName: string;
  programInterest: string;
  message: string;
  urgentMedia: boolean;
  source: string;
};

const initialForm: ContactFormState = {
  fullName: "",
  email: "",
  zipCode: "",
  organization: "",
  companyName: "",
  programInterest: "",
  message: "",
  urgentMedia: false,
  source: "contact-page",
};

const personas: Array<{
  id: ContactPersona;
  label: string;
  emoji: string;
  icon: typeof PawPrint;
  tone: string;
  selectedTone: string;
}> = [
  {
    id: "pet-parent",
    label: "Pet Parent Help",
    emoji: "🐾",
    icon: PawPrint,
    tone: "border-emerald-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/60",
    selectedTone:
      "border-emerald-400 bg-emerald-50 ring-4 ring-emerald-100 shadow-sm",
  },
  {
    id: "guru",
    label: "Guru Support",
    emoji: "💼",
    icon: UsersRound,
    tone: "border-sky-100 bg-white hover:border-sky-200 hover:bg-sky-50/60",
    selectedTone: "border-sky-400 bg-sky-50 ring-4 ring-sky-100 shadow-sm",
  },
  {
    id: "ambassador",
    label: "Ambassador / Programs",
    emoji: "🚀",
    icon: Rocket,
    tone: "border-violet-100 bg-white hover:border-violet-200 hover:bg-violet-50/60",
    selectedTone:
      "border-violet-400 bg-violet-50 ring-4 ring-violet-100 shadow-sm",
  },
  {
    id: "investor-press",
    label: "Investor / Press",
    emoji: "📈",
    icon: BriefcaseBusiness,
    tone: "border-amber-100 bg-white hover:border-amber-200 hover:bg-amber-50/60",
    selectedTone:
      "border-amber-400 bg-amber-50 ring-4 ring-amber-100 shadow-sm",
  },
];

const programOptions = [
  "Student Hire Program",
  "Community Hire Program",
  VETERANS_MILITARY_FAMILIES_PROGRAM.displayName,
  "Ambassador Program",
  "Not sure yet",
];

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

function personaToTopic(persona: ContactPersona) {
  if (persona === "pet-parent") return "pet-parent";
  if (persona === "guru") return "guru";
  if (persona === "ambassador") return "ambassadors";
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
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100";

const labelClass = "mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-600";

export default function ContactPage() {
  const [persona, setPersona] = useState<ContactPersona>("pet-parent");
  const [form, setForm] = useState<ContactFormState>(() => ({
    ...initialForm,
    source: detectSourceFromUrl(),
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const personaMeta = useMemo(
    () => personas.find((item) => item.id === persona) || personas[0],
    [persona],
  );

  function updateField<K extends keyof ContactFormState>(
    key: K,
    value: ContactFormState[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (formError) setFormError("");
    if (formSuccess) setFormSuccess("");
  }

  function selectPersona(next: ContactPersona) {
    setPersona(next);
    setFormError("");
    setFormSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setFormSuccess("");

    const topic = personaToTopic(persona);
    const displayName =
      persona === "investor-press"
        ? form.companyName.trim() || form.fullName.trim()
        : form.fullName.trim();

    const messageParts = [form.message.trim()];
    if (persona === "pet-parent" && form.zipCode.trim()) {
      messageParts.push(`ZIP: ${form.zipCode.trim()}`);
    }
    if (persona === "ambassador" && form.organization.trim()) {
      messageParts.push(`Organization/School: ${form.organization.trim()}`);
    }
    if (persona === "investor-press") {
      if (form.companyName.trim()) {
        messageParts.push(`Company: ${form.companyName.trim()}`);
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
            persona === "ambassador" ? form.programInterest : "",
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
        "Thanks — your message was routed to the right SitGuru team.",
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
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fffb_0%,#f4fbf7_50%,#ffffff_100%)] text-slate-950">
      <section className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <header className="mb-5 text-center sm:mb-6 sm:text-left">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
              Contact SitGuru
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Who can we help?
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-600 sm:text-base">
              Pick a path — we’ll show only the fields that matter.
            </p>
          </header>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {personas.map((item) => {
              const selected = persona === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectPersona(item.id)}
                  aria-pressed={selected}
                  className={`flex min-h-[104px] flex-col items-start justify-between rounded-2xl border p-3 text-left transition sm:min-h-[112px] sm:p-4 ${
                    selected ? item.selectedTone : item.tone
                  }`}
                >
                  <span className="text-xl" aria-hidden>
                    {item.emoji}
                  </span>
                  <span className="mt-2 flex w-full items-end justify-between gap-2">
                    <span className="text-xs font-black leading-4 text-slate-950 sm:text-sm sm:leading-5">
                      {item.label}
                    </span>
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        selected ? "opacity-90" : "opacity-50"
                      }`}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          <div
            id="contact-form"
            className="mt-5 scroll-mt-4 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={openRogueChat}
              className="flex w-full items-start gap-3 border-b border-amber-100 bg-[linear-gradient(90deg,#fffbeb_0%,#ffffff_70%)] px-4 py-3 text-left transition hover:bg-amber-50/80 sm:items-center"
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
                <Lightbulb className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black leading-5 text-amber-950">
                  💡 Need an instant answer? Chat with Rogue below for 5-second
                  automatic assistance!
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-amber-800/80">
                  Tap to open Rogue · {personaMeta.label}
                </span>
              </span>
            </button>

            <form
              onSubmit={handleSubmit}
              className="space-y-3 px-4 py-2 sm:space-y-4 sm:px-6 sm:py-5"
            >
              <div key={persona} className="space-y-3 sm:space-y-4">
                {persona === "pet-parent" ? (
                  <>
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                      <p className="flex items-center gap-2 text-sm font-black text-rose-900">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        Emergency Guardrail
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-rose-800 sm:text-sm">
                        For urgent pet safety or medical emergencies, contact
                        your veterinarian or local emergency services first —
                        SitGuru support is not an emergency line.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClass} htmlFor="contact-name">
                          Name
                        </label>
                        <input
                          id="contact-name"
                          value={form.fullName}
                          onChange={(e) =>
                            updateField("fullName", e.target.value)
                          }
                          className={fieldClass}
                          placeholder="Your name"
                          required
                          autoComplete="name"
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="contact-email">
                          Email
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          className={fieldClass}
                          placeholder="you@example.com"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="contact-zip">
                        Zip Code
                      </label>
                      <input
                        id="contact-zip"
                        value={form.zipCode}
                        onChange={(e) => updateField("zipCode", e.target.value)}
                        className={fieldClass}
                        placeholder="12345"
                        inputMode="numeric"
                        autoComplete="postal-code"
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="contact-message">
                        How can we help?
                      </label>
                      <textarea
                        id="contact-message"
                        value={form.message}
                        onChange={(e) => updateField("message", e.target.value)}
                        rows={4}
                        className={`${fieldClass} h-auto min-h-[112px] resize-y py-3`}
                        placeholder="Booking help, account question, finding care…"
                        required
                      />
                    </div>
                  </>
                ) : null}

                {persona === "guru" ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClass} htmlFor="guru-name">
                          Name
                        </label>
                        <input
                          id="guru-name"
                          value={form.fullName}
                          onChange={(e) =>
                            updateField("fullName", e.target.value)
                          }
                          className={fieldClass}
                          placeholder="Your name"
                          required
                          autoComplete="name"
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="guru-email">
                          Email
                        </label>
                        <input
                          id="guru-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          className={fieldClass}
                          placeholder="you@example.com"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="guru-message">
                        Support details
                      </label>
                      <textarea
                        id="guru-message"
                        value={form.message}
                        onChange={(e) => updateField("message", e.target.value)}
                        rows={4}
                        className={`${fieldClass} h-auto min-h-[112px] resize-y py-3`}
                        placeholder="Profile, payouts, bookings, onboarding…"
                        required
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link
                        href="/become-a-guru"
                        className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-900"
                      >
                        Become a Guru
                      </Link>
                      <Link
                        href="/guru/dashboard"
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700"
                      >
                        Guru dashboard
                      </Link>
                    </div>
                  </>
                ) : null}

                {persona === "ambassador" ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClass} htmlFor="amb-name">
                          Full Name
                        </label>
                        <input
                          id="amb-name"
                          value={form.fullName}
                          onChange={(e) =>
                            updateField("fullName", e.target.value)
                          }
                          className={fieldClass}
                          placeholder="Your full name"
                          required
                          autoComplete="name"
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="amb-email">
                          Email
                        </label>
                        <input
                          id="amb-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          className={fieldClass}
                          placeholder="you@example.com"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="amb-org">
                        Organization / School Name
                      </label>
                      <input
                        id="amb-org"
                        value={form.organization}
                        onChange={(e) =>
                          updateField("organization", e.target.value)
                        }
                        className={fieldClass}
                        placeholder="School, club, or organization"
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="amb-program">
                        Program interest
                      </label>
                      <select
                        id="amb-program"
                        value={form.programInterest}
                        onChange={(e) =>
                          updateField("programInterest", e.target.value)
                        }
                        className={fieldClass}
                        required
                      >
                        <option value="">Select a program</option>
                        {programOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="amb-message">
                        Message
                      </label>
                      <textarea
                        id="amb-message"
                        value={form.message}
                        onChange={(e) => updateField("message", e.target.value)}
                        rows={3}
                        className={`${fieldClass} h-auto min-h-[96px] resize-y py-3`}
                        placeholder="Tell us about your interest…"
                        required
                      />
                    </div>
                  </>
                ) : null}

                {persona === "investor-press" ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClass} htmlFor="inv-company">
                          Company Name
                        </label>
                        <input
                          id="inv-company"
                          value={form.companyName}
                          onChange={(e) =>
                            updateField("companyName", e.target.value)
                          }
                          className={fieldClass}
                          placeholder="Company or publication"
                          required
                          autoComplete="organization"
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="inv-email">
                          Email
                        </label>
                        <input
                          id="inv-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          className={fieldClass}
                          placeholder="you@company.com"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="inv-message">
                        Message
                      </label>
                      <textarea
                        id="inv-message"
                        value={form.message}
                        onChange={(e) => updateField("message", e.target.value)}
                        rows={4}
                        className={`${fieldClass} h-auto min-h-[112px] resize-y py-3`}
                        placeholder="Investor inquiry or press request…"
                        required
                      />
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={form.urgentMedia}
                        onChange={(e) =>
                          updateField("urgentMedia", e.target.checked)
                        }
                        className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-700 focus:ring-amber-200"
                      />
                      <span>
                        <span className="block text-sm font-black text-amber-950">
                          Urgent media deadline
                        </span>
                        <span className="mt-0.5 block text-xs font-semibold text-amber-800/80">
                          Check if you need a same-day press response.
                        </span>
                      </span>
                    </label>
                  </>
                ) : null}
              </div>

              {formError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                  {formError}
                </div>
              ) : null}

              {formSuccess ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                  {formSuccess}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-md shadow-emerald-900/15 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Sending…" : `Send ${personaMeta.label} message`}
                <Send className="h-4 w-4" />
              </button>

              <p className="pb-2 text-center text-[11px] font-semibold leading-4 text-slate-400">
                Routed as {personaToTopic(persona).replace(/-/g, " ")} · No
                spam · Emergency care: call local services first
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
