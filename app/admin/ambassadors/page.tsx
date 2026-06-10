import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  Archive,
  Award,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  HandCoins,
  MessageCircle,
  PauseCircle,
  PawPrint,
  PlayCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type AmbassadorSummaryRow = {
  ambassador_id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  program: string | null;
  internal_role: string | null;
  source: string | null;
  status: string | null;
  referral_code: string | null;
  referral_link: string | null;
  city: string | null;
  state: string | null;
  county: string | null;
  country: string | null;
  training_status: string | null;
  training_percent: number | null;
  created_at: string | null;
  pet_parent_signups: number | null;
  guru_signups: number | null;
  business_signups: number | null;
  completed_bookings: number | null;
  pending_rewards: number | null;
  approved_rewards: number | null;
  ready_for_payout_rewards: number | null;
  paid_rewards: number | null;
  total_earned: number | null;
  total_paid: number | null;
  ambassador_photo_url?: string | null;
  ambassador_photo_path?: string | null;
  photo_approved?: boolean | null;
  photo_uploaded_at?: string | null;
  archived_at?: string | null;
  archived_reason?: string | null;
  ambassador_type?: string | null;
  display_name?: string | null;
  tier?: string | null;
  guru_referral_url?: string | null;
};

type AmbassadorDetailRow = {
  id: string;
  display_name: string | null;
  ambassador_type: string | null;
  tier: string | null;
  status: string | null;
  referral_code: string | null;
  guru_referral_url: string | null;
  ambassador_photo_url: string | null;
  ambassador_photo_path: string | null;
  photo_approved: boolean | null;
  photo_uploaded_at: string | null;
  archived_at: string | null;
  archived_reason: string | null;
};

type AmbassadorRegistryFilters = {
  q: string;
  status: string;
  type: string;
  training: string;
  photo: string;
  rewards: string;
};

const SUPER_USER_EMAILS = new Set(["jason@sitguru.com", "nette@sitguru.com"]);

const ambassadorQuickActions = [
  {
    label: "Onboarding Sent",
    value: "onboarding_sent",
    icon: <Send className="h-3.5 w-3.5" />,
    className:
      "bg-blue-50 text-blue-800 ring-blue-100 hover:bg-blue-100 hover:text-blue-900",
  },
  {
    label: "Active",
    value: "active",
    icon: <PlayCircle className="h-3.5 w-3.5" />,
    className:
      "bg-emerald-50 text-emerald-800 ring-emerald-100 hover:bg-emerald-100 hover:text-emerald-900",
  },
  {
    label: "Pause",
    value: "paused",
    icon: <PauseCircle className="h-3.5 w-3.5" />,
    className:
      "bg-amber-50 text-amber-800 ring-amber-100 hover:bg-amber-100 hover:text-amber-900",
  },
  {
    label: "Archive",
    value: "archived",
    icon: <Archive className="h-3.5 w-3.5" />,
    className:
      "bg-red-50 text-red-700 ring-red-100 hover:bg-red-100 hover:text-red-800",
  },
];

function isSuperUserEmail(email?: string | null) {
  return SUPER_USER_EMAILS.has((email || "").toLowerCase());
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function currency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
}

