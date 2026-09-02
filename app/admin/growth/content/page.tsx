import { requireGrowthPortal } from "@/lib/admin/growth/access";
import { updateGrowthContentStatus } from "@/lib/admin/growth/actions";
import { listGrowthContent } from "@/lib/admin/growth/data";
import {
  GrowthCard,
  GrowthPageFrame,
  GrowthPrimaryLink,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

export default async function GrowthContentPage() {
  const access = await requireGrowthPortal();
  if (!access.ok) return access.ui;

  const items = await listGrowthContent();

  return (
    <GrowthPageFrame
      title="Content"
      detail="Draft → submit → Jason approves → you publish. Routine posts can skip approval once the rhythm is trusted."
      action={<GrowthPrimaryLink href="/admin/growth/create">New post</GrowthPrimaryLink>}
    >
      <div className="space-y-3">
        {items.map((item) => (
          <GrowthCard key={item.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black text-slate-950">{item.title}</h2>
              <StatusPill value={item.status} />
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {item.platform} · {item.audience}
              {item.plannedDate ? ` · ${item.plannedDate}` : ""}
            </p>
            {item.caption ? (
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                {item.caption}
              </p>
            ) : null}
            <form action={updateGrowthContentStatus} className="mt-4 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={item.id} />
              {item.status === "Draft" ? (
                <button
                  name="status"
                  value="Needs CEO Review"
                  className="min-h-11 rounded-2xl bg-amber-100 px-4 text-sm font-black text-amber-900"
                >
                  Submit for review
                </button>
              ) : null}
              {access.actor.isSuperUser && item.status !== "Ready" ? (
                <button
                  name="status"
                  value="Ready"
                  className="min-h-11 rounded-2xl px-4 text-sm font-black text-white"
                  style={{ background: "#0D5C3A" }}
                >
                  Approve
                </button>
              ) : null}
              <button
                name="status"
                value="Posted"
                className="min-h-11 rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900"
              >
                Mark posted
              </button>
            </form>
          </GrowthCard>
        ))}
        {items.length === 0 ? (
          <GrowthCard>
            <p className="font-semibold text-slate-600">
              Nothing on the calendar yet. Create a post from Home.
            </p>
          </GrowthCard>
        ) : null}
      </div>
    </GrowthPageFrame>
  );
}
