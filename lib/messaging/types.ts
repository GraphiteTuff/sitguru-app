// lib/messaging/types.ts
/** Shared types for SitGuru real-time messaging engine */

export type MessagingChannel = "in_app" | "sms" | "ai" | "system";

export type ChatLayoutMode = "panel" | "sheet";

export type ChatMediaItem = {
  url: string;
  mimeType: string;
  name?: string;
  size?: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string | null;
  recipientId?: string | null;
  body: string;
  createdAt: string;
  isAi?: boolean;
  channel?: MessagingChannel;
  media?: ChatMediaItem[];
  senderName?: string | null;
  status?: string | null;
};

export type ConversationAiState = {
  id: string;
  aiAssistEnabled: boolean;
  aiHandoffAt?: string | null;
  aiHandoffReason?: string | null;
  aiHandoffFlagged?: boolean;
  bookingId?: string | null;
  subject?: string | null;
  smsPhoneE164?: string | null;
};

export type HandoffTrigger =
  | "safety"
  | "negative_sentiment"
  | "manager_request"
  | "explicit_human"
  | "signup_intent"
  | "booking_intent"
  | "keyword";

export type HandoffEvaluation = {
  shouldHandoff: boolean;
  triggers: HandoffTrigger[];
  reason: string;
};
