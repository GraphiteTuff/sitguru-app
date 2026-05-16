import Link from "next/link";
import {
  CheckCircle2,
  Gift,
  GraduationCap,
  PawPrint,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const PETPERKS_IMAGES = {
  hero: "/images/petperks/petperks-hero-sharing.jpg",
  petParent: "/images/petperks/petperks-pet-parent-cat.jpg",
  futureGuru: "/images/petperks/petperks-future-guru-dog-walker.jpg",
  happyPetParent: "/images/petperks/petperks-happy-pet-parent.jpg",
};

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
  "Pet Parents can track their personal reward activity inside the PawPerks Rewards area after signing in.",
  "SitGuru may delay, deny, reverse, or adjust rewards for suspected abuse, fraud, cancelled activity, refunded activity, duplicate accounts, self-referrals, or policy violations.",
  "PetPerks are intended to support genuine community growth through real Pet Parents, future Gurus, Ambassadors, and trusted referrals.",
  "Additional terms may apply depending on the referral source, campaign, program, location, or launch phase.",
];

export default function PetPerksPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-emerald-50/40 to-slate-50 text-slate-950">
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
                SitGuru PetPerks
              </div>

              <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Share SitGuru. Earn PetPerks.
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700 sm:text-xl">
                PetPerks is SitGuru’s public rewards program for Pet Parents,
                future Gurus, Ambassadors, and community members who help the
                SitGuru pack grow through qualified referrals and eligible first
                paid booking activity.
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
                    Your friend or family member gets $10 toward care. You earn
                    $10 after their first eligible paid booking is completed.
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
                    Rewards are earned after the referred Guru is approved and
                    completes their first eligible paid booking.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
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

              <div className="mt-4 rounded-3xl border border-white/80 bg-emerald-600 px-5 py-4 text-white shadow-xl shadow-emerald-900/20 sm:absolute sm:-bottom-5 sm:right-5 sm:mt-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
                  PetPerks
                </p>
                <p className="mt-1 text-lg font-black">Share. Refer. Earn.</p>
              </div>
            </div>
          </div>

          <section className="mt-14 rounded-[2rem] border border-emerald-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
                  <Gift className="h-4 w-4" aria-hidden="true" />
                  Public program + private rewards center
                </div>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  PetPerks is the program. PawPerks Rewards is where Pet Parents
                  track it.
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    Public page
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    PetPerks
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Explains the SitGuru rewards program to Pet Parents, future
                    Gurus, Ambassadors, and the broader community.
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                    Pet Parent dashboard
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    PawPerks Rewards
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Logged-in Pet Parents can copy their PawPerks link, track
                    qualified referrals, and view available rewards.
                  </p>
                </div>
              </div>
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
                  Terms Overview
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

          <section className="mt-10 overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
              <div className="relative min-h-[260px] bg-slate-900 lg:order-2">
                <img
                  src={PETPERKS_IMAGES.happyPetParent}
                  alt="Happy Pet Parent relaxing at home with a dog"
                  className="h-full min-h-[260px] w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent lg:bg-gradient-to-l lg:from-slate-950/80 lg:via-slate-950/20 lg:to-transparent" />
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
                  Ready to share?
                </p>

                <h2 className="mt-3 !text-3xl !font-black !leading-tight !text-white sm:!text-4xl">
                  Help SitGuru grow the pet-care community.
                </h2>

                <p className="mt-4 max-w-3xl !text-base !leading-7 !text-slate-100">
                  Share SitGuru with Pet Parents who need trusted care and
                  future Gurus who want to earn by helping pets and families.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/customer/dashboard/pawperks"
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-black !text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                  >
                    Open PawPerks Rewards
                  </Link>

                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-black !text-white transition hover:bg-white/15"
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
