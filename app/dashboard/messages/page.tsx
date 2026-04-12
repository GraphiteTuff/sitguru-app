"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  account_type?: string | null;
  role?: string | null;
};

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read?: boolean | null;
  read_at?: string | null;
};

function getName(profile?: Profile | null) {
  if (!profile) return "User";
  const full = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
  return full || profile.account_type || profile.role || "User";
}

function isVisibleContact(profile: Profile) {
  const accountType = String(profile.account_type || "").toLowerCase();
  const role = String(profile.role || "").toLowerCase();

  return (
    role === "admin" ||
    role === "sitter" ||
    role === "walker" ||
    role === "caretaker" ||
    accountType.includes("sitter") ||
    accountType.includes("walker") ||
    accountType.includes("caretaker") ||
    accountType.includes("provider")
  );
}

function sortConversationPartners(
  safeProfiles: Profile[],
  safeMessages: Message[],
  activeUserId: string
) {
  const lastMessageTimeByPartner = new Map<string, number>();

  for (const message of safeMessages) {
    const partnerId =
      message.sender_id === activeUserId ? message.recipient_id : message.sender_id;

    const messageTime = new Date(message.created_at).getTime();
    const current = lastMessageTimeByPartner.get(partnerId) || 0;

    if (messageTime > current) {
      lastMessageTimeByPartner.set(partnerId, messageTime);
    }
  }

  return [...safeProfiles].sort((a, b) => {
    const aTime = lastMessageTimeByPartner.get(a.id) || 0;
    const bTime = lastMessageTimeByPartner.get(b.id) || 0;
    return bTime - aTime;
  });
}

