export type AdminInboxThread = {
  id: string;
  href: string;
  title: string;
  preview: string;
  subtitle: string;
  avatar: string;
  unreadCount: number;
  timeLabel: string;
};

export type AdminInboxFilter = {
  key: string;
  label: string;
  href: string;
  count: number;
};

export type AdminChatMessage = {
  id: string;
  body: string;
  createdAt: string | null;
  isAdmin: boolean;
  senderName: string;
  senderAvatar: string;
  senderRole: string;
};

export type AdminSelectedThread = {
  id: string;
  title: string;
  subtitle: string;
  avatar: string;
  topic: string;
  contactEmail: string;
  messages: AdminChatMessage[];
};
