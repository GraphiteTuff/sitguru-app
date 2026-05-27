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
};

type AmbassadorPhotoRow = {
  id: string;
  ambassador_photo_url: string | null;
  ambassador_photo_path: string | null;
  photo_approved: boolean | null;
  photo_uploaded_at: string | null;
  archived_at: string | null;
  archived_reason: string | null;
  status: string | null;
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

function isSuperUserEmail(email: string | null | undefined) {
  return SUPER_USER_EMAILS.has((email || "").toLowerCase());
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function currency(value: number | null | undefined) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function numberValue(value: number | null | undefined) {
  return Number(value || 0);
}

function prettyStatus(status: string | null | undefined) {
  if (!status) return "New";

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isArchivedAmbassador(ambassador: AmbassadorSummaryRow) {
  return ambassador.status === "archived" || Boolean(ambassador.archived_at);
}

function statusClass(status: string | null | undefined) {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";
    case "conditional_offer_sent":
    case "onboarding_sent":
      return "bg-blue-100 text-blue-800 ring-blue-200";
    case "paused":
    case "nurture":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    case "not_a_fit":
    case "inactive":
      return "bg-rose-100 text-rose-800 ring-rose-200";
    case "archived":
      return "bg-red-100 text-red-700 ring-red-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function photoStatusClass(
  hasPhoto: boolean,
  approved: boolean | null | undefined,
) {
  if (!hasPhoto) return "bg-slate-100 text-slate-600 ring-slate-200";
  if (approved) return "bg-emerald-100 text-emerald-800 ring-emerald-200";

  return "bg-amber-100 text-amber-800 ring-amber-200";
}

function getPhotoStatusLabel(
  hasPhoto: boolean,
  approved: boolean | null | undefined,
) {
  if (!hasPhoto) return "No Photo";
  if (approved) return "Photo Approved";

  return "Photo Pending";
}

function trainingClass(percent: number | null | undefined) {
  const value = numberValue(percent);

  if (value >= 100) return "bg-emerald-500";
  if (value >= 50) return "bg-amber-500";
  return "bg-slate-400";
}

function getInitials(name: string | null | undefined) {
  const cleanName = name || "SitGuru Ambassador";

  return cleanName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function buildAdminCards(rows: AmbassadorSummaryRow[]) {
  const activeRows = rows.filter((row) => !isArchivedAmbassador(row));

  return [
    {
      label: "Total Ambassadors",
      value: rows.length.toLocaleString(),
      subtext: "All active and archived Ambassador records",
      icon: GraduationCap,
    },
    {
      label: "Active Pipeline",
      value: activeRows.length.toLocaleString(),
      subtext: "Not archived",
      icon: Users,
    },
    {
      label: "Pet Parent Signups",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.pet_parent_signups), 0)
        .toLocaleString(),
      subtext: "Referred Pet Parent accounts",
      icon: PawPrint,
    },
    {
      label: "Guru Signups",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.guru_signups), 0)
        .toLocaleString(),
      subtext: "Referred Guru applicants/accounts",
      icon: Users,
    },
    {
      label: "Business Signups",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.business_signups), 0)
        .toLocaleString(),
      subtext: "Local business/community leads",
      icon: BriefcaseBusiness,
    },
    {
      label: "Completed Bookings",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.completed_bookings), 0)
        .toLocaleString(),
      subtext: "Referral-linked completed bookings",
      icon: CheckCircle2,
    },
    {
      label: "Pending Rewards",
      value: currency(
        rows.reduce((sum, row) => sum + numberValue(row.pending_rewards), 0),
      ),
      subtext: "Possible future reward review",
      icon: Award,
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
  const hasPhoto = Boolean(ambassador.ambassador_photo_url);
  const dimensionClass = size === "large" ? "h-20 w-20" : "h-14 w-14";
  const initialsClass = size === "large" ? "text-xl" : "text-sm";

  return (
    <div
      className={`relative flex ${dimensionClass} shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#e8f5e9] ${initialsClass} font-extrabold text-[#2f6f3e] ring-1 ring-[#dbe8d5]`}
    >
      {hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ambassador.ambassador_photo_url || ""}
          alt={`${ambassador.full_name || "Ambassador"} profile photo`}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{getInitials(ambassador.full_name) || "SG"}</span>
      )}

      {!hasPhoto ? (
        <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#2f6f3e] shadow-sm">
          <Camera className="h-3 w-3" />
        </div>
      ) : null}
    </div>
  );
}

function CompactMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-[#f5f8f3] p-3 text-center ring-1 ring-[#edf3e8]">
      <p className="text-lg font-extrabold leading-none text-[#102819]">
        {value}
      </p>
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
  if (isArchivedAmbassador(ambassador)) {
    return (
      <form action={updateAmbassadorPipelineStatus}>
        <input
          type="hidden"
          name="ambassador_id"
          value={ambassador.ambassador_id}
        />
        <input
          type="hidden"
          name="ambassador_name"
          value={ambassador.full_name || "Ambassador"}
        />
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
          <input
            type="hidden"
            name="ambassador_name"
            value={ambassador.full_name || "Ambassador"}
          />
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
                {ambassador.full_name || "Unnamed Ambassador"}
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

            <p className="mt-1 truncate text-sm font-semibold text-slate-600">
              {ambassador.email || "No email saved"}
            </p>

            <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-[#2f6f3e]">
              {ambassador.referral_code || "No referral code"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {[ambassador.city, ambassador.state].filter(Boolean).join(", ") ||
                "Location not saved"}
            </p>

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
          <span className="inline-flex rounded-full bg-[#f0f7ed] px-3 py-1 text-xs font-extrabold text-[#2f6f3e] ring-1 ring-[#dbe8d5]">
            {ambassador.program || "Student Hire"}
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
            href="/admin/messages"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#2f6f3e] px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#255b33]"
          >
            Open Messenger
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
          Source: {ambassador.source || "Indeed"}
        </p>

        <Link
          href={`/admin/ambassadors/${ambassador.ambassador_id}`}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#2f6f3e] px-5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#255b33]"
        >
          View Ambassador
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

  let photoRows: AmbassadorPhotoRow[] = [];

  if (summaryRows.length > 0) {
    const { data: photoData } = await supabase
      .from("ambassadors")
      .select(
        "id, status, ambassador_photo_url, ambassador_photo_path, photo_approved, photo_uploaded_at, archived_at, archived_reason",
      )
      .in(
        "id",
        summaryRows.map((row) => row.ambassador_id),
      );

    photoRows = (photoData || []) as AmbassadorPhotoRow[];
  }

  const photoMap = new Map(photoRows.map((row) => [row.id, row]));

  const ambassadors = summaryRows.map((row) => {
    const photo = photoMap.get(row.ambassador_id);

    return {
      ...row,
      status: photo?.status || row.status,
      ambassador_photo_url: photo?.ambassador_photo_url || null,
      ambassador_photo_path: photo?.ambassador_photo_path || null,
      photo_approved: photo?.photo_approved || false,
      photo_uploaded_at: photo?.photo_uploaded_at || null,
      archived_at: photo?.archived_at || null,
      archived_reason: photo?.archived_reason || null,
    };
  });

  const cards = buildAdminCards(ambassadors);

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

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f8f3] px-3 py-5 text-[#17351f] sm:px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-[2rem] border border-[#dbe8d5] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#2f6f3e]">
                SitGuru Growth
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#102819] sm:text-4xl">
                Ambassador Dashboard
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Track Student Ambassadors, Pet Parent signups, Guru signups,
                business signups, completed bookings, rewards, commissions,
                profile photos, archive status, and payout readiness from one
                admin view.
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-3xl border border-[#dbe8d5] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-3 text-3xl font-extrabold text-[#102819]">
                      {card.value}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#e8f5e9] p-3 text-[#2f6f3e]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{card.subtext}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-[2rem] border border-[#dbe8d5] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#102819]">
                Student Ambassadors
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Card-based admin view with wired status buttons. Archive
                declined candidates instead of deleting them.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-2xl bg-[#f0f7ed] px-4 py-3 text-sm font-bold text-[#2f6f3e]">
                Source: Indeed
              </span>
              <span className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                Photos Approved: {photoApprovedCount}
              </span>
            </div>
          </div>
        </section>

        {ambassadors.length === 0 ? (
          <section className="rounded-[2rem] border border-[#dbe8d5] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f5e9] text-[#2f6f3e]">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-xl font-extrabold text-[#102819]">
              No Ambassadors yet
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Your database is ready. Next, add candidates to the ambassadors
              table and wire their dashboard records.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 xl:grid-cols-2">
            {ambassadors.map((ambassador) => (
              <AmbassadorCard
                key={ambassador.ambassador_id}
                ambassador={ambassador}
              />
            ))}
          </section>
        )}
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
