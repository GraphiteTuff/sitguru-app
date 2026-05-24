import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  Cookie,
  CreditCard,
  Eye,
  Heart,
  Lock,
  Mail,
  PawPrint,
  Phone,
  ShieldCheck,
  UserCheck,
  Users,
  FileText,
  ArrowRight,
  BadgeCheck,
  Home,
  MessageCircle,
  Sparkles,
} from "lucide-react";

const lastUpdated = "May 21, 2026";

const quickSummary = [
  {
    title: "We collect what helps SitGuru work",
    description:
      "This can include account details, contact information, pet care details, messages, booking-related information, support requests, program applications, and information needed for trust and safety.",
    icon: <UserCheck className="h-5 w-5" />,
  },
  {
    title: "We use information to support care connections",
    description:
      "SitGuru uses information to help Pet Parents and Pet Gurus connect, manage accounts, organize care details, communicate, improve the platform, and protect the community.",
    icon: <PawPrint className="h-5 w-5" />,
  },
  {
    title: "We care about privacy and safety",
    description:
      "We use reasonable safeguards and limit access where appropriate, but no online system can be guaranteed completely secure.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
];

const sections = [
  {
    title: "1. Overview",
    body: [
      "SitGuru respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains how SitGuru collects, uses, stores, and shares information when you visit our website, create an account, join SitGuru, communicate with us, apply to a program, or use SitGuru services.",
      "SitGuru is a pet care marketplace for Pet Parents and independent Pet Gurus. We collect information needed to create accounts, support pet care connections, organize care details, protect the community, improve the platform, and communicate with users.",
      "By accessing or using SitGuru, you acknowledge that you have read and understand this Privacy Policy.",
    ],
  },
  {
    title: "2. Information We Collect",
    body: [
      "We may collect information you provide directly to us, including your name, email address, phone number, mailing address, account information, profile details, pet information, booking details, payment-related information, payout-related information, support or dispute records, messages sent through the platform, program application details, and any other information you choose to submit.",
      "Pet information may include pet names, species, breed, age, size, routines, behavior notes, care instructions, feeding needs, medication or health-related notes you choose to provide, veterinarian details, emergency contact details, and other information needed to support pet care.",
      "Pet Guru profile information may include services offered, experience, location, availability, service preferences, photos, profile descriptions, reviews, service areas, program interests, and trust and safety information.",
      "Program and ambassador information may include school, community, military-connected, referral, partner, resume, document, availability, and interest details that you choose to provide through SitGuru forms.",
      "We may also collect certain information automatically, such as your IP address, browser type, device information, operating system, referring pages, pages viewed, dates and times of access, and interactions with our website.",
      "If you join a waitlist, fill out a contact form, submit support requests, apply to a program, communicate with SitGuru, or interact with our website, we may collect and retain those communications.",
    ],
  },
  {
    title: "3. Phone Numbers, Login Codes, and SMS Messages",
    body: [
      "SitGuru may use phone numbers to help create accounts, sign users in, send one-time login or verification codes, support account security, communicate about account activity, and send service-related messages.",
      "Transactional text messages may include login codes, account messages, booking-related updates, safety-related communications, support updates, or important service notices. Message and data rates may apply depending on your mobile carrier.",
      "SitGuru does not use phone numbers to send marketing text messages unless permitted by law and, where required, with appropriate consent.",
    ],
  },
  {
    title: "4. How We Use Information",
    body: [
      "We may use your information to operate, maintain, and improve SitGuru; create and manage accounts; support bookings and related services; communicate with Pet Parents and Pet Gurus; respond to questions and support requests; send transactional messages; improve user experience; protect the safety and integrity of the platform; detect fraud, abuse, or misuse; and comply with legal obligations.",
      "We may use information to support trust and safety reviews, verification steps, account protection, safety-related records, dispute handling, program routing, partner referrals, and community protection.",
      "We may also use information to send updates, promotional materials, launch announcements, program information, or marketing communications where permitted by law. You may opt out of marketing emails at any time.",
    ],
  },
  {
    title: "5. How We Share Information",
    body: [
      "SitGuru may share information with service providers and vendors who help us operate the platform, including hosting providers, analytics tools, customer support tools, email service providers, messaging providers, payment processors, security providers, background or trust and safety providers, and similar business partners.",
      "We may share information between users where necessary to support platform functionality, such as facilitating communication, bookings, account setup, care instructions, or service-related interactions between Pet Parents and Pet Gurus.",
      "For example, a Pet Parent may share pet care details with a Pet Guru, and a Pet Guru may share profile, service, location, availability, and experience details with Pet Parents.",
      "We may share limited program or referral information where reasonably needed to support Student Hire, Community Hire, Military Hire, Ambassador activity, partner referrals, or workforce/community outreach.",
      "We may also disclose information if required by law, legal process, court order, government request, or where we believe disclosure is reasonably necessary to protect SitGuru, our users, pets, or the public.",
      "We do not sell personal information in the ordinary meaning of that phrase.",
    ],
  },
  {
    title: "6. Payments and Payouts",
    body: [
      "SitGuru may use third-party payment processors to help process payments, payouts, refunds, platform charges, invoices, or related financial activity.",
      "Payment processors may collect and process payment details, payout information, identity-related information, tax-related information, or transaction records according to their own terms and privacy policies.",
      "SitGuru generally does not store full payment card numbers on its own servers.",
    ],
  },
  {
    title: "7. Cookies and Analytics",
    body: [
      "SitGuru may use cookies, pixels, local storage, and similar technologies to remember preferences, understand site usage, improve performance, support analytics, support security, and improve marketing efforts.",
      "You may be able to adjust cookie preferences through your browser settings. Please note that disabling certain cookies may affect the functionality of parts of the site.",
    ],
  },
  {
    title: "8. Data Security",
    body: [
      "SitGuru takes reasonable administrative, technical, and organizational measures to help protect personal information against unauthorized access, loss, misuse, or alteration.",
      "However, no method of transmission over the internet and no method of electronic storage is guaranteed to be completely secure. For that reason, while we work to protect your information, SitGuru cannot guarantee absolute security.",
    ],
  },
  {
    title: "9. Data Retention",
    body: [
      "We retain personal information for as long as reasonably necessary to provide services, maintain business and legal records, resolve disputes, support trust and safety, enforce our agreements, and comply with legal obligations.",
      "Retention periods may vary depending on the type of information, the reason it was collected, legal requirements, safety needs, and business purposes.",
    ],
  },
  {
    title: "10. Your Choices and Rights",
    body: [
      "You may update certain account information by logging into your account, where that functionality is available.",
      "You may opt out of marketing emails by using the unsubscribe link in those communications.",
      "Depending on your location, you may have rights related to access, correction, deletion, portability, objection, or limitation of certain personal information. SitGuru will review and respond to applicable requests in accordance with governing law.",
      "To make a privacy-related request, contact us at support@sitguru.com.",
    ],
  },
  {
    title: "11. Children’s Privacy",
    body: [
      "SitGuru is not intended for children under the age of 13, and we do not knowingly collect personal information directly from children under 13.",
      "Certain SitGuru opportunities may be limited to users who meet applicable age, eligibility, onboarding, or program requirements. If we learn that we have collected personal information from a child under 13 without appropriate consent, we will take reasonable steps to delete it.",
    ],
  },
  {
    title: "12. Third-Party Services and Links",
    body: [
      "SitGuru may contain links to third-party websites, services, or integrations. This Privacy Policy does not apply to the practices of third parties that we do not own or control.",
      "We encourage you to review the privacy policies of those third parties before providing information to them.",
    ],
  },
  {
    title: "13. State, Local, and Regional Privacy Rights",
    body: [
      "Privacy laws may vary depending on where you live. If you are located in a state or region with specific privacy rights, SitGuru will review and respond to applicable requests as required by law.",
      "SitGuru supports Pet Parents and Pet Gurus across communities, cities, towns, townships, and states. As we grow, we may update this Privacy Policy to reflect new legal requirements, new features, or new privacy choices.",
    ],
  },
  {
    title: "14. Changes to This Policy",
    body: [
      "SitGuru may update this Privacy Policy from time to time. If we make material changes, we may update the effective date, post the revised version on this page, and take additional steps where required by law.",
      "Your continued use of SitGuru after an updated Privacy Policy becomes effective indicates your acknowledgment of the revised policy.",
    ],
  },
  {
    title: "15. Contact Us",
    body: [
      "If you have questions, concerns, or privacy-related requests, please contact us at support@sitguru.com.",
      "Because SitGuru believes in human communication, we want users to know they can reach out with privacy questions and receive support from a real person.",
    ],
  },
];

const dataHighlights = [
  {
    title: "Account and profile details",
    description:
      "Name, email, phone number, login details, role, profile information, and preferences.",
    icon: <UserCheck className="h-5 w-5" />,
  },
  {
    title: "Pet care information",
    description:
      "Pet details, routines, care instructions, notes, service needs, and information users choose to share.",
    icon: <PawPrint className="h-5 w-5" />,
  },
  {
    title: "Messages and support",
    description:
      "Contact forms, support requests, platform messages, dispute details, and service-related communications.",
    icon: <Mail className="h-5 w-5" />,
  },
  {
    title: "Phone and SMS activity",
    description:
      "Phone numbers may be used for account access, secure login codes, transactional messages, and safety-related notices.",
    icon: <Phone className="h-5 w-5" />,
  },
  {
    title: "Payment-related information",
    description:
      "Payment, payout, refund, transaction, or tax-related information may be handled with payment providers.",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    title: "Cookies and site activity",
    description:
      "Device data, page activity, analytics, cookies, and similar technologies may help us improve SitGuru.",
    icon: <Cookie className="h-5 w-5" />,
  },
];

const privacyPathways = [
  {
    title: "Pet Parents",
    description:
      "Pet profiles, care notes, booking details, messages, and support history help make care easier to organize.",
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: "Pet Gurus",
    description:
      "Profile details, service areas, preferences, program applications, and trust and safety steps help support local care connections.",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Programs and Ambassadors",
    description:
      "Student Hire, Community Hire, Military Hire, and Ambassador submissions may include referral, partner, school, or eligibility details.",
    icon: <Sparkles className="h-5 w-5" />,
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
        className={`text-sm font-black uppercase tracking-[0.22em] sm:tracking-[0.28em] ${
          inverse ? "text-white" : "text-emerald-700"
        }`}
      >
        {children}
      </p>
    </div>
  );
}

export default function PrivacyPage() {
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
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 sm:py-18 lg:px-8 lg:py-24">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-700 sm:tracking-[0.32em]">
              Privacy Policy
            </p>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Lock className="h-4 w-4" />
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Your privacy matters at SitGuru.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base font-semibold leading-8 text-slate-700 sm:text-lg">
            SitGuru is a trusted pet care marketplace for Pet Parents, Pet
            Gurus, Ambassadors, and community programs. This policy explains
            what information we collect, how we use it, how we share it, and how
            we work to protect it.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-bold text-slate-600">
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Last updated: {lastUpdated}
            </span>
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Human support available for privacy questions
            </span>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-7 py-4 text-base font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 sm:w-auto"
            >
              Contact SitGuru
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/terms"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-emerald-200 bg-white px-7 py-4 text-base font-black text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
            >
              View Terms
            </Link>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {quickSummary.map((item) => (
            <div
              key={item.title}
              className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
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
        <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-8 lg:p-10">
          <SectionEyebrow icon={<Eye className="h-4 w-4" />}>
            Information We May Handle
          </SectionEyebrow>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            SitGuru uses information to support trusted local pet care.
          </h2>

          <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
            The details below summarize common types of information SitGuru may
            collect or process. The full policy sections that follow explain
            these practices in more detail.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {dataHighlights.map((item) => (
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

      <section className="relative mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-emerald-900/20 bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-700 p-5 text-white shadow-[0_20px_60px_rgba(5,95,70,0.22)] sm:rounded-[34px] sm:p-8 lg:p-10">
          <SectionEyebrow inverse icon={<BadgeCheck className="h-4 w-4" />}>
            Privacy by pathway
          </SectionEyebrow>

          <div className="mt-5 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-black tracking-tight !text-white sm:text-4xl">
                Different users share different details with SitGuru.
              </h2>
              <p className="mt-4 text-base font-semibold leading-8 !text-white/90">
                Pet Parents, Pet Gurus, Ambassadors, students, community
                supporters, and military-connected applicants may use different
                parts of SitGuru. We use submitted information to route support,
                organize care, review program interest, and keep the community
                safer.
              </p>
            </div>

            <div className="grid gap-3">
              {privacyPathways.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 !text-white"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-800">
                      {item.icon}
                    </span>
                    <div>
                      <h3 className="text-sm font-black !text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm font-semibold leading-6 !text-white/85">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-4xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-8 lg:p-10">
          <SectionEyebrow icon={<ShieldCheck className="h-4 w-4" />}>
            SitGuru Privacy Policy
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

          <div className="mt-12 rounded-[24px] border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-start gap-3">
              <Bell className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  Privacy updates
                </h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
                  SitGuru may update this policy as features, services, legal
                  requirements, or community needs change. The latest version
                  will be posted on this page with the updated date.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-6 text-center shadow-[0_10px_30px_rgba(16,185,129,0.08)] sm:p-10">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <MessageCircle className="h-4 w-4" />
            </span>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700 sm:tracking-[0.28em]">
              Questions About Privacy?
            </p>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Mail className="h-4 w-4" />
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Privacy questions deserve human communication.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
            If you have a concern about how your information is handled, email
            support@sitguru.com or contact SitGuru through the contact page.
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
              href="/terms"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-emerald-200 bg-white px-7 py-4 text-base font-black text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
            >
              View Terms
            </Link>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                <FileText className="h-4 w-4" />
                Related Policies
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Review the Terms page for platform rules, user responsibilities,
                and SitGuru marketplace expectations.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/help"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
              >
                Help Center
              </Link>
              <Link
                href="/terms"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
              >
                View Terms
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
