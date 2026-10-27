import { ExternalLink, FolderOpen, Lock } from "lucide-react";
import {
  sharePointSectionsForShortcuts,
  sitguruSharePointLibraryHref,
  sitguruSharePointShortcuts,
  SITGURU_SHAREPOINT_LIBRARY,
} from "@/lib/admin/growth/sharepoint-files";
import { isSitGuruWorkEmail } from "@/lib/admin/growth/teams-access";

/**
 * SharePoint Documents shortcuts for Ava, Jason, and Danette
 * (SitGuru | Marketing & Community Growth).
 */
export default function GrowthSharePointShortcuts({
  email = null,
  includeLeadership = true,
  section,
  compact = false,
}: {
  email?: string | null;
  /** Leadership library — Jason, Danette, Ava. */
  includeLeadership?: boolean;
  section?: string;
  compact?: boolean;
}) {
  if (!isSitGuruWorkEmail(email)) return null;

  const shortcuts = sitguruSharePointShortcuts({
    email,
    includeLeadership,
    section,
  });
  if (!shortcuts.length) return null;

  const libraryHref = sitguruSharePointLibraryHref();
  const sections = sharePointSectionsForShortcuts(shortcuts);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-[#EFF6FF] px-4 py-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-sm font-black text-[#0F2744]">
            <FolderOpen size={16} className="text-[#2563EB]" />
            SharePoint · {SITGURU_SHAREPOINT_LIBRARY.team}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Documents shortcuts for Ava, Jason, and Danette. Files stay in
            SharePoint — SitGuru links the working folders.
          </p>
        </div>
        {libraryHref ? (
          <a
            href={libraryHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#1D4ED8] px-4 text-sm font-bold !text-white"
          >
            Open Documents
            <ExternalLink size={14} />
          </a>
        ) : (
          <p className="max-w-xs text-xs font-semibold text-slate-500">
            Set{" "}
            <code className="text-[10px]">
              NEXT_PUBLIC_SITGURU_SHAREPOINT_GROWTH_URL
            </code>{" "}
            (and optional folder URLs) to enable direct opens.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {sections.map((sectionName) => {
          const rows = shortcuts.filter((item) => item.section === sectionName);
          return (
            <div key={sectionName}>
              <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#1D4ED8]">
                {sectionName}
                {sectionName.startsWith("Leadership") ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal text-slate-600">
                    <Lock size={10} /> Jason · Danette · Ava
                  </span>
                ) : null}
              </p>
              <ul className={`grid gap-2 ${compact ? "" : "sm:grid-cols-2"}`}>
                {rows.map((folder) => (
                  <li
                    key={folder.id}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-black text-[#0F2744]">
                        {folder.name}
                      </p>
                      {folder.configured ? (
                        <a
                          href={folder.href}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-sm font-bold text-[#2563EB]"
                        >
                          Open →
                        </a>
                      ) : (
                        <span className="shrink-0 text-[11px] font-bold text-slate-400">
                          URL pending
                        </span>
                      )}
                    </div>
                    {!compact ? (
                      <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                        {folder.purpose}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
