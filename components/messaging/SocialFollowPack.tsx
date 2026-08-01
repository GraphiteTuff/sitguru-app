"use client";

import {
  SITGURU_OFFICIAL_HANDLE,
  SITGURU_OFFICIAL_SOCIAL_LINKS,
} from "@/lib/chat/sitguru-social";

/** Compact follow pack for Rogue chat — all @SitGuruOfficial. */
export function SocialFollowPack() {
  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-[#0D5C3A]/20 bg-white shadow-sm">
      <p className="m-0 px-3 pt-2.5 text-xs font-semibold text-slate-900">
        Follow {SITGURU_OFFICIAL_HANDLE}
      </p>
      <p className="m-0 px-3 pt-0.5 text-[11px] leading-snug text-slate-600">
        Events, pack moments, and community highlights — same handle on every
        platform.
      </p>
      <div className="flex flex-wrap gap-1.5 px-3 py-2.5">
        {SITGURU_OFFICIAL_SOCIAL_LINKS.map((link) => (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-full border border-[#0D5C3A]/30 bg-[#E8F3EC] px-2.5 py-1.5 text-center text-[11px] font-semibold text-[#0D5C3A] transition-colors hover:bg-[#0D5C3A] hover:text-white min-w-[4.5rem]"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
