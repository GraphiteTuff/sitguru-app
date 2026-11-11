import { READS_DISCLOSURE_COPY } from "@/lib/reads/constants";
import type { ReadsDisclosureLabel } from "@/lib/reads/types";

export default function DisclosureBadge({
  label,
}: {
  label?: ReadsDisclosureLabel | null;
}) {
  if (!label || label === "none") return null;
  const copy = READS_DISCLOSURE_COPY[label];
  if (!copy) return null;

  const tone =
    label === "sponsored"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : label === "partner_feature"
        ? "border-sky-300 bg-sky-50 text-sky-900"
        : "border-blue-300 bg-emerald-50 text-emerald-800";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${tone}`}
    >
      {copy}
    </span>
  );
}
