import Link from "next/link";
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

function formatCount(result: CountResult, fallback = "Review") {
  return result.available && result.value !== null
    ? result.value.toLocaleString()
    : fallback;
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
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
            {title}
          </h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default async function AdminOperationsDashboard() {
  await createClient();

  const nowIso = new Date().toISOString();
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
      { column: "status", operator: "in", value: ["pending_review", "hidden", "removed"] },
    ]),
  ]);

  const summaryCards: MetricCard[] = [
    {
      label: "Total Pet Parents",
      value: formatCount(petParents, "Needs setup"),
      helper: "Registered Pet Parent accounts",
      href: "/admin/customers",
      tone: "emerald",
    },
    {
      label: "Total Gurus",
      value: formatCount(gurus, "Needs setup"),
      helper: "Guru records in the marketplace",
      href: "/admin/gurus",
      tone: "sky",
    },
    {
      label: "Bookable Gurus",
      value: formatCount(bookableGurus, "Review"),
      helper: "Gurus currently ready for public booking",
      href: "/admin/gurus?queue=bookable",
      tone: "emerald",
    },
    {
      label: "Pending Guru Reviews",
      value: formatCount(pendingGurus, "Review"),
      helper: "Applications or profiles needing Admin review",
      href: "/admin/gurus?queue=pending-reviews",
      tone: "amber",
    },
    {
      label: "Active Ambassadors",
      value: formatCount(activeAmbassadors, "Needs setup"),
      helper: "Ambassadors supporting growth",
      href: "/admin/ambassadors",
      tone: "violet",
    },
    {
      label: "Unread Admin Messages",
      value: formatCount(unreadMessages, "Review"),
      helper: "Open support and operations threads",
      href: "/admin/messages",
      tone: "rose",
    },
    {
      label: "Reviews",
      value: formatCount(totalReviews, "Review"),
      helper: "Booking reviews and public trust signals",
      href: "/admin/reviews",
      tone: "violet",
    },
    {
      label: "Review Moderation",
      value: formatCount(pendingReviewModeration, "Review"),
      helper: "Hidden, removed, or pending-review items",
      href: "/admin/reviews?status=moderation",
      tone: "amber",
    },
    {
      label: "Upcoming Bookings",
      value: formatCount(
        upcomingBookings,
        formatCount(recentBookings, "Review"),
      ),
      helper: upcomingBookings.available
        ? "Bookings scheduled from today forward"
        : "Recent booking queue",
      href: "/admin/bookings",
      tone: "slate",
    },
    {
      label: "Payment Options",
      value: formatCount(paymentOptionBookings, "Review"),
      helper: "Bookings with selected card, wallet, Link, saved method, ACH placeholder, or checkout choice",
      href: "/admin/payments",
      tone: "sky",
    },
    {
      label: "Credits / Promo",
      value: formatCount(promoCreditBookings, "Review"),
      helper: "Promo code, PawPerks, referral, gift card, or SitGuru credit review",
      href: "/admin/payments?focus=credits",
      tone: "violet",
    },
    {
      label: "Tips",
      value: formatCount(tipBookings, "Review"),
      helper: "Bookings with optional Guru tip amounts",
      href: "/admin/payments?focus=tips",
      tone: "emerald",
    },
    {
      label: "Payouts Needing Review",
      value: formatCount(payoutsReview, "Review"),
      helper: "Pending, failed, or review-needed payouts",
      href: "/admin/partners/payouts",
      tone: "amber",
    },
    {
      label: "Stripe Readiness Issues",
      value: formatCount(stripeIssues, "Review"),
      helper: "Gurus with payout readiness gaps",
      href: "/admin/financials/stripe",
      tone: "rose",
    },
    {
      label: "PawPerks Conflicts",
      value: formatCount(pawPerksConflicts, "Review"),
      helper: "Referral conflicts or cleanup items",
      href: "/admin/referrals",
      tone: "violet",
    },
  ];

  const actions: ActionCard[] = [
    {
      title: "Review pending Gurus",
      description: "Approve, request fixes, or verify Guru applications.",
      href: "/admin/gurus?queue=pending-reviews",
      priority: "High",
    },
    {
      title: "Review Pet Parent accounts",
      description: "Find Pet Parents needing account attention or cleanup.",
      href: "/admin/customers",
      priority: "Review",
    },
    {
      title: "Check messages",
      description:
        "Respond to unread Admin, booking, support, and partner messages.",
      href: "/admin/messages",
      priority: "High",
    },
    {
      title: "Review ratings and reviews",
      description:
        "Monitor Guru reviews, public/private status, ratings, and would-book-again feedback.",
      href: "/admin/reviews",
      priority: "Review",
    },
    {
      title: "Check payouts",
      description: "Review partner and Guru payout queues before release.",
      href: "/admin/partners/payouts",
      priority: "High",
    },
    {
      title: "Review payment options",
      description: "Audit checkout method, PawPerks/referral credit, promo codes, gift card/SitGuru credit, and Guru tips from desktop and mobile booking flows.",
      href: "/admin/payments",
      priority: "Review",
    },
    {
      title: "Check Stripe readiness",
      description: "Audit Stripe Connect and payout readiness gaps.",
      href: "/admin/financials/stripe",
      priority: "Review",
    },
    {
      title: "Review PawPerks conflicts",
      description:
        "Resolve referral inventory, conflicts, and attribution issues.",
      href: "/admin/referrals",
      priority: "Review",
    },
    {
      title: "Open Growth & Referrals",
      description:
        "Monitor referrals, ambassadors, campaigns, and marketing leads.",
      href: "/admin/sales-marketing",
      priority: "Monitor",
    },
    {
      title: "Open Trust & Safety",
      description: "Review readiness, disputes, fraud, and safety queues.",
      href: "/admin/trust-safety",
      priority: "High",
    },
  ];

  const quickLinks = [
    ["Pet Parents", "/admin/customers"],
    ["Gurus", "/admin/gurus"],
    ["Ambassadors", "/admin/ambassadors"],
    ["Bookings", "/admin/bookings"],
    ["Reviews", "/admin/reviews"],
    ["Messages", "/admin/messages"],
    ["Financials", "/admin/financials"],
    ["Payments", "/admin/payments"],
    ["Partner Payouts", "/admin/partners/payouts"],
    ["Referrals", "/admin/referrals"],
    ["Referral Inventory", "/admin/referrals/inventory"],
    ["Trust & Safety", "/admin/trust-safety"],
    ["Analytics", "/admin/analytics"],
    ["Sales & Marketing", "/admin/sales-marketing"],
    ["HR", "/admin/hr"],
    ["SitGuru University", "/admin/university-progress"],
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
          <p
            className="text-xs font-black uppercase tracking-[0.24em] text-emerald-100"
            style={{ color: "#ecfdf5", WebkitTextFillColor: "#ecfdf5" }}
          >
            Admin Control
          </p>
          <h1
            className="mt-3 text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl"
            style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
          >
            SitGuru Operations Dashboard
          </h1>
          <p
            className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-emerald-50 sm:text-base"
            style={{ color: "#ecfdf5", WebkitTextFillColor: "#ecfdf5" }}
          >
            Daily command center for marketplace operations, people queues,
            bookings, messages, reviews, payouts, readiness, Trust & Safety, and growth
            work.
          </p>
        </div>

        <Section
          title="Top Operations Summary"
          description="The highest-signal operating metrics and review queues for today."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {summaryCards.map((card) => (
              <MetricCardView key={card.label} card={card} />
            ))}
          </div>
        </Section>

        <Section
          title="Daily Action Center"
          description="Start here for high-priority SitGuru operating tasks."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {actions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50"
              >
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-800 shadow-sm">
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

        <div className="grid gap-6 xl:grid-cols-2">
          <Section
            title="Business Health Snapshot"
            description="Simple readout for bookings, revenue-adjacent queues, payouts, referrals, and growth."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCardView
                card={{
                  label: "Bookings",
                  value: formatCount(
                    upcomingBookings,
                    formatCount(recentBookings, "Review"),
                  ),
                  helper: "Upcoming or recent booking activity",
                  href: "/admin/bookings",
                  tone: "sky",
                }}
              />
              <MetricCardView
                card={{
                  label: "Public Reviews",
                  value: formatCount(publishedReviews, "Review"),
                  helper: "Published public reviews shown as trust signals",
                  href: "/admin/reviews",
                  tone: "violet",
                }}
              />
              <MetricCardView
                card={{
                  label: "Revenue / Spend",
                  value: "Review",
                  helper:
                    "Open Financials for detailed revenue, ledger, and spend reporting",
                  href: "/admin/financials",
                  tone: "emerald",
                }}
              />
              <MetricCardView
                card={{
                  label: "Guru Payout Status",
                  value: formatCount(payoutsReview, "Review"),
                  helper: "Payouts pending review or remediation",
                  href: "/admin/financials/payouts",
                  tone: "amber",
                }}
              />
              <MetricCardView
                card={{
                  label: "Referral / PawPerks",
                  value: formatCount(pawPerksConflicts, "Review"),
                  helper: "Referral activity and conflicts",
                  href: "/admin/referrals",
                  tone: "violet",
                }}
              />
            </div>
          </Section>

          <Section
            title="People & Roles Overview"
            description="Grouped navigation for the core SitGuru roles Admin manages."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCardView
                card={{
                  label: "Pet Parents",
                  value: formatCount(petParents, "Open"),
                  helper: "Customer accounts and lifecycle",
                  href: "/admin/customers",
                  tone: "emerald",
                }}
              />
              <MetricCardView
                card={{
                  label: "Gurus",
                  value: formatCount(gurus, "Open"),
                  helper: "Guru records, onboarding, and readiness",
                  href: "/admin/gurus",
                  tone: "sky",
                }}
              />
              <MetricCardView
                card={{
                  label: "Ambassadors",
                  value: formatCount(activeAmbassadors, "Open"),
                  helper: "Ambassador programs and partner growth",
                  href: "/admin/ambassadors",
                  tone: "violet",
                }}
              />
              <MetricCardView
                card={{
                  label: "Admin / Super Users",
                  value: "Review",
                  helper: "User permissions, security, and Admin accounts",
                  href: "/admin/users",
                  tone: "slate",
                }}
              />
            </div>
          </Section>
        </div>

        <Section
          title="Trust & Safety / Readiness"
          description="Fast paths to verification, Stripe Connect, payout methods, profile completeness, and cleanup queues."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Guru verification", "/admin/gurus?queue=pending-reviews"],
              ["Stripe Connect readiness", "/admin/financials/stripe"],
              ["Payout method readiness", "/admin/partners/payouts"],
              ["Profile completeness", "/admin/gurus?queue=profile-updates"],
              ["Review moderation", "/admin/reviews?status=moderation"],
              ["Admin cleanup queues", "/admin/trust-safety"],
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
          description="Jump directly to the detailed Admin areas without crowding the main dashboard."
        >
          <div className="flex flex-wrap gap-3">
            {quickLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {label}
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}
