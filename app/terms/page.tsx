import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CircleAlert,
  CreditCard,
  FileText,
  Heart,
  Home,
  Lock,
  Mail,
  PawPrint,
  Scale,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";

const lastUpdated = "May 21, 2026";

const quickSummary = [
  {
    title: "SitGuru is a marketplace",
    description:
      "SitGuru helps Pet Parents discover and connect with independent local Pet Gurus for trusted pet care.",
    icon: <UsersRound className="h-5 w-5" />,
  },
  {
    title: "Everyone has responsibilities",
    description:
      "Pet Parents, Pet Gurus, applicants, partners, and SitGuru each play a role in keeping the platform clear, respectful, and safe.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "Trust and safety matter",
    description:
      "SitGuru may use profile reviews, verification steps, trust and safety checks, account reviews, and platform rules to help protect the community.",
    icon: <Lock className="h-5 w-5" />,
  },
];

const termHighlights = [
  {
    title: "Pet Parent responsibilities",
    description:
      "Pet Parents should share accurate pet, home, schedule, care, behavior, access, emergency, and medical-related details needed for safe care.",
    icon: <PawPrint className="h-5 w-5" />,
  },
  {
    title: "Pet Guru responsibilities",
    description:
      "Pet Gurus should communicate professionally, provide accurate profile information, accept only services they are prepared to provide, and deliver care responsibly.",
    icon: <UserCheck className="h-5 w-5" />,
  },
  {
    title: "Bookings and payments",
    description:
      "SitGuru may support booking requests, service details, pricing, payments, refunds, cancellations, payouts, and related platform tools.",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    title: "Platform communication",
    description:
      "Users may receive account, booking, support, trust and safety, login, and platform-related communications.",
    icon: <Mail className="h-5 w-5" />,
  },
  {
    title: "On-platform records",
    description:
      "Keeping care details, communications, confirmations, records, and support history on SitGuru helps protect Pet Parents, Pet Gurus, pets, and the broader community.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Platform rules",
    description:
      "Users may not misuse SitGuru, misrepresent information, harm pets or users, interfere with security, bypass platform rules, or violate laws.",
    icon: <Scale className="h-5 w-5" />,
  },
];

