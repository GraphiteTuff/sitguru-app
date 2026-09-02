"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createGrowthWork } from "@/lib/admin/growth/actions";
import {
  GROWTH_CHANNELS,
  GROWTH_CREATE_KINDS,
} from "@/lib/admin/growth/constants";

export default function GrowthWorkForm({
  defaultKind = "post",
  defaultTitle = "",
  defaultMarket = "",
  defaultDestination = "",
  sourceHref = "",
}: {
  defaultKind?: string;
  defaultTitle?: string;
  defaultMarket?: string;
  defaultDestination?: string;
  sourceHref?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          setError("");
          const result = await createGrowthWork(formData);
          if (!result.ok) {
            setError(result.error || "Could not save.");
            return;
          }
          router.push(`/admin/growth/campaigns/${result.campaignId}`);
        });
      }}
    >
      <label className="block">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
          Type
        </span>
        <select
          name="kind"
          defaultValue={defaultKind}
          className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-semibold"
        >
          {GROWTH_CREATE_KINDS.map((kind) => (
            <option key={kind.value} value={kind.value}>
              {kind.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
          Title
        </span>
        <input
          name="title"
          required
          defaultValue={defaultTitle}
          placeholder="Meet Kyra in the Lehigh Valley"
          className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-semibold"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
            Channel
          </span>
          <select
            name="channel"
            defaultValue="instagram"
            className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-semibold"
          >
            {GROWTH_CHANNELS.map((channel) => (
              <option key={channel.value} value={channel.value}>
                {channel.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
            Market
          </span>
          <input
            name="market"
            defaultValue={defaultMarket}
            placeholder="Bucks County, PA"
            className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-semibold"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
          Caption / hook
        </span>
        <textarea
          name="caption"
          rows={4}
          placeholder="Need a trusted sitter this weekend? Meet Kyra — SitGuru Gurus are local, vetted, and ready."
          className="mt-2 w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-semibold"
        />
      </label>

      <label className="block">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
          Destination
        </span>
        <input
          name="destination"
          defaultValue={defaultDestination}
          placeholder="https://sitguru.com/signup?role=pet_parent"
          className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-semibold"
        />
      </label>

      <label className="block">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
          Post date
        </span>
        <input
          type="date"
          name="plannedDate"
          className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-semibold"
        />
      </label>

      <input type="hidden" name="sourceHref" value={sourceHref} />

      {error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-black text-white disabled:opacity-60 sm:w-auto"
        style={{ background: "#0D5C3A" }}
      >
        {pending ? "Saving…" : "Create campaign + tracking link"}
      </button>
    </form>
  );
}