function numberValue(value: number | null | undefined) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function prettyStatus(status?: string | null) {
  const clean = asString(status);

  if (!clean) return "Not Started";

  return clean
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function isArchivedAmbassador(row: AmbassadorSummaryRow) {
  return Boolean(row.archived_at) || row.status === "archived";
}

function statusClass(status?: string | null) {
  const cleanStatus = status || "";

  if (cleanStatus === "active") {
    return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  }

  if (
    cleanStatus === "conditional_offer_sent" ||
    cleanStatus === "onboarding_sent"
  ) {
    return "bg-blue-100 text-blue-800 ring-blue-200";
  }

  if (cleanStatus === "paused") {
    return "bg-amber-100 text-amber-800 ring-amber-200";
  }

  if (cleanStatus === "archived") {
    return "bg-red-100 text-red-700 ring-red-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function photoStatusClass(hasPhoto: boolean, approved?: boolean | null) {
  if (!hasPhoto) {
    return "bg-slate-100 text-slate-600 ring-slate-200";
  }

  if (approved) {
    return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  }

  return "bg-amber-100 text-amber-800 ring-amber-200";
}

function getPhotoStatusLabel(hasPhoto: boolean, approved?: boolean | null) {
  if (!hasPhoto) return "No Photo";
  if (approved) return "Photo Approved";
  return "Photo Pending";
}

function trainingClass(percent: number) {
  if (percent >= 100) return "bg-emerald-600";
  if (percent >= 50) return "bg-blue-500";
  if (percent > 0) return "bg-amber-500";

  return "bg-slate-200";
}

function getAmbassadorName(ambassador: AmbassadorSummaryRow) {
  return (
    asString(ambassador.display_name) ||
    asString(ambassador.full_name) ||
    asString(ambassador.email) ||
    "Unnamed Ambassador"
  );
}

function buildAmbassadorDirectMessageHref(ambassador: AmbassadorSummaryRow) {
  const ambassadorName = getAmbassadorName(ambassador);
  const params = new URLSearchParams({
    threadType: "direct_ambassador",
    inquiry: "partner",
    messageCategory: "direct",
    recipientRole: "ambassador",
    recipientName: ambassadorName,
    source: "admin_ambassadors_dashboard",
    ambassadorId: ambassador.ambassador_id,
    ambassadorName,
  });

  if (ambassador.user_id) {
    params.set("recipientId", ambassador.user_id);
  }

  if (ambassador.email) {
    params.set("recipientEmail", ambassador.email);
    params.set("ambassadorEmail", ambassador.email);
  }

  if (ambassador.referral_code) {
    params.set("referralCode", ambassador.referral_code);
  }

  return `/admin/messages?${params.toString()}`;
}

function getInitials(name?: string | null) {
  const cleanName = asString(name) || "SitGuru Ambassador";

  return cleanName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function normalizeText(value?: string | null) {
  return asString(value).toLowerCase();
}

function getAmbassadorTypeLabel(ambassador: AmbassadorSummaryRow) {
  const type = normalizeText(ambassador.ambassador_type);
  const program = normalizeText(ambassador.program);
  const source = normalizeText(ambassador.source);
  const role = normalizeText(ambassador.internal_role);
  const combined = `${type} ${program} ${source} ${role}`;

  if (combined.includes("careerlink") || combined.includes("career link")) {
    return "Community Ambassador";
  }

  if (combined.includes("military")) {
    return "Military Ambassador";
  }

  if (combined.includes("veteran")) {
    return "Veteran Ambassador";
  }

  if (combined.includes("student")) {
    return "Student Ambassador";
  }

  if (combined.includes("vet tech") || combined.includes("veterinary")) {
    return "Vet Tech Ambassador";
  }

  if (combined.includes("trainer")) {
    return "Trainer Ambassador";
  }

  if (combined.includes("groomer")) {
    return "Groomer Ambassador";
  }

  if (combined.includes("pet care") || combined.includes("pet professional")) {
    return "Pet Care Professional Ambassador";
  }

  if (combined.includes("business") || combined.includes("partner")) {
    return "Business Ambassador";
  }

  if (combined.includes("community")) {
    return "Community Ambassador";
  }

  return "Ambassador";
}

function getSourceLabel(ambassador: AmbassadorSummaryRow) {
  const source = asString(ambassador.source);

  if (!source) return "Source not saved";

  const lowerSource = source.toLowerCase();

  if (lowerSource.includes("careerlink") || lowerSource.includes("career link")) {
    return "PA CareerLink";
  }

  return source;
}

function getAmbassadorCategory(ambassador: AmbassadorSummaryRow) {
  const typeLabel = getAmbassadorTypeLabel(ambassador);
  const sourceLabel = getSourceLabel(ambassador);

  if (sourceLabel === "PA CareerLink") return "PA CareerLink";
  if (typeLabel.includes("Student")) return "Student";
  if (typeLabel.includes("Community")) return "Community";
  if (typeLabel.includes("Veteran")) return "Veteran";
  if (typeLabel.includes("Military")) return "Military";
  if (typeLabel.includes("Vet Tech")) return "Vet Tech";
  if (typeLabel.includes("Trainer")) return "Trainer";
  if (typeLabel.includes("Groomer")) return "Groomer";
  if (typeLabel.includes("Pet Care Professional")) return "Pet Care Pro";
  if (typeLabel.includes("Business")) return "Business";

  return "Other";
}

function getLocationLabel(ambassador: AmbassadorSummaryRow) {
  return (
    [ambassador.city, ambassador.state].filter(Boolean).join(", ") ||
    "Location not saved"
  );
}

function buildAdminCards(rows: AmbassadorSummaryRow[]) {
  const activeRows = rows.filter((row) => !isArchivedAmbassador(row));

  return [
    {
      label: "Total Ambassadors",
      value: rows.length.toLocaleString(),
      subtext: "All active and archived Ambassador records",
      icon: GraduationCap,
      group: "Pipeline",
    },
    {
      label: "Active Pipeline",
      value: activeRows.length.toLocaleString(),
      subtext: "Not archived",
      icon: Users,
      group: "Pipeline",
    },
    {
      label: "Pet Parent Signups",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.pet_parent_signups), 0)
        .toLocaleString(),
      subtext: "Referred Pet Parent accounts",
      icon: PawPrint,
      group: "Performance",
    },
    {
      label: "Guru Signups",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.guru_signups), 0)
        .toLocaleString(),
      subtext: "Referred Guru applicants/accounts",
      icon: Users,
      group: "Performance",
    },
    {
      label: "Business Signups",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.business_signups), 0)
        .toLocaleString(),
      subtext: "Local business/community leads",
      icon: BriefcaseBusiness,
      group: "Performance",
    },
    {
      label: "Completed Bookings",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.completed_bookings), 0)
        .toLocaleString(),
      subtext: "Referral-linked completed bookings",
      icon: CheckCircle2,
      group: "Performance",
    },
    {
      label: "Pending Rewards",
      value: currency(
        rows.reduce((sum, row) => sum + numberValue(row.pending_rewards), 0),
      ),
      subtext: "Possible future reward review",
      icon: Award,
      group: "Rewards",
    },
    {
      label: "Ready for Payout",
      value: currency(
        rows.reduce(
          (sum, row) => sum + numberValue(row.ready_for_payout_rewards),
          0,
        ),
      ),
      subtext: "Queued for payout processing",
      icon: Wallet,
      group: "Rewards",
    },
  ];
}

