import Link from "next/link";
import { redirect } from "next/navigation";
import { GrowthCard, GrowthPageFrame } from "@/components/admin/growth/GrowthPageFrame";
import { getAdminIdentity } from "@/lib/admin/access";
import { listGrowthHires } from "@/lib/admin/growth/hire";
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
  const [people, hires, documents] = await Promise.all([
    loadOnboardingPeople(),
    listGrowthHires(),
    supabaseAdmin.from("onboarding_documents").select("id,title").eq("active", true).order("title"),
  ]);
  const focus = first(params.person);
  const selected = people.find((person) => person.userId === focus) || people[0];
  const audit = selected ? await loadOnboardingAudit(selected.workspace.instanceId) : [];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-3 py-4 sm:px-6">
      <GrowthPageFrame
        kicker="People & onboarding"
        title="Assign the package. Track the signature. Keep the file restricted."
        detail="The Growth Manager reviews the handbook and policies, then signs the agreement and the acknowledgment with an approved provider. SitGuru records the status. Executed copies stay in the restricted personnel folder."
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
            {!people.length ? <p className="text-sm font-semibold text-slate-500">No onboarding packages yet.</p> : null}
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
