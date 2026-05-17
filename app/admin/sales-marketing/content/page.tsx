import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ImageIcon,
  Images,
  Lightbulb,
  Megaphone,
  MessageSquareText,
  Palette,
  PawPrint,
  Send,
  Share2,
  Target,
  Users,
  Video,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/admin";

type StatusTone = "emerald" | "amber" | "blue" | "rose" | "slate" | "purple";

type ContentStatus =
  | "Idea"
  | "Draft"
  | "Needs Asset"
  | "Ready"
  | "Scheduled"
  | "Posted"
  | "Needs CEO Review"
  | "Needs Follow-Up";

type ContentPlatform =
  | "Facebook"
  | "Instagram"
  | "Stories"
  | "Reels"
  | "Local Group"
  | "Flyer"
  | "Email"
  | "Website";

type ContentAudience =
  | "Pet Parents"
  | "Gurus"
  | "Ambassadors"
  | "Groomers"
  | "Trainers"
  | "Vet Techs"
  | "Local Partners"
  | "Friends & Family"
  | "Mixed";

type ContentItem = {
  id: string;
  title: string | null;
  platform: string | null;
  audience: string | null;
  campaign: string | null;
  status: string | null;
  planned_date: string | null;
  asset_needed: string | null;
  caption_direction: string | null;
  ceo_review: string | null;
  performance_note: string | null;
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

type ContentPlay = {
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

const statusToneMap: Record<ContentStatus, StatusTone> = {
  Idea: "slate",
  Draft: "blue",
  "Needs Asset": "amber",
  Ready: "emerald",
  Scheduled: "purple",
  Posted: "emerald",
  "Needs CEO Review": "rose",
  "Needs Follow-Up": "rose",
};

const platformToneMap: Record<ContentPlatform, StatusTone> = {
  Facebook: "blue",
  Instagram: "purple",
  Stories: "amber",
  Reels: "rose",
  "Local Group": "emerald",
  Flyer: "slate",
  Email: "blue",
  Website: "emerald",
};

const audienceToneMap: Record<ContentAudience, StatusTone> = {
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

const contentPlays: ContentPlay[] = [
  {
    title: "Keep every post tied to a goal",
    description:
      "Each post should push a clear action: sign up, apply as a Guru, join the Ambassador Program, book care, refer someone, or visit SitGuru.com.",
    icon: Target,
    tone: "emerald",
  },
  {
    title: "Use SitGuru-specific visuals",
    description:
      "Prioritize SitGuru logos, avatars, pet photos, screenshots, and brand colors so the content feels ownable and recognizable.",
    icon: Palette,
    tone: "purple",
  },
  {
    title: "Create by audience",
    description:
      "Separate content for Pet Parents, Gurus, Ambassadors, groomers, trainers, vet techs, local partners, and friends/family.",
    icon: Users,
    tone: "blue",
  },
  {
    title: "Capture questions as future posts",
    description:
      "Questions from DMs, comments, outreach, and signup conversations should become FAQs, captions, reels, and website copy improvements.",
    icon: MessageSquareText,
    tone: "amber",
  },
];

function normalizeContentStatus(status: string | null | undefined): ContentStatus {
  const cleanStatus = (status || "Idea").trim();

  if (
    cleanStatus === "Idea" ||
    cleanStatus === "Draft" ||
    cleanStatus === "Needs Asset" ||
    cleanStatus === "Ready" ||
    cleanStatus === "Scheduled" ||
    cleanStatus === "Posted" ||
    cleanStatus === "Needs CEO Review" ||
    cleanStatus === "Needs Follow-Up"
  ) {
    return cleanStatus;
  }

  if (cleanStatus === "CEO Review") return "Needs CEO Review";
  if (cleanStatus === "Needs Follow Up") return "Needs Follow-Up";

  return "Idea";
}

function normalizeContentPlatform(platform: string | null | undefined): ContentPlatform {
  const cleanPlatform = (platform || "Website").trim();

  if (
    cleanPlatform === "Facebook" ||
    cleanPlatform === "Instagram" ||
    cleanPlatform === "Stories" ||
    cleanPlatform === "Reels" ||
    cleanPlatform === "Local Group" ||
    cleanPlatform === "Flyer" ||
    cleanPlatform === "Email" ||
    cleanPlatform === "Website"
  ) {
    return cleanPlatform;
  }

  return "Website";
}

function normalizeContentAudience(audience: string | null | undefined): ContentAudience {
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

function formatDate(dateValue: string | null | undefined) {
  if (!dateValue) return "Not scheduled";

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function getContentItems(): Promise<ContentItem[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_marketing_content_calendar")
    .select(
      [
        "id",
        "title",
        "platform",
        "audience",
        "campaign",
        "status",
        "planned_date",
        "asset_needed",
        "caption_direction",
        "ceo_review",
        "performance_note",
        "owner_name",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .order("planned_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Sales & Marketing Content Planner fetch error:", error.message);
    return [];
  }

  return (data ?? []) as unknown as ContentItem[];
}

function buildStatCards(contentItems: ContentItem[]): StatCard[] {
  const needsCeoReview = contentItems.filter((item) => {
    const status = normalizeContentStatus(item.status);
    return status === "Needs CEO Review";
  }).length;

  const readyOrScheduled = contentItems.filter((item) => {
    const status = normalizeContentStatus(item.status);
    return status === "Ready" || status === "Scheduled";
  }).length;

  const needsAsset = contentItems.filter((item) => {
    const status = normalizeContentStatus(item.status);
    return status === "Needs Asset" || Boolean(item.asset_needed);
  }).length;

  return [
    {
      title: "Content Items",
      value: String(contentItems.length),
      description: "Live Supabase count of planned posts, ads, captions, and content assets.",
      icon: FileText,
      tone: "emerald",
    },
    {
      title: "Needs CEO Review",
      value: String(needsCeoReview),
      description: "Posts or captions that should be approved before publishing.",
      icon: ClipboardCheck,
      tone: "rose",
    },
    {
      title: "Ready / Scheduled",
      value: String(readyOrScheduled),
      description: "Content that can be posted, scheduled, or reused in campaign pushes.",
      icon: CalendarCheck,
      tone: "purple",
    },
    {
      title: "Needs Asset",
      value: String(needsAsset),
      description: "Posts waiting on logos, avatars, dog images, screenshots, or final creatives.",
      icon: ImageIcon,
      tone: "amber",
    },
  ];
}

function StatusBadge({ status }: { status: ContentStatus }) {
  const tone = statusToneMap[status];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${toneStyles[tone].pill}`}
    >
      {status}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: ContentPlatform }) {
  const tone = platformToneMap[platform];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${toneStyles[tone].pill}`}
    >
      {platform}
    </span>
  );
}

function AudienceBadge({ audience }: { audience: ContentAudience }) {
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

function PlatformIcon({ platform }: { platform: ContentPlatform }) {
  if (platform === "Facebook") return Share2;
  if (platform === "Instagram") return Images;
  if (platform === "Reels") return Video;
  if (platform === "Stories") return Camera;
  if (platform === "Flyer") return FileText;
  if (platform === "Email") return Send;
  return Megaphone;
}

export default async function SalesMarketingContentPage() {
  const contentItems = await getContentItems();
  const statCards = buildStatCards(contentItems);

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
                Content Planner
              </div>

              <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Plan SitGuru posts, ads, captions, and campaign content.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                This page is now reading live content records from Supabase.
                Danette can organize Facebook posts, Instagram posts, reels,
                stories, Ambassador ads, Guru signup content, Pet Parent signup
                content, campaign captions, and CEO review notes.
              </p>
            </div>

            <aside className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 lg:w-[22rem]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                    Content goal
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-emerald-950">
                    Clear action
                  </h2>
                </div>
                <CardIcon icon={Target} tone="emerald" />
              </div>

              <p className="mt-4 text-sm leading-6 text-emerald-900">
                Every post should make the next step obvious: sign up, apply,
                join as an Ambassador, book care, refer someone, or visit SitGuru.com.
              </p>

              <div className="mt-5 rounded-2xl border border-emerald-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  Supabase status
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Connected · {contentItems.length} content rows loaded
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
                Content Rules
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                How Danette should plan content
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Content should feel local, trustworthy, SitGuru-specific, and tied
                to a clear business goal.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {contentPlays.map((item) => (
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
                  CEO Content View
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
                      Content ready to publish
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-emerald-900">
                      Confirm the CTA, audience, landing page, and visuals before
                      Danette posts important campaign content.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-1 h-5 w-5 text-rose-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-extrabold text-rose-950">
                      Assets or approval needed
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-rose-900">
                      Some content may wait on SitGuru logos, avatars, pet photos,
                      approved screenshots, ad creative, or final wording.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="mt-1 h-5 w-5 text-sky-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-extrabold text-sky-950">
                      Turn questions into content
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-sky-900">
                      Repeated questions about trust, booking, pricing, Gurus,
                      service areas, and applications should become future posts.
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
                Content Calendar
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Live Supabase content records
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                This is a read-only live view of the content calendar table. Next
                we can add safe Admin actions for adding content, changing status,
                assigning CEO review, and marking posts ready.
              </p>
            </div>

            <Link
              href="/admin/sales-marketing/proof-library"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              Proof Library
              <PawPrint className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {contentItems.length > 0 ? (
              contentItems.map((item) => {
                const status = normalizeContentStatus(item.status);
                const platform = normalizeContentPlatform(item.platform);
                const audience = normalizeContentAudience(item.audience);
                const Icon = PlatformIcon({ platform });

                return (
                  <article
                    key={item.id}
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
                            <PlatformBadge platform={platform} />
                            <AudienceBadge audience={audience} />
                          </div>

                          <h3 className="mt-3 text-xl font-extrabold text-slate-950">
                            {item.title || "Untitled content item"}
                          </h3>

                          <p className="mt-1 text-sm font-bold text-emerald-800">
                            {item.campaign || "No campaign assigned"}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Owner: {item.owner_name || "Danette"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3 lg:min-w-[17rem]">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Planned Date
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatDate(item.planned_date)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Caption Direction
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {item.caption_direction || "No caption direction entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                          Asset Needed
                        </p>
                        <p className="mt-1 text-sm leading-6 text-amber-950">
                          {item.asset_needed || "No asset requirement entered."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                          CEO Review
                        </p>
                        <p className="mt-1 text-sm leading-6 text-rose-950">
                          {item.ceo_review || "No CEO review note entered."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                          Performance Note
                        </p>
                        <p className="mt-1 text-sm leading-6 text-sky-950">
                          {item.performance_note || "No performance note entered yet."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white">
                        Future button: Mark Ready
                      </span>
                      <span className="inline-flex rounded-full bg-violet-100 px-4 py-2 text-xs font-bold text-violet-800">
                        Future button: Schedule
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
                  No content records found.
                </h3>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  The page is connected to Supabase, but there are no rows in
                  admin_marketing_content_calendar yet.
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
                This page now reads from admin_marketing_content_calendar. It does
                not write to Supabase yet and does not affect public pages, customer
                flows, Guru flows, auth, bookings, payments, or financial logic.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}