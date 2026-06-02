import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AcademyType = "pet_parent" | "guru" | "ambassador";

type ProfileRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  created_at?: string | null;
};

type AcademyAssignment = {
  id: string;
  user_id: string;
  academy_type: AcademyType | string;
  assigned_at?: string | null;
  is_active?: boolean | null;
  completed_at?: string | null;
  certificate_issued?: boolean | null;
};

type TrainingStep = {
  id: string;
  academy_type?: AcademyType | string | null;
  is_active?: boolean | null;
  is_required?: boolean | null;
};

const superAdminEmails = ["jason@sitguru.com", "nette@sitguru.com"];

const adminRoutes = {
  dashboard: "/admin",
  hr: "/admin/hr",
  trainingManager: "/admin/ambassador-training",
  universityAssignments: "/admin/university-assignments",
};

const academyOptions: {
  value: AcademyType;
  label: string;
  shortLabel: string;
  emoji: string;
  credential: string;
  description: string;
}[] = [
  {
    value: "pet_parent",
    label: "Pet Parent Academy",
    shortLabel: "Pet Parent",
    emoji: "🐾",
    credential: "Certified Pet Parent",
    description:
      "Profile setup, pet profiles, Guru search, booking, reviews, and safety.",
  },
  {
    value: "guru",
    label: "Guru Academy",
    shortLabel: "Guru",
    emoji: "🎓",
    credential: "Certified Guru",
    description:
      "Guru profile, bookings, care standards, Stripe payouts, earnings, and success tools.",
  },
  {
    value: "ambassador",
    label: "Ambassador Academy",
    shortLabel: "Ambassador",
    emoji: "🌟",
    credential: "Certified Ambassador",
    description:
      "Referral links, outreach, dashboard, PawPerks, Stripe, rewards, and compliance.",
  },
];

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAcademyType(value?: string | null): AcademyType {
  const normalized = asString(value).toLowerCase();

  if (normalized === "pet_parent" || normalized === "pet-parent") {
    return "pet_parent";
  }

  if (normalized === "guru") return "guru";

  return "ambassador";
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDisplayName(profile: ProfileRow) {
  const fullName = asString(profile.full_name);
  const firstName = asString(profile.first_name);
  const lastName = asString(profile.last_name);

  if (fullName) return fullName;
  if (firstName || lastName) return `${firstName} ${lastName}`.trim();
  return asString(profile.email) || "Unnamed user";
}

function getInitials(profile: ProfileRow) {
  const name = getDisplayName(profile);
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getNotice(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const updated = asString(searchParams?.updated);
  const error = asString(searchParams?.error);

  if (updated === "success") {
    return {
      tone: "success" as const,
      title: "Academy assignments updated",
      message: "The selected academies were saved for this user.",
    };
  }

  if (error) {
    return {
      tone: "error" as const,
      title: "Assignment update failed",
      message:
        "The academy assignment could not be saved. Confirm the academy_assignments table exists in Supabase.",
    };
  }

  return null;
}

async function requireSuperAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  const email = asString(user.email).toLowerCase();

  if (!superAdminEmails.includes(email)) {
    redirect("/admin/login");
  }

  return user;
}

async function updateAcademyAssignments(formData: FormData) {
  "use server";

  const adminUser = await requireSuperAdmin();

  const userId = asString(formData.get("user_id"));
  const selectedAcademies = formData
    .getAll("academy_type")
    .map((value) => normalizeAcademyType(asString(value)));

  if (!userId) {
    redirect(`${adminRoutes.universityAssignments}?error=missing-user`);
  }

  const { error: deleteError } = await supabaseAdmin
    .from("academy_assignments")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    console.warn("Unable to clear academy assignments:", deleteError);
    redirect(`${adminRoutes.universityAssignments}?error=delete`);
  }

  if (selectedAcademies.length > 0) {
    const now = new Date().toISOString();

    const rows = selectedAcademies.map((academyType) => ({
      user_id: userId,
      academy_type: academyType,
      assigned_by: adminUser.id,
      assigned_at: now,
      is_active: true,
      certificate_issued: false,
      created_at: now,
      updated_at: now,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("academy_assignments")
      .insert(rows);

    if (insertError) {
      console.warn("Unable to save academy assignments:", insertError);
      redirect(`${adminRoutes.universityAssignments}?error=insert`);
    }
  }

  revalidatePath(adminRoutes.universityAssignments);
  revalidatePath("/customer/dashboard");
  revalidatePath("/guru/dashboard");
  revalidatePath("/ambassador/dashboard");

  redirect(`${adminRoutes.universityAssignments}?user=${userId}&updated=success`);
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UniversityAssignmentsPage({
  searchParams,
}: PageProps) {
  await requireSuperAdmin();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const notice = getNotice(resolvedSearchParams);
  const query = asString(resolvedSearchParams?.q);
  const selectedUserId = asString(resolvedSearchParams?.user);

  let profilesQuery = supabaseAdmin
    .from("profiles")
    .select("id,email,full_name,first_name,last_name,role,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (query) {
    profilesQuery = profilesQuery.or(
      `email.ilike.%${query}%,full_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`,
    );
  }

  const [{ data: profilesResult }, { data: assignmentsResult }, { data: stepsResult }] =
    await Promise.all([
      profilesQuery,
      supabaseAdmin
        .from("academy_assignments")
        .select("*")
        .order("assigned_at", { ascending: false }),
      supabaseAdmin
        .from("ambassador_training_steps")
        .select("id,academy_type,is_active,is_required"),
    ]);

  const profiles = (profilesResult || []) as ProfileRow[];
  const assignments = (assignmentsResult || []) as AcademyAssignment[];
  const trainingSteps = (stepsResult || []) as TrainingStep[];

  const selectedProfile =
    profiles.find((profile) => profile.id === selectedUserId) || profiles[0] || null;

  const assignmentsByUser = new Map<string, AcademyAssignment[]>();

  assignments.forEach((assignment) => {
    const list = assignmentsByUser.get(assignment.user_id) || [];
    list.push(assignment);
    assignmentsByUser.set(assignment.user_id, list);
  });

  const stepCountsByAcademy = academyOptions.reduce(
    (acc, academy) => {
      const steps = trainingSteps.filter(
        (step) =>
          normalizeAcademyType(step.academy_type) === academy.value &&
          step.is_active !== false &&
          step.is_required !== false,
      );

      acc[academy.value] = steps.length;
      return acc;
    },
    {} as Record<AcademyType, number>,
  );

  const selectedAssignments = selectedProfile
    ? assignmentsByUser.get(selectedProfile.id) || []
    : [];

  const selectedAssignedAcademies = new Set(
    selectedAssignments.map((assignment) =>
      normalizeAcademyType(assignment.academy_type),
    ),
  );

  const totalAssigned = assignments.filter(
    (assignment) => assignment.is_active !== false,
  ).length;

  return (
    <main className="min-h-screen bg-[#f8fbf6] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <section className="rounded-[30px] border border-green-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <Link
                href={adminRoutes.hr}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-2 text-xs font-black text-green-900 transition hover:bg-green-100 sm:text-sm"
              >
                <ArrowLeft size={16} />
                Back to HR
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-green-800 text-white">
                  <GraduationCap size={28} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                    Admin / SitGuru University
                  </p>
                  <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-5xl">
                    Academy Assignment Manager
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-5xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
                Assign Pet Parent Academy, Guru Academy, Ambassador Academy, or
                multiple academies to any SitGuru user. This controls which
                training path, progress tracker, badge, and certificate the user
                should receive.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href={adminRoutes.trainingManager}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
              >
                <BookOpenCheck size={17} />
                Training Manager
              </Link>

              <Link
                href={adminRoutes.dashboard}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                <ShieldCheck size={17} />
                Admin Dashboard
              </Link>
            </div>
          </div>
        </section>

        {notice ? (
          <section
            className={`rounded-[24px] border p-4 text-sm font-bold leading-6 ${
              notice.tone === "success"
                ? "border-green-100 bg-green-50 text-green-900"
                : "border-red-100 bg-red-50 text-red-800"
            }`}
          >
            <p className="font-black">{notice.title}</p>
            <p className="mt-1">{notice.message}</p>
          </section>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Users size={20} />}
            label="Users Loaded"
            value={profiles.length.toString()}
            detail="Current search results"
          />
          <MetricCard
            icon={<BadgeCheck size={20} />}
            label="Active Assignments"
            value={totalAssigned.toString()}
            detail="All academy assignments"
          />
          <MetricCard
            icon={<BookOpenCheck size={20} />}
            label="Pet Parent Steps"
            value={(stepCountsByAcademy.pet_parent || 0).toString()}
            detail="Required active steps"
          />
          <MetricCard
            icon={<GraduationCap size={20} />}
            label="Guru + Ambassador"
            value={`${stepCountsByAcademy.guru || 0} / ${
              stepCountsByAcademy.ambassador || 0
            }`}
            detail="Required active steps"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
          <DashboardCard>
            <div className="mb-5">
              <SectionHeader
                icon={<Search size={22} />}
                title="Find User"
                detail="Search by name or email, then assign one or more SitGuru University academies."
              />
            </div>

            <form className="mb-5 grid gap-3">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search name or email..."
                className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
              />

              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                <Search size={17} />
                Search Users
              </button>
            </form>

            <div className="grid gap-3">
              {profiles.length ? (
                profiles.map((profile) => {
                  const active = selectedProfile?.id === profile.id;
                  const userAssignments =
                    assignmentsByUser.get(profile.id) || [];

                  return (
                    <Link
                      key={profile.id}
                      href={`${adminRoutes.universityAssignments}?user=${profile.id}${
                        query ? `&q=${encodeURIComponent(query)}` : ""
                      }`}
                      className={`rounded-[22px] border p-4 transition ${
                        active
                          ? "border-green-300 bg-green-50 ring-4 ring-green-100"
                          : "border-[#dfe9e2] bg-white hover:bg-green-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-800 text-sm font-black text-white">
                          {getInitials(profile)}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-base font-black text-green-950">
                            {getDisplayName(profile)}
                          </h3>
                          <p className="truncate text-xs font-bold text-slate-500">
                            {profile.email || "No email saved"}
                          </p>
                          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-green-700">
                            {profile.role || "No role saved"}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-1">
                            {userAssignments.length ? (
                              userAssignments.map((assignment) => {
                                const academy = academyOptions.find(
                                  (option) =>
                                    option.value ===
                                    normalizeAcademyType(
                                      assignment.academy_type,
                                    ),
                                );

                                return (
                                  <span
                                    key={assignment.id}
                                    className="rounded-full border border-green-100 bg-white px-2 py-1 text-[10px] font-black text-green-900"
                                  >
                                    {academy?.emoji} {academy?.shortLabel}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-500">
                                No academies
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-green-200 bg-green-50 p-5 text-center">
                  <p className="text-sm font-black text-green-950">
                    No users found
                  </p>
                </div>
              )}
            </div>
          </DashboardCard>

          <DashboardCard>
            {selectedProfile ? (
              <div className="space-y-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                      Selected User
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">
                      {getDisplayName(selectedProfile)}
                    </h2>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {selectedProfile.email || "No email saved"}
                    </p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                      Role: {selectedProfile.role || "Not saved"} · Joined{" "}
                      {formatDate(selectedProfile.created_at)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-black text-green-900">
                    {selectedAssignments.length} assigned academies
                  </div>
                </div>

                <form action={updateAcademyAssignments} className="grid gap-4">
                  <input
                    type="hidden"
                    name="user_id"
                    value={selectedProfile.id}
                  />

                  <div className="grid gap-4 lg:grid-cols-3">
                    {academyOptions.map((academy) => {
                      const assigned = selectedAssignedAcademies.has(
                        academy.value,
                      );
                      const assignment = selectedAssignments.find(
                        (row) =>
                          normalizeAcademyType(row.academy_type) ===
                          academy.value,
                      );

                      return (
                        <label
                          key={academy.value}
                          className={`cursor-pointer rounded-[26px] border p-5 transition ${
                            assigned
                              ? "border-green-300 bg-green-50 ring-4 ring-green-100"
                              : "border-[#dfe9e2] bg-white hover:bg-green-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              name="academy_type"
                              value={academy.value}
                              defaultChecked={assigned}
                              className="mt-1 h-5 w-5 rounded border-green-300 text-green-800"
                            />

                            <div>
                              <p className="text-3xl">{academy.emoji}</p>
                              <h3 className="mt-2 text-xl font-black text-green-950">
                                {academy.label}
                              </h3>
                              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                                {academy.description}
                              </p>

                              <div className="mt-4 rounded-2xl border border-green-100 bg-white p-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                                  Credential
                                </p>
                                <p className="mt-1 text-sm font-black text-green-950">
                                  {academy.credential}
                                </p>
                              </div>

                              <div className="mt-3 grid gap-2">
                                <MiniStat
                                  label="Required Steps"
                                  value={(
                                    stepCountsByAcademy[academy.value] || 0
                                  ).toString()}
                                />
                                <MiniStat
                                  label="Assigned"
                                  value={assignment ? "Yes" : "No"}
                                />
                                <MiniStat
                                  label="Certificate"
                                  value={
                                    assignment?.certificate_issued
                                      ? "Issued"
                                      : "Not issued"
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
                  >
                    <UserCheck size={17} />
                    Save Academy Assignments
                  </button>
                </form>

                <div className="rounded-[26px] border border-green-100 bg-green-50 p-5">
                  <h3 className="text-lg font-black text-green-950">
                    Assignment Rule
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-green-900/80">
                    A user may have one academy or multiple academies. For
                    example, a Guru who is also an Ambassador should receive
                    both Guru Academy and Ambassador Academy. A Pet Parent who
                    later becomes a Guru can keep Pet Parent Academy and add
                    Guru Academy.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-green-200 bg-green-50 p-6 text-center">
                <CheckCircle2 className="mx-auto mb-3 text-green-700" size={36} />
                <h2 className="text-lg font-black text-green-950">
                  Select a user
                </h2>
                <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-green-900/75">
                  Search for a SitGuru user and choose which academy or
                  academies they should complete.
                </p>
              </div>
            )}
          </DashboardCard>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-[#dfe9e2] bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6">
      {children}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-2xl font-black text-green-950">{title}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          {detail}
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#dfe9e2] bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-green-950">{value}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-green-950">{value}</p>
    </div>
  );
}