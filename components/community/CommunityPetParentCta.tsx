"use client";

import Link from "next/link";
import { PawPrint, Sparkles } from "lucide-react";
import { buildCommunityJoinHref } from "@/lib/community/pet-parent-signup";

type CommunityPetParentCtaProps = {
  nextPath?: string;
  source?: string;
  campaign?: string;
  compact?: boolean;
};

export default function CommunityPetParentCta({
  nextPath = "/community/events",
  source = "community_events",
  campaign = "community_join_cta",
  compact = false,
}: CommunityPetParentCtaProps) {
  const signupHref = buildCommunityJoinHref({
    next: nextPath,
    source,
    campaign,
  });

  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-sm font-black text-emerald-900">
          Free Pet Parent account — RSVP in one tap, find local Gurus, and join the pack.
        </p>
        <Link
          href={signupHref}
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800"
        >
          Join free
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            Join SitGuru free
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Become a Pet Parent in minutes
          </h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600 sm:text-base">
            Say I&apos;m Going at community events, meet trusted local Gurus, and keep your
            pets&apos; care all in one place — free to join.
          </p>
        </div>
        <Link
          href={signupHref}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 text-sm font-black text-white transition hover:bg-emerald-800"
        >
          <PawPrint className="h-4 w-4" />
          Create free Pet Parent account
        </Link>
      </div>
    </div>
  );
}
