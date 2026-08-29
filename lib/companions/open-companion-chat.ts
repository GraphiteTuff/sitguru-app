/**
 * Cross-component open signal for SitGuru AI companions (homepage pack cards → FAB).
 */

export const OPEN_COMPANION_CHAT_EVENT = "sitguru:open-companion-chat" as const;

export type CompanionChatId = "rogue" | "scout" | "taco" | "delilah";

export type OpenCompanionChatDetail = {
  companion: CompanionChatId;
};

export function openCompanionChat(companion: CompanionChatId) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<OpenCompanionChatDetail>(OPEN_COMPANION_CHAT_EVENT, {
      detail: { companion },
    }),
  );
}

/** Marketing destinations that mount Scout / Taco / Delilah instead of Rogue. */
export const COMPANION_CHAT_HREF: Record<CompanionChatId, string> = {
  rogue: "/?chat=rogue#ai-companions",
  scout: "/become-a-guru?chat=scout",
  taco: "/ambassadors?chat=taco",
  delilah: "/events?chat=delilah",
};

export function companionChatHref(companion: CompanionChatId) {
  return COMPANION_CHAT_HREF[companion];
}