const termsAtAGlance = [
  "SitGuru helps connect Pet Parents with independent local Pet Gurus.",
  "Pet Gurus are responsible for the services they offer and provide.",
  "Pet Parents are responsible for choosing a Pet Guru and sharing accurate care details.",
  "SitGuru may review, limit, suspend, or remove accounts or content for trust, safety, legal, fraud, or policy reasons.",
  "Bookings, payments, messages, and care details should stay organized through SitGuru when platform tools are available.",
  "Program applications do not guarantee acceptance, bookings, earnings, employment, or continued platform access.",
];

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "These Terms and Conditions govern your access to and use of SitGuru, including our website, platform, content, communications, accounts, booking-related tools, program pages, applications, and related services.",
      "By accessing or using SitGuru, creating an account, browsing the platform, communicating through SitGuru, applying to a program, submitting information, or using any related service, you agree to be bound by these Terms and any policies referenced within them.",
      "If you do not agree to these Terms, you should not access or use SitGuru.",
    ],
  },
  {
    title: "2. Eligibility",
    body: [
      "You must be at least 18 years old, or the age of majority in your jurisdiction, to create an account or use SitGuru as a Pet Parent, Pet Guru, applicant, partner, Ambassador, or other user.",
      "By using SitGuru, you represent that you have the legal capacity and authority to enter into a binding agreement.",
      "SitGuru may limit, suspend, decline, or remove access where we believe eligibility requirements are not met or where use of the platform may create risk for users, pets, the community, or SitGuru.",
    ],
  },
  {
    title: "3. SitGuru’s Platform Role",
    body: [
      "SitGuru is a pet care marketplace designed to help Pet Parents connect with independent local Pet Gurus who may offer services such as pet sitting, dog walking, boarding, drop-ins, day care, grooming support, training support, or other pet care services.",
      "Unless explicitly stated otherwise in a separate written agreement, SitGuru does not independently provide pet care services and is not the direct provider of services offered by individual Pet Gurus.",
      "Pet Gurus are responsible for the services they offer and provide. Pet Parents are responsible for choosing Pet Gurus, sharing accurate care details, and determining whether a Pet Guru is appropriate for their pet care needs.",
      "SitGuru may provide tools for profiles, search, communication, booking requests, account management, payments, trust and safety, support, programs, and related platform features.",
    ],
  },
  {
    title: "4. Accounts and Account Security",
    body: [
      "You may be required to create an account to access certain parts of SitGuru. You agree to provide accurate, current, and complete information and to keep that information updated.",
      "You are responsible for maintaining the confidentiality of your account access, login methods, passwords, phone login codes, and any activity that occurs under your account.",
      "You agree not to share login codes or account access with unauthorized people. If you believe your account has been accessed without authorization, you should notify SitGuru promptly.",
      "SitGuru may use phone numbers, email addresses, one-time codes, or other methods to support account access, verification, security, and service-related communications.",
    ],
  },
  {
    title: "5. Pet Parent Responsibilities",
    body: [
      "Pet Parents are responsible for providing accurate information about themselves, their pets, requested services, schedules, locations, household conditions, emergency contacts, veterinarian details, care instructions, feeding routines, medication or health-related notes, behavioral concerns, access instructions, and any other information needed for safe and informed care.",
      "Pet Parents should communicate honestly, respectfully, and promptly with Pet Gurus and should not misrepresent pets, expectations, home conditions, care needs, access details, or booking-related information.",
      "Pet Parents are responsible for determining whether a Pet Guru is a suitable fit for their pet, household, schedule, and care expectations.",
      "Pet Parents should make sure pets are safe, properly identified where appropriate, and prepared for scheduled care.",
    ],
  },
  {
    title: "6. Pet Guru Responsibilities",
    body: [
      "Pet Gurus are responsible for providing accurate information about their services, experience, qualifications, availability, pricing, location, profile details, photos, and any applicable business or care-related information.",
      "Pet Gurus agree to communicate professionally, respond honestly, provide services responsibly, and treat pets, Pet Parents, homes, property, keys, access information, and private details with respect and care.",
      "Pet Gurus should only accept services they are prepared, qualified, and available to provide. Pet Gurus are responsible for complying with applicable laws, rules, permits, licenses, insurance requirements, tax obligations, and local requirements that may apply to their services.",
      "Nothing in these Terms should be interpreted as SitGuru guaranteeing the quality, legality, suitability, availability, or outcome of any Pet Guru’s services.",
    ],
  },
  {
    title: "7. Independent Provider Relationship",
    body: [
      "Unless SitGuru enters into a separate written employment agreement with a person, use of the platform, Pet Guru participation, program application, profile creation, receipt of booking opportunities, or participation in a pathway does not create an employment relationship with SitGuru.",
      "Pet Gurus are not employees of SitGuru solely because they create a profile, receive inquiries, accept bookings, provide pet care services, or participate in SitGuru programs.",
      "Pet Gurus are responsible for determining their own legal, tax, insurance, licensing, equipment, transportation, supplies, and business obligations.",
      "SitGuru may provide platform standards, trust and safety requirements, support resources, and community expectations without becoming the employer or direct supervisor of independent Pet Gurus.",
    ],
  },
  {
    title: "8. Trust and Safety",
    body: [
      "SitGuru may use trust and safety reviews, verification steps, profile reviews, safety-related checks, fraud prevention tools, account reviews, user reports, support records, and other measures to help protect pets, Pet Parents, Pet Gurus, applicants, Ambassadors, partners, and the SitGuru community.",
      "Trust and safety steps may vary based on user role, location, platform activity, program participation, service type, legal requirements, or other factors.",
      "Completion of a trust and safety step does not guarantee that a user, booking, pet care service, or interaction will be risk-free. Pet care involves real people, real animals, private homes, neighborhoods, travel, weather, and real-world circumstances.",
      "SitGuru may suspend, limit, review, remove, or restrict accounts, listings, content, messages, bookings, payouts, program participation, or access if we believe there may be a safety concern, policy concern, legal issue, fraud risk, or platform risk.",
    ],
  },
  {
    title: "9. Bookings, Payments, Platform Charges, and Cancellations",
    body: [
      "SitGuru may provide tools that support booking requests, confirmations, service details, pricing, payment collection, platform charges, processing charges, refunds, cancellations, credits, payouts, or related financial transactions.",
      "If payments or payouts are processed through third-party providers, those providers may have additional terms, policies, identity requirements, tax requirements, processing rules, and privacy practices that apply.",
      "SitGuru reserves the right to establish, modify, display, or apply platform charges, service charges, processing charges, cancellation terms, refund rules, payout rules, or related financial policies, subject to applicable law and notice requirements where required.",
      "Pet Parents and Pet Gurus are responsible for reviewing booking details, pricing, services, cancellation terms, payout details, and other booking-related information before confirming, accepting, or completing services.",
      "SitGuru may hold, delay, adjust, reverse, or cancel transactions where needed to address disputes, suspected fraud, policy violations, chargebacks, safety issues, errors, or legal requirements.",
    ],
  },
  {
    title: "10. Staying On-Platform",
    body: [
      "SitGuru works best when booking details, care instructions, messages, confirmations, service records, payment records, reviews, and support history remain organized through the platform where those tools are available.",
      "Users may not use SitGuru to identify, contact, solicit, or arrange services with another user for the purpose of avoiding SitGuru booking tools, payment tools, platform policies, platform charges, trust and safety steps, or other platform requirements.",
      "Off-platform arrangements may reduce SitGuru’s ability to support users, review disputes, verify service history, assist with booking records, or apply platform protections and policies.",
      "SitGuru may limit, suspend, or remove accounts or access where we believe a user is misusing the platform, bypassing platform rules, creating safety concerns, or undermining marketplace trust.",
    ],
  },
  {
    title: "11. Programs, Applications, and Pathways",
    body: [
      "SitGuru may offer or promote pathways such as Student Hire, Community Hire, Military Hire, partner referrals, waitlists, pilot programs, ambassador opportunities, outreach programs, or other programs.",
      "Applying to a SitGuru program does not guarantee acceptance, approval, employment, independent contractor status, bookings, earnings, compensation, referral rewards, Pet Guru activation, or continued access to the platform.",
      "Program applicants may be asked to provide information for review, onboarding, trust and safety steps, eligibility assessment, communications, and pathway support.",
      "SitGuru may change, pause, expand, combine, rename, or end programs at any time, subject to applicable law.",
    ],
  },
  {
    title: "12. Ambassador and Referral Activity",
    body: [
      "SitGuru may allow Ambassadors, partners, community supporters, students, military-connected participants, or other approved users to share referral links, QR codes, community materials, or promotional information.",
      "Referral rewards, recognition, public features, program perks, or Ambassador opportunities are subject to SitGuru’s current program terms, eligibility, verification, consent, and platform needs.",
      "Ambassadors and referral partners must not make false claims, misleading promises, unauthorized guarantees, or statements that conflict with SitGuru’s policies, brand standards, or legal obligations.",
      "SitGuru may review, approve, decline, pause, or remove Ambassador participation, referral eligibility, rewards, or recognition at any time where needed for trust, safety, fraud prevention, brand protection, or program integrity.",
    ],
  },
  {
    title: "13. Communications",
    body: [
      "By using SitGuru, you consent to receive communications related to your account, login codes, bookings, messages, support requests, programs, payments, trust and safety, platform updates, and other service-related notices.",
      "SitGuru may communicate by email, text message, phone, in-platform messages, push notifications, or other available methods.",
      "You may also receive marketing or promotional communications where permitted by law. You may opt out of promotional messages using available unsubscribe methods, though service-related messages may still be sent where necessary.",
      "Message and data rates may apply for text messages depending on your mobile carrier.",
    ],
  },
  {
    title: "14. Prohibited Conduct",
    body: [
      "You agree not to use SitGuru for unlawful, harmful, fraudulent, deceptive, abusive, harassing, threatening, unsafe, discriminatory, or unauthorized purposes.",
      "Prohibited conduct includes, without limitation, misrepresenting identity or qualifications, providing false profile or pet care information, interfering with platform security, collecting user information without authorization, posting false or misleading content, violating another party’s rights, bypassing platform rules, abusing support systems, or using SitGuru in a way that could harm pets, users, property, or the platform.",
      "Users may not use SitGuru to promote illegal activity, unsafe pet care, harassment, spam, scams, unauthorized advertising, or any activity that conflicts with SitGuru’s mission of trusted local pet care.",
    ],
  },
  {
    title: "15. Content and User Submissions",
    body: [
      "Users may submit profile information, pet details, messages, reviews, photos, listings, care notes, service descriptions, program information, application information, or other content through SitGuru.",
      "You retain ownership of content you submit, but you grant SitGuru a non-exclusive, worldwide, royalty-free license to host, use, display, reproduce, modify for formatting, distribute, and otherwise process that content as reasonably necessary to operate, protect, improve, and promote the platform.",
      "You are solely responsible for the content you submit and represent that you have the rights necessary to provide it.",
      "SitGuru may remove or restrict content that we believe violates these Terms, applicable law, platform policies, trust and safety standards, or the rights of others.",
    ],
  },
  {
    title: "16. Reviews, Ratings, and Profiles",
    body: [
      "SitGuru may allow users to create profiles, leave reviews, display ratings, share feedback, earn profile indicators, or provide other information about care experiences.",
      "Reviews and ratings should be honest, respectful, relevant, and based on real experiences. Users may not submit fake, misleading, abusive, retaliatory, or unlawful reviews.",
      "SitGuru may remove, limit, or moderate reviews, ratings, or profile content where we believe it violates these Terms, platform policies, law, or community trust and safety standards.",
      "SitGuru may consider completed on-platform activity, reviews, responsiveness, trust and safety history, program participation, and community conduct when displaying or ranking profiles.",
    ],
  },
  {
    title: "17. Privacy",
    body: [
      "Your use of SitGuru is also subject to our Privacy Policy. Please review that policy to understand how SitGuru collects, uses, stores, and shares information.",
      "The Privacy Policy explains how SitGuru may handle account details, pet care information, messages, phone numbers, SMS login codes, payment-related information, support records, cookies, analytics, and trust and safety information.",
    ],
  },
  {
    title: "18. Third-Party Services",
    body: [
      "SitGuru may rely on or link to third-party tools, services, integrations, or websites, including payment processors, hosting providers, analytics services, communication tools, maps, identity-related services, email providers, SMS providers, customer support tools, or social media platforms.",
      "SitGuru is not responsible for the content, actions, terms, privacy policies, or practices of third parties that we do not own or control.",
      "Your use of third-party services may be subject to additional terms and policies from those providers.",
    ],
  },
  {
    title: "19. Disclaimers",
    body: [
      'SitGuru is provided on an "as is" and "as available" basis, to the fullest extent permitted by law. SitGuru does not guarantee uninterrupted access, error-free functionality, specific booking results, specific income, specific user matches, specific referral results, or that the platform will always be secure or available.',
      "SitGuru does not guarantee that any Pet Parent, Pet Guru, pet, booking, listing, review, profile, program, or communication will meet your expectations or be free from risk.",
      "To the fullest extent permitted by law, SitGuru disclaims warranties of any kind, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, non-infringement, and course of dealing.",
    ],
  },
  {
    title: "20. Limitation of Liability",
    body: [
      "To the fullest extent permitted by law, SitGuru and its owners, officers, affiliates, employees, agents, contractors, and representatives shall not be liable for any indirect, incidental, consequential, special, exemplary, or punitive damages, or for any loss of profits, revenue, data, goodwill, business opportunity, or similar losses arising out of or related to your use of the platform.",
      "To the fullest extent permitted by law, SitGuru’s total liability for any claim arising out of or relating to these Terms or the platform shall not exceed the greater of the amount paid by you to SitGuru in the twelve months preceding the event giving rise to the claim, or one hundred U.S. dollars ($100), unless otherwise required by law.",
      "Some jurisdictions do not allow certain limitations of liability, so some limitations may not apply to you.",
    ],
  },
  {
    title: "21. Indemnification",
    body: [
      "You agree to defend, indemnify, and hold harmless SitGuru and its owners, officers, affiliates, employees, agents, contractors, and representatives from and against claims, liabilities, damages, losses, costs, and expenses, including reasonable attorneys’ fees, arising out of or related to your use of SitGuru, your content, your conduct, your pet, your services, your bookings, your program participation, your violation of these Terms, or your violation of any law or third-party rights.",
    ],
  },
  {
    title: "22. Suspension and Termination",
    body: [
      "SitGuru may suspend, restrict, or terminate access to all or part of the platform at any time, with or without notice, if we believe a user has violated these Terms, created risk for the platform or others, provided inaccurate information, engaged in unsafe conduct, or acted inconsistently with SitGuru’s mission, values, trust and safety standards, or legal obligations.",
      "Users may stop using SitGuru at any time. Certain provisions of these Terms that by their nature should survive termination will remain in effect.",
    ],
  },
  {
    title: "23. Changes to These Terms",
    body: [
      "SitGuru may update these Terms from time to time. If we make material changes, we may update the effective date, post the revised Terms on this page, and take additional steps where required by law.",
      "Your continued use of SitGuru after revised Terms become effective indicates your acceptance of the updated Terms.",
    ],
  },
  {
    title: "24. Governing Law",
    body: [
      "These Terms shall be governed by and construed in accordance with the laws of the applicable state or jurisdiction designated by SitGuru, without regard to conflict of law principles.",
      "Any disputes arising out of or relating to these Terms or use of SitGuru shall be subject to the courts and legal procedures designated by applicable law or by any valid dispute provision adopted by SitGuru.",
    ],
  },
  {
    title: "25. Contact Us",
    body: [
      "If you have questions about these Terms, please contact us at support@sitguru.com or through the SitGuru contact page.",
      "Because SitGuru values human communication, we want users to know they can reach out with questions and receive support from a real person.",
    ],
  },
];

