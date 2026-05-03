"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Mail,
  Medal,
  MessageCircle,
  Newspaper,
  PawPrint,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

type ContactTopic =
  | "general"
  | "pet-parent"
  | "guru"
  | "programs"
  | "partners"
  | "investors"
  | "press"
  | "support";

type ContactFormState = {
  fullName: string;
  email: string;
  phone: string;
  topic: ContactTopic;
  programInterest: string;
  message: string;
  source: string;
};

type ContactCard = {
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  cta: string;
  icon: ReactNode;
};

const initialContactForm: ContactFormState = {
  fullName: "",
  email: "",
  phone: "",
  topic: "general",
  programInterest: "",
  message: "",
  source: "contact-page",
};

const contactTopics: Array<{
  value: ContactTopic;
  label: string;
  description: string;
}> = [
  {
    value: "general",
    label: "General",
    description: "I have a general question for SitGuru.",
  },
  {
    value: "pet-parent",
    label: "Pet Parent",
    description: "I need help finding or booking pet care.",
  },
  {
    value: "guru",
    label: "Guru",
    description: "I want to become a Guru or need Guru support.",
  },
  {
    value: "programs",
    label: "Programs",
    description: "I am interested in Military, Student, or Community programs.",
  },
  {
    value: "partners",
    label: "Partners",
    description: "I want to partner with SitGuru.",
  },
  {
    value: "investors",
    label: "Investors",
    description: "I have an investor or strategic growth inquiry.",
  },
  {
    value: "press",
    label: "Press",
    description: "I have a media or press inquiry.",
  },
  {
    value: "support",
    label: "Support",
    description: "I need help with an account, message, booking, or issue.",
  },
];

const contactCards: ContactCard[] = [
  {
    title: "Pet Parents",
    eyebrow: "Find trusted care",
    description:
      "Search for local Gurus, explore services, and get help finding trusted care for your pets.",
    href: "/search",
    cta: "Find a Guru",
    icon: <PawPrint size={26} />,
  },
  {
    title: "Gurus",
    eyebrow: "Grow with SitGuru",
    description:
      "Become a Guru, manage your profile, or get connected to the right Guru pathway.",
    href: "/become-a-guru",
    cta: "Become a Guru",
    icon: <UsersRound size={26} />,
  },
  {
    title: "Programs",
    eyebrow: "Apply today",
    description:
      "Military, Student, and Community Hire programs help qualified people train, grow, and work toward full Guru status.",
    href: "/programs/apply",
    cta: "Apply to a Program",
    icon: <HeartHandshake size={26} />,
  },
  {
    title: "Partners",
    eyebrow: "Build with SitGuru",
    description:
      "Partner with SitGuru through community, workforce, military, student, local, or national programs.",
    href: "/partners",
    cta: "Partner with Us",
    icon: <Handshake size={26} />,
  },
  {
    title: "Investors",
    eyebrow: "Strategic growth",
    description:
      "Connect with SitGuru for investor relations, strategic partnerships, and growth opportunities.",
    href: "/investors",
    cta: "Investor Info",
    icon: <BriefcaseBusiness size={26} />,
  },
  {
    title: "Press",
    eyebrow: "Media inquiries",
    description:
      "Reach out for media, launch, local market, founder, or community program stories.",
    href: "#contact-form",
    cta: "Contact Press",
    icon: <Newspaper size={26} />,
  },
];

const programOptions = [
  "Military Hire Program",
  "Student Hire Program",
  "Community Hire Program",
  "Not sure yet",
];

function detectSourceFromUrl() {
  if (typeof window === "undefined") return "contact-page";

  const params = new URLSearchParams(window.location.search);
  const sourceParam =
    params.get("source") ||
    params.get("utm_source") ||
    params.get("ref") ||
    "contact-page";

  return sourceParam.trim().toLowerCase() || "contact-page";
}

