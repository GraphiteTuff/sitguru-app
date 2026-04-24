import Link from "next/link";
import { Heart, PawPrint, ShieldCheck, Lock, Mail, Eye } from "lucide-react";

const sections = [
  {
    title: "1. Overview",
    body: [
      "SitGuru respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains how SitGuru collects, uses, stores, and shares information when you visit our website, create an account, join the waitlist, communicate with us, or use SitGuru services.",
      "By accessing or using SitGuru, you acknowledge that you have read and understand this Privacy Policy.",
    ],
  },
  {
    title: "2. Information We Collect",
    body: [
      "We may collect information you provide directly to us, including your name, email address, phone number, mailing address, account information, profile details, pet information, booking details, payment-related information, messages sent through the platform, and any other information you choose to submit.",
      "We may also collect certain information automatically, such as your IP address, browser type, device information, referring pages, pages viewed, dates and times of access, and interactions with our website.",
      "If you join a waitlist, fill out a contact form, submit support requests, or communicate with SitGuru, we may collect and retain those communications.",
    ],
  },
  {
    title: "3. How We Use Information",
    body: [
      "We may use your information to operate, maintain, and improve SitGuru; create and manage accounts; support bookings and related services; communicate with Pet Parents and Gurus; respond to questions and support requests; send transactional messages; improve user experience; protect the safety and integrity of the platform; detect fraud, abuse, or misuse; and comply with legal obligations.",
      "We may also use information to send updates, promotional materials, launch announcements, or marketing communications where permitted by law. You may opt out of marketing emails at any time.",
    ],
  },
  {
    title: "4. How We Share Information",
    body: [
      "SitGuru may share information with service providers and vendors who help us operate the platform, including hosting providers, analytics tools, customer support tools, email service providers, payment processors, and similar business partners.",
      "We may share information between users where necessary to support platform functionality, such as facilitating communication, bookings, account setup, or service-related interactions between Pet Parents and Gurus.",
      "We may also disclose information if required by law, legal process, court order, government request, or where we believe disclosure is reasonably necessary to protect SitGuru, our users, pets, or the public.",
      "We do not sell personal information in the ordinary meaning of that phrase.",
    ],
  },
  {
    title: "5. Cookies and Analytics",
    body: [
      "SitGuru may use cookies, pixels, local storage, and similar technologies to remember preferences, understand site usage, improve performance, and support analytics and marketing efforts.",
      "You may be able to adjust cookie preferences through your browser settings. Please note that disabling certain cookies may affect the functionality of parts of the site.",
    ],
  },
  {
    title: "6. Data Security",
    body: [
      "SitGuru takes reasonable administrative, technical, and organizational measures to help protect personal information against unauthorized access, loss, misuse, or alteration. However, no method of transmission over the internet and no method of electronic storage is guaranteed to be completely secure.",
      "For that reason, while we work to protect your information, SitGuru cannot guarantee absolute security.",
    ],
  },
  {
    title: "7. Data Retention",
    body: [
      "We retain personal information for as long as reasonably necessary to provide services, maintain business and legal records, resolve disputes, enforce our agreements, and comply with legal obligations.",
      "Retention periods may vary depending on the type of information and the reason it was collected.",
    ],
  },
  {
    title: "8. Your Choices and Rights",
    body: [
      "You may update certain account information by logging into your account, where that functionality is available.",
      "You may opt out of marketing emails by using the unsubscribe link in those communications.",
      "Depending on your location, you may have rights related to access, correction, deletion, or limitation of certain personal information. SitGuru will review and respond to applicable requests in accordance with governing law.",
    ],
  },
  {
    title: "9. Children’s Privacy",
    body: [
      "SitGuru is not intended for children under the age of 13, and we do not knowingly collect personal information directly from children under 13. If we learn that we have collected personal information from a child under 13 without appropriate consent, we will take reasonable steps to delete it.",
    ],
  },
  {
    title: "10. Third-Party Services and Links",
    body: [
      "SitGuru may contain links to third-party websites, services, or integrations. This Privacy Policy does not apply to the practices of third parties that we do not own or control. We encourage you to review the privacy policies of those third parties before providing information to them.",
    ],
  },
  {
    title: "11. Changes to This Policy",
    body: [
      "SitGuru may update this Privacy Policy from time to time. If we make material changes, we may update the effective date, post the revised version on this page, and take additional steps where required by law.",
      "Your continued use of SitGuru after an updated Privacy Policy becomes effective indicates your acknowledgment of the revised policy.",
    ],
  },
  {
    title: "12. Contact Us",
    body: [
      "If you have questions, concerns, or privacy-related requests, please contact SitGuru through the support or contact information provided on the platform.",
      "Because SitGuru believes in human communication, we want users to know they can reach out with privacy questions and receive support from a real person.",
    ],
  },
];

function SectionEyebrow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
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

export default function PrivacyPage() {
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
              <ShieldCheck className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-emerald-700">
              Privacy Policy
            </p>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Lock className="h-4 w-4" />
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Your privacy matters at SitGuru.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            SitGuru is committed to protecting the information entrusted to us
            by Pet Parents, Gurus, and visitors to our platform. This page
            explains what information we collect, how we use it, and how we
            work to keep it safe.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600">
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Last updated: [Month Day, Year]
            </span>
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-2">
              Human support available for privacy questions
            </span>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <SectionEyebrow icon={<Eye className="h-4 w-4" />}>
              Clear by Design
            </SectionEyebrow>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              We want privacy information to feel understandable, not buried in
              confusing legal language.
            </p>
          </div>

          <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <SectionEyebrow icon={<Lock className="h-4 w-4" />}>
              Respect for Data
            </SectionEyebrow>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              SitGuru works to protect personal information using reasonable
              safeguards and responsible access practices.
            </p>
          </div>

          <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <SectionEyebrow icon={<Mail className="h-4 w-4" />}>
              Real Support
            </SectionEyebrow>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              If you have questions about privacy, SitGuru believes you should
              be able to reach a real person for help.
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-4xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:p-10">
          <SectionEyebrow icon={<ShieldCheck className="h-4 w-4" />}>
            SitGuru Privacy Policy
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
              This page is intended as a customer-facing privacy policy draft
              and should be reviewed by qualified legal counsel before final
              publication.
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
              Questions About Privacy?
            </p>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Mail className="h-4 w-4" />
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            We believe privacy questions deserve human communication.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
            If you have a concern about how your information is handled, SitGuru
            wants you to feel supported and informed.
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