import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProfileRow = Record<string, unknown>;
type UserRoleRow = Record<string, unknown>;

type AmbassadorRegistryRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  accountType: string;
  assignedRoles: string[];
  city: string;
  state: string;
  zipCode: string;
  referralCode: string;
  avatarUrl: string;
  createdAt: string | null;
  matchReason: "email" | "role" | "both";
};

const SUPER_USER_EMAILS = new Set(["jason@sitguru.com", "nette@sitguru.com"]);

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstString(record: ProfileRow | null | undefined, keys: string[]) {
  if (!record) return "";

  for (const key of keys) {
    const value = asString(record[key]);
    if (value) return value;
  }

  return "";
}

function normalizeRole(value: unknown) {
  return asString(value).toLowerCase();
}

function isAmbassadorRole(value: unknown) {
  return normalizeRole(value) === "ambassador";
}

function emailLooksLikeJourneyAmbassador(email: unknown) {
  return asString(email).toLowerCase().includes("journey.amb.");
}

function getDisplayName(profile: ProfileRow, email: string) {
  const displayName = firstString(profile, ["display_name", "full_name"]);
  if (displayName && !/^sitguru(\s|$)/i.test(displayName)) return displayName;

  const first = firstString(profile, ["first_name"]);
  const last = firstString(profile, ["last_name"]);
  const combined = [first, last].filter(Boolean).join(" ");
  if (combined) return combined;

  if (email.includes("@")) {
    const local = email
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\d+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (local) {
      return local
        .split(" ")
        .filter(Boolean)
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(" ");
    }
  }

  return displayName || "Unnamed Ambassador";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function safeSelect(
  table: "profiles" | "user_roles",
): Promise<{ rows: ProfileRow[]; errorMessage: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .limit(5000);

    if (error) {
      console.warn(`[admin/ambassadors] ${table} query failed:`, error.message);
      return { rows: [], errorMessage: error.message };
    }

    return {
      rows: Array.isArray(data) ? (data as ProfileRow[]) : [],
      errorMessage: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : `Unable to load ${table}`;
    console.warn(`[admin/ambassadors] ${table} threw:`, message);
    return { rows: [], errorMessage: message };
  }
}

function buildRoleMap(roleRows: UserRoleRow[]) {
  const rolesByUserId = new Map<string, string[]>();

  for (const row of roleRows) {
    if (!row || typeof row !== "object") continue;

    const userId =
      asString(row.user_id) || asString(row.profile_id) || asString(row.id);
    const role = asString(row.role) || asString(row.role_name);
    if (!userId || !role) continue;

    const existing = rolesByUserId.get(userId) || [];
    if (!existing.some((item) => normalizeRole(item) === normalizeRole(role))) {
      existing.push(role);
    }
    rolesByUserId.set(userId, existing);
  }

  return rolesByUserId;
}

/**
 * Keep only profiles whose email includes journey.amb. OR whose role
 * (profile.role / user_roles.role) explicitly equals "ambassador".
 */
function filterAmbassadorProfiles(
  profiles: ProfileRow[],
  rolesByUserId: Map<string, string[]>,
): AmbassadorRegistryRow[] {
  const rows: AmbassadorRegistryRow[] = [];

  for (const profile of profiles) {
    if (!profile || typeof profile !== "object") continue;

    const id = asString(profile.id) || asString(profile.user_id);
    if (!id) continue;

    const email = firstString(profile, ["email"]).toLowerCase();
    const profileRole = firstString(profile, ["role", "user_role"]);
    const accountType = firstString(profile, ["account_type", "type"]);
    const assignedRoles = rolesByUserId.get(id) || [];

    const emailMatch = emailLooksLikeJourneyAmbassador(email);
    const roleMatch =
      isAmbassadorRole(profileRole) ||
      isAmbassadorRole(accountType) ||
      assignedRoles.some((role) => isAmbassadorRole(role));

    if (!emailMatch && !roleMatch) continue;

    rows.push({
      id,
      fullName: getDisplayName(profile, email),
      email: email || firstString(profile, ["email"]),
      phone: firstString(profile, ["phone", "phone_number"]),
      role: profileRole || assignedRoles.find((role) => isAmbassadorRole(role)) || "",
      accountType,
      assignedRoles,
      city: firstString(profile, ["city", "service_city"]),
      state: firstString(profile, ["state", "service_state"]),
      zipCode: firstString(profile, [
        "zip_code",
        "zip",
        "zipcode",
        "postal_code",
        "service_zip",
      ]),
      referralCode: firstString(profile, [
        "referral_code",
        "ambassador_code",
        "invite_code",
      ]),
      avatarUrl: firstString(profile, [
        "avatar_url",
        "photo_url",
        "profile_photo_url",
      ]),
      createdAt: firstString(profile, ["created_at"]) || null,
      matchReason: emailMatch && roleMatch ? "both" : emailMatch ? "email" : "role",
    });
  }

  return rows.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

function buildMessageHref(row: AmbassadorRegistryRow) {
  const params = new URLSearchParams({
    threadType: "direct_ambassador",
    inquiry: "partner",
    messageCategory: "direct",
    recipientRole: "ambassador",
    recipientName: row.fullName,
    recipientId: row.id,
    source: "admin_ambassadors_dashboard",
    ambassadorName: row.fullName,
  });

  if (row.email) {
    params.set("recipientEmail", row.email);
    params.set("ambassadorEmail", row.email);
  }

  if (row.referralCode) {
    params.set("referralCode", row.referralCode);
  }

  return `/admin/messages?${params.toString()}`;
}

function buildLifecycleHref(row: AmbassadorRegistryRow) {
  const query = row.email || row.id;
  return `/admin/account-lifecycle?query=${encodeURIComponent(query)}`;
}

function MatchBadge({ reason }: { reason: AmbassadorRegistryRow["matchReason"] }) {
  if (reason === "both") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-800 ring-1 ring-emerald-100">
        Role + journey.amb.
      </span>
    );
  }

  if (reason === "email") {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-800 ring-1 ring-amber-100">
        journey.amb. email
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-800 ring-1 ring-blue-100">
      role = ambassador
    </span>
  );
}

