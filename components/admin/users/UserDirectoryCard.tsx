import Link from "next/link";
import type { DirectoryUser } from "@/lib/admin/users/types";
import { riskBadgeClass, statusBadgeClass } from "@/lib/admin/users/normalize";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "SG";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function UserDirectoryCard({ user }: { user: DirectoryUser }) {
  const email = user.email && user.email !== "—" ? user.email : null;
  const phone = user.phone || null;

  return (
    <article className="rounded-[1.5rem] border border-[#e3ece5] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-emerald-50"
              />
            ) : (
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-black text-emerald-800 ring-2 ring-emerald-100">
                {initials(user.name || "SitGuru User")}
              </span>
            )}

            <div className="min-w-0">
              <h3 className="truncate text-lg font-black text-slate-950">
                {user.name || "SitGuru User"}
              </h3>
              <p className="mt-1 break-all text-sm font-semibold text-slate-600">
                {email || "No email on file"}
              </p>
              {phone ? (
                <p className="mt-1 text-sm font-semibold text-slate-500">{phone}</p>
              ) : null}
              <p className="mt-1 max-w-[320px] truncate text-xs font-semibold text-slate-400">
                {user.id}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
              {user.role}
            </span>
            {user.hqRole ? (
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                HQ {user.hqRole.replaceAll("_", " ")}
              </span>
            ) : null}
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusBadgeClass(
                user.status,
              )}`}
            >
              {user.status}
            </span>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${riskBadgeClass(
                user.risk,
              )}`}
            >
              Risk {user.risk}
            </span>
            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-500">
              {user.source}
            </span>
            <span className="text-xs font-bold text-slate-400">
              Joined {user.joined}
            </span>
          </div>
        </div>

        <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-[320px] lg:grid-cols-1">
          <Link
            href={user.scopeHref}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
          >
            Scope Actions
          </Link>
          <Link
            href={user.messageHref}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-800"
          >
            Message
          </Link>
          <Link
            href={user.profileHref}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
          >
            Review
          </Link>
          {user.settingsHref ? (
            <Link
              href={user.settingsHref}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-xs font-black text-emerald-800 transition hover:bg-emerald-50"
            >
              Assign HQ Access
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
