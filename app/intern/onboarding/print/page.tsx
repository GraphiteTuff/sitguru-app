import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InternConfidentialityNotice from "@/components/internship/InternConfidentialityNotice";
import InternPrintButton from "@/components/internship/InternPrintButton";
import { internSchoolEmphasis } from "@/lib/internship/intern-tools";
import { INTERNSHIP_ONBOARDING_PATH } from "@/lib/internship/onboarding";
import { findInternByAccount, getInternWorkspace } from "@/lib/internship/queries";

export const dynamic = "force-dynamic";

export default async function InternOnboardingPrintPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/intern/login?next=/intern/onboarding/print");

  const intern = await findInternByAccount({
    userId: user.id,
    email: user.email,
  });
  if (!intern) redirect("/intern/login");
  const workspace = await getInternWorkspace(intern.id);
  const school = internSchoolEmphasis({
    university: workspace?.university,
    campus: workspace?.campus,
    intern,
    cohort: workspace?.cohort,
  });
  const signedOn = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 print:max-w-none print:px-0 print:py-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <a
          href={INTERNSHIP_ONBOARDING_PATH}
          className="text-sm font-black text-emerald-800"
        >
          Back to onboarding
        </a>
        <InternPrintButton />
      </div>
      <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 print:rounded-none print:border-0 print:p-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
          SitGuru Internship · print, sign, and return
        </p>
        <InternConfidentialityNotice />
        <div className="mt-8 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2">
          <p className="text-sm font-semibold text-slate-700">
            Intern legal name: {intern.fullName}
          </p>
          <p className="text-sm font-semibold text-slate-700">
            School: {school.school || "SitGuru intern"}
          </p>
          <p className="text-sm font-semibold text-slate-700">
            Program: {school.program || intern.academicProgram || "—"}
          </p>
          <p className="text-sm font-semibold text-slate-700">Date: {signedOn}</p>
        </div>
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              Wet-ink signature
            </p>
            <div className="mt-8 border-b border-slate-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              Printed name
            </p>
            <div className="mt-8 border-b border-slate-400" />
          </div>
        </div>
        <p className="mt-6 text-xs font-semibold text-slate-500">
          After signing, scan or photograph this page and upload it on intern onboarding.
          SitGuru stores that file privately.
        </p>
      </section>
    </main>
  );
}
