"use client";

import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { DELILAH_AVATAR } from "@/lib/companions/avatar-assets";
import { companionChatHref } from "@/lib/companions/open-companion-chat";

/**
 * Homepage intro for Delilah — Pet Event Coordinator.
 * Matches the Taco “AI Pet Companion” card pattern on Ambassadors.
 * Placed under homepage event cards and above the Host/Manager banner.
 */
export default function DelilahEventCompanionIntro({
  className = "",
}: {
  className?: string;
}) {
  return (
    <section
      aria-label="Meet Delilah, your AI Pet Event Coordinator"
      className={`rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8 ${className}`}
    >
      <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr] lg:gap-12">
        <div className="mx-auto flex flex-col items-center text-center lg:mx-0">
          <div className="relative h-28 w-28 overflow-hidden rounded-full bg-white shadow-[0_10px_28px_rgba(13,92,58,0.12)] ring-2 ring-[#0D5C3A]/15 sm:h-32 sm:w-32">
            <span
              className="absolute inset-0 rounded-full bg-white"
              aria-hidden
            />
            <Image
              src={DELILAH_AVATAR.src}
              alt={DELILAH_AVATAR.alt}
              fill
              className="object-cover"
              style={{
                backgroundColor: "#fff",
                objectPosition: DELILAH_AVATAR.objectPosition,
              }}
              sizes="128px"
              priority={false}
            />
          </div>
          <p className="mt-4 text-xl font-black tracking-tight text-emerald-950">
            Delilah
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[#0D5C3A]">
            Pet Event Coordinator
          </p>
        </div>

        <div className="text-center lg:text-left">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#0D5C3A]">
            <CalendarDays className="h-4 w-4" aria-hidden />
            AI Pet Companion
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
            Your pet event planning partner.
          </h2>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Meet Delilah — SitGuru&apos;s Pet Event Coordinator. She helps Pet
            Event Planners &amp; Managers, hosts, and pet parents with every
            listing on SitGuru: publishing Partner Events, RSVPs, sharing, and
            answering questions about what&apos;s happening near you.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
            <a
              href={companionChatHref("delilah")}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0D5C3A] px-5 text-sm font-black text-white transition hover:bg-emerald-900"
            >
              Chat with Delilah
            </a>
            <a
              href="/events"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-300 bg-white px-5 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
            >
              Browse Pet Events
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
