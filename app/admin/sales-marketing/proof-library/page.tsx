import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FolderHeart,
  ImageIcon,
  Lock,
  MessageSquareHeart,
  MessageSquareText,
  PawPrint,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/admin";

type StatusTone = "emerald" | "amber" | "blue" | "rose" | "slate" | "purple";

type ProofStatus =
  | "Collected"
  | "Needs Permission"
  | "Ready to Use"
  | "Used in Content"
  | "Needs CEO Review"
  | "Archived";

type ProofType =
  | "Testimonial"
  | "Screenshot"
  | "Pet Photo"
  | "Positive DM"
  | "Review"
  | "Guru Story"
  | "Booking Win"
  | "Partner Win";

type ProofItem = {
  id: string;
  title: string | null;
  proof_type: string | null;
  source: string | null;
  status: string | null;
  campaign_use: string | null;
  permission_status: string | null;
  suggested_use: string | null;
  ceo_review: string | null;
  notes: string | null;
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

type ProofRule = {
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

const statusToneMap: Record<ProofStatus, StatusTone> = {
  Collected: "blue",
  "Needs Permission": "amber",
  "Ready to Use": "emerald",
  "Used in Content": "purple",
  "Needs CEO Review": "rose",
  Archived: "slate",
};

const proofTypeToneMap: Record<ProofType, StatusTone> = {
  Testimonial: "emerald",
  Screenshot: "blue",
  "Pet Photo": "amber",
  "Positive DM": "purple",
  Review: "emerald",
  "Guru Story": "blue",
  "Booking Win": "rose",
  "Partner Win": "slate",
};

const proofRules: ProofRule[] = [
  {
    title: "Capture proof every week",
    description:
      "Danette should save useful screenshots, testimonials, reviews, pet photos, DMs, booking wins, and local feedback as they happen.",
    icon: Camera,
    tone: "emerald",
  },
  {
    title: "Confirm permission before public use",
    description:
      "Any customer, Guru, pet, message, or partner proof should be marked as approved before it appears in public marketing.",
    icon: ShieldCheck,
    tone: "amber",
  },
  {
    title: "Tag proof by campaign",
    description:
      "Each item should connect to a future use: launch content, trust-building, Guru signup, Pet Parent signup, Ambassador ads, or local outreach.",
    icon: Target,
    tone: "blue",
  },
  {
    title: "Turn proof into reusable assets",
    description:
      "Good proof should become captions, flyers, stories, reels, testimonials, FAQs, and future website sections.",
    icon: Sparkles,
    tone: "purple",
  },
];

function normalizeProofStatus(status: string | null | undefined): ProofStatus {
  const cleanStatus = (status || "Collected").trim();

  if (
    cleanStatus === "Collected" ||
    cleanStatus === "Needs Permission" ||
    cleanStatus === "Ready to Use" ||
    cleanStatus === "Used in Content" ||
    cleanStatus === "Needs CEO Review" ||
    cleanStatus === "Archived"
  ) {
    return cleanStatus;
  }

  if (cleanStatus === "Ready") return "Ready to Use";
  if (cleanStatus === "CEO Review") return "Needs CEO Review";

  return "Collected";
}

function normalizeProofType(proofType: string | null | undefined): ProofType {
  const cleanType = (proofType || "Testimonial").trim();

  if (
    cleanType === "Testimonial" ||
    cleanType === "Screenshot" ||
    cleanType === "Pet Photo" ||
    cleanType === "Positive DM" ||
    cleanType === "Review" ||
    cleanType === "Guru Story" ||
    cleanType === "Booking Win" ||
    cleanType === "Partner Win"
  ) {
    return cleanType;
  }

  return "Testimonial";
}

async function getProofItems(): Promise<ProofItem[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_marketing_proof_library")
    .select(
      [
        "id",
        "title",
        "proof_type",
        "source",
        "status",
        "campaign_use",
        "permission_status",
        "suggested_use",
        "ceo_review",
        "notes",
        "owner_name",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Sales & Marketing Proof Library fetch error:", error.message);
    return [];
  }

  return (data ?? []) as unknown as ProofItem[];
}

function buildStatCards(proofItems: ProofItem[]): StatCard[] {
  const readyToUse = proofItems.filter((item) => {
    const status = normalizeProofStatus(item.status);
    return status === "Ready to Use" || status === "Used in Content";
  }).length;

  const needsPermission = proofItems.filter((item) => {
    const status = normalizeProofStatus(item.status);
    return status === "Needs Permission";
  }).length;

  const needsCeoReview = proofItems.filter((item) => {
    const status = normalizeProofStatus(item.status);
    return status === "Needs CEO Review";
  }).length;

  return [
    {
      title: "Proof Items",
      value: String(proofItems.length),
      description:
        "Live Supabase count of testimonials, screenshots, photos, DMs, reviews, and proof records.",
      icon: FolderHeart,
      tone: "emerald",
    },
    {
      title: "Ready to Use",
      value: String(readyToUse),
      description:
        "Proof that can support posts, ads, flyers, landing pages, and trust-building content.",
      icon: CheckCircle2,
      tone: "blue",
    },
    {
      title: "Needs Permission",
      value: String(needsPermission),
      description:
        "Items that should not be used publicly until consent or approval is confirmed.",
      icon: Lock,
      tone: "amber",
    },
    {
      title: "Needs CEO Review",
      value: String(needsCeoReview),
      description:
        "Proof that needs Jason to confirm public use, wording, or campaign fit.",
      icon: ClipboardCheck,
      tone: "rose",
    },
  ];
}

function StatusBadge({ status }: { status: ProofStatus }) {
  const tone = statusToneMap[status];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${toneStyles[tone].pill}`}
    >
      {status}
    </span>
  );
}

function ProofTypeBadge({ proofType }: { proofType: ProofType }) {
  const tone = proofTypeToneMap[proofType];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${toneStyles[tone].pill}`}
    >
      {proofType}
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

function ProofIcon({ proofType }: { proofType: ProofType }) {
  if (proofType === "Testimonial") return Quote;
  if (proofType === "Screenshot") return ImageIcon;
  if (proofType === "Pet Photo") return PawPrint;
  if (proofType === "Positive DM") return MessageSquareHeart;
  if (proofType === "Review") return Star;
  if (proofType === "Guru Story") return Users;
  if (proofType === "Booking Win") return CheckCircle2;
  return FolderHeart;
}

export default async function SalesMarketingProofLibraryPage() {
  const proofItems = await getProofItems();
  const statCards = buildStatCards(proofItems);

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
                <FolderHeart className="h-4 w-4" aria-hidden="true" />
                Proof Library
              </div>

              <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Collect proof that makes SitGuru easier to trust and promote.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                This page is now reading live proof records from Supabase.
                Danette can organize testimonials, screenshots, reviews, pet photos,
                positive DMs, Guru stories, booking wins, and partner proof.
              </p>
            </div>

            <aside className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 lg:w-[22rem]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                    Proof goal
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-emerald-950">
                    Build trust
                  </h2>
                </div>
                <CardIcon icon={ShieldCheck} tone="emerald" />
              </div>

              <p className="mt-4 text-sm leading-6 text-emerald-900">
                Capture proof, confirm permission, connect it to a campaign, and
                reuse it in posts, stories, flyers, FAQs, ads, and website updates.
              </p>

              <div className="mt-5 rounded-2xl border border-emerald-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  Supabase status
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Connected · {proofItems.length} proof rows loaded
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
                Proof Rules
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                How Danette should handle proof
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Proof is only useful when it is organized, approved, and tied to a
                clear campaign or trust-building purpose.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {proofRules.map((item) => (
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
                  CEO Proof View
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
                      Public-use approval
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-emerald-900">
                      Confirm which proof can be shown publicly, which should be
                      paraphrased, and which should remain internal only.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-1 h-5 w-5 text-rose-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-extrabold text-rose-950">
                      Sensitive or unclear proof
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-rose-900">
                      Anything involving Pet Parents, Gurus, photos, messages,
                      reviews, or business names should be reviewed before public use.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-5 w-5 text-sky-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-extrabold text-sky-950">
                      Reusable marketing assets
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-sky-900">
                      Strong proof should be turned into future posts, flyers,
                      landing page sections, FAQs, ads, and story templates.
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
                Proof Item Log
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Live proof records
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                This is now a read-only live view of the proof library table. Next
                we can add safe Admin actions for adding proof, changing permission
                status, and marking items ready for public use.
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
            {proofItems.length > 0 ? (
              proofItems.map((item) => {
                const status = normalizeProofStatus(item.status);
                const proofType = normalizeProofType(item.proof_type);
                const Icon = ProofIcon({ proofType });

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
                            <ProofTypeBadge proofType={proofType} />
                          </div>

                          <h3 className="mt-3 text-xl font-extrabold text-slate-950">
                            {item.title || "Untitled proof item"}
                          </h3>

                          <p className="mt-1 text-sm font-bold text-emerald-800">
                            {item.campaign_use || "No campaign assigned"}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Owner: {item.owner_name || "Danette"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3 lg:min-w-[17rem]">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Source
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {item.source || "No source entered"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Suggested Use
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {item.suggested_use || "No suggested use entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                          Permission Status
                        </p>
                        <p className="mt-1 text-sm leading-6 text-amber-950">
                          {item.permission_status || "No permission status entered."}
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
                          Notes
                        </p>
                        <p className="mt-1 text-sm leading-6 text-sky-950">
                          {item.notes || "No notes entered yet."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white">
                        Future button: Mark Ready
                      </span>
                      <span className="inline-flex rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-800">
                        Future button: Needs Permission
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
                  No proof records found.
                </h3>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  The page is connected to Supabase, but there are no rows in
                  admin_marketing_proof_library yet.
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
                This page now reads from admin_marketing_proof_library. It does
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