async function updateAmbassadorPipelineStatus(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isSuperUserEmail(user.email)) {
    redirect("/admin/login");
  }

  const ambassadorId = asString(formData.get("ambassador_id"));
  const nextStatus = asString(formData.get("next_status"));
  const ambassadorName =
    asString(formData.get("ambassador_name")) || "Ambassador";

  if (!ambassadorId || !nextStatus) {
    redirect("/admin/ambassadors?updated=missing");
  }

  const now = new Date().toISOString();

  const statusPatch =
    nextStatus === "archived"
      ? {
          status: "archived",
          archived_at: now,
          archived_reason:
            "Archived from Ambassador Dashboard quick action. Retained for applicant and contractor recordkeeping.",
          updated_at: now,
        }
      : {
          status: nextStatus,
          archived_at: null,
          archived_reason: null,
          updated_at: now,
          ...(nextStatus === "active" ? { activated_at: now } : {}),
        };

  const { error } = await supabase
    .from("ambassadors")
    .update(statusPatch)
    .eq("id", ambassadorId);

  if (error) {
    console.warn("Unable to update Ambassador status:", error);
    redirect("/admin/ambassadors?updated=error");
  }

  const activityTitle =
    nextStatus === "archived"
      ? "Ambassador archived"
      : `Ambassador status updated to ${prettyStatus(nextStatus)}`;

  await supabase.from("ambassador_activity_log").insert({
    ambassador_id: ambassadorId,
    activity_type: "status_update",
    activity_title: activityTitle,
    activity_notes: `${ambassadorName} was updated by ${
      user.email || "Super Admin"
    } from the Ambassador Dashboard.`,
    created_by: user.id,
  });

  revalidatePath("/admin/ambassadors");
  revalidatePath(`/admin/ambassadors/${ambassadorId}`);
  revalidatePath("/admin/hr");

  redirect("/admin/ambassadors?updated=success");
}

function AmbassadorPhoto({
  ambassador,
  size = "normal",
}: {
  ambassador: AmbassadorSummaryRow;
  size?: "normal" | "large";
}) {
  const name = getAmbassadorName(ambassador);
  const hasPhoto = Boolean(ambassador.ambassador_photo_url);
  const dimensionClass = size === "large" ? "h-20 w-20" : "h-14 w-14";
  const initialsClass = size === "large" ? "text-xl" : "text-sm";

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-[#dbe8d5] bg-[#e8f5e9] font-extrabold text-[#2f6f3e] ${dimensionClass} ${initialsClass}`}
    >
      {hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ambassador.ambassador_photo_url || ""}
          alt={`${name} Ambassador profile`}
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(name)
      )}

      <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-white text-[#2f6f3e] shadow-sm">
        <Camera className="h-3 w-3" />
      </span>
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#edf3e8] bg-[#fbfcf9] px-4 py-3 text-center">
      <p className="text-xl font-black leading-none text-[#102819]">{value}</p>
      <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
        {label}
      </p>
    </div>
  );
}

function RewardLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-extrabold text-[#102819]">{value}</span>
    </div>
  );
}

