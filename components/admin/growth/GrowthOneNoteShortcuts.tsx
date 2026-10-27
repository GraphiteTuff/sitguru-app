import { BookOpen, ExternalLink } from "lucide-react";
import {
  sitguruOneNoteNotebookHref,
  sitguruOneNoteShortcuts,
  SITGURU_ONENOTE_NOTEBOOK,
} from "@/lib/admin/growth/onenote-notebook";
import { isSitGuruWorkEmail } from "@/lib/admin/growth/teams-access";

/**
 * OneNote section shortcuts for Ava, Jason, and Danette
 * (SitGuru - Marketing & Community Growth Notebook).
 */
export default function GrowthOneNoteShortcuts({
  email = null,
  compact = false,
}: {
  email?: string | null;
  compact?: boolean;
}) {
  if (!isSitGuruWorkEmail(email)) return null;

  const shortcuts = sitguruOneNoteShortcuts({
    email,
    includePlaybookPages: !compact,
  });
  if (!shortcuts.length) return null;

  const notebookHref = sitguruOneNoteNotebookHref();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-[#F5F3FF] px-4 py-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-sm font-black text-[#0F2744]">
            <BookOpen size={16} className="text-[#7C3AED]" />
            OneNote · {SITGURU_ONENOTE_NOTEBOOK.shortName}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Shared working knowledge for Ava, Jason, and Danette. Meeting notes
            and learnings live here — official files stay in SharePoint.
          </p>
        </div>
        {notebookHref ? (
          <a
            href={notebookHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#7C3AED] px-4 text-sm font-bold !text-white"
          >
            Open Notebook
            <ExternalLink size={14} />
          </a>
        ) : (
          <p className="max-w-xs text-xs font-semibold text-slate-500">
            Set{" "}
            <code className="text-[10px]">
              NEXT_PUBLIC_SITGURU_ONENOTE_GROWTH_URL
            </code>{" "}
            (and optional section URLs) to enable direct opens.
          </p>
        )}
      </div>

      <ul className={`grid gap-2 ${compact ? "" : "sm:grid-cols-2"}`}>
        {shortcuts.map((section) => (
          <li
            key={section.id}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-black text-[#0F2744]">{section.name}</p>
              {section.configured ? (
                <a
                  href={section.href}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-sm font-bold text-[#7C3AED]"
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
                {section.purpose}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
