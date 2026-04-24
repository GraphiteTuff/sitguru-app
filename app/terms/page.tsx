import type { ReactNode } from "react";
import Link from "next/link";
import {
  Heart,
  PawPrint,
  ShieldCheck,
  FileText,
  Scale,
  CircleAlert,
} from "lucide-react";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "These Terms and Conditions govern your access to and use of SitGuru, including our website, platform, content, communications, and related services. By accessing or using SitGuru, you agree to be bound by these Terms and Conditions and any policies referenced within them.",
      "If you do not agree to these Terms and Conditions, you should not use SitGuru.",
    ],
  },
  {
    title: "2. Eligibility",
    body: [
      "You must be at least 18 years old, or the age of majority in your jurisdiction, to create an account or use SitGuru as a Pet Parent or Guru.",
      "By using SitGuru, you represent that you have the legal capacity to enter into a binding agreement.",
    ],
  },
  {
    title: "3. Platform Role",
    body: [
      "SitGuru is a platform intended to help connect Pet Parents and Gurus. SitGuru may provide tools for browsing, messaging, account management, bookings, payments, and related support features.",
      "Unless explicitly stated otherwise, SitGuru does not independently provide pet care services and is not the direct provider of services offered by individual Gurus.",
    ],
  },
  {
    title: "4. Accounts and Account Security",
    body: [
      "You may be required to create an account to access some parts of SitGuru. You agree to provide accurate, current, and complete information and to keep that information updated.",
      "You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. If you believe your account has been accessed without authorization, you should notify SitGuru promptly.",
    ],
  },
  {
    title: "5. Pet Parent Responsibilities",
    body: [
      "Pet Parents are responsible for providing accurate information about themselves, their pets, requested services, care needs, schedules, medical or behavioral concerns, household conditions, and any other details necessary for safe and informed care.",
      "Pet Parents should communicate honestly and promptly with Gurus and should not misrepresent pets, expectations, or booking-related details.",
    ],
  },
  {
    title: "6. Guru Responsibilities",
    body: [
      "Gurus are responsible for providing accurate information about their services, qualifications, availability, pricing, experience, and any applicable business or care-related details.",
      "Gurus agree to communicate professionally, provide services responsibly, and treat pets, Pet Parents, homes, and related information with respect and care.",
      "Nothing in these Terms should be interpreted as SitGuru guaranteeing the quality, legality, suitability, or availability of any Guru’s services.",
    ],
  },
  {
    title: "7. Bookings, Payments, and Fees",
    body: [
      "SitGuru may provide tools that support booking requests, confirmations, service details, pricing, payment collection, fees, refunds, cancellations, or related financial transactions.",
      "If payments are processed through third-party providers, those providers may have additional terms and policies that apply.",
      "SitGuru reserves the right to establish, modify, or disclose platform fees, service fees, cancellation terms, or related financial rules at its discretion, subject to applicable law and notice requirements where required.",
    ],
  },
  {
    title: "8. Communications",
    body: [
      "By using SitGuru, you consent to receive communications related to your account, bookings, support requests, platform updates, and other service-related notices.",
      "You may also receive marketing or promotional communications where permitted by law. You may opt out of promotional messages using available unsubscribe methods, though service-related messages may still be sent where necessary.",
    ],
  },
  {
    title: "9. Prohibited Conduct",
    body: [
      "You agree not to use SitGuru for unlawful, harmful, fraudulent, deceptive, abusive, harassing, or unauthorized purposes.",
      "This includes, without limitation, misrepresenting identity or qualifications, interfering with platform security, collecting user information without authorization, posting false or misleading content, violating another party’s rights, or using SitGuru in a way that could harm pets, users, or the platform.",
    ],
  },
  {
    title: "10. Content and User Submissions",
    body: [
      "Users may submit profile information, pet details, messages, reviews, photos, listings, or other content through SitGuru. You retain ownership of content you submit, but you grant SitGuru a non-exclusive, worldwide, royalty-free license to host, use, display, reproduce, modify for formatting, and distribute that content as reasonably necessary to operate, improve, and promote the platform.",
      "You are solely responsible for the content you submit and represent that you have the rights necessary to provide it.",
    ],
  },
  {
    title: "11. Privacy",
    body: [
      "Your use of SitGuru is also subject to our Privacy Policy. Please review that policy to understand how SitGuru collects, uses, and shares information.",
    ],
  },
  {
    title: "12. Third-Party Services",
    body: [
      "SitGuru may rely on or link to third-party tools, services, integrations, or websites, including payment processors, hosting providers, analytics services, communication tools, or social media platforms.",
      "SitGuru is not responsible for the content, actions, or policies of third parties that we do not own or control.",
    ],
  },
  {
    title: "13. Disclaimers",
    body: [
      "SitGuru is provided on an “as is” and “as available” basis, to the fullest extent permitted by law. SitGuru does not guarantee uninterrupted access, error-free functionality, or that the platform will always be secure or available.",
      "To the fullest extent permitted by law, SitGuru disclaims warranties of any kind, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, non-infringement, and course of dealing.",
    ],
  },
  {
    title: "14. Limitation of Liability",
    body: [
      "To the fullest extent permitted by law, SitGuru and its owners, officers, affiliates, employees, agents, and representatives shall not be liable for any indirect, incidental, consequential, special, exemplary, or punitive damages, or for any loss of profits, revenue, data, goodwill, business opportunity, or similar losses arising out of or related to your use of the platform.",
      "To the fullest extent permitted by law, SitGuru’s total liability for any claim arising out of or relating to these Terms or the platform shall not exceed the greater of the amount paid by you to SitGuru in the twelve months preceding the event giving rise to the claim, or one hundred U.S. dollars ($100), unless otherwise required by law.",
    ],
  },
  {
    title: "15. Indemnification",
    body: [
      "You agree to defend, indemnify, and hold harmless SitGuru and its owners, officers, affiliates, employees, agents, and representatives from and against claims, liabilities, damages, losses, costs, and expenses, including reasonable attorneys’ fees, arising out of or related to your use of SitGuru, your content, your conduct, your violation of these Terms, or your violation of any law or third-party rights.",
    ],
  },
  {
    title: "16. Suspension and Termination",
    body: [
      "SitGuru may suspend, restrict, or terminate access to all or part of the platform at any time, with or without notice, if we believe a user has violated these Terms, created risk for the platform or others, or engaged in conduct inconsistent with SitGuru’s mission, values, or legal obligations.",
      "Users may also stop using SitGuru at any time. Provisions that by their nature should survive termination will remain in effect.",
    ],
  },
  {
    title: "17. Changes to These Terms",
    body: [
      "SitGuru may update these Terms and Conditions from time to time. If we make material changes, we may update the effective date, post the revised Terms on this page, and take additional steps where appropriate.",
      "Your continued use of SitGuru after revised Terms become effective indicates your acceptance of the updated Terms.",
    ],
  },
  {
    title: "18. Governing Law",
    body: [
      "These Terms and Conditions shall be governed by and construed in accordance with the laws of the applicable state or jurisdiction designated by SitGuru, without regard to conflict of law principles.",
      "Any disputes arising out of or relating to these Terms or use of SitGuru shall be subject to the courts and legal procedures designated by applicable law or by any valid dispute provision adopted by SitGuru.",
    ],
  },
  {
    title: "19. Contact Us",
    body: [
      "If you have questions about these Terms and Conditions, please contact SitGuru through the support or contact information provided on the platform.",
      "Because SitGuru values human communication, we want users to know they can reach out with questions and receive support from a real person.",
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

export default function TermsPage() {
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
              <Scale className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-emerald-700">
              Terms & Conditions
            </p>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <FileText className="h-4 w-4" />
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Clear terms for a more trusted platform.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            These Terms and Conditions explain the rules, responsibilities, and
            expectations that apply when using SitGuru. We want them to be
            clear, readable, and grounded in the same trust-centered approach
            that shapes the rest of the platform.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600">
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Last updated: [Month Day, Year]
            </span>
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Applies to Pet Parents and Gurus
            </span>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <SectionEyebrow icon={<ShieldCheck className="h-4 w-4" />}>
              Trust and Clarity
            </SectionEyebrow>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              These terms are designed to set expectations clearly for people
              using SitGuru.
            </p>
          </div>

          <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <SectionEyebrow icon={<Scale className="h-4 w-4" />}>
              Shared Responsibility
            </SectionEyebrow>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Pet Parents, Gurus, and SitGuru each play a role in making the
              platform safe, respectful, and dependable.
            </p>
          </div>

          <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <SectionEyebrow icon={<CircleAlert className="h-4 w-4" />}>
              Important Legal Page
            </SectionEyebrow>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Please read these Terms carefully before using SitGuru or creating
              an account.
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-4xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:p-10">
          <SectionEyebrow icon={<FileText className="h-4 w-4" />}>
            SitGuru Terms & Conditions
          </SectionEyebrow>

          <div className="mt-8 space-y-10">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-base leading-8 text-slate-600"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-[24px] border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="text-lg font-bold text-slate-950">
              Important note
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              This page is intended as a website-ready terms draft and should be
              reviewed by qualified legal counsel before final publication.
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-8 text-center shadow-[0_10px_30px_rgba(16,185,129,0.08)] sm:p-10">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Heart className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Questions About These Terms?
            </p>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <FileText className="h-4 w-4" />
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            We believe important questions deserve real communication.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
            If you have questions about platform rules, responsibilities, or how
            SitGuru works, we want you to feel informed and supported.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/help"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
            >
              Visit Help Center
            </Link>

            <Link
              href="/"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Return to SitGuru
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}