export default async function AdminAmbassadorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase() || "";
  if (!user || !SUPER_USER_EMAILS.has(email)) {
    redirect("/admin/login");
  }

  const [profilesResult, rolesResult] = await Promise.all([
    safeSelect("profiles"),
    safeSelect("user_roles"),
  ]);

  const rolesByUserId = buildRoleMap(rolesResult.rows);
  const ambassadors = filterAmbassadorProfiles(
    profilesResult.rows,
    rolesByUserId,
  );

  const loadErrors = [
    profilesResult.errorMessage
      ? `profiles: ${profilesResult.errorMessage}`
      : null,
    rolesResult.errorMessage
      ? `user_roles: ${rolesResult.errorMessage}`
      : null,
  ].filter(Boolean) as string[];

  const roleMatchedCount = ambassadors.filter(
    (row) => row.matchReason === "role" || row.matchReason === "both",
  ).length;
  const emailMatchedCount = ambassadors.filter(
    (row) => row.matchReason === "email" || row.matchReason === "both",
  ).length;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f8f3] px-3 py-5 text-[#17351f] sm:px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-[2rem] border border-[#dbe8d5] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#0D5C3A]">
                Admin / Ambassador Registry
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#102819] sm:text-4xl">
                Ambassador Intelligence
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Built from verified <code className="font-semibold">profiles</code>{" "}
                and <code className="font-semibold">user_roles</code> only.
                Records are kept when email includes{" "}
                <code className="font-semibold">journey.amb.</code> or role
                equals <code className="font-semibold">ambassador</code>.
              </p>
            </div>

            <div className="grid w-full grid-cols-3 gap-3 xl:max-w-md">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Matched
                </p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-900">
                  {ambassadors.length}
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  By Role
                </p>
                <p className="mt-1 text-2xl font-extrabold text-blue-900">
                  {roleMatchedCount}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  journey.amb.
                </p>
                <p className="mt-1 text-2xl font-extrabold text-amber-900">
                  {emailMatchedCount}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/admin/customer-intelligence"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#cfe4c8] bg-white px-4 py-2 text-sm font-black text-[#0D5C3A] shadow-sm transition hover:bg-[#eef7ea]"
            >
              Pet Parent Registry
            </Link>
            <Link
              href="/admin/gurus"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#cfe4c8] bg-white px-4 py-2 text-sm font-black text-[#0D5C3A] shadow-sm transition hover:bg-[#eef7ea]"
            >
              Guru Registry
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0D5C3A] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#09472d]"
            >
              All Users
            </Link>
          </div>
        </section>

        {loadErrors.length > 0 ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h2 className="text-lg font-extrabold">Data load warning</h2>
                <p className="mt-1 text-sm">
                  One or more verified endpoints returned an error. The registry
                  still renders with whatever rows were available.
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {loadErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-[#dbe8d5] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2ecd9] p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#0D5C3A]" />
              <div>
                <h2 className="text-lg font-extrabold text-[#102819]">
                  Ambassador records
                </h2>
                <p className="text-sm font-semibold text-slate-600">
                  {ambassadors.length} profile
                  {ambassadors.length === 1 ? "" : "s"} matched from profiles +
                  user_roles
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-[#f0f7ed] px-3 py-2 text-xs font-black text-[#0D5C3A]">
              <ShieldCheck className="h-3.5 w-3.5" />
              No ambassadors table queries
            </span>
          </div>

          {ambassadors.length === 0 ? (
            <div className="p-6 text-sm font-semibold text-slate-600">
              No Ambassador records matched yet. Looking for profiles where
              email includes <code>journey.amb.</code> or role equals{" "}
              <code>ambassador</code>.
            </div>
          ) : (
            <div className="grid gap-4 p-4 sm:p-5">
              {ambassadors.map((row) => {
                const location = [row.city, row.state, row.zipCode]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <article
                    key={row.id}
                    className="rounded-[1.6rem] border border-[#e2ecd9] bg-white p-4 shadow-sm transition hover:border-[#b9d5b7] hover:shadow-md sm:p-5"
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
                      <div className="flex min-w-0 gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#e8f5e9] ring-1 ring-[#dbe8d5]">
                          <div className="absolute inset-0 bg-white" />
                          {row.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.avatarUrl}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover object-center"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-[#0D5C3A]">
                              {getInitials(row.fullName)}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-black text-[#102819]">
                              {row.fullName}
                            </p>
                            <MatchBadge reason={row.matchReason} />
                          </div>

                          <p className="mt-1 flex items-center gap-1.5 break-words text-sm font-semibold text-slate-600">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            {row.email || "No email saved"}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {row.phone || "No phone saved"}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[#0D5C3A]">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {location || "No location saved"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-2xl bg-[#f5f8f3] px-3 py-2">
                            <p className="font-black uppercase tracking-wide text-slate-500">
                              Role
                            </p>
                            <p className="mt-1 font-bold text-[#102819]">
                              {row.role || "—"}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[#f5f8f3] px-3 py-2">
                            <p className="font-black uppercase tracking-wide text-slate-500">
                              Account type
                            </p>
                            <p className="mt-1 font-bold text-[#102819]">
                              {row.accountType || "—"}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[#f5f8f3] px-3 py-2">
                            <p className="font-black uppercase tracking-wide text-slate-500">
                              Referral code
                            </p>
                            <p className="mt-1 font-bold text-[#102819]">
                              {row.referralCode || "—"}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[#f5f8f3] px-3 py-2">
                            <p className="font-black uppercase tracking-wide text-slate-500">
                              Created
                            </p>
                            <p className="mt-1 font-bold text-[#102819]">
                              {formatDate(row.createdAt)}
                            </p>
                          </div>
                        </div>

                        {row.assignedRoles.length > 0 ? (
                          <p className="text-xs font-semibold text-slate-600">
                            user_roles:{" "}
                            <span className="font-bold text-[#102819]">
                              {row.assignedRoles.join(", ")}
                            </span>
                          </p>
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={buildLifecycleHref(row)}
                            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-[#0D5C3A] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#09472d]"
                          >
                            Account Lifecycle
                          </Link>
                          <Link
                            href={buildMessageHref(row)}
                            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl border border-[#cfe4c8] bg-white px-4 py-2 text-xs font-black text-[#0D5C3A] shadow-sm transition hover:bg-[#eef7ea]"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Message
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
