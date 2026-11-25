import { currentAssignedIntern, requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export default async function InternAnnouncementsPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const intern = await currentAssignedIntern();
  if (!intern) return <p className="rounded-2xl bg-white p-5">Announcements require a linked intern account.</p>;

  const { data, error } = await supabaseAdmin
    .from("internship_announcements")
    .select("id,title,body,publisher_role,created_at")
    .eq("intern_id", intern.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) console.error("[internship] Announcement retrieval failed", error.code);

  return (
    <section className="space-y-4 rounded-2xl border border-emerald-950/10 bg-white p-4 sm:p-6">
      <h1 className="text-2xl font-black text-emerald-950">Announcements</h1>
      {error ? <p role="alert" className="text-sm text-rose-900">Announcements are temporarily unavailable.</p> :
        data?.length ? (
          <ul className="space-y-3">
            {data.map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-200 p-4">
                <h2 className="break-words font-bold text-slate-950">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {item.publisher_role === "supervisor" ? "Internship Supervisor" : "Internship Instructor"} · <time dateTime={item.created_at}>{dateFormat.format(new Date(item.created_at))}</time>
                </p>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{item.body}</p>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-slate-600">No announcements yet.</p>}
    </section>
  );
}
