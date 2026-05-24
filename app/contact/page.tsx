"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Handshake,
  HeartHandshake,
  Mail,
  MessageCircle,
  Newspaper,
  PawPrint,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

type ContactTopic =
  | "general"
  | "pet-parent"
  | "guru"
  | "programs"
  | "ambassadors"
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
    description: "I need help finding or using pet care.",
  },
  {
    value: "guru",
    label: "Guru",
    description: "I am a Guru, want to join, or need Guru support.",
  },
  {
    value: "programs",
    label: "Programs",
    description: "I am interested in Student, Community, or Military programs.",
  },
  {
    value: "ambassadors",
    label: "Ambassadors",
    description: "I want to help refer, share, or grow SitGuru locally.",
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
    description: "I have a media, press, or story inquiry.",
  },
  {
    value: "support",
    label: "Support",
    description: "I need help with an account, booking, message, or issue.",
  },
];

const contactCards: ContactCard[] = [
  {
    title: "Pet Parents",
    eyebrow: "Find trusted care",
    description:
      "Looking for pet care? Search local Gurus and connect with expert pet care providers near you.",
    href: "/search",
    cta: "Find Care",
    icon: <PawPrint size={26} />,
  },
  {
    title: "Gurus",
    eyebrow: "Expert pet care providers",
    description:
      "Already a sitter, walker, trainer, groomer, or caregiver? Join SitGuru and connect with more Pet Parents.",
    href: "/become-a-guru",
    cta: "Become a Guru",
    icon: <UsersRound size={26} />,
  },
  {
    title: "Programs",
    eyebrow: "Student, Community & Military",
    description:
      "Apply to SitGuru programs designed to help qualified people grow into trusted Guru pathways.",
    href: "/programs/apply",
    cta: "Apply to a Program",
    icon: <HeartHandshake size={26} />,
  },
  {
    title: "Ambassadors",
    eyebrow: "Share SitGuru locally",
    description:
      "Help introduce Pet Parents, Pet Gurus, schools, partners, and community groups to SitGuru.",
    href: "/ambassadors",
    cta: "Explore Ambassadors",
    icon: <Sparkles size={26} />,
  },
  {
    title: "Partners",
    eyebrow: "Community and growth",
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
      "Reach out for founder stories, launch updates, local market news, or SitGuru community programs.",
    href: "#contact-form",
    cta: "Contact Press",
    icon: <Newspaper size={26} />,
  },
];

const quickPaths = [
  {
    title: "I’m a Pet Parent",
    description: "Find care, ask a question, or get help with SitGuru.",
    href: "/search",
    cta: "Find Care",
    icon: <PawPrint size={20} />,
  },
  {
    title: "I’m a Guru",
    description: "Join, sign in, or get help with your Guru profile.",
    href: "/become-a-guru",
    cta: "Guru Help",
    icon: <UsersRound size={20} />,
  },
  {
    title: "I need support",
    description: "Send a message and we’ll route it to the right place.",
    href: "#contact-form",
    cta: "Send Message",
    icon: <MessageCircle size={20} />,
  },
  {
    title: "I want programs",
    description: "Explore Student Hire, Community Hire, Military Hire, or Ambassadors.",
    href: "/programs",
    cta: "View Programs",
    icon: <HeartHandshake size={20} />,
  },
];

const programOptions = [
  "Student Hire Program",
  "Community Hire Program",
  "Military Hire Program",
  "Not sure yet",
];

const routingDetails = [
  "Pet Parent questions",
  "Guru support",
  "Program applications",
  "Ambassador questions",
  "Partnerships",
  "Investor questions",
  "Press inquiries",
];

