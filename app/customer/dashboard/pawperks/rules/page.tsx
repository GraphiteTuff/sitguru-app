 // app/customer/dashboard/pawperks/rules/page.tsx
"use client";

import Header from "@/components/Header";

function RuleSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <h2 className="text-2xl font-black tracking-tight text-slate-950">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-base font-semibold leading-7 text-slate-600">
        {children}
      </div>
    </section>
  );
}

function RuleItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-black text-emerald-700 ring-1 ring-emerald-100">
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}

export default function PawPerksRulesPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] text-slate-950">
      <Header />

      <section className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-[2.5rem] border border-emerald-100 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.86),transparent_18%),linear-gradient(120deg,#f3fdf7_0%,#ddfaea_48%,#a7f3d0_100%)] p-6 shadow-[0_28px_95px_rgba(6,95,70,0.14)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/86 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-800 shadow-sm backdrop-blur-sm">
                  🐾 SitGuru PawPerks
                </span>

                <span className="inline-flex items-center rounded-full bg-yellow-300 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-950 shadow-sm">
                  Friends & Family Rewards
                </span>
              </div>

              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-slate-950 md:text-6xl">
                Official PawPerks Rules
              </h1>

              <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-slate-700 md:text-lg">
                Review how Friends & Family Rewards qualify, when credits are
                issued, and how PawPerks Rewards can be used on eligible
                SitGuru bookings.
              </p>
            </div>

            <a
              href="/customer/dashboard/pawperks"
              className="inline-flex min-h-[50px] items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-black text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              ← Back to PawPerks
            </a>
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          <RuleSection title="Program overview">
            <p>
              PawPerks is SitGuru’s Friends & Family Rewards program. Pet
              Parents can share their personal PawPerks link or referral code
              with friends and family. When a referred person signs up, books
              eligible Pet Care, and completes the qualifying action, the
              referring Pet Parent may earn future SitGuru booking credits.
            </p>
          </RuleSection>

          <RuleSection title="Who can participate">
            <ul className="space-y-3">
              <RuleItem>
                PawPerks is intended for active SitGuru customer accounts in
                good standing.
              </RuleItem>
              <RuleItem>
                Referrals should be shared with real friends, family members,
                neighbors, coworkers, or people who may genuinely need trusted
                Pet Care.
              </RuleItem>
              <RuleItem>
                SitGuru may review referral activity to confirm that rewards are
                connected to legitimate customer activity.
              </RuleItem>
            </ul>
          </RuleSection>

          <RuleSection title="What counts as a qualified referral">
            <p>
              A referral generally qualifies when a new customer uses your
              PawPerks link or referral code, creates a SitGuru account, books
              eligible Pet Care, and completes the required booking activity.
            </p>

            <ul className="space-y-3">
              <RuleItem>
                The referred customer must be new to SitGuru.
              </RuleItem>
              <RuleItem>
                The referral must be connected to your PawPerks code or link.
              </RuleItem>
              <RuleItem>
                The booking must be completed and not canceled, refunded, or
                marked as invalid.
              </RuleItem>
              <RuleItem>
                Duplicate accounts, self-referrals, fake referrals, or
                suspicious activity may be disqualified.
              </RuleItem>
            </ul>
          </RuleSection>

          <RuleSection title="Reward tiers">
            <p>
              PawPerks Rewards are currently planned as future booking credits
              based on qualified referrals:
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                  2 referrals
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  $10 credit
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                  5 referrals
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  $25 credit
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                  10 referrals
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  $60 credit
                </p>
              </div>
            </div>

            <p>
              Reward amounts, tiers, and qualification requirements may be
              adjusted as SitGuru finalizes the PawPerks program.
            </p>
          </RuleSection>

          <RuleSection title="When rewards become available">
            <ul className="space-y-3">
              <RuleItem>
                Rewards are generally issued after the referred customer’s
                qualifying booking is completed.
              </RuleItem>
              <RuleItem>
                Rewards may remain pending while SitGuru verifies the referral,
                booking status, payment status, cancellation status, and account
                activity.
              </RuleItem>
              <RuleItem>
                Credits may not be available immediately after a referral signs
                up.
              </RuleItem>
            </ul>
          </RuleSection>

          <RuleSection title="How PawPerks Rewards can be used">
            <ul className="space-y-3">
              <RuleItem>
                PawPerks Rewards are intended to be used as future SitGuru
                booking credits.
              </RuleItem>
              <RuleItem>
                Credits may apply only to eligible SitGuru bookings.
              </RuleItem>
              <RuleItem>
                Credits are not cash, are not cash equivalents, and may not be
                transferred, sold, or exchanged outside of SitGuru.
              </RuleItem>
              <RuleItem>
                SitGuru may apply limits to how many credits can be used on a
                single booking.
              </RuleItem>
            </ul>
          </RuleSection>

          <RuleSection title="Referral activity that may not qualify">
            <ul className="space-y-3">
              <RuleItem>
                Self-referrals or referrals between duplicate accounts.
              </RuleItem>
              <RuleItem>
                Fake, automated, or spam referral activity.
              </RuleItem>
              <RuleItem>
                Referrals connected to canceled, refunded, disputed, or invalid
                bookings.
              </RuleItem>
              <RuleItem>
                Attempts to manipulate the program, create duplicate rewards, or
                abuse credits.
              </RuleItem>
            </ul>
          </RuleSection>

          <RuleSection title="Program changes">
            <p>
              SitGuru may update PawPerks Rewards, tiers, eligibility,
              qualification rules, credit amounts, or program availability as
              the program grows. Any changes should be reflected on this page or
              in future PawPerks program updates.
            </p>
          </RuleSection>

          <RuleSection title="Questions or support">
            <p>
              If you have questions about your PawPerks Rewards, referral
              status, or available credits, contact SitGuru support through your
              customer account.
            </p>

            <a
              href="/customer/dashboard/messages"
              className="mt-2 inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              Message SitGuru Support
            </a>
          </RuleSection>

          <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-bold leading-6 text-amber-800">
              Program note: This page is a working program rules page for
              PawPerks. Before public launch, final reward terms should be
              reviewed and approved by SitGuru.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
