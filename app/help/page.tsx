import type { ReactNode } from "react";
import Link from "next/link";
import {
  Heart,
  PawPrint,
  LifeBuoy,
  MessageCircle,
  CircleHelp,
  ShieldCheck,
  Search,
  Mail,
} from "lucide-react";

const helpSections = [
  {
    title: "Accounts & Login",
    items: [
      {
        question: "How do I create an account on SitGuru?",
        answer:
          "You can create an account by choosing the sign-up option on SitGuru and completing the requested information. Depending on the account type, you may be guided through steps designed for Pet Parents or Gurus.",
      },
      {
        question: "What should I do if I cannot log in?",
        answer:
          "Double-check your email address and password first. If you are still unable to access your account, use any available reset or recovery tools, or contact SitGuru at support@sitguru.com for help.",
      },
      {
        question: "Can I update my profile information later?",
        answer:
          "Yes. Where functionality is available, users should be able to update profile details, contact information, and certain account settings through their dashboard or profile areas.",
      },
    ],
  },
  {
    title: "For Pet Parents",
    items: [
      {
        question: "How do I find the right Guru?",
        answer:
          "SitGuru is designed to help Pet Parents review Guru profiles, services, availability, and other helpful details so they can choose care with greater confidence.",
      },
      {
        question: "Can I share my pet’s needs and routines?",
        answer:
          "Yes. SitGuru is being built to help Pet Parents keep important pet details organized so Gurus can better understand routines, care needs, and preferences.",
      },
      {
        question: "What if I have questions before booking?",
        answer:
          "We believe questions should be welcomed. Where communication tools are available, Pet Parents should be able to connect and get clarity before moving forward.",
      },
    ],
  },
  {
    title: "For Gurus",
    items: [
      {
        question: "How do I join SitGuru as a Guru?",
        answer:
          "Gurus can begin by applying or creating an account through SitGuru’s onboarding process. Requirements and steps may evolve as the platform grows.",
      },
      {
        question: "What information should Gurus include in their profile?",
        answer:
          "Gurus should provide clear and accurate information about services, experience, availability, and other relevant details so Pet Parents can make informed decisions.",
      },
      {
        question: "How does SitGuru help Gurus stand out?",
        answer:
          "SitGuru is being built to highlight professionalism, communication, trust, and genuine care — helping Gurus build stronger and more meaningful relationships with Pet Parents.",
      },
    ],
  },
  {
    title: "Bookings & Communication",
    items: [
      {
        question: "How do bookings work on SitGuru?",
        answer:
          "SitGuru may provide tools for requests, confirmations, details, scheduling, and related service communication. Exact workflows may continue to evolve as the platform grows.",
      },
      {
        question: "Can Pet Parents and Gurus message each other?",
        answer:
          "Yes, where messaging functionality is available. SitGuru is designed to support clearer and more connected communication throughout the care experience.",
      },
      {
        question: "What if something feels unclear during a booking?",
        answer:
          "We encourage users to ask questions early and communicate directly where platform tools allow. SitGuru also believes customers should have access to human support when needed.",
      },
    ],
  },
  {
    title: "Support & Safety",
    items: [
      {
        question: "How do I contact SitGuru for help?",
        answer:
          "If you need support, email support@sitguru.com. SitGuru believes important questions and concerns deserve real communication.",
      },
      {
        question: "Will I be talking to a real person?",
        answer:
          "Yes — that is part of SitGuru’s philosophy. We believe Pet Parents and Gurus should know there is a human being available when questions or concerns arise.",
      },
      {
        question: "What if I need help with privacy, terms, or account concerns?",
        answer:
          "You can review the applicable Privacy Policy and Terms & Conditions pages and email support@sitguru.com if you need clarification or assistance.",
      },
    ],
  },
];

function SectionEyebrow({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        {icon}
      </span>
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
        {children}
      </p>
    </div>
  );
}

export default function HelpPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fffb_0%,#f3fbf7_48%,#ffffff_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <PawPrint className="absolute left-[6%] top-28 h-10 w-10 rotate-[-18deg] text-emerald-200/70" />
        <Heart className="absolute right-[8%] top-44 h-8 w-8 text-emerald-200/70" />
        <PawPrint className="absolute right-[10%] top-[24%] h-12 w-12 rotate-[12deg] text-emerald-100" />
        <Heart className="absolute left-[8%] top-[42%] h-8 w-8 text-emerald-100" />
      </div>

      <section className="relative border-b border-emerald-100 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_34%),linear-gradient(180deg,_#f7fffb_0%,_#effcf5_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <LifeBuoy className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-emerald-700">
              Help Center
            </p>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <MessageCircle className="h-4 w-4" />
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Real help for Pet Parents and Gurus.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            SitGuru’s Help Center is designed to answer common questions and
            guide users with clarity. Because we believe support should feel
            human, we want this page to be useful, easy to navigate, and backed
            by real communication when needed.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600">
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Support for Pet Parents
            </span>
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Support for Gurus
            </span>
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Human communication matters
            </span>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <SectionEyebrow icon={<Search className="h-4 w-4" />}>
              Find Answers Fast
            </SectionEyebrow>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Browse common questions about accounts, bookings, messaging, and
              platform use.
            </p>
          </div>

          <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <SectionEyebrow icon={<ShieldCheck className="h-4 w-4" />}>
              Guidance with Trust
            </SectionEyebrow>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              We want Help Center information to feel clear, respectful, and
              useful to the people relying on SitGuru.
            </p>
          </div>

          <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <SectionEyebrow icon={<CircleHelp className="h-4 w-4" />}>
              Human Support
            </SectionEyebrow>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              If your question is not answered here, SitGuru believes you should
              be able to reach a real person for help.
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {helpSections.map((section, sectionIndex) => (
            <div
              key={section.title}
              className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:p-10"
            >
              <SectionEyebrow
                icon={
                  sectionIndex % 2 === 0 ? (
                    <PawPrint className="h-4 w-4" />
                  ) : (
                    <Heart className="h-4 w-4" />
                  )
                }
              >
                {section.title}
              </SectionEyebrow>

              <div className="mt-8 space-y-8">
                {section.items.map((item) => (
                  <div
                    key={item.question}
                    className="rounded-[24px] border border-emerald-100 bg-emerald-50/40 p-6"
                  >
                    <h2 className="text-xl font-bold text-slate-950">
                      {item.question}
                    </h2>
                    <p className="mt-3 text-base leading-8 text-slate-600">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-8 text-center shadow-[0_10px_30px_rgba(16,185,129,0.08)] sm:p-10">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Heart className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Still Need Help?
            </p>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Mail className="h-4 w-4" />
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            We believe important questions deserve human communication.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
            If you need more help, email support@sitguru.com and a real person
            will get back to you.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="mailto:support@sitguru.com"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
            >
              Email Support
            </a>

            <Link
              href="/privacy"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Review Privacy Policy
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}