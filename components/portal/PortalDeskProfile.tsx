"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronDown } from "lucide-react";
import { SiteAccountMenu } from "@/components/sitguru/SiteAccountMenu";
import { deskInitials, deskRoleLines } from "@/lib/portal/desk-ui";

/** Presentational chip used in mockup frames (no auth menu). */
export function PortalDeskProfileStatic({
  name,
  title,
  avatarUrl,
  notifications = 0,
  notificationsHref,
}: {
  name: string;
  title: string;
  avatarUrl?: string | null;
  notifications?: number;
  notificationsHref?: string;
}) {
  const initials = deskInitials(name);
  return (
    <div className="ml-auto flex items-center gap-3">
      {notificationsHref ? (
        <Link
          href={notificationsHref}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#0F2744] hover:bg-[#EEF2F6]"
          aria-label={`${notifications} notifications`}
        >
          <Bell size={20} strokeWidth={1.75} />
          {notifications > 0 ? (
            <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F05A4A] px-1 text-[10px] font-black !text-white">
              {notifications > 9 ? "9+" : notifications}
            </span>
          ) : null}
        </Link>
      ) : (
        <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#0F2744]">
          <Bell size={20} strokeWidth={1.75} />
          {notifications > 0 ? (
            <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F05A4A] px-1 text-[10px] font-black !text-white">
              {notifications > 9 ? "9+" : notifications}
            </span>
          ) : null}
        </span>
      )}
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="relative inline-flex h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-slate-200">
          <span className="absolute inset-0 bg-white" />
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={48}
              height={48}
              className="relative z-[1] h-full w-full object-cover object-center"
            />
          ) : (
            <span className="relative z-[1] m-auto text-sm font-black text-[#0F2744]">{initials}</span>
          )}
        </span>
        <span className="hidden shrink-0 text-left sm:block">
          <span className="block whitespace-nowrap text-sm font-bold leading-tight text-[#0F2744]">
            {name}
          </span>
          <span className="mt-0.5 block text-[11px] font-medium leading-[1.15] text-slate-500">
            {deskRoleLines(title).map((line) => (
              <span key={line} className="block whitespace-nowrap">
                {line}
              </span>
            ))}
          </span>
        </span>
        <ChevronDown size={16} className="hidden text-[#0F2744] sm:block" />
      </div>
    </div>
  );
}

/** Live header profile: bell + SiteAccountMenu desk variant. */
export function PortalDeskProfileLive({
  title,
  notifications = 0,
  notificationsHref,
}: {
  title: string;
  notifications?: number;
  notificationsHref: string;
}) {
  return (
    <div className="ml-auto flex items-center gap-2 sm:gap-3">
      <Link
        href={notificationsHref}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#0F2744] hover:bg-[#EEF2F6]"
        aria-label={`${notifications} notifications`}
      >
        <Bell size={20} strokeWidth={1.75} />
        {notifications > 0 ? (
          <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F05A4A] px-1 text-[10px] font-black !text-white">
            {notifications > 9 ? "9+" : notifications}
          </span>
        ) : null}
      </Link>
      <div className="hidden h-8 w-px bg-slate-200 sm:block" />
      <SiteAccountMenu variant="desk" deskTitle={title} />
    </div>
  );
}