function ContactCard({ card }: { card: ContactCard }) {
  return (
    <Link
      href={card.href}
      className="group rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
        {card.icon}
      </div>

      <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
        {card.eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-black tracking-tight text-green-950">
        {card.title}
      </h2>

      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {card.description}
      </p>

      <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-green-800">
        {card.cta}
        <ArrowRight size={16} />
      </span>
    </Link>
  );
}

function TopicButton({
  value,
  label,
  description,
  selected,
  onSelect,
}: {
  value: ContactTopic;
  label: string;
  description: string;
  selected: boolean;
  onSelect: (value: ContactTopic) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-green-400 bg-green-50 shadow-sm ring-4 ring-green-100"
          : "border-[#e3ece5] bg-white hover:border-green-200 hover:bg-green-50/50"
      }`}
    >
      <p className="text-sm font-black text-slate-950">{label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
        {description}
      </p>
    </button>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-green-800">
        {title}
      </p>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-2 text-sm font-bold leading-6 text-slate-600"
          >
            <CheckCircle2 className="mt-1 shrink-0 text-green-700" size={15} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState<ContactFormState>(() => ({
    ...initialContactForm,
    source: detectSourceFromUrl(),
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const selectedTopic = useMemo(
    () => contactTopics.find((topic) => topic.value === form.topic),
    [form.topic],
  );

  function updateField<K extends keyof ContactFormState>(
    key: K,
    value: ContactFormState[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.error || "Unable to submit your message right now.",
        );
      }

      setFormSuccess(
        "Thanks for contacting SitGuru. Your message was received and routed for review.",
      );

      setForm((previous) => ({
        ...initialContactForm,
        source: previous.source,
        topic: previous.topic,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting your message.";

      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f9faf5]">
      <section className="relative overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-[-80px] top-[-80px] h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-[-120px] right-[-120px] h-96 w-96 rounded-full bg-emerald-300 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
              <MessageCircle size={15} />
              Contact SitGuru
            </div>

            <h1 className="max-w-5xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Get connected to the right SitGuru team.
            </h1>

            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-white/85">
              Whether you are a pet parent, Guru, program applicant, partner,
              investor, or press contact, this page helps route your message to
              the right place.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact-form"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-green-950 shadow-xl shadow-black/20 transition hover:bg-green-50"
              >
                Send a Message
                <Send size={18} />
              </a>

              <Link
                href="/programs/apply"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black text-white transition hover:bg-white/15"
              >
                Apply to a Program
                <Sparkles size={18} />
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Pet Parent Help
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Guru Support
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Programs
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Partners
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Investors
              </span>
            </div>
          </div>

          <div className="rounded-[34px] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="rounded-[28px] bg-white p-6 text-slate-950">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-800 text-white">
                  <Mail size={24} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
                    Quick Contact Paths
                  </p>
                  <h2 className="text-2xl font-black text-green-950">
                    Choose your next step.
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Pet parents can search for care or ask for help.",
                  "Gurus can apply, sign in, or request support.",
                  "Program applicants can apply today.",
                  "Partners, investors, and press can send direct inquiries.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4 text-sm font-bold text-slate-600"
                  >
                    <CheckCircle2 className="mt-0.5 shrink-0 text-green-700" size={17} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <a
                href="#contact-form"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                Contact SitGuru
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {contactCards.map((card) => (
            <ContactCard key={card.title} card={card} />
          ))}
        </section>

        <section className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                How Contact Works
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight text-green-950">
                Tell us what you need, and we’ll route it.
              </h2>

              <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                SitGuru uses contact topics to understand whether a message is
                about pet care, Guru support, programs, partners, investors,
                press, or general support. This helps keep operations organized
                as SitGuru grows.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoList
                title="Common inquiries"
                items={[
                  "Finding pet care",
                  "Becoming a Guru",
                  "Applying to a program",
                  "Partnerships",
                  "Investor questions",
                ]}
              />

              <InfoList
                title="Helpful details"
                items={[
                  "Your name and email",
                  "Your role or topic",
                  "Your city or area",
                  "Program interest",
                  "Clear message details",
                ]}
              />
            </div>
          </div>
        </section>

        <section
          id="contact-form"
          className="rounded-[34px] border border-[#e3ece5] bg-white p-5 shadow-sm sm:p-6 lg:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Contact Form
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">
                Send SitGuru a message.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Use this form for general questions, support, program interest,
                partner inquiries, investor inquiries, and press outreach.
              </p>

              <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4">
                <p className="text-sm font-black text-green-950">
                  Selected topic:
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-green-900">
                  {selectedTopic?.label || "General"} —{" "}
                  {selectedTopic?.description || "General inquiry"}
                </p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <InfoList
                  title="Program links"
                  items={[
                    "Military Hire Program",
                    "Student Hire Program",
                    "Community Hire Program",
                  ]}
                />

                <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-green-800">
                    Helpful shortcuts
                  </p>

                  <div className="flex flex-col gap-2">
                    <Link
                      href="/programs/apply"
                      className="inline-flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-green-50 hover:text-green-800"
                    >
                      Apply to Program
                      <ArrowRight size={15} />
                    </Link>

                    <Link
                      href="/become-a-guru"
                      className="inline-flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-green-50 hover:text-green-800"
                    >
                      Become a Guru
                      <ArrowRight size={15} />
                    </Link>

                    <Link
                      href="/partners"
                      className="inline-flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-green-50 hover:text-green-800"
                    >
                      Partner Network
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-800">
                    Full name
                  </label>
                  <input
                    value={form.fullName}
                    onChange={(event) =>
                      updateField("fullName", event.target.value)
                    }
                    className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-300 focus:ring-4 focus:ring-green-100"
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-800">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-300 focus:ring-4 focus:ring-green-100"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-800">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-300 focus:ring-4 focus:ring-green-100"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-800">
                    Program interest
                  </label>
                  <select
                    value={form.programInterest}
                    onChange={(event) =>
                      updateField("programInterest", event.target.value)
                    }
                    className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100"
                  >
                    <option value="">None / Not applicable</option>
                    {programOptions.map((program) => (
                      <option key={program} value={program}>
                        {program}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-black text-slate-800">
                  What is this about?
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {contactTopics.map((topic) => (
                    <TopicButton
                      key={topic.value}
                      value={topic.value}
                      label={topic.label}
                      description={topic.description}
                      selected={form.topic === topic.value}
                      onSelect={(value) => updateField("topic", value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-800">
                  Message
                </label>
                <textarea
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  rows={7}
                  className="w-full resize-y rounded-2xl border border-green-100 bg-white px-4 py-3 text-sm font-bold leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-300 focus:ring-4 focus:ring-green-100"
                  placeholder="Tell us how we can help..."
                  required
                />
              </div>

              {formError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                  {formError}
                </div>
              ) : null}

              {formSuccess ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
                  {formSuccess}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
                <Send size={17} />
              </button>

              <p className="text-xs font-semibold leading-5 text-slate-500">
                By submitting this form, you are asking SitGuru to review your
                inquiry and respond when appropriate. For urgent pet safety or
                emergency issues, contact local emergency services first.
              </p>
            </form>
          </div>
        </section>

        <section className="rounded-[32px] border border-green-100 bg-green-950 p-6 text-white shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
                Interested in SitGuru Programs?
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight">
                Apply today and take the first step.
              </h2>

              <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-white/75">
                Military Hire, Student Hire, and Community Hire applicants can
                apply directly and feed into SitGuru program review.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/programs"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-green-950 transition hover:bg-green-50"
              >
                View Programs
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/programs/apply"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
              >
                Apply Now
                <Sparkles size={17} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}