const helpfulDetails = [
  "Your name and email",
  "Your role or topic",
  "Your city, state, or community",
  "Program interest if applicable",
  "Referral source or organization",
  "A clear message with details",
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
      className="group rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-6"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
        {card.icon}
      </div>

      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
        {card.eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {card.title}
      </h2>

      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {card.description}
      </p>

      <span className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800 transition group-hover:bg-emerald-600 group-hover:text-white">
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
      className={`min-h-[92px] rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-emerald-400 bg-emerald-50 shadow-sm ring-4 ring-emerald-100"
          : "border-emerald-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
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
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
        {title}
      </p>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-2 text-sm font-bold leading-6 text-slate-600"
          >
            <CheckCircle2
              className="mt-1 shrink-0 text-emerald-700"
              size={15}
            />
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

    if (formError) setFormError("");
    if (formSuccess) setFormSuccess("");
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
        "Thanks for contacting SitGuru. Your message was received and will be routed for review.",
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
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fffb_0%,#f4fbf7_52%,#ffffff_100%)] pb-24 text-slate-950 sm:pb-0">
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-200 bg-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
        <a
          href="#contact-form"
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
        >
          Send SitGuru a Message
          <Send size={18} />
        </a>
      </div>

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-700 px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-[-80px] top-[-80px] h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-[-120px] right-[-120px] h-96 w-96 rounded-full bg-emerald-300 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.06fr_0.94fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
              <MessageCircle size={15} />
              Contact SitGuru
            </div>

            <h1 className="max-w-5xl text-4xl font-black leading-[1.05] tracking-tight !text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
              Tell us who you are. We’ll get you to the right place.
            </h1>

            <p className="mt-5 max-w-3xl text-base font-semibold leading-8 !text-white/90 sm:text-lg">
              Whether you are a Pet Parent, Pet Guru, Ambassador, program applicant,
              workforce partner, investor, or press contact, SitGuru is here to
              help route your message clearly.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#contact-form"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-black text-emerald-950 shadow-xl shadow-black/20 transition hover:bg-emerald-50 sm:w-auto"
              >
                Send a Message
                <Send size={18} />
              </a>

              <Link
                href="/search"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-4 text-base font-black text-white transition hover:bg-white/15 sm:w-auto"
              >
                Find Care
                <PawPrint size={18} />
              </Link>

              <Link
                href="/become-a-guru"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-4 text-base font-black text-white transition hover:bg-white/15 sm:w-auto"
              >
                Become a Guru
                <UsersRound size={18} />
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {[
                "Pet Parent Help",
                "Guru Support",
                "Programs",
                "Ambassadors",
                "Partners",
                "Investors",
                "Press",
              ].map((label) => (
                <span
                  key={label}
                  className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-950"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/15 bg-white/10 p-4 shadow-2xl shadow-black/20 backdrop-blur sm:rounded-[34px] sm:p-5">
            <div className="rounded-[26px] bg-white p-5 text-slate-950 sm:rounded-[28px] sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white">
                  <Mail size={24} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                    Quick Contact Paths
                  </p>
                  <h2 className="text-2xl font-black text-slate-950">
                    Choose your next step.
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {quickPaths.map((path) => (
                  <Link
                    key={path.title}
                    href={path.href}
                    className="group flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm transition group-hover:bg-emerald-600 group-hover:text-white">
                      {path.icon}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-slate-950">
                        {path.title}
                      </span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600">
                        {path.description}
                      </span>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-black text-emerald-700">
                        {path.cta}
                        <ArrowRight size={14} />
                      </span>
                    </span>
                  </Link>
                ))}
              </div>

              <a
                href="#contact-form"
                className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-4 text-base font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800"
              >
                Contact SitGuru
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {contactCards.map((card) => (
            <ContactCard key={card.title} card={card} />
          ))}
        </section>

        <section className="rounded-[30px] border border-emerald-100 bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                How Contact Works
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                One form. The right route.
              </h2>

              <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                SitGuru uses your selected topic to understand whether your
                message is about Pet Parent help, Guru support, programs,
                partners, investors, press, or general support.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoList title="We can help with" items={routingDetails} />
              <InfoList title="Helpful to include" items={helpfulDetails} />
            </div>
          </div>
        </section>

        <section
          id="contact-form"
          className="scroll-mt-6 rounded-[30px] border border-emerald-100 bg-white p-5 shadow-sm sm:rounded-[34px] sm:p-6 lg:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Contact Form
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Send SitGuru a message.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
                Use this form for general questions, support, Ambassador interest,
                program interest, partner inquiries, investor inquiries, and
                press outreach.
              </p>

              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-black text-slate-950">
                  Selected topic:
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-emerald-900">
                  {selectedTopic?.label || "General"} —{" "}
                  {selectedTopic?.description || "General inquiry"}
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-amber-900">
                  <ShieldCheck size={17} />
                  Emergency note
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-amber-800">
                  For urgent pet safety, medical, or emergency issues, contact
                  your veterinarian, local emergency services, or the proper
                  local authority first.
                </p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <InfoList
                  title="Program and Ambassador links"
                  items={[
                    "Student Hire Program",
                    "Community Hire Program",
                    "Military Hire Program",
                  ]}
                />

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
                    Helpful shortcuts
                  </p>

                  <div className="flex flex-col gap-2">
                    <Link
                      href="/programs/apply"
                      className="inline-flex min-h-11 items-center justify-between rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      Apply to Program
                      <ArrowRight size={15} />
                    </Link>

                    <Link
                      href="/ambassadors"
                      className="inline-flex min-h-11 items-center justify-between rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      Ambassador Program
                      <ArrowRight size={15} />
                    </Link>

                    <Link
                      href="/become-a-guru"
                      className="inline-flex min-h-11 items-center justify-between rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      Become a Guru
                      <ArrowRight size={15} />
                    </Link>

                    <Link
                      href="/partners"
                      className="inline-flex min-h-11 items-center justify-between rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
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
                    className="h-14 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-base font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
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
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    className="h-14 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-base font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-800">
                    Phone{" "}
                    <span className="font-bold text-slate-400">optional</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    className="h-14 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-base font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-800">
                    Program interest{" "}
                    <span className="font-bold text-slate-400">optional</span>
                  </label>
                  <select
                    value={form.programInterest}
                    onChange={(event) =>
                      updateField("programInterest", event.target.value)
                    }
                    className="h-14 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-base font-bold text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
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
                  onChange={(event) =>
                    updateField("message", event.target.value)
                  }
                  rows={7}
                  className="w-full resize-y rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-base font-bold leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
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
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                  {formSuccess}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
                <Send size={18} />
              </button>

              <p className="text-xs font-semibold leading-5 text-slate-500">
                By submitting this form, you are asking SitGuru to review your
                inquiry and respond when appropriate. For urgent pet safety,
                medical, or emergency issues, contact local emergency services
                first.
              </p>
            </form>
          </div>
        </section>

        <section className="rounded-[30px] border border-emerald-100 bg-emerald-950 p-6 text-white shadow-sm sm:rounded-[32px] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] !text-emerald-200">
                Interested in SitGuru Programs?
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight !text-white">
                Apply today and take the first step.
              </h2>

              <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 !text-white/85 sm:text-base sm:leading-7">
                Student Hire, Community Hire, Military Hire, and Ambassador applicants
                can start from the right page and feed into SitGuru review.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/programs"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-50"
              >
                View Programs
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/programs/apply"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/15"
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