import Link from "next/link";
import { redirect } from "next/navigation";
import { GrowthCard, GrowthPageFrame } from "@/components/admin/growth/GrowthPageFrame";
import { getAdminIdentity } from "@/lib/admin/access";
import { listGrowthHires } from "@/lib/admin/growth/hire";
import { listInterns } from "@/lib/internship/queries";
import { listActiveEngagements, listCompensationRates } from "@/lib/staff-time/engagement";
import { currentRate } from "@/lib/staff-time/rates";
import { isoToday } from "@/lib/staff-time/periods";
import { canEditRequirements, internshipActorKind } from "@/lib/internship/manager-access";
import {
  assignGrowthOnboarding,
  recordContractorSigned,
  sendForSignature,
  verifyExternalCompletion,
} from "@/lib/onboarding/actions";
import { loadOnboardingAudit, loadOnboardingPeople } from "@/lib/onboarding/data";
import { EXAMPLE_SIGNATURE_PROVIDERS } from "@/lib/onboarding/domain";
import { remindOnboarding, supersedeOnboardingDocument } from "@/lib/onboarding/actions";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function PeopleOnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  const kind = internshipActorKind({ role: actor?.role, isSuperUser: actor?.isSuperUser });
  if (!actor || !canEditRequirements(kind)) redirect("/admin/login?next=/admin/hr/onboarding");
  const params = searchParams ? await searchParams : {};
  const notice = first(params.ok) || first(params.error);
  const error = Boolean(first(params.error));

  const [people, hires, interns, engagements, documents] = await Promise.all([
    loadOnboardingPeople(),
    listGrowthHires(),
    listInterns(),
    listActiveEngagements(),
    supabaseAdmin.from("onboarding_documents").select("id,title").eq("active", true).order("title"),
  ]);
  // An active paid engagement, not an internship course record, determines whether
  // an intern belongs in this HR compensation-onboarding section.
  const paidEngagementByUser = new Map(
    engagements
      .filter((engagement) => engagement.userId && engagement.status === "active")
      .map((engagement) => [engagement.userId, engagement]),
  );
  const paidInterns = await Promise.all(
    interns
      .filter((intern) => intern.userId && paidEngagementByUser.has(intern.userId))
      .map(async (intern) => {
        const engagement = paidEngagementByUser.get(intern.userId || "")!;
        const rates = await listCompensationRates(engagement.id);
        const rate = currentRate(rates, isoToday());
        return {
          userId: intern.userId || "",
          internId: intern.id,
          name: intern.preferredName || intern.fullName,
          email: intern.email,
          title: intern.internshipTitle || "Social Media & Community Growth Intern",
          rateCents: rate?.hourlyRateCents ?? null,
          classification: engagement.employmentClassification,
          w9Status: engagement.w9Status,
        };
      }),
  );
  const focus = first(params.person);
  const selected = focus ? people.find((person) => person.userId === focus) : people[0];
  const selectedPaidIntern = focus ? paidInterns.find((intern) => intern.userId === focus) : null;
  const audit = selected ? await loadOnboardingAudit(selected.workspace.instanceId) : [];
  const assignedUserIds = new Set(people.map((person) => person.userId));
  const unassignedPaidInterns = paidInterns.filter((intern) => !assignedUserIds.has(intern.userId));

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-3 py-4 sm:px-6">
      <GrowthPageFrame
        kicker="People & onboarding"
        title="Team onboarding, signatures & confidential records"
        detail="Manage Growth Manager packages and paid-intern HR preparation separately. Keep signed agreements, tax documents, and banking information in a founder-restricted personnel repository."
      >
        {notice ? (
          <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-900"}`}>
            {notice}
          </p>
        ) : null}
        <GrowthCard>
          <h2 className="text-lg font-black text-slate-950">Assign Growth Manager onboarding</h2>
          <form action={assignGrowthOnboarding} className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
            <select name="userId" required className="min-h-12 rounded-xl border border-emerald-100 px-3 text-base font-semibold">
              <option value="">Choose a Growth Manager login</option>
              {hires.filter((hire) => hire.userId && hire.status === "active").map((hire) => (
                <option key={hire.userId} value={hire.userId}>
                  {hire.email}
                </option>
              ))}
            </select>
            <button className="min-h-12 rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">
              Assign package
            </button>
          </form>
        </GrowthCard>
        <GrowthCard>
          <h2 className="text-lg font-black text-slate-950">Paid Intern HR Onboarding</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            Paid interns are also team members. Their compensation paperwork is separate from university
            internship check-ins and academic-credit documents. A manager agreement must never be assigned
            to an intern.
          </p>
          {paidInterns.length ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {paidInterns.map((intern) => (
                <Link
                  key={intern.userId}
                  href={`/admin/hr/onboarding?person=${encodeURIComponent(intern.userId)}`}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 transition hover:border-emerald-300"
                >
                  <p className="font-black text-slate-950">{intern.name}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{intern.title}</p>
                  <p className="mt-2 text-xs font-bold text-emerald-900">
                    {intern.rateCents == null ? "Rate pending" : `$${(intern.rateCents / 100).toFixed(2)}/hr`}
                    {" · "}
                    {assignedUserIds.has(intern.userId) ? "HR package assigned" : "HR package not assigned"}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm font-semibold text-slate-600">
              No active paid interns have been linked to an HR engagement yet.
            </p>
          )}
          <p className="mt-3 text-xs font-semibold leading-5 text-amber-900">
            Intern-specific agreements and the secure profile, tax and banking collection steps must
            be approved and configured before signature requests are sent. An active paid rate alone
            does not establish 1099 eligibility.
          </p>
        </GrowthCard>
        <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="grid gap-2">
            {people.map((person) => (
              <Link
                key={person.workspace.instanceId}
                href={`/admin/hr/onboarding?person=${person.userId}`}
                className="rounded-2xl border border-emerald-100 bg-white p-4"
              >
                <p className="font-black text-slate-950">{person.name}</p>
                <p className="text-xs font-semibold text-slate-500">{person.role}</p>
                <p className="mt-2 text-sm font-black text-emerald-900">
                  {person.workspace.complete ? "Complete" : `${person.workspace.percent}%`}
                </p>
              </Link>
            ))}
            {unassignedPaidInterns.map((intern) => (
              <Link
                key={intern.userId}
                href={`/admin/hr/onboarding?person=${encodeURIComponent(intern.userId)}`}
                className={`rounded-2xl border bg-white p-4 ${focus === intern.userId ? "border-emerald-500" : "border-emerald-100"}`}
              >
                <p className="font-black text-slate-950">{intern.name}</p>
                <p className="text-xs font-semibold text-slate-500">Paid intern · HR onboarding</p>
                <p className="mt-2 text-sm font-black text-amber-900">Packet preparation required</p>
              </Link>
            ))}
            {!people.length && !unassignedPaidInterns.length ? <p className="text-sm font-semibold text-slate-500">No onboarding packages yet.</p> : null}
          </div>
          {selected ? (
            <div className="grid gap-3">
              <GrowthCard>
                <h2 className="text-xl font-black text-slate-950">{selected.name}</h2>
                <p className="text-sm font-semibold text-slate-600">{selected.email}</p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {selected.workspace.complete ? "Complete" : `${selected.workspace.outstanding.length} items still open`}
                </p>
              </GrowthCard>
              {selected.workspace.items.map((item) => (
                <GrowthCard key={item.id}>
                  <h3 className="font-black text-slate-950">{item.title}</h3>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
                    {item.versionLabel} · {item.statusText}
                  </p>
                  {item.kind !== "review" ? (
                    <div className="mt-3 grid gap-2">
                      <form action={sendForSignature} className="grid gap-2">
                        <input type="hidden" name="itemId" value={item.id} />
                        <select name="provider" className="min-h-12 rounded-xl border border-emerald-100 px-3 text-sm font-semibold">
                          {EXAMPLE_SIGNATURE_PROVIDERS.map((provider) => (
                            <option key={provider} value={provider}>{provider.replaceAll("_", " ")}</option>
                          ))}
                        </select>
                        <input name="signingUrl" placeholder="https:// signing link" className="min-h-12 rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
                        <button className="min-h-12 rounded-2xl border border-emerald-200 px-3 text-sm font-black text-emerald-900">Send for signature</button>
                      </form>
                      <form action={recordContractorSigned}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <button className="min-h-12 w-full rounded-2xl border border-amber-200 bg-amber-50 px-3 text-sm font-black text-amber-950">Record their signature</button>
                      </form>
                      <form action={verifyExternalCompletion} className="grid gap-2">
                        <input type="hidden" name="itemId" value={item.id} />
                        <input name="finalRef" placeholder="Restricted folder reference" className="min-h-12 rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
                        <input name="note" placeholder="Verification note" className="min-h-12 rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
                        <button className="min-h-12 rounded-2xl bg-[#0D5C3A] px-3 text-sm font-black !text-white">Verify and countersign</button>
                      </form>
                    </div>
                  ) : null}
                </GrowthCard>
              ))}
              <GrowthCard>
                <h3 className="font-black text-slate-950">History</h3>
                <ul className="mt-2 space-y-2 text-sm font-semibold text-slate-700">
                  {audit.map((event) => (
                    <li key={event.id}>{event.at.slice(0, 16).replace("T", " ")} · {event.action} · {event.next}</li>
                  ))}
                </ul>
              </GrowthCard>
            </div>
          ) : selectedPaidIntern ? (
            <div className="grid gap-3">
              <GrowthCard>
                <h2 className="text-xl font-black text-slate-950">{selectedPaidIntern.name}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">{selectedPaidIntern.title} · {selectedPaidIntern.email}</p>
                <p className="mt-2 font-black text-slate-950">
                  {selectedPaidIntern.rateCents == null
                    ? "Hourly rate not recorded"
                    : `$${(selectedPaidIntern.rateCents / 100).toFixed(2)}/hour`}
                </p>
                <p className="mt-2 text-sm font-bold text-amber-900">
                  HR compensation packet not yet assigned. Worker classification: {
                    selectedPaidIntern.classification === "pending_review"
                      ? "pending legal review"
                      : selectedPaidIntern.classification.replaceAll("_", " ")
                  }.
                </p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                  Academic onboarding remains under the separate internship record.
                  Do not send an independent contractor agreement or W-9 as approved paperwork
                  before applicable worker-classification review.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/admin/internship/interns/${encodeURIComponent(selectedPaidIntern.internId)}#onboarding`}
                    className="inline-flex min-h-11 items-center rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">
                    Academic intern onboarding
                  </Link>
                  <Link href="/admin/hr/people"
                    className="inline-flex min-h-11 items-center rounded-xl border border-emerald-200 px-4 text-sm font-black text-emerald-900">
                    HR & compensation
                  </Link>
                </div>
              </GrowthCard>
              <GrowthCard>
                <h3 className="font-black text-slate-950">HR documents to prepare securely</h3>
                <ul className="mt-3 space-y-3 text-sm font-semibold text-slate-700">
                  {[
                    "Paid-intern compensation agreement — $/hour, role, and actual work dates",
                    "Personal profile sheet and emergency-contact information",
                    "Intern-specific handbook and approved policies",
                    "Signed acknowledgments and verified agreement copies",
                    "Tax forms and bank authorization — only after classification review",
                    "Timesheet, manager review, founder approval, and payment record",
                  ].map((label) => (
                    <li key={label} className="flex items-start gap-2">
                      <span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-semibold text-slate-600">
                  This is a preparation checklist, not proof that forms were collected, signed,
                  stored, or sent. Tax identification and banking information must use restricted
                  access and a verified secure collection channel, never ordinary email attachments.
                </p>
              </GrowthCard>
            </div>
          ) : null}
        </div>
        <GrowthCard>
          <h2 className="text-lg font-black text-slate-950">Replace a document</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">Earlier acknowledgments stay on record. Choose a new review only when the change is material.</p>
          <form action={supersedeOnboardingDocument} className="mt-3 grid gap-2">
            <select name="documentId" className="min-h-12 rounded-xl border border-emerald-100 px-3 text-sm font-semibold">
              {(documents.data || []).map((document) => (
                <option key={String(document.id)} value={String(document.id)}>{String(document.title)}</option>
              ))}
            </select>
            <input name="versionLabel" placeholder="v1.1" required className="min-h-12 rounded-xl border border-emerald-100 px-3" />
            <input name="summary" placeholder="What changed" className="min-h-12 rounded-xl border border-emerald-100 px-3" />
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" name="reacknowledge" value="yes" /> Require a new review
            </label>
            <button className="min-h-12 rounded-2xl border border-emerald-200 text-sm font-black text-emerald-900">Publish version</button>
          </form>
          {selected ? (
            <form action={remindOnboarding} className="mt-3">
              <input type="hidden" name="instanceId" value={selected.workspace.instanceId} />
              <button className="min-h-12 w-full rounded-2xl bg-amber-100 text-sm font-black text-amber-950">Send onboarding reminder</button>
            </form>
          ) : null}
        </GrowthCard>
        <Link href="/admin/hr" className="text-sm font-black text-emerald-800">Back to HR</Link>
      </GrowthPageFrame>
    </main>
  );
}
