import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type MetricCard = {
  label: string;
  value: string;
  helper: string;
  href?: string;
  tone?: "emerald" | "sky" | "amber" | "rose" | "slate" | "violet";
};

type ActionCard = {
  title: string;
  description: string;
  href: string;
  priority: "High" | "Review" | "Monitor";
};

type CountFilter = {
  column: string;
  operator: "eq" | "neq" | "is" | "in" | "gte" | "lte";
  value: string | number | boolean | null | string[] | number[];
};

type CountResult = {
  value: number | null;
  available: boolean;
};

const toneClasses: Record<NonNullable<MetricCard["tone"]>, string> = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
  sky: "border-sky-200 bg-sky-50 text-sky-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  rose: "border-rose-200 bg-rose-50 text-rose-900",
  slate: "border-slate-200 bg-white text-slate-900",
  violet: "border-violet-200 bg-violet-50 text-violet-900",
};

const priorityTone: Record<ActionCard["priority"], string> = {
  High: "bg-rose-100 text-rose-800",
  Review: "bg-amber-100 text-amber-900",
  Monitor: "bg-slate-100 text-slate-700",
};

function formatCount(result: CountResult, fallback = "Review") {
  return result.available && result.value !== null
    ? result.value.toLocaleString()
    : fallback;
}

function numericCount(result: CountResult) {
  return result.available && result.value !== null ? result.value : 0;
}

async function safeCount(
  table: string,
  filters: CountFilter[] = [],
): Promise<CountResult> {
  try {
    let query = supabaseAdmin
      .from(table)
      .select("*", { count: "exact", head: true });

    for (const filter of filters) {
      if (filter.operator === "eq")
        query = query.eq(filter.column, filter.value);
      if (filter.operator === "neq")
        query = query.neq(filter.column, filter.value);
      if (filter.operator === "is")
        query = query.is(filter.column, filter.value);
      if (filter.operator === "in" && Array.isArray(filter.value))
        query = query.in(filter.column, filter.value);
      if (filter.operator === "gte")
        query = query.gte(filter.column, filter.value);
      if (filter.operator === "lte")
        query = query.lte(filter.column, filter.value);
    }

    const { count, error } = await query;
    if (error) return { value: null, available: false };
    return { value: count ?? 0, available: true };
  } catch {
    return { value: null, available: false };
  }
}

