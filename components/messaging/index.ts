// components/messaging/index.ts
export { default as ChatWindow } from "@/components/messaging/ChatWindow";
export { default as ChatBottomSheet } from "@/components/messaging/ChatBottomSheet";
export { default as WalkChatBridge } from "@/components/messaging/WalkChatBridge";
export { default as SitGuruChatWorkspace } from "@/components/messaging/SitGuruChatWorkspace";
export { default as MediaAttachmentDrawer } from "@/components/messaging/MediaAttachmentDrawer";
export { default as AdminWalkChatPanel } from "@/components/messaging/AdminWalkChatPanel";
export { default as HomepageChatBubble } from "@/components/messaging/HomepageChatBubble";
export {
  scanMessageForOffPlatformContact,
  containsOffPlatformContact,
  SITGURU_CONTACT_GUARD_ALERT,
} from "@/lib/messaging/contact-guard";

