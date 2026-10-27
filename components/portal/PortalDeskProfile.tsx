"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronDown } from "lucide-react";
import { SiteAccountMenu } from "@/components/sitguru/SiteAccountMenu";
import { deskInitials } from "@/lib/portal/desk-ui";

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
      <div className="hidden h-8 w-px bg-slate-200 sm:block" />
      <div className="flex items-center gap-2.5">
        <span className="relative inline-flex h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#EEF2F6] ring-2 ring-white">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={44}
              height={44}
              className="sg-face-photo h-full w-full object-cover"
            />
          ) : (
            <span className="m-auto text-sm font-black text-[#0F2744]">{initials}</span>
          )}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-sm font-bold leading-tight text-[#0F2744]">
            {name}
          </span>
          <span className="mt-0.5 block max-w-[11rem] truncate text-[11px] font-medium leading-snug text-slate-500 lg:max-w-[14rem]">
            {title}
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
