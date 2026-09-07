import { internGhostBtnClass } from "@/lib/internship/intern-ui";
import { INTERN_HELP_FILES, internHelpFileHref } from "@/lib/internship/intern-help";

export default function InternHelpFileDownloads({
  ids,
}: {
  ids?: Array<(typeof INTERN_HELP_FILES)[number]["id"]>;
}) {
  const files = ids
    ? INTERN_HELP_FILES.filter((file) => ids.includes(file.id))
    : INTERN_HELP_FILES;
  if (!files.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {files.map((file) => (
        <a
          key={file.id}
          href={internHelpFileHref(file.filename)}
          className={`${internGhostBtnClass} min-h-11 px-4 text-xs`}
        >
          Download {file.title}
        </a>
      ))}
    </div>
  );
}
