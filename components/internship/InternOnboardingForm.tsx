import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import InternConfidentialityNotice from "@/components/internship/InternConfidentialityNotice";
import InternSignedPageUpload from "@/components/internship/InternSignedPageUpload";
import {
  acceptInternAccessRules,
  signInternConfidentiality,
  submitInternConfidentialityScan,
} from "@/lib/internship/actions";
import {
  INTERN_ACCESS_RULES,
  INTERN_ONBOARDING_STEPS,
  INTERNSHIP_ONBOARDING_PRINT_PATH,
  internOnboardingComplete,
  internOnboardingStep,
} from "@/lib/internship/onboarding";
import type { InternshipIntern, InternshipOnboarding } from "@/lib/internship/types";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default function InternOnboardingForm({
  intern,
  onboarding,
  notice,
}: {
  intern: InternshipIntern;
  onboarding: InternshipOnboarding | null;
  notice?: { kind: "ok" | "error"; message: string } | null;
}) {
  const complete = internOnboardingComplete(onboarding);
  const current = internOnboardingStep(onboarding);
  const accessDone = Boolean(onboarding?.accessRulesAcceptedAt);
  const signed = Boolean(onboarding?.electronicSignedAt);
  const uploaded = Boolean(onboarding?.wetInkUploadedAt && onboarding?.wetInkStoragePath);
  const submitted = Boolean(onboarding?.wetInkSubmittedAt);

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-3 py-5 sm:px-5">
      <section
        className="public-dark-section rounded-[1.75rem] p-5 sm:p-6"
        data-brand-green
        style={{ background: "#0D5C3A" }}
      >
        <p className="text-[11px] font-black uppercase tracking-[0.2em] !text-white/80">
          Required before portal access
        </p>
        <h1 className="mt-2 text-3xl font-black !text-white">Intern onboarding</h1>
        <p className="mt-3 text-sm font-semibold leading-6 !text-white/90">
          SitGuru unlocks the intern portal after you accept the access rules, sign,
          print and upload the signed page, then submit. Email confirmation will be
          sent to your email on file.
        </p>
      </section>

      {notice ? (
        <p
          className={
            notice.kind === "ok"
              ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950"
              : "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-950"
          }
        >
          {notice.message}
        </p>
      ) : null}

      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {INTERN_ONBOARDING_STEPS.map((step, index) => {
          const done =
            (step.id === "access" && accessDone) ||
            (step.id === "esign" && signed) ||
            (step.id === "wetink" && uploaded) ||
            (step.id === "submit" && submitted);
          const active = !complete && current === step.id;
          return (
            <li
              key={step.id}
              className={
                done
                  ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3"
                  : active
                    ? "rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3"
                    : "rounded-2xl border border-slate-200 bg-white px-3 py-3"
              }
            >
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Step {index + 1}
                {done ? " · done" : active ? " · now" : ""}
              </p>
              <p className="mt-1 text-sm font-black text-slate-950">{step.title}</p>
              <p className="mt-1 text-xs font-semibold text-slate-600">{step.blurb}</p>
            </li>
          );
        })}
      </ol>

      {complete ? (
        <section className="rounded-[1.75rem] border border-emerald-200 bg-white p-5">
          <p className="flex items-center gap-2 text-sm font-black text-emerald-900">
            <CheckCircle2 size={18} />
            Onboarding complete
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Signed electronically as {onboarding?.typedLegalName}. Email confirmation
            was sent to your email on file.
          </p>
          <Link
            href="/intern"
            className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white"
          >
            Open intern portal
          </Link>
        </section>
      ) : null}

      <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5">
        <h2 className="font-black text-slate-950">1. Intern access rules</h2>
        <ul className="mt-3 space-y-2">
          {INTERN_ACCESS_RULES.map((rule) => (
            <li key={rule} className="text-sm font-semibold leading-6 text-slate-700">
              {rule}
            </li>
          ))}
        </ul>
        {accessDone ? (
          <p className="mt-4 text-sm font-black text-emerald-800">Accepted.</p>
        ) : (
          <form action={acceptInternAccessRules} className="mt-4 space-y-3">
            <input type="hidden" name="internId" value={intern.id} />
            <label className="flex items-start gap-3 text-sm font-semibold text-slate-800">
              <input type="checkbox" name="agreeAccess" required className="mt-1" />
              I understand these access rules and will follow them.
            </label>
            <button className="inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">
              Accept access rules
            </button>
          </form>
        )}
      </section>

      <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5">
        <h2 className="font-black text-slate-950">2. Confidentiality notice</h2>
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <InternConfidentialityNotice compact />
        </div>
        {signed ? (
          <p className="mt-4 text-sm font-black text-emerald-800">
            Electronically signed by {onboarding?.typedLegalName}.
          </p>
        ) : (
          <form action={signInternConfidentiality} className="mt-4 space-y-3">
            <input type="hidden" name="internId" value={intern.id} />
            <label className="flex items-start gap-3 text-sm font-semibold text-slate-800">
              <input type="checkbox" name="agreeConfidential" required className="mt-1" />
              I have read the notice and agree to protect SitGuru confidential information.
            </label>
            <label className="flex items-start gap-3 text-sm font-semibold text-slate-800">
              <input type="checkbox" name="agreeOwnership" required className="mt-1" />
              I understand internship work product belongs to SitGuru, with a sanitized
              portfolio report after supervisor review.
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Type your legal name to sign
              </span>
              <input
                name="typedLegalName"
                required
                defaultValue={intern.fullName}
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
              />
            </label>
            <p className="text-xs font-semibold text-slate-500">
              Use the name on your intern record: {intern.fullName}. This is an electronic
              signature for onboarding, not a substitute for the printed wet-ink copy.
            </p>
            <button
              disabled={!accessDone}
              className="inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white disabled:opacity-50"
            >
              Sign electronically
            </button>
          </form>
        )}
      </section>

      <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5">
        <h2 className="font-black text-slate-950">3. Print, sign, and upload</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Print the signature page, sign it, then upload a PDF or photo.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={INTERNSHIP_ONBOARDING_PRINT_PATH}
            className="inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white"
          >
            Print
          </Link>
        </div>
        {uploaded ? (
          <p className="mt-4 text-sm font-black text-emerald-800">
            Uploaded {onboarding?.wetInkFileName}.
          </p>
        ) : (
          <InternSignedPageUpload internId={intern.id} disabled={!signed} />
        )}
      </section>

      <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5">
        <h2 className="font-black text-slate-950">4. Submit</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Email confirmation will be sent to your email on file. The intern portal
          unlocks after this step.
        </p>
        {submitted ? (
          <p className="mt-4 text-sm font-black text-emerald-800">Submitted.</p>
        ) : (
          <form action={submitInternConfidentialityScan} className="mt-4">
            <input type="hidden" name="internId" value={intern.id} />
            <button
              disabled={!uploaded}
              className="inline-flex min-h-12 items-center rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black !text-white disabled:opacity-50"
            >
              Submit signed page
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

export function internOnboardingNotice(searchParams: Record<string, string | string[] | undefined>) {
  const ok = first(searchParams.ok);
  const error = first(searchParams.error);
  if (ok) return { kind: "ok" as const, message: ok };
  if (error) return { kind: "error" as const, message: error };
  return null;
}
