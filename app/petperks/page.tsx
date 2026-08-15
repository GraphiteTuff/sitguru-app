import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  CheckCircle2,
  Gift,
  GraduationCap,
  Link2,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import PetPerksRefCapture from "@/components/rewards/PetPerksRefCapture";

export const metadata: Metadata = {
  title: "PetPerks & PawPerks | SitGuru Rewards",
  description:
    "PetPerks is SitGuru’s public share-and-earn referral program. PawPerks is where Pet Parents track referral credits, rewards, and checkout savings. Give $10, get $10 — refer a Guru and earn $20.",
  alternates: {
    canonical: "/petperks",
  },
};

const PETPERKS_IMAGES = {
  hero: "/images/petperks/petperks-hero-sharing.jpg",
  petParent: "/images/petperks/petperks-pet-parent-cat.jpg",
  futureGuru: "/images/petperks/petperks-future-guru-dog-walker.jpg",
  happyPetParent: "/images/petperks/petperks-happy-pet-parent.jpg",
};

const howItWorks = [
  {
    step: "1",
    title: "Get your link",
    description:
      "Sign up free, then open PawPerks Rewards to copy your personal referral link.",
  },
  {
    step: "2",
    title: "Share with the pack",
    description:
      "Send your PetPerks link to friends who need care, or future Gurus who want to earn helping pets.",
  },
  {
    step: "3",
    title: "They join & book",
    description:
      "Rewards unlock after qualified sign-up and the first eligible paid booking is completed (Guru referrals also need approval).",
  },
  {
    step: "4",
    title: "Track in PawPerks",
    description:
      "See pending and available credits in your Pet Parent dashboard, then apply them at SitGuru checkout.",
  },
] as const;

const petParentRules = [
  "The referred friend or family member must sign up using a valid PetPerks referral link.",
  "The referred friend or family member must complete their first eligible paid booking with a SitGuru Guru.",
  "Pet Parent rewards are issued as future SitGuru care credits after the referral qualifies.",
  "Rewards may not apply to cancelled, refunded, duplicate, fraudulent, self-referred, incomplete, or ineligible activity.",
  "SitGuru may review referral activity before issuing any PetPerks reward.",
];

const guruRules = [
  "The referred Guru must sign up through a valid PetPerks referral link.",
  "The referred Guru must be approved and complete their first eligible paid booking.",
  "Guru referral rewards require an approved profile, completed verification steps when required, and a completed first eligible paid booking.",
  "Rewards may not apply to duplicate accounts, incomplete applications, rejected applications, cancelled bookings, refunded bookings, or fraudulent referrals.",
];

const generalTerms = [
  "PetPerks rewards are earned after qualified sign-up, approval when required, and eligible first paid booking activity is completed.",
  "Rewards are not guaranteed until all eligibility requirements and first eligible paid booking activity are completed.",
  "Pet Parents can track personal reward activity inside PawPerks Rewards after signing in.",
  "SitGuru may delay, deny, reverse, or adjust rewards for suspected abuse, fraud, cancelled activity, refunded activity, duplicate accounts, self-referrals, or policy violations.",
  "PetPerks are intended to support genuine community growth through real Pet Parents, future Gurus, Ambassadors, and trusted referrals.",
  "Additional terms may apply depending on the referral source, campaign, program, location, or launch phase.",
];

const faqs = [
  {
    q: "What’s the difference between PetPerks and PawPerks?",
    a: "PetPerks is the public share-and-earn program (the offer you promote). PawPerks is the Pet Parent rewards center where you copy your link, track referrals, and see credits you can use toward SitGuru care.",
  },
  {
    q: "Who can join PetPerks?",
    a: "Pet Parents, future Gurus, Ambassadors, and community members who want to grow SitGuru through genuine referrals. Pet Parents manage most reward tracking inside PawPerks after sign-in.",
  },
  {
    q: "When do I get my reward?",
    a: "After the referred person signs up with your valid link and completes the first eligible paid booking. Guru referrals also need approval first. Credits are not guaranteed until those steps finish.",
  },
  {
    q: "Where do I use PawPerks credits?",
    a: "At SitGuru checkout only. Keep rewards on-platform — they can’t be moved to Venmo, cash, or off-platform payments.",
  },
] as const;