function AmbassadorQuickActions({
  ambassador,
}: {
  ambassador: AmbassadorSummaryRow;
}) {
  const ambassadorName = getAmbassadorName(ambassador);

  if (isArchivedAmbassador(ambassador)) {
    return (
      <form action={updateAmbassadorPipelineStatus}>
        <input
          type="hidden"
          name="ambassador_id"
          value={ambassador.ambassador_id}
        />
        <input type="hidden" name="ambassador_name" value={ambassadorName} />
        <input type="hidden" name="next_status" value="contacted" />
        <button
          type="submit"
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl bg-green-50 px-4 py-2 text-xs font-extrabold text-green-800 ring-1 ring-green-100 transition hover:bg-green-100 sm:w-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restore
        </button>
      </form>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {ambassadorQuickActions.map((action) => (
        <form key={action.value} action={updateAmbassadorPipelineStatus}>
          <input
            type="hidden"
            name="ambassador_id"
            value={ambassador.ambassador_id}
          />
          <input type="hidden" name="ambassador_name" value={ambassadorName} />
          <input type="hidden" name="next_status" value={action.value} />
          <button
            type="submit"
            className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition ${action.className}`}
          >
            {action.icon}
            {action.label}
          </button>
        </form>
      ))}
    </div>
  );
}

function AmbassadorCard({ ambassador }: { ambassador: AmbassadorSummaryRow }) {
  const ambassadorName = getAmbassadorName(ambassador);
  const ambassadorTypeLabel = getAmbassadorTypeLabel(ambassador);
  const sourceLabel = getSourceLabel(ambassador);
  const locationLabel = getLocationLabel(ambassador);
  const category = getAmbassadorCategory(ambassador);
  const hasPhoto = Boolean(ambassador.ambassador_photo_url);
  const trainingPercent = numberValue(ambassador.training_percent);
  const archived = isArchivedAmbassador(ambassador);

  return (
    <article
      className={`rounded-[2rem] border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
        archived
          ? "border-red-100 bg-red-50/30 hover:border-red-200"
          : "border-[#dbe8d5] hover:border-[#b8d9b2]"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <AmbassadorPhoto ambassador={ambassador} size="large" />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-extrabold text-[#102819]">
                {ambassadorName}
              </h3>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide ring-1 ${photoStatusClass(
                  hasPhoto,
                  ambassador.photo_approved,
                )}`}
              >
                {getPhotoStatusLabel(hasPhoto, ambassador.photo_approved)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-[#f0f7ed] px-3 py-1 text-xs font-extrabold text-[#2f6f3e] ring-1 ring-[#dbe8d5]">
                {ambassadorTypeLabel}
              </span>
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200">
                {category}
              </span>
            </div>

            <p className="mt-2 truncate text-sm font-semibold text-slate-600">
              {ambassador.email || "No email saved"}
            </p>

            <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-[#2f6f3e]">
              {ambassador.referral_code || "No referral code"}
            </p>

            <p className="mt-1 text-xs text-slate-500">{locationLabel}</p>

            {archived ? (
              <p className="mt-2 rounded-2xl bg-red-100 px-3 py-2 text-xs font-bold leading-5 text-red-800">
                Archived:{" "}
                {ambassador.archived_reason ||
                  "Retained on file. Not active for onboarding."}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${statusClass(
              archived ? "archived" : ambassador.status,
            )}`}
          >
            {archived ? "Archived" : prettyStatus(ambassador.status)}
          </span>
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-800 ring-1 ring-blue-100">
            {sourceLabel}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <CompactMetric
          label="Parents"
          value={numberValue(ambassador.pet_parent_signups)}
        />
        <CompactMetric
          label="Gurus"
          value={numberValue(ambassador.guru_signups)}
        />
        <CompactMetric
          label="Business"
          value={numberValue(ambassador.business_signups)}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#edf3e8] bg-[#fbfcf9] p-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
            Rewards
          </p>
          <div className="mt-3 space-y-2">
            <RewardLine
              label="Pending"
              value={currency(ambassador.pending_rewards)}
            />
            <RewardLine
              label="Approved"
              value={currency(ambassador.approved_rewards)}
            />
            <RewardLine
              label="Ready"
              value={currency(ambassador.ready_for_payout_rewards)}
            />
            <RewardLine
              label="Paid"
              value={currency(ambassador.paid_rewards)}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[#edf3e8] bg-[#fbfcf9] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
              Training
            </p>
            <p className="text-sm font-extrabold text-[#102819]">
              {trainingPercent}%
            </p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${trainingClass(trainingPercent)}`}
              style={{ width: `${trainingPercent}%` }}
            />
          </div>

          <p className="mt-3 text-xs font-semibold text-slate-500">
            {prettyStatus(ambassador.training_status)}
          </p>

          {ambassador.ambassador_photo_path ? (
            <p className="mt-3 truncate text-[11px] text-slate-400">
              {ambassador.ambassador_photo_path}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2f6f3e] text-white shadow-sm">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-[#102819]">
                SitGuru Messenger
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Open the SitGuru message center for onboarding questions,
                referral-code support, Pet Parent signups, Guru signups, and
                referral credit follow-up for this Ambassador.
              </p>
            </div>
          </div>

          <Link
            href={buildAmbassadorDirectMessageHref(ambassador)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#2f6f3e] px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#255b33]"
          >
            Start Direct Message
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[#edf3e8] bg-[#fbfcf9] p-3">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
          Quick Actions
        </p>
        <AmbassadorQuickActions ambassador={ambassador} />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-500">
          Source: {sourceLabel}
        </p>

        <Link
          href={`/admin/ambassadors/${ambassador.ambassador_id}`}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#2f6f3e] px-5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#255b33]"
        >
          View Dashboard
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function getNotice(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const updated = searchParams?.updated;

  if (updated === "success") {
    return {
      title: "Ambassador updated",
      message: "The Ambassador status was updated successfully.",
      tone: "success" as const,
    };
  }

  if (updated === "missing") {
    return {
      title: "Ambassador not updated",
      message: "The Ambassador ID or next status was missing.",
      tone: "warning" as const,
    };
  }

  if (updated === "error") {
    return {
      title: "Ambassador not updated",
      message:
        "The Ambassador could not be updated. Confirm archive columns and status constraints exist in Supabase.",
      tone: "warning" as const,
    };
  }

  return null;
}


function getSingleSearchParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = searchParams?.[key];

  if (Array.isArray(value)) {
    return asString(value[0]);
  }

  return asString(value);
}

function buildRegistryFilters(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): AmbassadorRegistryFilters {
  return {
    q: getSingleSearchParam(searchParams, "q"),
    status: getSingleSearchParam(searchParams, "status"),
    type: getSingleSearchParam(searchParams, "type"),
    training: getSingleSearchParam(searchParams, "training"),
    photo: getSingleSearchParam(searchParams, "photo"),
    rewards: getSingleSearchParam(searchParams, "rewards"),
  };
}

function hasActiveRegistryFilters(filters: AmbassadorRegistryFilters) {
  return Boolean(
    filters.q ||
      filters.status ||
      filters.type ||
      filters.training ||
      filters.photo ||
      filters.rewards,
  );
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function getTrainingFilterMatch(ambassador: AmbassadorSummaryRow, filter: string) {
  const percent = numberValue(ambassador.training_percent);
  const status = normalizeText(ambassador.training_status);

  if (!filter) return true;
  if (filter === "not_started") return percent === 0 || status.includes("not started");
  if (filter === "in_progress") return percent > 0 && percent < 100;
  if (filter === "complete") return percent >= 100 || status.includes("complete");

  return true;
}

function getPhotoFilterMatch(ambassador: AmbassadorSummaryRow, filter: string) {
  const hasPhoto = Boolean(ambassador.ambassador_photo_url);

  if (!filter) return true;
  if (filter === "missing") return !hasPhoto;
  if (filter === "pending") return hasPhoto && ambassador.photo_approved !== true;
  if (filter === "approved") return hasPhoto && ambassador.photo_approved === true;

  return true;
}

function getRewardsFilterMatch(ambassador: AmbassadorSummaryRow, filter: string) {
  const pending = numberValue(ambassador.pending_rewards);
  const approved = numberValue(ambassador.approved_rewards);
  const ready = numberValue(ambassador.ready_for_payout_rewards);
  const paid = numberValue(ambassador.paid_rewards);
  const total = pending + approved + ready + paid;

  if (!filter) return true;
  if (filter === "none") return total === 0;
  if (filter === "pending") return pending > 0 || approved > 0;
  if (filter === "ready") return ready > 0;
  if (filter === "paid") return paid > 0;

  return true;
}

function filterAmbassadorsForRegistry(
  ambassadors: AmbassadorSummaryRow[],
  filters: AmbassadorRegistryFilters,
) {
  const query = normalizeText(filters.q);

  return ambassadors.filter((ambassador) => {
    const status = isArchivedAmbassador(ambassador)
      ? "archived"
      : normalizeText(ambassador.status);
    const typeLabel = getAmbassadorTypeLabel(ambassador);

    const searchableText = [
      getAmbassadorName(ambassador),
      ambassador.email,
      ambassador.phone,
      ambassador.referral_code,
      ambassador.city,
      ambassador.state,
      ambassador.county,
      ambassador.country,
      ambassador.source,
      ambassador.program,
      ambassador.internal_role,
      typeLabel,
      getSourceLabel(ambassador),
      getAmbassadorCategory(ambassador),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesQuery = !query || searchableText.includes(query);
    const matchesStatus = !filters.status || status === filters.status;
    const matchesType = !filters.type || typeLabel === filters.type;
    const matchesTraining = getTrainingFilterMatch(ambassador, filters.training);
    const matchesPhoto = getPhotoFilterMatch(ambassador, filters.photo);
    const matchesRewards = getRewardsFilterMatch(ambassador, filters.rewards);

    return (
      matchesQuery &&
      matchesStatus &&
      matchesType &&
      matchesTraining &&
      matchesPhoto &&
      matchesRewards
    );
  });
}

function DashboardStatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof GraduationCap;
}) {
  return (
    <div className="rounded-3xl border border-[#dbe8d5] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-extrabold text-[#102819]">{value}</p>
        </div>
        <div className="rounded-2xl bg-[#e8f5e9] p-3 text-[#2f6f3e]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{detail}</p>
    </div>
  );
}

function AmbassadorGroupSection({
  title,
  description,
  ambassadors,
  icon: Icon,
}: {
  title: string;
  description: string;
  ambassadors: AmbassadorSummaryRow[];
  icon: typeof GraduationCap;
}) {
  if (ambassadors.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] border border-[#dbe8d5] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f5e9] text-[#2f6f3e]">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#102819]">
                {title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
          </div>

          <span className="rounded-2xl bg-[#f0f7ed] px-4 py-3 text-sm font-bold text-[#2f6f3e]">
            {ambassadors.length} records
          </span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {ambassadors.map((ambassador) => (
          <AmbassadorCard
            key={ambassador.ambassador_id}
            ambassador={ambassador}
          />
        ))}
      </div>
    </section>
  );
}


function AmbassadorRegistryTable({
  ambassadors,
  allAmbassadors,
  filters,
}: {
  ambassadors: AmbassadorSummaryRow[];
  allAmbassadors: AmbassadorSummaryRow[];
  filters: AmbassadorRegistryFilters;
}) {
  const activeFilters = hasActiveRegistryFilters(filters);
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "interested", label: "Interested" },
    { value: "onboarding_sent", label: "Onboarding Sent" },
    { value: "paused", label: "Paused" },
    { value: "archived", label: "Archived" },
  ];
  const typeOptions = uniqueSorted(allAmbassadors.map(getAmbassadorTypeLabel));

  return (
    <section className="rounded-[2rem] border border-[#dbe8d5] bg-white shadow-sm">
      <div className="border-b border-[#e2ecd9] p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#2f6f3e]">
              Super Admin Ambassador Registry
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#102819] sm:text-3xl">
              Click into each Ambassador dashboard
            </h2>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
              View every Ambassador profile, onboarding status, referral code,
              Pet Parent and Guru referral activity, rewards, messages, and admin
              controls from one mobile-friendly registry.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/ambassador-leads"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#cfe4c8] bg-white px-4 py-2 text-sm font-black text-[#2f6f3e] shadow-sm transition hover:bg-[#eef7ea]"
            >
              View Leads
            </Link>
            <Link
              href="/admin/ambassador-training"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#cfe4c8] bg-white px-4 py-2 text-sm font-black text-[#2f6f3e] shadow-sm transition hover:bg-[#eef7ea]"
            >
              Training Manager
            </Link>
            <Link
              href="/admin/commissions"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#2f6f3e] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#255b33]"
            >
              Commissions
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#e2ecd9] bg-[#fbfcf9] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Ambassador Records
            </p>
            <p className="mt-1 text-2xl font-black text-[#102819]">
              {allAmbassadors.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e2ecd9] bg-[#fbfcf9] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Showing
            </p>
            <p className="mt-1 text-2xl font-black text-[#102819]">
              {ambassadors.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e2ecd9] bg-[#fbfcf9] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Ready for Payout
            </p>
            <p className="mt-1 text-2xl font-black text-[#102819]">
              {currency(
                allAmbassadors.reduce(
                  (sum, ambassador) =>
                    sum + numberValue(ambassador.ready_for_payout_rewards),
                  0,
                ),
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e2ecd9] bg-[#fbfcf9] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Paid Rewards
            </p>
            <p className="mt-1 text-2xl font-black text-[#102819]">
              {currency(
                allAmbassadors.reduce(
                  (sum, ambassador) => sum + numberValue(ambassador.paid_rewards),
                  0,
                ),
              )}
            </p>
          </div>
        </div>

        <form
          action="/admin/ambassadors"
          className="mt-5 rounded-[1.5rem] border border-[#e2ecd9] bg-[#f8fbf6] p-4"
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_repeat(5,minmax(0,0.8fr))]">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Search
              </span>
              <input
                name="q"
                defaultValue={filters.q}
                placeholder="Name, email, code, city, source..."
                className="min-h-11 w-full rounded-2xl border border-[#dbe8d5] bg-white px-4 py-2 text-sm font-bold text-[#102819] outline-none transition focus:border-[#2f6f3e] focus:ring-4 focus:ring-[#2f6f3e]/10"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Status
              </span>
              <select
                name="status"
                defaultValue={filters.status}
                className="min-h-11 w-full rounded-2xl border border-[#dbe8d5] bg-white px-4 py-2 text-sm font-bold text-[#102819] outline-none transition focus:border-[#2f6f3e] focus:ring-4 focus:ring-[#2f6f3e]/10"
              >
                <option value="">All Statuses</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Type
              </span>
              <select
                name="type"
                defaultValue={filters.type}
                className="min-h-11 w-full rounded-2xl border border-[#dbe8d5] bg-white px-4 py-2 text-sm font-bold text-[#102819] outline-none transition focus:border-[#2f6f3e] focus:ring-4 focus:ring-[#2f6f3e]/10"
              >
                <option value="">All Types</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Training
              </span>
              <select
                name="training"
                defaultValue={filters.training}
                className="min-h-11 w-full rounded-2xl border border-[#dbe8d5] bg-white px-4 py-2 text-sm font-bold text-[#102819] outline-none transition focus:border-[#2f6f3e] focus:ring-4 focus:ring-[#2f6f3e]/10"
              >
                <option value="">All Training</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="complete">Complete</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Photo
              </span>
              <select
                name="photo"
                defaultValue={filters.photo}
                className="min-h-11 w-full rounded-2xl border border-[#dbe8d5] bg-white px-4 py-2 text-sm font-bold text-[#102819] outline-none transition focus:border-[#2f6f3e] focus:ring-4 focus:ring-[#2f6f3e]/10"
              >
                <option value="">All Photos</option>
                <option value="missing">Missing</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Rewards
              </span>
              <select
                name="rewards"
                defaultValue={filters.rewards}
                className="min-h-11 w-full rounded-2xl border border-[#dbe8d5] bg-white px-4 py-2 text-sm font-bold text-[#102819] outline-none transition focus:border-[#2f6f3e] focus:ring-4 focus:ring-[#2f6f3e]/10"
              >
                <option value="">All Rewards</option>
                <option value="none">No Rewards</option>
                <option value="pending">Pending/Approved</option>
                <option value="ready">Ready for Payout</option>
                <option value="paid">Paid</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-slate-500">
              Showing {ambassadors.length} of {allAmbassadors.length} Ambassador records.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {activeFilters ? (
                <Link
                  href="/admin/ambassadors"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#cfe4c8] bg-white px-4 py-2 text-xs font-black text-[#2f6f3e] shadow-sm transition hover:bg-[#eef7ea]"
                >
                  Clear Filters
                </Link>
              ) : null}
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-[#2f6f3e] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#255b33]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      </div>

      {ambassadors.length === 0 ? (
        <div className="p-6 text-sm font-semibold text-slate-600">
          {allAmbassadors.length === 0
            ? "No Ambassador records are available yet."
            : "No Ambassador records match the current filters."}
        </div>
      ) : (
        <div className="grid gap-4 p-4 sm:p-5">
          {ambassadors.map((ambassador) => {
            const ambassadorName = getAmbassadorName(ambassador);
            const archived = isArchivedAmbassador(ambassador);
            const hasPhoto = Boolean(ambassador.ambassador_photo_url);
            const trainingPercent = numberValue(ambassador.training_percent);
            const referralTotal =
              numberValue(ambassador.pet_parent_signups) +
              numberValue(ambassador.guru_signups) +
              numberValue(ambassador.business_signups);
            const rewardsTotal =
              numberValue(ambassador.pending_rewards) +
              numberValue(ambassador.approved_rewards) +
              numberValue(ambassador.ready_for_payout_rewards) +
              numberValue(ambassador.paid_rewards);

            return (
              <article
                key={ambassador.ambassador_id}
                className="rounded-[1.6rem] border border-[#e2ecd9] bg-white p-4 shadow-sm transition hover:border-[#b9d5b7] hover:shadow-md sm:p-5"
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,0.85fr)] xl:items-start">
                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                    <AmbassadorPhoto ambassador={ambassador} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <p className="text-lg font-black leading-tight text-[#102819] sm:text-xl">
                            {ambassadorName}
                          </p>
                          <p className="mt-1 break-words text-sm font-semibold text-slate-600">
                            {ambassador.email || "No email saved"}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-600">
                            {ambassador.phone || "No phone saved"}
                          </p>
                          <p className="mt-1 text-sm font-bold text-[#2f6f3e]">
                            {getLocationLabel(ambassador)}
                          </p>
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(
                            archived ? "archived" : ambassador.status,
                          )}`}
                        >
                          {archived ? "Archived" : prettyStatus(ambassador.status)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <Link
                          href={`/admin/ambassadors/${ambassador.ambassador_id}`}
                          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#2f6f3e] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#255b33]"
                        >
                          View Dashboard
                        </Link>
                        <Link
                          href={buildAmbassadorDirectMessageHref(ambassador)}
                          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#cfe4c8] bg-white px-4 py-2 text-sm font-black text-[#2f6f3e] shadow-sm transition hover:bg-[#eef7ea]"
                        >
                          Message
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-2xl border border-[#edf3e8] bg-[#f8fbf6] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Ambassador Type
                      </p>
                      <p className="mt-2 text-sm font-black text-[#102819]">
                        {getAmbassadorTypeLabel(ambassador)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {getSourceLabel(ambassador)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {ambassador.program || ambassador.internal_role || "Program not saved"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#edf3e8] bg-[#f8fbf6] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Referral Code
                      </p>
                      <p className="mt-2 break-words rounded-xl bg-[#f0f7ed] px-3 py-2 text-sm font-black text-[#2f6f3e] ring-1 ring-[#dbe8d5]">
                        {ambassador.referral_code || "Not saved"}
                      </p>
                      <span
                        className={`mt-3 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ring-1 ${photoStatusClass(
                          hasPhoto,
                          ambassador.photo_approved,
                        )}`}
                      >
                        {getPhotoStatusLabel(hasPhoto, ambassador.photo_approved)}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-2xl border border-[#edf3e8] bg-[#fbfcf9] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          Training
                        </p>
                        <span className="text-xs font-black text-[#102819]">
                          {trainingPercent}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {prettyStatus(ambassador.training_status)}
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${trainingClass(trainingPercent)}`}
                          style={{ width: `${trainingPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#edf3e8] bg-[#fbfcf9] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Referrals
                      </p>
                      <div className="mt-2 text-xs font-bold leading-5 text-slate-600">
                        <p>{numberValue(ambassador.pet_parent_signups)} Pet Parents</p>
                        <p>{numberValue(ambassador.guru_signups)} Gurus</p>
                        <p>{numberValue(ambassador.business_signups)} Businesses</p>
                        <p className="mt-1 font-black text-[#102819]">
                          {referralTotal} total
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#edf3e8] bg-[#fbfcf9] p-4 sm:col-span-2 xl:col-span-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Rewards
                      </p>
                      <div className="mt-2 text-xs font-bold leading-5 text-slate-600">
                        <p>Pending: {currency(ambassador.pending_rewards)}</p>
                        <p>Ready: {currency(ambassador.ready_for_payout_rewards)}</p>
                        <p>Paid: {currency(ambassador.paid_rewards)}</p>
                        <p className="mt-1 font-black text-[#102819]">
                          {currency(rewardsTotal)} total
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default async function AdminAmbassadorsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase() || "";

  if (!user || !SUPER_USER_EMAILS.has(email)) {
    redirect("/admin/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const notice = getNotice(resolvedSearchParams);

  const { data, error } = await supabase
    .from("admin_ambassador_dashboard_summary")
    .select("*")
    .order("created_at", { ascending: false });

  const summaryRows = (data || []) as AmbassadorSummaryRow[];

  let detailRows: AmbassadorDetailRow[] = [];

  if (summaryRows.length > 0) {
    const { data: detailData } = await supabase
      .from("ambassadors")
      .select(
        "id, display_name, ambassador_type, tier, status, referral_code, guru_referral_url, ambassador_photo_url, ambassador_photo_path, photo_approved, photo_uploaded_at, archived_at, archived_reason",
      )
      .in(
        "id",
        summaryRows.map((row) => row.ambassador_id),
      );

    detailRows = (detailData || []) as AmbassadorDetailRow[];
  }

  const detailMap = new Map(detailRows.map((row) => [row.id, row]));

  const ambassadors = summaryRows.map((row) => {
    const detail = detailMap.get(row.ambassador_id);

    return {
      ...row,
      display_name: detail?.display_name || null,
      ambassador_type: detail?.ambassador_type || null,
      tier: detail?.tier || null,
      status: detail?.status || row.status,
      referral_code: detail?.referral_code || row.referral_code,
      guru_referral_url: detail?.guru_referral_url || null,
      ambassador_photo_url: detail?.ambassador_photo_url || null,
      ambassador_photo_path: detail?.ambassador_photo_path || null,
      photo_approved: detail?.photo_approved || false,
      photo_uploaded_at: detail?.photo_uploaded_at || null,
      archived_at: detail?.archived_at || null,
      archived_reason: detail?.archived_reason || null,
    };
  });

  const registryFilters = buildRegistryFilters(resolvedSearchParams);
  const registryAmbassadors = filterAmbassadorsForRegistry(
    ambassadors,
    registryFilters,
  );

  const cards = buildAdminCards(ambassadors);
  const pipelineCards = cards.filter((card) => card.group === "Pipeline");
  const performanceCards = cards.filter((card) => card.group === "Performance");
  const rewardCards = cards.filter((card) => card.group === "Rewards");

  const activeCount = ambassadors.filter(
    (row) => row.status === "active",
  ).length;
  const onboardingCount = ambassadors.filter((row) =>
    ["conditional_offer_sent", "onboarding_sent"].includes(row.status || ""),
  ).length;
  const archivedCount = ambassadors.filter(isArchivedAmbassador).length;
  const photoPendingCount = ambassadors.filter(
    (row) => row.ambassador_photo_url && !row.photo_approved,
  ).length;
  const photoApprovedCount = ambassadors.filter(
    (row) => row.ambassador_photo_url && row.photo_approved,
  ).length;

  const activeAmbassadors = ambassadors.filter(
    (row) => row.status === "active" && !isArchivedAmbassador(row),
  );
  const onboardingAmbassadors = ambassadors.filter(
    (row) =>
      ["conditional_offer_sent", "onboarding_sent", "new"].includes(
        row.status || "",
      ) && !isArchivedAmbassador(row),
  );
  const paCareerLinkAmbassadors = ambassadors.filter(
    (row) => getAmbassadorCategory(row) === "PA CareerLink",
  );
  const studentAmbassadors = ambassadors.filter(
    (row) => getAmbassadorCategory(row) === "Student",
  );
  const otherAmbassadors = ambassadors.filter((row) => {
    const category = getAmbassadorCategory(row);

    return (
      !isArchivedAmbassador(row) &&
      category !== "PA CareerLink" &&
      category !== "Student" &&
      row.status !== "active" &&
      !["conditional_offer_sent", "onboarding_sent", "new"].includes(
        row.status || "",
      )
    );
  });
  const archivedAmbassadors = ambassadors.filter(isArchivedAmbassador);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f8f3] px-3 py-5 text-[#17351f] sm:px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-[2rem] border border-[#dbe8d5] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#2f6f3e]">
                Admin / Ambassador Intelligence
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#102819] sm:text-4xl">
                Ambassador Intelligence
              </h1>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                View every Ambassador in one clean registry. Track onboarding,
                training, referral codes, Pet Parent and Guru referrals, rewards,
                payout readiness, direct messages, and admin dashboard access.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[420px]">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Active
                </p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-900">
                  {activeCount}
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  Onboarding
                </p>
                <p className="mt-1 text-2xl font-extrabold text-blue-900">
                  {onboardingCount}
                </p>
              </div>
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                  Archived
                </p>
                <p className="mt-1 text-2xl font-extrabold text-red-900">
                  {archivedCount}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  Photos Pending
                </p>
                <p className="mt-1 text-2xl font-extrabold text-amber-900">
                  {photoPendingCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        {notice ? (
          <NoticeCard
            title={notice.title}
            message={notice.message}
            tone={notice.tone}
          />
        ) : null}

        {error ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
            <h2 className="text-lg font-extrabold">Ambassador data error</h2>
            <p className="mt-2 text-sm">
              SitGuru could not load the ambassador summary view. Supabase
              returned:
            </p>
            <pre className="mt-3 overflow-auto rounded-2xl bg-white p-4 text-xs">
              {error.message}
            </pre>
          </section>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[2rem] border border-[#dbe8d5] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#2f6f3e]" />
              <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#102819]">
                Pipeline
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {pipelineCards.map((card) => (
                <DashboardStatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  detail={card.subtext}
                  icon={card.icon}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#dbe8d5] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#2f6f3e]" />
              <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#102819]">
                Performance
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {performanceCards.map((card) => (
                <DashboardStatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  detail={card.subtext}
                  icon={card.icon}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#dbe8d5] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-[#2f6f3e]" />
              <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#102819]">
                Rewards & Payouts
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {rewardCards.map((card) => (
                <DashboardStatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  detail={card.subtext}
                  icon={card.icon}
                />
              ))}
            </div>
          </div>
        </section>

        <AmbassadorRegistryTable
          ambassadors={registryAmbassadors}
          allAmbassadors={ambassadors}
          filters={registryFilters}
        />
      </div>
    </main>
  );
}

function NoticeCard({
  title,
  message,
  tone,
}: {
  title: string;
  message: string;
  tone: "success" | "warning";
}) {
  return (
    <div
      className={`rounded-[24px] border p-4 ${
        tone === "success"
          ? "border-green-200 bg-green-50 text-green-950"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <p className="text-sm font-black">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6">{message}</p>
    </div>
  );
}