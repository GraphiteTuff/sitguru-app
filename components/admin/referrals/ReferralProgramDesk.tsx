import Link from "next/link";
import {
  ArrowLeft,
  BadgeDollarSign,
  ClipboardList,
  Gift,
  HandCoins,
  MousePointerClick,
  Plus,
  QrCode,
  Search,
  UserRoundX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import {
  AdminWorkplaceActions,
  AdminWorkplaceHealth,
  GrowthCard,
  GrowthPageFrame,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";
import type {
  ReferralAccounting,
  ReferralProgram,
} from "@/lib/admin/referrals/accounting";

const routes = {
  hub: "/admin/referrals",
  codes: "/admin/referrals/codes",
  inventory: "/admin/referrals/inventory",
  rewards: "/admin/rewards",
  payouts: "/admin/referrals/payouts",
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function when(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function eventLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function ReferralProgramDesk({
  kicker,
  title,
  detail,
  program,
  desk,
  query = "",
  extraActions = [],
}: {
  kicker: string;
  title: string;
  detail: string;
  program: ReferralProgram;
  desk: ReferralAccounting;
  query?: string;
  extraActions?: Array<{
    href: string;
    label: string;
    detail: string;
    icon: LucideIcon;
  }>;
}) {
  const missing = desk.codes.filter((row) => row.missingOwner).slice(0, 8);
  const unconverted = desk.codes
    .filter((row) => row.visits + row.scans > 0 && row.signups === 0)
    .slice(0, 8);
  const live = desk.codes.slice(0, 40);
  const recent = desk.events.slice(0, 12);

  return (
    <GrowthPageFrame
      kicker={kicker}
      title={title}
      detail={detail}
      action={
        <Link
          href={`${routes.codes}#generate-code`}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-green-950"
        >
          <Plus size={17} />
          Generate code
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href={routes.hub}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
        >
          <ArrowLeft size={14} />
          Referrals workplace
        </Link>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
          HQ is alerted on attributed signups
        </span>
      </div>

      {desk.warnings.length ? (
        <GrowthCard className="border-amber-200 bg-amber-50">
          <p className="text-sm font-black text-amber-950">
            Some referral reads were skipped
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm font-semibold text-amber-900">
            {desk.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </GrowthCard>
      ) : null}

      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3">
        <AdminThemeCard
          label="Live codes"
          value={desk.totals.codes}
          helper="Owned or issued in this program"
          tone="emerald"
          icon={<ClipboardList size={18} />}
        />
        <AdminThemeCard
          label="Tracked visits"
          value={desk.totals.visits}
          helper={`${number(desk.totals.scans)} QR scans`}
          tone="violet"
          icon={<MousePointerClick size={18} />}
        />
        <AdminThemeCard
          label="Signups captured"
          value={desk.totals.signups}
          helper="Reward-eligible first-touch joins"
          tone="sky"
          icon={<Gift size={18} />}
        />
        <AdminThemeCard
          label="Needs owner"
          value={desk.totals.missingOwners}
          helper="Cannot pay an unnamed code"
          tone="amber"
          icon={<UserRoundX size={18} />}
        />
        <AdminThemeCard
          label="Traffic, no signup"
          value={desk.totals.unconvertedTraffic}
          helper="Clicks or scans still unaccounted"
          tone="rose"
          icon={<QrCode size={18} />}
        />
        <AdminThemeCard
          label="Reward queue"
          value={desk.totals.signups}
          helper="Open payouts to confirm"
          tone="slate"
          icon={<HandCoins size={18} />}
        />
      </section>

      <AdminWorkplaceActions
        actions={[
          {
            href: `${routes.codes}#generate-code`,
            label: "Issue a code",
            detail: "Create or repair a tracked code",
            icon: Plus,
            primary: desk.totals.missingOwners > 0,
          },
          {
            href: routes.rewards,
            label: "Rewards auditor",
            detail: "Clicks, conversions, and flags",
            icon: BadgeDollarSign,
          },
          {
            href: routes.payouts,
            label: "Payouts",
            detail: "Mark earned rewards paid",
            icon: HandCoins,
          },
          ...extraActions,
        ]}
      />

      <GrowthCard>
        <form className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label>
            <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Find a code or owner
            </span>
            <div className="flex min-h-11 items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-3">
              <Search size={16} className="text-emerald-800" />
              <input
                name="q"
                defaultValue={query}
                placeholder="JASON, owner name, email..."
                className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-black !text-white"
              style={{ background: "#0D5C3A" }}
            >
              Filter
            </button>
          </div>
        </form>
      </GrowthCard>

      {missing.length ? (
        <GrowthCard>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">
                Work queue
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                Attach an owner before any payout
              </h2>
            </div>
            <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-black text-amber-800 ring-1 ring-amber-100">
              {number(desk.totals.missingOwners)} open
            </span>
          </div>
          <div className="mt-4 grid min-w-0 gap-3">
            {missing.map((row) => (
              <Link
                key={row.code}
                href={`${routes.codes}?q=${encodeURIComponent(row.code)}#editable-registry`}
                className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <p className="font-black text-slate-950">{row.code}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {row.ownerEmail} · {number(row.visits + row.scans)} tracked hits
                  </p>
                </div>
                <span className="text-xs font-black text-amber-900">
                  Open registry
                </span>
              </Link>
            ))}
          </div>
        </GrowthCard>
      ) : null}

      {unconverted.length ? (
        <GrowthCard>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-rose-700">
                Accounting
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                Traffic that has not become a signup yet
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Visits and scans do not earn a reward until a referred member
                registers.
              </p>
            </div>
          </div>
          <div className="mt-4 grid min-w-0 gap-3">
            {unconverted.map((row) => (
              <div
                key={row.code}
                className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <p className="font-black text-slate-950">{row.code}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-600">
                    {row.ownerName} · {number(row.visits)} visits ·{" "}
                    {number(row.scans)} QR
                  </p>
                </div>
                <StatusPill value="Unconverted" />
              </div>
            ))}
          </div>
        </GrowthCard>
      ) : null}

      <GrowthCard>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              {programLabelTitle(program)} codes
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Live tracking from PawPerks events, not leftover profile codes.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800 ring-1 ring-emerald-100">
            {number(live.length)} shown
          </span>
        </div>
        {live.length ? (
          <div className="grid min-w-0 gap-3">
            {live.map((row) => (
              <article
                key={row.code}
                className="grid min-w-0 gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 md:grid-cols-[1.2fr_0.8fr_0.8fr]"
              >
                <div className="min-w-0">
                  <p className="font-black text-slate-950">{row.code}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-600">
                    {row.ownerName}
                  </p>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    {row.ownerEmail}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    Tracked
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-800">
                    {number(row.visits)} visits · {number(row.scans)} QR
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Last {when(row.lastActivity)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    Reward
                  </p>
                  <div className="mt-1">
                    <StatusPill
                      value={
                        row.signups > 0
                          ? `${row.signups} signup`
                          : row.missingOwner
                            ? "Needs owner"
                            : "Awaiting join"
                      }
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold text-slate-500">
            No {programLabelTitle(program).toLowerCase()} codes match this
            filter.
          </p>
        )}
      </GrowthCard>

      <GrowthCard>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Recent events</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Admin is alerted when a signup is captured. Visits stay on this
            board.
          </p>
        </div>
        <div className="grid min-w-0 gap-3">
          {recent.map((event) => (
            <div
              key={event.id}
              className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <p className="font-black text-slate-950">
                  {event.code || "Unknown code"}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-600">
                  {event.referredName || event.referredEmail || "Anonymous visit"}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <StatusPill value={eventLabel(event.eventType)} />
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {when(event.occurredAt)}
                </p>
              </div>
            </div>
          ))}
          {!recent.length ? (
            <p className="text-sm font-semibold text-slate-500">
              No tracked events for this program yet.
            </p>
          ) : null}
        </div>
      </GrowthCard>

      <AdminWorkplaceHealth
        sources={desk.sourceHealth}
        helper="Tables that feed this desk"
        links={
          <>
            <Link
              href={routes.inventory}
              className="rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
            >
              Inventory
            </Link>
            <Link
              href={routes.codes}
              className="rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
            >
              Registry
            </Link>
          </>
        }
      />
    </GrowthPageFrame>
  );
}

function programLabelTitle(program: ReferralProgram) {
  if (program === "guru") return "Guru";
  if (program === "pet_parent") return "Pet Parent";
  if (program === "ambassador") return "Ambassador";
  if (program === "partner") return "Partner";
  return "Referral";
}
