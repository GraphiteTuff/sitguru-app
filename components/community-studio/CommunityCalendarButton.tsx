"use client";

import { communityCalendarEvent } from "@/lib/community-studio/calendar";

export default function CommunityCalendarButton({ id, title, publishAt }: { id: string; title: string; publishAt: string }) {
  function download() {
    const content = communityCalendarEvent({ id, title, publishAt, url: `${window.location.origin}/manager/community-studio#story-${id}` });
    if (!content) return;
    const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sitguru-community-publication.ics";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <button type="button" onClick={download} className="min-h-12 text-xs font-bold text-blue-700">Add reminder to Outlook ↗</button>;
}
