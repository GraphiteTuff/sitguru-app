import { submitSurveyAnswer } from "@/lib/manager-growth/actions";
import { loadPublicSurvey } from "@/lib/manager-growth/data";
import { surveyIsOpen } from "@/lib/manager-growth/model";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function PublicSurveyPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { code } = await params;
  const query = searchParams ? await searchParams : {};
  const survey = await loadPublicSurvey(code);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const open = survey ? surveyIsOpen({
    status: String(survey.status || ""),
    startOn: String(survey.start_on || ""),
    endOn: String(survey.end_on || ""),
    today,
  }) : false;
  const choices = Array.isArray(survey?.choices) ? survey.choices.map((item) => String(item)) : [];
  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#2563EB]">SitGuru</p>
      <h1 className="mt-2 text-3xl font-black text-[#0F2744]">{survey ? String(survey.title) : "Poll not found"}</h1>
      {first(query.ok) ? <p className="mt-4 text-sm font-semibold text-[#166534]">Answer saved. Thank you.</p> : null}
      {first(query.error) ? <p className="mt-4 text-sm font-semibold text-rose-700">{first(query.error)}</p> : null}
      {survey && open ? (
        <form action={submitSurveyAnswer} className="mt-4 grid gap-3">
          <input type="hidden" name="code" value={code} />
          <input name="company" className="hidden" tabIndex={-1} autoComplete="off" />
          <p className="text-sm font-semibold text-slate-700">{String(survey.question)}</p>
          {choices.map((choice) => (
            <label key={choice} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold">
              <input type="radio" name="choice" value={choice} required /> {choice}
            </label>
          ))}
          <textarea name="note" rows={3} placeholder="Optional note" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <button className="min-h-11 rounded-full bg-[#0D5C3A] text-sm font-bold !text-white">Send answer</button>
        </form>
      ) : survey ? <p className="mt-4 text-sm font-semibold text-slate-600">This poll is not open.</p> : null}
    </main>
  );
}
