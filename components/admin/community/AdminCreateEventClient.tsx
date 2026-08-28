"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createAdminEventDraft } from "@/app/admin/community/events/actions";
import type { AdminPartnerOption } from "@/lib/community/admin-event-mutations";

export default function AdminCreateEventClient({
  partners,
}: {
  partners: AdminPartnerOption[];
}) {
  const router = useRouter();
  const [partnerId, setPartnerId] = useState(partners[0]?.id || "");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    if (!partnerId) {
      setMessage("Select a partner to host this event.");
      return;
    }

    startTransition(async () => {
      const result = await createAdminEventDraft({
        partnerId,
        draft: title.trim() ? { title: title.trim() } : {},
      });

      if (!result.ok) {
        setMessage(result.error || "Unable to create event.");
        return;
      }

      router.push(`/admin/community/events/${result.event.id}/edit`);
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
          Admin • New Event
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Create community event</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Pick a partner host, then fill in details and publish directly — perfect for launch seed
          content.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-black text-slate-800">Partner host *</span>
            <select
              value={partnerId}
              onChange={(event) => setPartnerId(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold"
            >
              <option value="">Select partner…</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.business_name || "Partner"}
                  {partner.city ? ` — ${partner.city}${partner.state ? `, ${partner.state}` : ""}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-black text-slate-800">Event name (optional)</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Adoption Day at the Park"
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 text-base font-semibold"
            />
          </label>

          {message ? <p className="text-sm font-black text-emerald-800">{message}</p> : null}

          <button
            type="button"
            disabled={pending || !partnerId}
            onClick={handleCreate}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white disabled:opacity-60 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            {pending ? "Creating…" : "Start editing"}
          </button>
        </div>
      </div>
    </div>
  );
}
