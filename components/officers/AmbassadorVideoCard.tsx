"use client";

/**
 * In-chat Ambassador promo video card for Taco replies.
 * Embeds the same public promo used on /ambassadors#ambassador-video.
 */

import Link from "next/link";
import { PlayCircle } from "lucide-react";

export const AMBASSADOR_PROMO_VIDEO_SRC = "/videos/sitguru-ambassador-promo.mp4";
export const AMBASSADOR_PROMO_POSTER_SRC =
  "/images/ambassadors/student-ambassador2.jpg";

const ROLE_BULLETS = [
  {
    title: "Share the vibe",
    description:
      "Post, text, talk, or use your QR code to introduce people to SitGuru.",
  },
  {
    title: "Refer great people",
    description:
      "Connect Pet Parents, future Gurus, and local partners with the right SitGuru path.",
  },
  {
    title: "Show up locally",
    description:
      "Represent SitGuru at campus activities, community events, pet spaces, and local meetups.",
  },
  {
    title: "Grow your lane",
    description:
      "Build real outreach, leadership, referral, and community experience as SitGuru grows.",
  },
] as const;

export default function AmbassadorVideoCard({
  showJoinCta = true,
}: {
  showJoinCta?: boolean;
}) {
  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 px-3 pb-2 pt-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Watch first
          </p>
          <p className="mt-1 text-sm font-black leading-snug text-slate-950">
            See what Ambassadors actually do.
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white">
          <PlayCircle size={18} aria-hidden />
        </div>
      </div>

      <div className="mx-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
        <video
          controls
          playsInline
          preload="metadata"
          poster={AMBASSADOR_PROMO_POSTER_SRC}
          className="aspect-video w-full bg-slate-950 object-cover"
        >
          <source src={AMBASSADOR_PROMO_VIDEO_SRC} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="space-y-2 px-3 py-3">
        <p className="text-xs font-semibold leading-5 text-slate-600">
          Share SitGuru on campus, online, at events, or with people you already
          know. Help Pet Parents find care, help great people become Gurus, and
          build real community experience along the way.
        </p>

        <ul className="space-y-1.5">
          {ROLE_BULLETS.map((item) => (
            <li key={item.title} className="text-xs leading-5 text-slate-700">
              <span className="font-black text-emerald-900">{item.title}.</span>{" "}
              {item.description}
            </li>
          ))}
        </ul>

        {showJoinCta ? (
          <Link
            href="/programs/ambassadors/apply?type=community&source=taco_chat_video"
            className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-[#0D5C3A] px-4 py-2 text-center text-xs font-bold text-white transition hover:bg-[#09462C]"
          >
            Join the Pack
          </Link>
        ) : null}
      </div>
    </div>
  );
}