export default function PetPerksPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-emerald-50/40 to-slate-50 text-slate-950">
      <Suspense fallback={null}>
        <PetPerksRefCapture />
      </Suspense>
      <section className="relative overflow-hidden px-5 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-24">
        <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              ← Back to SitGuru
            </Link>
          </div>

          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-800">
                <PawPrint className="h-4 w-4" aria-hidden="true" />
                SitGuru PetPerks + PawPerks
              </div>

              <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Share SitGuru. Earn rewards.
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700 sm:text-xl">
                <strong className="font-black text-slate-950">PetPerks</strong>{" "}
                is SitGuru’s public referral program.{" "}
                <strong className="font-black text-slate-950">PawPerks</strong>{" "}
                is where Pet Parents track links, credits, and checkout savings
                after they sign in.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                    Pet Parents
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    Give $10. Get $10.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Your friend gets $10 toward care. You earn $10 after their
                    first eligible paid booking is completed.
                  </p>
                </div>

                <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-700">
                    Future Gurus
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    Refer a Guru. Earn $20.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Rewards unlock after the referred Guru is approved and
                    completes their first eligible paid booking.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-[#0D5C3A] px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#09462C]"
                >
                  Sign Up Free
                </Link>

                <Link
                  href="/customer/dashboard/pawperks"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
                >
                  Open PawPerks Rewards
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-5 -top-5 z-10 hidden rounded-3xl border border-emerald-100 bg-white p-4 shadow-xl shadow-slate-950/10 sm:block">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Simple sharing
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  Copy your link. Share with the pack.
                </p>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-2 shadow-[0_30px_90px_rgba(15,23,42,0.14)] sm:rounded-[2.5rem] sm:p-3">
                <img
                  src={PETPERKS_IMAGES.hero}
                  alt="Pet Parent sharing SitGuru from a phone while sitting with a dog"
                  className="h-auto max-h-[520px] w-full rounded-[1.5rem] object-contain sm:rounded-[2rem]"
                />
              </div>

              <div className="mt-4 rounded-3xl border border-white/80 bg-[#0D5C3A] px-5 py-4 text-white shadow-xl shadow-emerald-900/20 sm:absolute sm:-bottom-5 sm:right-5 sm:mt-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
                  PetPerks
                </p>
                <p className="mt-1 text-lg font-black">Share. Refer. Earn.</p>
              </div>
            </div>
          </div>

          <section
            id="petperks-vs-pawperks"
            className="mt-14 rounded-[2rem] border border-emerald-200 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
              <Gift className="h-4 w-4" aria-hidden="true" />
              Clear names, clear jobs
            </div>

            <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              PetPerks vs PawPerks — what’s the difference?
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
              People often see both names. Here’s the simple split: PetPerks is
              the public program you share. PawPerks is the private rewards home
              for Pet Parents once they’re signed in.
            </p>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Public program
                    </p>
                    <p className="text-2xl font-black text-slate-950">PetPerks</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-3 text-sm font-semibold leading-6 text-slate-700">
                  <li>Explains Give $10 / Get $10 and Guru referral rewards</li>
                  <li>Open to Pet Parents, future Gurus, Ambassadors & community</li>
                  <li>This page (`/petperks`) is the public story and invite hub</li>
                  <li>Rewards require real, eligible first paid booking activity</li>
                </ul>
              </div>

              <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/80 p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0D5C3A] text-white">
                    <Wallet className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                      Pet Parent rewards center
                    </p>
                    <p className="text-2xl font-black text-slate-950">
                      PawPerks
                    </p>
                  </div>
                </div>
                <ul className="mt-5 space-y-3 text-sm font-semibold leading-6 text-slate-700">
                  <li>Copy your personal PawPerks / PetPerks referral link</li>
                  <li>Track invited friends, pending rewards, and available credit</li>
                  <li>Apply eligible credits at SitGuru checkout</li>
                  <li>
                    Open anytime in your dashboard at{" "}
                    <Link
                      href="/customer/dashboard/pawperks"
                      className="font-black text-emerald-800 underline"
                    >
                      PawPerks Rewards
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                <Link2
                  className="h-5 w-5 text-emerald-700"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-black text-slate-950">
                  One link to share
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Your PawPerks link attributes PetPerks referrals to your
                  account.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                <Wallet
                  className="h-5 w-5 text-emerald-700"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-black text-slate-950">
                  Credits toward care
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Qualified rewards show as SitGuru care credit — not cash off
                  platform.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                <ShieldCheck
                  className="h-5 w-5 text-emerald-700"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-black text-slate-950">
                  Fair & protected
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Self-referrals, duplicates, cancellations, and fraud don’t
                  qualify.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <div className="mb-6 max-w-2xl">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                How it works
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                From share to savings in four steps
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((item) => (
                <div
                  key={item.step}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Step {item.step}
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="overflow-hidden rounded-[2rem] border border-emerald-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div className="relative overflow-hidden bg-emerald-50">
                <img
                  src={PETPERKS_IMAGES.petParent}
                  alt="Pet Parents smiling with a cat at home"
                  className="h-auto w-full object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-lg">
                  <PawPrint className="h-8 w-8" aria-hidden="true" />
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
                  Pet Parent PetPerk
                </p>

                <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950">
                  Give $10. Get $10.
                </h2>

                <p className="mt-4 text-base leading-7 text-slate-700">
                  Invite a friend or family member who needs trusted pet care.
                  They get $10 toward eligible SitGuru care, and you earn $10
                  after their first eligible paid booking with a SitGuru Guru is
                  completed.
                </p>

                <div className="mt-6 space-y-3">
                  {petParentRules.map((rule) => (
                    <div key={rule} className="flex gap-3">
                      <CheckCircle2
                        className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                        aria-hidden="true"
                      />
                      <p className="text-sm leading-6 text-slate-700">{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="overflow-hidden rounded-[2rem] border border-sky-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div className="relative overflow-hidden bg-sky-50">
                <img
                  src={PETPERKS_IMAGES.futureGuru}
                  alt="Future SitGuru Guru walking a happy dog outside"
                  className="h-auto w-full object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-lg">
                  <GraduationCap className="h-8 w-8" aria-hidden="true" />
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-700">
                  Future Guru PetPerk
                </p>

                <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950">
                  Refer a Guru. Earn $20.
                </h2>

                <p className="mt-4 text-base leading-7 text-slate-700">
                  Invite sitters, walkers, trainers, pet-care professionals, and
                  trusted community helpers. Rewards are earned after the
                  referred Guru is approved and completes their first eligible
                  paid booking.
                </p>

                <div className="mt-6 space-y-3">
                  {guruRules.map((rule) => (
                    <div key={rule} className="flex gap-3">
                      <CheckCircle2
                        className="mt-0.5 h-5 w-5 shrink-0 text-sky-600"
                        aria-hidden="true"
                      />
                      <p className="text-sm leading-6 text-slate-700">{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>

          <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Terms overview
                </div>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950">
                  PetPerks are earned after eligible first paid booking
                  activity.
                </h2>

                <p className="mt-4 text-base leading-7 text-slate-700">
                  SitGuru keeps rewards simple for the community while still
                  protecting the platform from duplicate accounts, cancelled
                  activity, refunded activity, self-referrals, abuse, or fraud.
                </p>
              </div>

              <div className="grid gap-3">
                {generalTerms.map((term) => (
                  <div
                    key={term}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex gap-3">
                      <Sparkles
                        className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                        aria-hidden="true"
                      />
                      <p className="text-sm leading-6 text-slate-700">{term}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-10 rounded-[2rem] border border-emerald-100 bg-emerald-50/50 p-6 sm:p-8">
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
              Quick answers
            </h2>
            <div className="mt-6 grid gap-3">
              {faqs.map((item) => (
                <div
                  key={item.q}
                  className="rounded-2xl border border-emerald-100 bg-white px-5 py-4"
                >
                  <p className="text-sm font-black text-slate-950">{item.q}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            data-brand-green
            className="public-dark-section mt-10 overflow-hidden rounded-[2rem] border border-emerald-950 bg-[#0D5C3A] text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
          >
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
              <div className="relative min-h-[260px] bg-emerald-950 lg:order-2">
                <img
                  src={PETPERKS_IMAGES.happyPetParent}
                  alt="Happy Pet Parent relaxing at home with a dog"
                  className="h-full min-h-[260px] w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D5C3A]/80 via-[#0D5C3A]/20 to-transparent lg:bg-gradient-to-l lg:from-[#0D5C3A]/85 lg:via-[#0D5C3A]/25 lg:to-transparent" />
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                <p className="text-sm font-black uppercase tracking-[0.2em] !text-emerald-100">
                  Ready to share?
                </p>

                <h2 className="mt-3 !text-3xl !font-black !leading-tight !text-white sm:!text-4xl">
                  Start with PetPerks. Track everything in PawPerks.
                </h2>

                <p className="mt-4 max-w-3xl !text-base !leading-7 !text-emerald-50">
                  Share SitGuru with Pet Parents who need trusted care and
                  future Gurus who want to earn helping pets and families — then
                  manage your link and credits in PawPerks Rewards.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/customer/dashboard/pawperks"
                    className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-black text-[#0D5C3A] shadow-lg transition hover:bg-emerald-50"
                  >
                    Open PawPerks Rewards
                  </Link>

                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-black !text-white transition hover:bg-white/15"
                  >
                    Sign Up Free
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
