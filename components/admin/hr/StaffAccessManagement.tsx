import Link from "next/link";
import type { ReactNode } from "react";
import {
  resendStaffRegistrationInvite,
  setStaffInternEligibility,
  setStaffManagerPortalAccess,
  suspendStaffManagerAccess,
} from "@/lib/admin/hr/staff-access-actions";
import type { StaffAccessSnapshot } from "@/lib/admin/hr/staff-access";
import {
  CheckCircle2,
  Clock3,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

const primary =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white";
const secondary =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800";
const danger =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-black text-rose-700";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function Badge({
  children,
  tone = "emerald",
}: {
  children: ReactNode;
  tone?: "emerald" | "sky" | "violet" | "amber" | "rose" | "slate";
}) {
  const map = {
    emerald: "bg-emerald-50 text-emerald-800",
    sky: "bg-sky-50 text-sky-800",
    violet: "bg-violet-50 text-violet-800",
    amber: "bg-amber-50 text-amber-800",
    rose: "bg-rose-50 text-rose-800",
    slate: "bg-slate-100 text-slate-700",
  } as const;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${map[tone]}`}>
      {children}
    </span>
  );
}

function Card({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#0D5C3A]">
            {icon}
          </span>
          <h3 className="text-base font-black text-slate-950">{title}</h3>
        </div>
        {action}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-right text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}

export default function StaffAccessManagement({
  staff,
  canEdit,
  notice = "",
  noticeError = "",
}: {
  staff: StaffAccessSnapshot;
  canEdit: boolean;
  notice?: string;
  noticeError?: string;
}) {
  const tabs = [
    { id: "overview", label: "Overview", active: true },
    { id: "roles", label: "Roles & Permissions" },
    { id: "microsoft", label: "Microsoft 365" },
    { id: "onboarding", label: "Onboarding" },
    { id: "interns", label: "Intern Management" },
    { id: "activity", label: "Activity & Audit" },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <p className="text-sm font-semibold text-slate-500">
        Admin HQ / Hiring & People / Staff Access & Roles
      </p>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-lg font-black text-[#0D5C3A]">
              {initials(staff.fullName)}
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-2xl font-black text-slate-950">
                {staff.fullName}
                {staff.accountActive ? <Badge>Active</Badge> : <Badge tone="rose">Inactive</Badge>}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{staff.jobTitle}</p>
              <p className="text-sm font-semibold text-slate-500">{staff.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {staff.roles
                  .filter((role) => role.enabled && role.key !== "admin")
                  .map((role) => (
                    <Badge
                      key={role.key}
                      tone={
                        role.key === "manager"
                          ? "emerald"
                          : role.key === "intern_preview"
                            ? "violet"
                            : "sky"
                      }
                    >
                      {role.label}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>
          <div className="space-y-3 text-sm font-semibold text-slate-600 lg:text-right">
            <p>Member since {staff.memberSince}</p>
            <p>Last sign in {staff.lastSignIn || "Not recorded"}</p>
            <p>Account status {staff.accountActive ? "Active" : "Inactive"}</p>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link href="/admin/hr" className={secondary}>
                Back to Team & Interns
              </Link>
              <Link href="/manager" className={primary}>
                View Full Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      {notice ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {notice}
        </p>
      ) : null}
      {noticeError ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {noticeError}
        </p>
      ) : null}

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ${
              tab.active
                ? "bg-[#0D5C3A] !text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      <div id="overview" className="grid scroll-mt-24 gap-4 xl:grid-cols-3">
        <Card title="Account Information" icon={<UserRound className="h-4 w-4" />}>
          <Row label="Full name" value={staff.fullName} />
          <Row label="Email" value={staff.email || "—"} />
          <Row label="Phone" value={staff.phone || "—"} />
          <Row label="Location" value={staff.location} />
          <Row label="Hire type" value={staff.hireType} />
          <Row label="Start date" value={staff.startDate || "—"} />
          <Row label="Auth identity" value={staff.userId.slice(0, 8) + "…"} />
        </Card>

        <Card title="Account Status" icon={<ShieldCheck className="h-4 w-4" />}>
          <Row
            label="Account"
            value={staff.accountActive ? <Badge>Active</Badge> : <Badge tone="rose">Inactive</Badge>}
          />
          <Row
            label="Email verified"
            value={
              staff.emailVerified == null ? (
                "—"
              ) : staff.emailVerified ? (
                <Badge>Verified</Badge>
              ) : (
                <Badge tone="amber">Pending</Badge>
              )
            }
          />
          <Row
            label="Manager Portal"
            value={
              staff.managerPortalActive ? (
                <Badge>Enabled</Badge>
              ) : (
                <Badge tone="amber">Disabled</Badge>
              )
            }
          />
          <Row
            label="Intern eligibility"
            value={
              staff.canManageInterns ? (
                <Badge tone="violet">Eligible</Badge>
              ) : (
                <Badge tone="slate">Off</Badge>
              )
            }
          />
          {canEdit ? (
            <form action={resendStaffRegistrationInvite} className="pt-1">
              <input type="hidden" name="userId" value={staff.userId} />
              <button type="submit" className={secondary}>
                Send secure registration invite
              </button>
            </form>
          ) : null}
        </Card>

        <Card title="Quick Actions" icon={<KeyRound className="h-4 w-4" />}>
          <Link href="/manager" className={`${primary} w-full`}>
            Open Manager Portal
          </Link>
          {canEdit ? (
            <>
              <form action={setStaffManagerPortalAccess}>
                <input type="hidden" name="userId" value={staff.userId} />
                <input type="hidden" name="enable" value={staff.managerPortalActive ? "0" : "1"} />
                <button type="submit" className={`${secondary} w-full`}>
                  {staff.managerPortalActive ? "Disable Manager Portal" : "Enable Manager Portal"}
                </button>
              </form>
              <form action={setStaffInternEligibility}>
                <input type="hidden" name="userId" value={staff.userId} />
                <input type="hidden" name="enable" value={staff.canManageInterns ? "0" : "1"} />
                <button type="submit" className={`${secondary} w-full`}>
                  {staff.canManageInterns
                    ? "Turn off Intern Preview eligibility"
                    : "Enable Intern Preview eligibility"}
                </button>
              </form>
              <form action={resendStaffRegistrationInvite}>
                <input type="hidden" name="userId" value={staff.userId} />
                <button type="submit" className={`${secondary} w-full`}>
                  Resend secure registration invite
                </button>
              </form>
              <form action={suspendStaffManagerAccess} className="space-y-2 rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
                <input type="hidden" name="userId" value={staff.userId} />
                <p className="text-xs font-semibold text-rose-800">
                  Suspend Manager access only. Type SUSPEND to confirm. Pet Parent and Ambassador stay.
                </p>
                <input
                  name="confirm"
                  placeholder="SUSPEND"
                  className="min-h-11 w-full rounded-xl border border-rose-200 bg-white px-3 text-sm font-bold"
                />
                <button type="submit" className={`${danger} w-full`}>
                  Suspend Access
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm font-semibold text-slate-500">
              Only a Super Admin can change roles on this page.
            </p>
          )}
        </Card>
      </div>

      <div id="roles" className="grid scroll-mt-24 gap-4 xl:grid-cols-3">
        <Card title="Roles & Permissions" icon={<ShieldCheck className="h-4 w-4" />}>
          {staff.roles.map((role) => (
            <Row
              key={role.key}
              label={role.label}
              value={
                role.enabled ? (
                  <Badge tone={role.key === "admin" ? "rose" : "emerald"}>
                    {role.key === "admin" ? "Present" : "Enabled"}
                  </Badge>
                ) : (
                  <Badge tone="slate">Disabled</Badge>
                )
              }
            />
          ))}
          <p className="text-xs font-semibold leading-5 text-slate-500">
            Assigned Intern Preview is manager eligibility only. It never creates an Intern student identity.
          </p>
        </Card>

        <div id="microsoft" className="scroll-mt-24">
          <Card title="Microsoft 365" icon={<Mail className="h-4 w-4" />}>
            <Row label="Status" value={<Badge tone="amber">{staff.microsoft.status}</Badge>} />
            <p className="text-sm font-semibold text-slate-600">{staff.microsoft.detail}</p>
            <Link href="/admin/hr/microsoft" className={secondary}>
              Open Microsoft readiness
            </Link>
          </Card>
        </div>

        <div id="onboarding" className="scroll-mt-24">
          <Card title="Onboarding Progress" icon={<CheckCircle2 className="h-4 w-4" />}>
            <ul className="space-y-2">
              {staff.onboarding.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-700">{item.label}</span>
                  {item.tone === "done" ? (
                    <Badge>Complete</Badge>
                  ) : (
                    <Badge tone="amber">Pending</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div id="interns" className="grid scroll-mt-24 gap-4 xl:grid-cols-3">
        <Card title="Intern Management" icon={<Users className="h-4 w-4" />}>
          <Row
            label="Eligible to manage interns"
            value={staff.canManageInterns ? "Yes" : "No"}
          />
          <Row label="Assigned interns" value={String(staff.assignedInterns.length)} />
          <Row label="Can review check-ins" value={staff.canManageInterns ? "Yes" : "No"} />
          <Row label="Can approve hours" value={staff.canManageInterns ? "Yes" : "No"} />
          <Row label="Can provide feedback" value={staff.canManageInterns ? "Yes" : "No"} />
        </Card>

        <Card title="Assigned Interns" icon={<Users className="h-4 w-4" />}>
          {staff.assignedInterns.length ? (
            staff.assignedInterns.map((intern) => (
              <Link
                key={intern.id}
                href={`/admin/internship/interns/${intern.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-3 py-2 hover:border-emerald-200 hover:bg-emerald-50/40"
              >
                <span>
                  <span className="block text-sm font-black text-slate-950">{intern.fullName}</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {intern.universityName}
                  </span>
                </span>
                <Badge
                  tone={
                    intern.statusLabel.toLowerCase().includes("prospective")
                      ? "violet"
                      : intern.statusLabel.toLowerCase().includes("pending")
                        ? "amber"
                        : "emerald"
                  }
                >
                  {intern.statusLabel}
                </Badge>
              </Link>
            ))
          ) : (
            <p className="text-sm font-semibold text-slate-500">
              No interns are assigned to this manager yet.
            </p>
          )}
        </Card>

        <div id="activity" className="scroll-mt-24">
          <Card title="Recent Activity" icon={<Clock3 className="h-4 w-4" />}>
            {staff.activity.length ? (
              <ul className="space-y-3">
                {staff.activity.map((row) => (
                  <li key={row.id} className="text-sm">
                    <p className="font-bold text-slate-950">{row.action}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString()
                        : "—"}
                      {row.actorEmail ? ` · ${row.actorEmail}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-semibold text-slate-500">
                No staff access audit events are recorded yet.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