export default function MessagesPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function loadData(preferredSelectedUser?: string | null) {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        router.push("/login");
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const [
        { data: profilesData, error: profilesError },
        { data: messagesData, error: messagesError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, first_name, last_name, account_type, role")
          .neq("id", user.id),
        supabase
          .from("messages")
          .select("id, sender_id, recipient_id, content, created_at, is_read, read_at")
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order("created_at", { ascending: true }),
      ]);

      if (profilesError) throw profilesError;
      if (messagesError) throw messagesError;

      const safeProfiles = ((profilesData || []) as Profile[]).filter(isVisibleContact);
      const safeMessages = (messagesData || []) as Message[];

      const sortedProfiles = sortConversationPartners(safeProfiles, safeMessages, user.id);

      setProfiles(sortedProfiles);
      setMessages(safeMessages);

      const currentSelected = preferredSelectedUser ?? selectedUser;

      if (currentSelected && sortedProfiles.some((p) => p.id === currentSelected)) {
        setSelectedUser(currentSelected);
      } else if (sortedProfiles.length > 0) {
        const existingConversationPartner = [...safeMessages]
          .reverse()
          .map((m) => (m.sender_id === user.id ? m.recipient_id : m.sender_id))
          .find((id) => sortedProfiles.some((p) => p.id === id));

        setSelectedUser(existingConversationPartner || sortedProfiles[0].id);
      } else {
        setSelectedUser(null);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }

  async function markConversationAsRead(activeUserId: string, partnerId: string) {
    const unreadIncoming = messages.filter(
      (m) =>
        m.sender_id === partnerId &&
        m.recipient_id === activeUserId &&
        m.is_read === false
    );

    if (unreadIncoming.length === 0) return;

    const unreadIds = unreadIncoming.map((m) => m.id);
    const readTimestamp = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("messages")
      .update({
        is_read: true,
        read_at: readTimestamp,
      })
      .in("id", unreadIds);

    if (updateError) {
      console.error("Failed to mark messages as read:", updateError.message);
      return;
    }

    setMessages((prev) =>
      prev.map((m) =>
        unreadIds.includes(m.id)
          ? { ...m, is_read: true, read_at: readTimestamp }
          : m
      )
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`messages-live-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const incoming = payload.new as Message;
          const isRelevant =
            incoming.sender_id === userId || incoming.recipient_id === userId;

          if (!isRelevant) return;

          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === incoming.id);
            if (exists) return prev;

            return [...prev, incoming].sort(
              (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const updated = payload.new as Message;
          const isRelevant =
            updated.sender_id === userId || updated.recipient_id === userId;

          if (!isRelevant) return;

          setMessages((prev) =>
            prev.map((msg) => (msg.id === updated.id ? updated : msg))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const selectedProfile = useMemo(() => {
    return profiles.find((p) => p.id === selectedUser) || null;
  }, [profiles, selectedUser]);

  const conversationItems = useMemo(() => {
    if (!userId) return [];

    return profiles
      .map((profile) => {
        const thread = messages.filter(
          (m) =>
            (m.sender_id === userId && m.recipient_id === profile.id) ||
            (m.sender_id === profile.id && m.recipient_id === userId)
        );

        const lastMessage = thread[thread.length - 1] || null;
        const unreadCount = thread.filter(
          (m) =>
            m.sender_id === profile.id &&
            m.recipient_id === userId &&
            m.is_read === false
        ).length;

        return {
          profile,
          thread,
          lastMessage,
          unreadCount,
        };
      })
      .filter((item) => item.thread.length > 0 || item.profile.role === "admin")
      .sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
        const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
        return bTime - aTime;
      });
  }, [profiles, messages, userId]);

  const activeMessages = useMemo(() => {
    if (!userId || !selectedUser) return [];

    return messages.filter(
      (m) =>
        (m.sender_id === userId && m.recipient_id === selectedUser) ||
        (m.sender_id === selectedUser && m.recipient_id === userId)
    );
  }, [messages, userId, selectedUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  useEffect(() => {
    if (!userId || !selectedUser) return;
    markConversationAsRead(userId, selectedUser);
  }, [userId, selectedUser, activeMessages.length]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();

    if (!userId || !selectedUser || !newMessage.trim()) return;

    try {
      setSending(true);
      setError("");

      const messageText = newMessage.trim();

      const { error: insertError } = await supabase.from("messages").insert({
        sender_id: userId,
        recipient_id: selectedUser,
        content: messageText,
        is_read: false,
        read_at: null,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setNewMessage("");
    } catch (err: any) {
      setError(err?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="mt-2 text-slate-600">Loading your inbox...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
            <p className="mt-2 text-slate-600">Chat with providers and support.</p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to dashboard
          </Link>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Conversations</h2>

            <div className="space-y-2">
              {conversationItems.map(({ profile, lastMessage, unreadCount }) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedUser(profile.id)}
                  className={`w-full rounded-2xl p-4 text-left transition ${
                    selectedUser === profile.id
                      ? "border border-emerald-300 bg-emerald-100"
                      : unreadCount > 0
                      ? "border border-red-200 bg-red-50 hover:bg-red-100"
                      : "border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900">{getName(profile)}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {profile.account_type || profile.role || "Member"}
                      </div>
                    </div>

                    {unreadCount > 0 ? (
                      <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                        {unreadCount}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 line-clamp-2 text-xs text-slate-500">
                    {lastMessage ? lastMessage.content : "Start a new conversation"}
                  </div>
                </button>
              ))}

              {conversationItems.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No providers or support profiles found yet.
                </div>
              ) : null}
            </div>
          </aside>

          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedProfile ? getName(selectedProfile) : "Select a conversation"}
              </h2>
            </div>

            <div className="flex min-h-[650px] flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {!selectedUser ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Choose someone on the left to start chatting.
                  </div>
                ) : null}

                {selectedUser && activeMessages.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No messages yet. Type a message below and press Send message.
                  </div>
                ) : null}

                {activeMessages.map((msg) => {
                  const mine = msg.sender_id === userId;

                  return (
                    <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          mine
                            ? "bg-emerald-600 text-white"
                            : msg.is_read === false
                            ? "border border-red-200 bg-red-50 text-slate-900"
                            : "border border-slate-200 bg-slate-100 text-slate-900"
                        }`}
                      >
                        <div>{msg.content}</div>
                        <div
                          className={`mt-2 text-[11px] ${
                            mine ? "text-emerald-100" : "text-slate-500"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={bottomRef} />
              </div>

              <form onSubmit={sendMessage} className="border-t border-slate-200 p-5">
                <div className="flex flex-col gap-3 md:flex-row">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={
                      selectedUser
                        ? "Type your message here..."
                        : "Select a conversation first..."
                    }
                    disabled={!selectedUser || sending}
                    rows={3}
                    className="min-h-[110px] flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={!selectedUser || !newMessage.trim() || sending}
                    className="inline-flex min-w-[180px] items-center justify-center rounded-2xl bg-emerald-600 px-6 py-4 text-base font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {sending ? "Sending..." : "Send message"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}