function SectionEyebrow({
  icon,
  children,
  inverse = false,
}: {
  icon: ReactNode;
  children: ReactNode;
  inverse?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
          inverse ? "bg-white/15 text-white" : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {icon}
      </span>
      <p
        className={`text-xs font-black uppercase tracking-[0.18em] sm:text-sm sm:tracking-[0.24em] ${
          inverse ? "text-emerald-50" : "text-emerald-700"
        }`}
      >
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
        <PawPrint className="absolute left-[10%] bottom-24 h-12 w-12 rotate-[-10deg] text-emerald-100" />
      </div>

      <section className="relative border-b border-emerald-100 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_34%),linear-gradient(180deg,_#f7fffb_0%,_#effcf5_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8 lg:py-24">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Scale className="h-4 w-4" />
            </span>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700 sm:text-sm sm:tracking-[0.32em]">
              Terms & Conditions
            </p>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <FileText className="h-4 w-4" />
            </span>
          </div>

          <h1 className="mx-auto mt-6 max-w-5xl text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Clear terms for a trusted local pet care marketplace.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base font-semibold leading-8 text-slate-700 sm:text-lg">
            These Terms explain the rules, responsibilities, and expectations
            that apply when using SitGuru as a Pet Parent, Pet Guru, applicant,
            Ambassador, partner, or visitor.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm font-bold text-slate-600 sm:flex-row sm:flex-wrap">
            <span className="w-full rounded-full border border-emerald-200 bg-white px-4 py-2 sm:w-auto">
              Last updated: {lastUpdated}
            </span>
            <span className="w-full rounded-full border border-emerald-200 bg-white px-4 py-2 sm:w-auto">
              Applies to Pet Parents, Pet Gurus, applicants, and partners
            </span>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {quickSummary.map((item) => (
            <div
              key={item.title}
              className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6"
            >
              <SectionEyebrow icon={item.icon}>{item.title}</SectionEyebrow>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-emerald-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-8 lg:p-10">
          <SectionEyebrow icon={<CircleAlert className="h-4 w-4" />}>
            Important Platform Expectations
          </SectionEyebrow>

          <div className="mt-5 grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                SitGuru works best when everyone communicates clearly and acts
                with care.
              </h2>

              <p className="mt-4 text-base leading-8 text-slate-600">
                The highlights below summarize key expectations. The full Terms
                that follow are the complete agreement for use of the platform.
              </p>

              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">
                  Not legal advice
                </p>
                <p className="mt-2 text-sm font-semibold leading-7 text-amber-950">
                  These Terms are provided for SitGuru platform use. Users should
                  consult their own legal, tax, insurance, or professional
                  advisors when needed.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {termsAtAGlance.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"
                >
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  <p className="text-sm font-bold leading-6 text-slate-700">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {termHighlights.map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-emerald-100 bg-emerald-50/50 p-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-emerald-900/20 bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-700 p-5 text-white shadow-[0_20px_60px_rgba(5,95,70,0.22)] sm:rounded-[34px] sm:p-8 lg:p-10">
          <SectionEyebrow inverse icon={<Home className="h-4 w-4" />}>
            Marketplace Protection
          </SectionEyebrow>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-black tracking-tight !text-white sm:text-4xl">
                Keeping care organized through SitGuru helps protect everyone.
              </h2>
              <p className="mt-4 text-base font-semibold leading-8 !text-white/90">
                Booking details, care notes, payment records, messages, reviews,
                and support history are easier to review when they stay connected
                to the platform.
              </p>
            </div>

            <div className="grid gap-3">
              {[
                "Clear care instructions",
                "Service and payment records",
                "Review and profile history",
                "Support visibility if something needs attention",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black !text-white"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-4xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-emerald-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-8 lg:p-10">
          <SectionEyebrow icon={<FileText className="h-4 w-4" />}>
            SitGuru Terms & Conditions
          </SectionEyebrow>

          <div className="mt-8 space-y-8 sm:space-y-10">
            {sections.map((section) => (
              <article
                key={section.title}
                className="scroll-mt-28 rounded-3xl border border-slate-100 bg-slate-50/40 p-5 sm:p-6"
              >
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-base font-medium leading-8 text-slate-600"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  Trust and safety first
                </h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
                  SitGuru may update platform rules, trust and safety steps, and
                  support practices as the community grows and as new features
                  are added.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-6 text-center shadow-[0_10px_30px_rgba(16,185,129,0.08)] sm:rounded-[34px] sm:p-10">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Heart className="h-4 w-4" />
            </span>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700 sm:text-sm sm:tracking-[0.28em]">
              Questions About These Terms?
            </p>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <FileText className="h-4 w-4" />
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Important questions deserve real communication.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
            If you have questions about platform rules, responsibilities, or how
            SitGuru works, contact us and a real person will help.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
            >
              Contact SitGuru
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/privacy"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-emerald-200 bg-white px-7 py-4 text-base font-black text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
            >
              View Privacy Policy
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
