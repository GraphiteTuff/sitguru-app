import { paymentStatusTone } from "@/lib/staff-time/status";

const TONE: Record<string, string> = {
  neutral: "bg-slate-100 text-slate-800 ring-slate-200",
  amber: "bg-amber-50 text-amber-950 ring-amber-200",
  emerald: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  sky: "bg-sky-50 text-sky-950 ring-sky-200",
  rose: "bg-rose-50 text-rose-900 ring-rose-200",
};

export default function StatusChip({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  const tone = paymentStatusTone(status);
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ring-1 ${TONE[tone]}`}
    >
      {label}
    </span>
  );
}
