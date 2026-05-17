import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gift,
  Handshake,
  Megaphone,
  MessageSquareText,
  PawPrint,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/admin";

type StatusTone = "emerald" | "amber" | "blue" | "rose" | "slate" | "purple";

type CampaignStatus =
  | "Planning"
  | "Drafting"
  | "Active"
  | "Paused"
  | "Needs Asset"
  | "Needs CEO Review"
  | "Completed";

type CampaignAudience =
  | "Pet Parents"
  | "Gurus"
  | "Ambassadors"
  | "Groomers"
  | "Trainers"
  | "Vet Techs"
  | "Local Partners"
  | "Friends & Family"
  | "Mixed";

type CampaignItem = {
  id: string;
  name: string | null;
  audience: string | null;
  status: string | null;
  goal: string | null;
  primary_cta: string | null;
  landing_page: string | null;
  content_needed: string | null;
  outreach_tie_in: string | null;
  proof_needed: string | null;
  ceo_decision: string | null;
  success_signal: string | null;
  owner_name: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type StatCard = {
  title: string;
  value: string;
  description: string;
  icon: typeof ClipboardCheck;
  tone: StatusTone;
};

type CampaignRule = {
  title: string;
  description: string;
  icon: typeof ClipboardCheck;
  tone: StatusTone;
};

const toneStyles: Record<
  StatusTone,
  {
    card: string;
    icon: string;
    pill: string;
    text: string;
    border: string;
  }
> = {
  emerald: {
    card: "border-emerald-200 bg-emerald-50",
    icon: "bg-emerald-600 text-white",
    pill: "bg-emerald-100 text-emerald-800",
    text: "text-emerald-800",
    border: "border-emerald-200",
  },
  amber: {
    card: "border-amber-200 bg-amber-50",
    icon: "bg-amber-500 text-white",
    pill: "bg-amber-100 text-amber-800",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  blue: {
    card: "border-sky-200 bg-sky-50",
    icon: "bg-sky-600 text-white",
    pill: "bg-sky-100 text-sky-800",
    text: "text-sky-800",
    border: "border-sky-200",
  },
  rose: {
    card: "border-rose-200 bg-rose-50",
    icon: "bg-rose-600 text-white",
    pill: "bg-rose-100 text-rose-800",
    text: "text-rose-800",
    border: "border-rose-200",
  },
  slate: {
    card: "border-slate-200 bg-slate-50",
    icon: "bg-slate-700 text-white",
    pill: "bg-slate-100 text-slate-700",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  purple: {
    card: "border-violet-200 bg-violet-50",
    icon: "bg-violet-600 text-white",
    pill: "bg-violet-100 text-violet-800",
    text: "text-violet-800",
    border: "border-violet-200",
  },
};

const statusToneMap: Record<CampaignStatus, StatusTone> = {
  Planning: "slate",
  Drafting: "blue",
  Active: "emerald",
  Paused: "amber",
  "Needs Asset": "amber",
  "Needs CEO Review": "rose",
  Completed: "purple",
};

const audienceToneMap: Record<CampaignAudience, StatusTone> = {
  "Pet Parents": "emerald",
  Gurus: "blue",
  Ambassadors: "purple",
  Groomers: "amber",
  Trainers: "blue",
  "Vet Techs": "rose",
  "Local Partners": "slate",
  "Friends & Family": "emerald",
  Mixed: "purple",
};

const campaignRules: CampaignRule[] = [
  {
    title: "One campaign, one primary action",
    description:
      "Each campaign should make the next step obvious: sign up, apply, join the Ambassador Program, book care, refer someone, or visit SitGuru.com.",
    icon: Target,
    tone: "emerald",
  },
  {
    title: "Tie content to outreach",
    description:
      "Campaigns should connect posts, DMs, flyers, local conversations, and follow-ups so Danette is not working from scattered ideas.",
    icon: Handshake,
    tone: "blue",
  },
  {
    title: "Use proof as soon as it is approved",
    description:
      "Testimonials, screenshots, pet photos, reviews, and partner wins should support campaigns once permission and CEO review are complete.",
    icon: ShieldCheck,
    tone: "purple",
  },
  {
    title: "Review performance weekly",
    description:
      "Friday reviews should identify which campaign messages are producing comments, DMs, applications, referrals, signups, or bookings.",
    icon: BarChart3,
    tone: "amber",
  },
];

function normalizeCampaignStatus(status: string | null | undefined): CampaignStatus {
  const cleanStatus = (status || "Planning").trim();

  if (
    cleanStatus === "Planning" ||
    cleanStatus === "Drafting" ||
    cleanStatus === "Active" ||
    cleanStatus === "Paused" ||
    cleanStatus === "Needs Asset" ||
    cleanStatus === "Needs CEO Review" ||
    cleanStatus === "Completed"
  ) {
    return cleanStatus;
  }

  if (cleanStatus === "CEO Review") return "Needs CEO Review";
  if (cleanStatus === "Needs Assets") return "Needs Asset";

  return "Planning";
}

function normalizeCampaignAudience(
  audience: string | null | undefined,
): CampaignAudience {
  const cleanAudience = (audience || "Mixed").trim();

  if (
    cleanAudience === "Pet Parents" ||
    cleanAudience === "Gurus" ||
    cleanAudience === "Ambassadors" ||
    cleanAudience === "Groomers" ||
    cleanAudience === "Trainers" ||
    cleanAudience === "Vet Techs" ||
    cleanAudience === "Local Partners" ||
    cleanAudience === "Friends & Family" ||
    cleanAudience === "Mixed"
  ) {
    return cleanAudience;
  }

  return "Mixed";
}

async function getCampaigns(): Promise<CampaignItem[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_marketing_campaigns")
    .select(
      [
        "id",
        "name",
        "audience",
        "status",
        "goal",
        "primary_cta",
        "landing_page",
        "content_needed",
        "outreach_tie_in",
        "proof_needed",
        "ceo_decision",
        "success_signal",
        "owner_name",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Sales & Marketing Campaigns fetch error:", error.message);
    return [];
  }

  return (data ?? []) as unknown as CampaignItem[];
}

function buildStatCards(campaigns: CampaignItem[]): StatCard[] {
  const activeCampaigns = campaigns.filter((campaign) => {
    const status = normalizeCampaignStatus(campaign.status);
    return status === "Active";
  }).length;

  const needsCeoReview = campaigns.filter((campaign) => {
    const status = normalizeCampaignStatus(campaign.status);
    return status === "Needs CEO Review" || Boolean(campaign.ceo_decision);
  }).length;

  const needsAsset = campaigns.filter((campaign) => {
    const status = normalizeCampaignStatus(campaign.status);
    return status === "Needs Asset" || Boolean(campaign.content_needed);
  }).length;

  return [
    {
      title: "Campaigns",
      value: String(campaigns.length),
      description:
        "Live Supabase count of launch, Pet Parent, Guru, Ambassador, PawPerks, local, and seasonal campaigns.",
      icon: Megaphone,
      tone: "emerald",
    },
    {
      title: "Active",
      value: String(activeCampaigns),
      description:
        "Campaigns currently supporting launch, local awareness, signups, outreach, or referrals.",
      icon: Rocket,
      tone: "blue",
    },
    {
      title: "Needs CEO Review",
      value: String(needsCeoReview),
      description:
        "Campaigns that need Jason’s decision, approval, positioning, or final CTA confirmation.",
      icon: ClipboardCheck,
      tone: "rose",
    },
    {
      title: "Needs Content / Assets",
      value: String(needsAsset),
      description:
        "Campaigns waiting on posts, visuals, flyers, proof, screenshots, or ad creative.",
      icon: FileText,
      tone: "amber",
    },
  ];
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  const tone = statusToneMap[status];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${toneStyles[tone].pill}`}
    >
      {status}
    </span>
  );
}

function AudienceBadge({ audience }: { audience: CampaignAudience }) {
  const tone = audienceToneMap[audience];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${toneStyles[tone].pill}`}
    >
      {audience}
    </span>
  );
}

function CardIcon({
  icon: Icon,
  tone,
}: {
  icon: typeof ClipboardCheck;
  tone: StatusTone;
}) {
  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${toneStyles[tone].icon}`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </div>
  );
}

function CampaignIcon({ audience }: { audience: CampaignAudience }) {
  if (audience === "Pet Parents") return PawPrint;
  if (audience === "Gurus") return Users;
  if (audience === "Ambassadors") return Handshake;
  if (audience === "Groomers") return Sparkles;
  if (audience === "Trainers") return Target;
  if (audience === "Vet Techs") return ShieldCheck;
  if (audience === "Friends & Family") return Gift;
  if (audience === "Local Partners") return Handshake;
  return Megaphone;
}

export default async function SalesMarketingCampaignsPage() {
  const campaigns = await getCampaigns();
  const statCards = buildStatCards(campaigns);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/admin/sales-marketing"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Sales & Marketing
              </Link>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                <Megaphone className="h-4 w-4" aria-hidden="true" />
                Campaigns
              </div>

              <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Organize SitGuru marketing campaigns from launch to growth.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                This page is now reading live campaign records from Supabase.
                Danette can organize launch, Pet Parent signup, Guru signup,
                Ambassador, PawPerks, local awareness, outreach, and seasonal
                campaigns in one place.
              </p>
            </div>

            <aside className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 lg:w-[22rem]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                    Campaign goal
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-emerald-950">
                    Drive action
                  </h2>
                </div>
                <CardIcon icon={Rocket} tone="emerald" />
              </div>

              <p className="mt-4 text-sm leading-6 text-emerald-900">
                Each campaign should clearly connect audience, message, landing
                page, content, outreach, proof, CEO decisions, and success signals.
              </p>

              <div className="mt-5 rounded-2xl border border-emerald-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  Supabase status
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Connected · {campaigns.length} campaign rows loaded
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <article
              key={card.title}
              className={`rounded-[1.5rem] border p-5 shadow-sm ${toneStyles[card.tone].card}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">{card.title}</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-950">
                    {card.value}
                  </p>
                </div>
                <CardIcon icon={card.icon} tone={card.tone} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Campaign Rules
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                How Danette should manage campaigns
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Campaigns should be practical, trackable, and connected to real
                outcomes like signups, applications, referrals, and bookings.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {campaignRules.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-2xl border p-4 ${toneStyles[item.tone].card}`}
                >
                  <div className="flex items-start gap-3">
                    <CardIcon icon={item.icon} tone={item.tone} />
                    <div>
                      <h3 className="font-extrabold text-slate-950">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                  CEO Campaign View
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                  What Jason should review
                </h2>
              </div>

              <Link
                href="/admin/sales-marketing/ceo-review"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
              >
                CEO Review
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-1 h-5 w-5 text-emerald-700"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-extrabold text-emerald-950">
                      Approve campaign direction
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-emerald-900">
                      Confirm the audience, call-to-action, landing page, and
                      campaign priority before Danette pushes the campaign.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-1 h-5 w-5 text-rose-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-extrabold text-rose-950">
                      Clear campaign blockers
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-rose-900">
                      Some campaigns may wait on ad creative, proof permission,
                      landing-page clarity, referral rules, or business decisions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="mt-1 h-5 w-5 text-sky-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-extrabold text-sky-950">
                      Watch success signals
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-sky-900">
                      Strong campaigns should create signups, applications,
                      referrals, DMs, local shares, bookings, or warm follow-ups.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Campaign Log
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Live campaign records
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                This is now a read-only live view of the campaigns table. Next we
                can add safe Admin actions for adding campaigns, changing statuses,
                attaching content, tracking proof, and flagging CEO decisions.
              </p>
            </div>

            <Link
              href="/admin/sales-marketing/content"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              Content Planner
              <FileText className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {campaigns.length > 0 ? (
              campaigns.map((campaign) => {
                const status = normalizeCampaignStatus(campaign.status);
                const audience = normalizeCampaignAudience(campaign.audience);
                const Icon = CampaignIcon({ audience });

                return (
                  <article
                    key={campaign.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={status} />
                            <AudienceBadge audience={audience} />
                          </div>

                          <h3 className="mt-3 text-xl font-extrabold text-slate-950">
                            {campaign.name || "Untitled campaign"}
                          </h3>

                          <p className="mt-1 text-sm font-bold text-emerald-800">
                            {campaign.primary_cta || "No primary CTA entered"}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Owner: {campaign.owner_name || "Danette"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3 lg:min-w-[17rem]">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Landing Page
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                          {campaign.landing_page || "No landing page entered"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Goal
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {campaign.goal || "No campaign goal entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Content Needed
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {campaign.content_needed || "No content needs entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                          Outreach Tie-In
                        </p>
                        <p className="mt-1 text-sm leading-6 text-sky-950">
                          {campaign.outreach_tie_in || "No outreach tie-in entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                          Proof Needed
                        </p>
                        <p className="mt-1 text-sm leading-6 text-violet-950">
                          {campaign.proof_needed || "No proof needs entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                          CEO Decision
                        </p>
                        <p className="mt-1 text-sm leading-6 text-rose-950">
                          {campaign.ceo_decision || "No CEO decision entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                          Success Signal
                        </p>
                        <p className="mt-1 text-sm leading-6 text-emerald-950">
                          {campaign.success_signal || "No success signal entered yet."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white">
                        Future button: Mark Active
                      </span>
                      <span className="inline-flex rounded-full bg-violet-100 px-4 py-2 text-xs font-bold text-violet-800">
                        Future button: Add Content
                      </span>
                      <span className="inline-flex rounded-full bg-rose-100 px-4 py-2 text-xs font-bold text-rose-800">
                        Future button: Needs CEO Review
                      </span>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="font-extrabold text-amber-950">
                  No campaign records found.
                </h3>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  The page is connected to Supabase, but there are no rows in
                  admin_marketing_campaigns yet.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <MessageSquareText className="mt-1 h-5 w-5 text-emerald-700" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">
                Supabase Wiring Note
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This page now reads from admin_marketing_campaigns. It does not
                write to Supabase yet and does not affect public pages, customer
                flows, Guru flows, auth, bookings, payments, or financial logic.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}