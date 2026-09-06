import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InternConfidentialityNotice from "@/components/internship/InternConfidentialityNotice";
import InternPrintButton from "@/components/internship/InternPrintButton";
import SiteLogo from "@/components/SiteLogo";
import { internSchoolEmphasis } from "@/lib/internship/intern-tools";
import {
  INTERN_ONBOARDING_INBOX,
  INTERNSHIP_ONBOARDING_PATH,
} from "@/lib/internship/onboarding";
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
    <main className="intern-signature-sheet mx-auto max-w-[8.5in] bg-white px-4 py-6 print:max-w-none print:p-0">
      <style>{`
        @media print {
          @page { size: letter portrait; margin: 0.4in; }
          html, body { background: #fff !important; }
          header, footer, .print\\:hidden, #crisp-chatbox { display: none !important; }
        }
      `}</style>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <a href={INTERNSHIP_ONBOARDING_PATH} className="text-sm font-black text-emerald-800">
          Back to onboarding
        </a>
        <InternPrintButton label="Print" />
      </div>
      <section className="border border-emerald-100 bg-white p-4 print:border-0 print:p-0">
        <div className="flex items-start justify-between gap-3 border-b border-emerald-100 pb-2">
          <SiteLogo href="" wrapperClassName="w-[140px]" imageClassName="h-10 w-auto" />
          <p className="text-right text-[9px] font-black uppercase tracking-[0.14em] text-emerald-800">
            Signature page
            <br />
            Return to {INTERN_ONBOARDING_INBOX}
          </p>
        </div>
        <InternConfidentialityNotice printSheet />
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 text-[10px] font-semibold text-slate-700">
          <p>Intern legal name: {intern.fullName}</p>
          <p>School: {school.school || "SitGuru intern"}</p>
          <p>Program: {school.program || intern.academicProgram || "—"}</p>
          <p>Date: {signedOn}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-800">
              Wet-ink signature
            </p>
            <div className="mt-6 border-b border-slate-400" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-800">
              Printed name
            </p>
            <div className="mt-6 border-b border-slate-400" />
          </div>
        </div>
        <p className="mt-3 text-[9px] font-semibold text-slate-500">
          After signing, upload this page and click Submit. Email confirmation will
          be sent to your email on file.
        </p>
      </section>
    </main>
  );
}
