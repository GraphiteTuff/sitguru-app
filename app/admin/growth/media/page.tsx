import { requireGrowthPortal } from "@/lib/admin/growth/access";
import { saveGrowthMediaAction } from "@/lib/admin/growth/actions";
import { listGrowthMedia } from "@/lib/admin/growth/data";
import {
  GrowthCard,
  GrowthPageFrame,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

export default async function GrowthMediaPage() {
  const access = await requireGrowthPortal();
  if (!access.ok) return access.ui;

  const items = await listGrowthMedia();

  return (
    <GrowthPageFrame
      title="Media"
      detail="Drop Canva or CapCut links here. SitGuru does not publish to Instagram — you still post in Meta and TikTok."
    >
      <GrowthCard>
        <form action={saveGrowthMediaAction} className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Title
            </span>
            <input
              name="title"
              required
              placeholder="Kyra Reel cover"
              className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Canva / CapCut / Drive link
            </span>
            <input
              name="source"
              required
              placeholder="https://www.canva.com/..."
              className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Type
            </span>
            <select
              name="proofType"
              className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
            >
              <option>Reel</option>
              <option>Story</option>
              <option>Graphic</option>
              <option>Photo</option>
              <option>Link</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Use for
            </span>
            <input
              name="campaignUse"
              placeholder="Guru spotlight"
              className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
            />
          </label>
          <button
            type="submit"
            className="min-h-12 rounded-2xl px-4 text-sm font-black text-white sm:col-span-2"
            style={{ background: "#0D5C3A" }}
          >
            Save asset
          </button>
        </form>
      </GrowthCard>

      <div className="space-y-3">
        {items.map((item) => (
          <GrowthCard key={item.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black text-slate-950">{item.title}</h2>
              <StatusPill value={item.status} />
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {item.proofType}
              {item.campaignUse ? ` · ${item.campaignUse}` : ""}
            </p>
            {item.source ? (
              <a
                href={item.source}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-11 items-center text-sm font-black text-emerald-800"
              >
                Open link →
              </a>
            ) : null}
          </GrowthCard>
        ))}
      </div>
    </GrowthPageFrame>
  );
}
