import { PROGRAM_STATUS_LABELS, type ProgramStatus } from "@/lib/internship/program-status";

export default function ProgramStatusBanner({ status }: { status: ProgramStatus | null }) {
  return (
    <aside aria-label="Internship semester status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <strong>{status ? PROGRAM_STATUS_LABELS[status] : "Semester status unavailable"}</strong>
      {status === "pre_launch" ? <span className="ml-2">Official semester activities await manual activation. Operational work is available.</span> : null}
    </aside>
  );
}
