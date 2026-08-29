"use client";

import Link from "next/link";
import { Home, Sparkles, Star, Users } from "lucide-react";
import {
  buildCommunityEventLoginHref,
  buildCommunityEventSignupHref,
  COMMUNITY_SIGNUP_ROLES,
  savePendingEventRsvp,
  type CommunitySignupRole,
  type PendingEventRsvp,
} from "@/lib/community/pet-parent-signup";

type CommunityJoinOptionsProps = {
  slug?: string;
  eventId?: string;
  nextPath?: string;
  source?: string;
  campaign?: string;
  variant?: "event" | "hub" | "compact";
  onBeforeNavigate?: () => void;
};

const roleIcons: Record<CommunitySignupRole, typeof Users> = {
  pet_parent: Users,
  guru: Home,
  ambassador: Star,
};

export default function CommunityJoinOptions({
  slug,
  eventId,
  source = "community_events",
  campaign,
  variant = "event",
  onBeforeNavigate,
}: CommunityJoinOptionsProps) {
  function rememberPending() {
    onBeforeNavigate?.();
    if (slug && eventId) {
      savePendingEventRsvp({
        eventId,
        slug,
        savedAt: Date.now(),
      } satisfies PendingEventRsvp);
    }
  }

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap gap-2">
        {COMMUNITY_SIGNUP_ROLES.map((role) => {
          const Icon = roleIcons[role.id];
          const href = slug
            ? buildCommunityEventSignupHref({
                slug,
                eventId,
                role: role.id,
                source,
                campaign: campaign || `community_${role.id}`,
              })
            : `/signup?role=${role.id}&intent=${role.signupIntent}&source=${source}`;

          return (
            <Link
              key={role.id}
              href={href}
              onClick={rememberPending}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 text-xs font-black text-emerald-900 hover:bg-emerald-50"
            >
              <Icon className="h-3.5 w-3.5" />
              {role.label}
            </Link>
          );
        })}
      </div>
    );
  }

  const isEvent = variant === "event" && slug;

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
      <div>
        <p className="text-sm font-black text-emerald-950">
          {isEvent ? "Join free & say I'm Going" : "Join SitGuru free"}
        </p>
        <p className="mt-1 text-xs font-semibold text-emerald-900/80">
          {isEvent
            ? "Pick your path — we'll bring you right back to this event."
            : "Pet Parent, Guru, or Ambassador — start in minutes."}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {COMMUNITY_SIGNUP_ROLES.map((role) => {
          const Icon = roleIcons[role.id];
          const href = isEvent
            ? buildCommunityEventSignupHref({
                slug: slug!,
                eventId,
                role: role.id,
                source,
                campaign:
                  campaign ||
                  (role.id === "guru"
                    ? "community_event_guru"
                    : role.id === "ambassador"
                      ? "community_event_ambassador"
                      : "community_event_im_going"),
              })
            : `/signup?role=${role.id}&intent=${role.signupIntent}&next=${encodeURIComponent("/events")}&source=${source}`;

          return (
            <Link
              key={role.id}
              href={href}
              onClick={rememberPending}
              className={`flex min-h-12 flex-col justify-center rounded-xl px-3 py-2 transition ${
                role.id === "pet_parent"
                  ? "bg-emerald-700 text-white hover:bg-emerald-800"
                  : "border border-emerald-200 bg-white text-emerald-900 hover:bg-white/90"
              }`}
            >
              <span className="inline-flex items-center gap-1.5 text-sm font-black">
                <Icon className="h-4 w-4" />
                {role.label}
              </span>
              <span
                className={`mt-0.5 text-[11px] font-semibold ${
                  role.id === "pet_parent" ? "text-emerald-100" : "text-emerald-800/80"
                }`}
              >
                {role.short}
              </span>
            </Link>
          );
        })}
      </div>

      {isEvent ? (
        <Link
          href={buildCommunityEventLoginHref({ slug: slug! })}
          onClick={rememberPending}
          className="inline-flex text-xs font-black text-emerald-800 underline-offset-2 hover:underline"
        >
          Already have an account? Log in
        </Link>
      ) : null}
    </div>
  );
}

export function CommunityJoinHubBanner() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 sm:p-8">
      <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
        <Sparkles className="h-3.5 w-3.5" />
        Join SitGuru free
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
        Pet Parent, Guru, or Ambassador
      </h2>
      <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-slate-600 sm:text-base">
        RSVP at community events, meet local pet people, and grow with SitGuru — pick the
        path that fits you.
      </p>
      <div className="mt-5">
        <CommunityJoinOptions variant="hub" source="community_hub" campaign="community_hub_join" />
      </div>
    </div>
  );
}
