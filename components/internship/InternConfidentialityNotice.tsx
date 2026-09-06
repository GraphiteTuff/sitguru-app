import { INTERN_CONFIDENTIALITY_NOTICE } from "@/lib/internship/onboarding";

export default function InternConfidentialityNotice({
  compact = false,
  printSheet = false,
}: {
  compact?: boolean;
  printSheet?: boolean;
}) {
  const notice = INTERN_CONFIDENTIALITY_NOTICE;
  if (printSheet) {
    return (
      <article className="space-y-1.5 text-[10px] leading-snug text-slate-800">
        <header>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-800">
            {notice.employer}
          </p>
          <h2 className="mt-1 text-sm font-black text-slate-950">{notice.title}</h2>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-600">{notice.subtitle}</p>
        </header>
        {notice.sections.map((section) => (
          <section key={section.heading}>
            <h3 className="font-black text-slate-950">{section.heading}</h3>
            <p className="font-medium text-slate-700">{section.body}</p>
          </section>
        ))}
      </article>
    );
  }
  return (
    <article className={compact ? "space-y-4" : "space-y-5"}>
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
          {notice.employer}
        </p>
        <h2 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">
          {notice.title}
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">{notice.subtitle}</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{notice.intro}</p>
      </header>
      {notice.sections.map((section) => (
        <section key={section.heading}>
          <h3 className="text-sm font-black text-slate-950">{section.heading}</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{section.body}</p>
        </section>
      ))}
    </article>
  );
}