function MetricCardView({ card }: { card: MetricCard }) {
  const content = (
    <div
      className={`h-full rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClasses[card.tone || "slate"]}`}
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">
        {card.label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight">{card.value}</p>
      <p className="mt-2 text-sm font-semibold leading-6 opacity-75">
        {card.helper}
      </p>
    </div>
  );

  return card.href ? <Link href={card.href}>{content}</Link> : content;
}

function Section({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
            {title}
          </h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            {description}
          </p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default async function AdminOperationsDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const nowIso = new Date().toISOString();
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const [
    petParents,
    gurus,
    bookableGurus,
    pendingGurus,
    activeAmbassadors,
    unreadMessages,
    upcomingBookings,
    recentBookings,
    paymentOptionBookings,
    promoCreditBookings,
    tipBookings,
    payoutsReview,
    stripeIssues,
    pawPerksConflicts,
    totalReviews,
    publishedReviews,
    pendingReviewModeration,
  ] = await Promise.all([
    safeCount("profiles", [
      { column: "role", operator: "eq", value: "customer" },
    ]),
    safeCount("gurus"),
    safeCount("gurus", [{ column: "is_public", operator: "eq", value: true }]),
    safeCount("gurus", [
      {
        column: "application_status",
        operator: "in",
        value: [
          "new",
          "reviewing",
          "needs_info",
          "verification_pending",
          "pending",
        ],
      },
    ]),
    safeCount("ambassadors", [
      { column: "status", operator: "eq", value: "active" },
    ]),
    safeCount("messages", [
      { column: "is_read", operator: "eq", value: false },
      { column: "recipient_role", operator: "eq", value: "admin" },
    ]),
    safeCount("bookings", [
      { column: "start_time", operator: "gte", value: nowIso },
    ]),
    safeCount("bookings"),
    safeCount("bookings", [
      { column: "selected_payment_option", operator: "neq", value: "" },
    ]),
    safeCount("bookings", [
      { column: "promo_code", operator: "neq", value: "" },
    ]),
    safeCount("bookings", [
      { column: "tip_amount", operator: "gte", value: 0.01 },
    ]),
    safeCount("payouts", [
      {
        column: "status",
        operator: "in",
        value: ["pending", "review", "needs_review", "failed"],
      },
    ]),
    safeCount("gurus", [
      { column: "stripe_connect_ready", operator: "eq", value: false },
    ]),
    safeCount("referral_conflicts", [
      { column: "status", operator: "neq", value: "resolved" },
    ]),
    safeCount("booking_reviews"),
    safeCount("booking_reviews", [
      { column: "status", operator: "eq", value: "published" },
      { column: "is_public", operator: "eq", value: true },
    ]),
    safeCount("booking_reviews", [
      {
        column: "status",
        operator: "in",
        value: ["pending_review", "hidden", "removed"],
      },
    ]),
  ]);

  const attentionItems = [
    {
      label: "Pending Gurus",
      value: pendingGurus,
      href: "/admin/guru-approvals",
    },
    {
      label: "Unread Messages",
      value: unreadMessages,
      href: "/admin/messages",
    },
    {
      label: "Payouts Review",
      value: payoutsReview,
      href: "/admin/payouts",
    },
    {
      label: "Review Moderation",
      value: pendingReviewModeration,
      href: "/admin/reviews?status=moderation",
    },
    {
      label: "Stripe Gaps",
      value: stripeIssues,
      href: "/admin/financials/payment-gateway",
    },
    {
      label: "PawPerks Conflicts",
      value: pawPerksConflicts,
      href: "/admin/referrals",
    },
  ].filter((item) => numericCount(item.value) > 0 || !item.value.available);

  const needsAttentionCount = attentionItems.reduce(
    (sum, item) => sum + numericCount(item.value),
    0,
  );

  const peopleCards: MetricCard[] = [
    {
      label: "Pet Parents",
      value: formatCount(petParents, "Needs setup"),
      helper: "Customer accounts and lifecycle",
      href: "/admin/customers",
      tone: "emerald",
    },
    {
      label: "Gurus",
      value: formatCount(gurus, "Needs setup"),
      helper: `${formatCount(bookableGurus, "—")} bookable · ${formatCount(pendingGurus, "—")} pending`,
      href: "/admin/gurus",
      tone: "sky",
    },
    {
      label: "Ambassadors",
      value: formatCount(activeAmbassadors, "Needs setup"),
      helper: "Active ambassador growth network",
      href: "/admin/ambassadors",
      tone: "violet",
    },
    {
      label: "User Directory",
      value: "Open",
      helper: "Search, message, and moderate accounts",
      href: "/admin/users",
      tone: "slate",
    },
  ];

  const opsCards: MetricCard[] = [
    {
      label: "Unread Messages",
      value: formatCount(unreadMessages, "Review"),
      helper: "Support and operations threads",
      href: "/admin/messages",
      tone: "rose",
    },
    {
      label: "Upcoming Bookings",
      value: formatCount(
        upcomingBookings,
        formatCount(recentBookings, "Review"),
      ),
      helper: upcomingBookings.available
        ? "Scheduled from today forward"
        : "Recent booking queue",
      href: "/admin/bookings",
      tone: "sky",
    },
    {
      label: "Reviews",
      value: formatCount(totalReviews, "Review"),
      helper: `${formatCount(publishedReviews, "—")} public · ${formatCount(pendingReviewModeration, "—")} moderation`,
      href: "/admin/reviews",
      tone: "violet",
    },
    {
      label: "Payouts Needing Review",
      value: formatCount(payoutsReview, "Review"),
      helper: "Pending, failed, or review-needed payouts",
      href: "/admin/payouts",
      tone: "amber",
    },
    {
      label: "Payments / Credits",
      value: formatCount(paymentOptionBookings, "Review"),
      helper: `${formatCount(promoCreditBookings, "—")} promo · ${formatCount(tipBookings, "—")} tips`,
      href: "/admin/payments",
      tone: "emerald",
    },
    {
      label: "Stripe Readiness",
      value: formatCount(stripeIssues, "Review"),
      helper: "Gurus with payout readiness gaps",
      href: "/admin/financials/payment-gateway",
      tone: "rose",
    },
  ];

  const actions: ActionCard[] = [
    {
      title: "Review Guru Approvals",
      description: "Approve, request fixes, or send Checkr invites.",
      href: "/admin/guru-approvals",
      priority: "High",
    },
    {
      title: "Check messages",
      description: "Respond to unread admin, booking, and support threads.",
      href: "/admin/messages",
      priority: "High",
    },
    {
      title: "Check payouts",
      description: "Review Guru and partner payout queues before release.",
      href: "/admin/payouts",
      priority: "High",
    },
    {
      title: "Open Trust & Safety",
      description: "Background checks, readiness, disputes, and safety queues.",
      href: "/admin/background-checks",
      priority: "High",
    },
    {
      title: "Review Pet Parents",
      description: "Customer intelligence, lifecycle, and account cleanup.",
      href: "/admin/customers",
      priority: "Review",
    },
    {
      title: "Open User Directory",
      description: "Search accounts, start threads, and run moderation actions.",
      href: "/admin/users",
      priority: "Review",
    },
    {
      title: "Review ratings & reviews",
      description: "Monitor public trust signals and moderation items.",
      href: "/admin/reviews",
      priority: "Review",
    },
    {
      title: "Programs & growth",
      description: "Student, community, veterans pathways, and ambassador leads.",
      href: "/admin/programs",
      priority: "Monitor",
    },
  ];

  const quickLinkGroups = [
    {
      title: "People",
      links: [
        ["Pet Parents", "/admin/customers"],
        ["User Directory", "/admin/users"],
        ["Gurus", "/admin/gurus"],
        ["Guru Approvals", "/admin/guru-approvals"],
        ["Ambassadors", "/admin/ambassadors"],
        ["HR", "/admin/hr"],
      ],
    },
    {
      title: "Marketplace",
      links: [
        ["Bookings", "/admin/bookings"],
        ["Live Walks", "/admin/dashboard/live-walks"],
        ["Messages", "/admin/messages"],
        ["Reviews", "/admin/reviews"],
        ["Payments", "/admin/payments"],
      ],
    },
    {
      title: "Money",
      links: [
        ["Financials", "/admin/financials"],
        ["Payouts", "/admin/payouts"],
        ["Payment Gateway", "/admin/financials/payment-gateway"],
        ["Commissions", "/admin/commissions"],
        ["Partner Payouts", "/admin/partners/payouts"],
      ],
    },
    {
      title: "Growth",
      links: [
        ["Programs", "/admin/programs"],
        ["Referrals", "/admin/referrals"],
        ["Sales & Marketing", "/admin/sales-marketing"],
        ["Partners", "/admin/partners"],
        ["Analytics", "/admin/analytics"],
        ["SitGuru University", "/admin/university-progress"],
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="on-dark-surface overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-100">
                SitGuru Admin Portal · {todayLabel}
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] !text-white sm:text-5xl">
                Operations Dashboard
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-emerald-50 sm:text-base">
                Daily dashboard for marketplace operations, people queues,
                bookings, messages, reviews, payouts, readiness, Trust & Safety,
                and growth work.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:max-w-md">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-wide text-emerald-100">
                  Needs Attention
                </p>
                <p className="mt-1 text-3xl font-black text-white">
                  {needsAttentionCount.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-wide text-emerald-100">
                  Bookable Gurus
                </p>
                <p className="mt-1 text-3xl font-black text-white">
                  {formatCount(bookableGurus, "—")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/admin/guru-approvals"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 py-2 text-sm font-black text-emerald-950 transition hover:bg-emerald-50"
            >
              Guru Approvals
            </Link>
            <Link
              href="/admin/messages"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
            >
              Messages
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
            >
              User Directory
            </Link>
            <Link
              href="/admin/customers"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
            >
              Pet Parents
            </Link>
          </div>
        </div>

        {attentionItems.length > 0 ? (
          <Section
            title="Attention Queue"
            description="Queues with open work. Tap any card to jump straight into review."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {attentionItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-3xl border border-rose-100 bg-rose-50 p-4 transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-sm"
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-rose-950">
                    {formatCount(item.value, "Review")}
                  </p>
                  <p className="mt-2 text-sm font-black text-rose-700">
                    Open queue →
                  </p>
                </Link>
              ))}
            </div>
          </Section>
        ) : null}

        <Section
          title="People"
          description="Core SitGuru roles and the User Directory for search, messaging, and moderation."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {peopleCards.map((card) => (
              <MetricCardView key={card.label} card={card} />
            ))}
          </div>
        </Section>

        <Section
          title="Marketplace & Money"
          description="Bookings, messaging, reviews, payments, payouts, and Stripe readiness."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {opsCards.map((card) => (
              <MetricCardView key={card.label} card={card} />
            ))}
          </div>
        </Section>

        <Section
          title="Daily Actions"
          description="Start here for high-priority SitGuru operating tasks."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {actions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50"
              >
                <span
                  className={`inline-flex rounded-xl px-3 py-1 text-xs font-black ${priorityTone[action.priority]}`}
                >
                  {action.priority}
                </span>
                <h3 className="mt-4 text-lg font-black text-slate-950">
                  {action.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {action.description}
                </p>
                <p className="mt-4 text-sm font-black text-emerald-700">
                  Open →
                </p>
              </Link>
            ))}
          </div>
        </Section>

        <Section
          title="Trust & Safety / Readiness"
          description="Fast paths to verification, Stripe Connect, payout methods, profile completeness, and cleanup queues."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Guru verification", "/admin/guru-approvals"],
              ["Background checks", "/admin/background-checks"],
              ["Payment Gateway readiness", "/admin/financials/payment-gateway"],
              ["Payout method readiness", "/admin/payouts"],
              ["Profile completeness", "/admin/gurus?queue=profile-updates"],
              ["Review moderation", "/admin/reviews?status=moderation"],
              ["Disputes", "/admin/disputes"],
              ["Incomplete profiles", "/admin/incomplete-profiles"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="rounded-3xl border border-slate-200 bg-white p-5 text-sm font-black text-slate-900 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                {label}
                <span className="mt-3 block text-emerald-700">Review →</span>
              </Link>
            ))}
          </div>
        </Section>

        <Section
          title="Quick Links"
          description="Jump to detailed Admin areas without crowding the main dashboard."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {quickLinkGroups.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  {group.title}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.links.map(([label, href]) => (
                    <Link
                      key={href}
                      href={href}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-800 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}
