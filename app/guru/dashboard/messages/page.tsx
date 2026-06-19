"use client";

import Link from "next/link";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  email?: string | null;
  account_type?: string | null;
  role?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  image_url?: string | null;
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

type GuruRecord = {
  id?: string | number | null;
  user_id?: string | null;
  email?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  profile_photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
};

type BookingRow = Record<string, string | number | null | undefined>;

type ConversationItem = {
  profile: Profile;
  thread: Message[];
  lastMessage: Message | null;
  unreadCount: number;
  isBookedCustomer: boolean;
  isAdmin: boolean;
};

function getName(profile?: Profile | null) {
  if (!profile) return "User";
  const full = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
  return (
    profile.full_name ||
    profile.display_name ||
    profile.name ||
    full ||
    profile.email?.split("@")[0] ||
    profile.account_type ||
    profile.role ||
    "User"
  );
}

function getPhoto(profile?: Profile | null) {
  return profile?.profile_photo_url || profile?.avatar_url || profile?.image_url || null;
}

function getGuruDisplayName(profile?: Profile | null, guru?: GuruRecord | null) {
  const profileFull = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();

  return (
    guru?.full_name ||
    guru?.display_name ||
    guru?.name ||
    profile?.full_name ||
    profile?.display_name ||
    profile?.name ||
    profileFull ||
    guru?.email?.split("@")[0] ||
    profile?.email?.split("@")[0] ||
    "Guru"
  );
}

function getGuruPhotoUrl(profile?: Profile | null, guru?: GuruRecord | null) {
  return (
    guru?.profile_photo_url ||
    guru?.avatar_url ||
    guru?.image_url ||
    profile?.profile_photo_url ||
    profile?.avatar_url ||
    profile?.image_url ||
    null
  );
}

function MessageAvatar({
  profile,
  photoUrl,
  fallbackName,
  size = "md",
}: {
  profile?: Profile | null;
  photoUrl?: string | null;
  fallbackName?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const label = fallbackName || getName(profile);
  const photo = photoUrl || getPhoto(profile);
  const sizeClass = size === "lg" ? "h-14 w-14 text-lg" : size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";

  if (photo) {
    return <img src={photo} alt={label} className={`${sizeClass} rounded-full border border-slate-200 object-cover shadow-sm`} />;
  }

  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-full border border-emerald-100 bg-gradient-to-br from-emerald-50 to-sky-50 font-black !text-[#061638] shadow-sm`}>
      {initials(label)}
    </div>
  );
}

function getStatusText(count: number) {
  if (count <= 0) return "No active threads yet";
  if (count === 1) return "1 active thread";
  return `${count} active threads`;
}

function normalizeRole(value?: string | null) {
  const role = String(value || "").trim().toLowerCase();
  if (["provider", "sitter", "walker"].includes(role)) return "guru";
  if (["pet_parent", "pet parent", "pet owner", "owner", "customer"].includes(role)) return "customer";
  return role;
}

function isAdmin(profile?: Profile | null) {
  return normalizeRole(profile?.role || profile?.account_type) === "admin";
}

function isCustomer(profile?: Profile | null) {
  return normalizeRole(profile?.role || profile?.account_type) === "customer";
}

function getRoleLabel(profile?: Profile | null) {
  const role = normalizeRole(profile?.role || profile?.account_type);
  if (role === "admin") return "Admin HQ";
  if (role === "customer") return "Pet Parent";
  if (role === "guru") return "Guru";
  return profile?.account_type || profile?.role || "Member";
}

function initials(value?: string | null) {
  const parts = String(value || "SG")
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "SG";
}

function Avatar({ profile, size = "md" }: { profile?: Profile | null; size?: "sm" | "md" | "lg" }) {
  const photo = getPhoto(profile);
  const label = getName(profile);
  const sizeClass = size === "lg" ? "h-14 w-14 text-lg" : size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";

  if (photo) {
    return <img src={photo} alt={label} className={`${sizeClass} rounded-full border border-slate-200 object-cover shadow-sm`} />;
  }

  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-full border border-emerald-100 bg-gradient-to-br from-emerald-50 to-sky-50 font-black !text-[#061638] shadow-sm`}>
      {initials(label)}
    </div>
  );
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string") return error.message;
  return "Something went wrong.";
}

function getPartnerIds(messages: Message[], userId: string) {
  const ids = new Set<string>();
  messages.forEach((message) => {
    if (message.sender_id === userId) ids.add(message.recipient_id);
    if (message.recipient_id === userId) ids.add(message.sender_id);
  });
  ids.delete(userId);
  return ids;
}

function getBookingValue(booking: BookingRow, keys: string[]) {
  for (const key of keys) {
    const value = booking[key];
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return null;
}

async function fetchGuruRecord(userId: string, email?: string | null) {
  const select = "id, user_id, email, full_name, display_name, name, profile_photo_url, avatar_url, image_url";

  const byUserId = await supabase.from("gurus").select(select).eq("user_id", userId).maybeSingle();
  if (!byUserId.error && byUserId.data) return byUserId.data as GuruRecord;

  if (email) {
    const byEmail = await supabase.from("gurus").select(select).eq("email", email).maybeSingle();
    if (!byEmail.error && byEmail.data) return byEmail.data as GuruRecord;
  }

  return null;
}

async function fetchBookedCustomerIds(userId: string, guruId?: string | number | null) {
  const ids = new Set<string>();
  const possibleGuruValues = [userId, guruId ? String(guruId) : ""].filter(Boolean);
  const attempts = [
    { select: "customer_id,pet_owner_id,owner_id,user_id,guru_id", guruColumn: "guru_id" },
    { select: "customer_id,pet_owner_id,owner_id,user_id,provider_id", guruColumn: "provider_id" },
    { select: "customer_id,pet_owner_id,owner_id,user_id,sitter_id", guruColumn: "sitter_id" },
    { select: "customer_id,pet_owner_id,owner_id,user_id,guru_user_id", guruColumn: "guru_user_id" },
  ];

  for (const attempt of attempts) {
    for (const guruValue of possibleGuruValues) {
      const { data, error } = await supabase.from("bookings").select(attempt.select).eq(attempt.guruColumn, guruValue);
      if (error || !data) continue;
      (data as unknown as BookingRow[]).forEach((booking) => {
        ["customer_id", "pet_owner_id", "owner_id", "user_id"].forEach((key) => {
          const value = booking[key];
          if (value && String(value) !== userId && String(value) !== String(guruValue)) ids.add(String(value));
        });
      });
    }
    if (ids.size > 0) break;
  }

  return ids;
}

async function fetchAdminRecipient() {
  try {
    const response = await fetch("/api/guru/admin-recipient", { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" });
    const data = (await response.json().catch(() => null)) as { admin?: Profile | null } | null;
    if (!response.ok || !data?.admin?.id) return null;
    return {
      ...data.admin,
      role: "admin",
      account_type: data.admin.account_type || "admin",
      display_name: "Admin HQ",
      full_name: data.admin.full_name || data.admin.display_name || data.admin.name || "Admin HQ",
    } as Profile;
  } catch {
    return null;
  }
}

async function fetchProfileById(id?: string | null) {
  if (!id) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id,email,first_name,last_name,full_name,display_name,name,account_type,role,avatar_url,profile_photo_url,image_url")
    .eq("id", id)
    .maybeSingle();
  return (data || null) as Profile | null;
}

async function fetchProfileByEmail(email?: string | null) {
  if (!email) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id,email,first_name,last_name,full_name,display_name,name,account_type,role,avatar_url,profile_photo_url,image_url")
    .ilike("email", email)
    .maybeSingle();
  return (data || null) as Profile | null;
}

async function fetchDirectRecipient({
  recipientId,
  email,
  name,
  bookingId,
  activeUserId,
  guruId,
}: {
  recipientId?: string | null;
  email?: string | null;
  name?: string | null;
  bookingId?: string | null;
  activeUserId: string;
  guruId?: string | number | null;
}) {
  const byId = await fetchProfileById(recipientId);
  if (byId?.id && byId.id !== activeUserId) return byId;

  const byEmail = await fetchProfileByEmail(email);
  if (byEmail?.id && byEmail.id !== activeUserId) return byEmail;

  if (!bookingId) return null;

  const { data } = await supabase.from("bookings").select("*").eq("id", bookingId).maybeSingle();
  const booking = (data || null) as BookingRow | null;
  if (!booking) return null;

  const blocked = new Set(
    [activeUserId, guruId ? String(guruId) : null, getBookingValue(booking, ["guru_id"]), getBookingValue(booking, ["sitter_id"])]
      .filter(Boolean)
      .map(String)
  );
  const bookingName = getBookingValue(booking, ["customer_name", "owner_name", "pet_parent_name", "name"]);
  const bookingEmail = getBookingValue(booking, ["customer_email", "owner_email", "pet_parent_email", "email"]);
  const possibleIds = ["customer_id", "pet_owner_id", "owner_id", "customer_user_id", "user_id"]
    .map((key) => getBookingValue(booking, [key]))
    .filter(Boolean) as string[];

  for (const id of possibleIds) {
    if (blocked.has(id)) continue;
    const profile = await fetchProfileById(id);
    if (profile?.id) return { ...profile, role: profile.role || "customer", account_type: profile.account_type || "customer" } as Profile;
    return {
      id,
      email: bookingEmail || email || null,
      full_name: bookingName || name || bookingEmail || email || "Pet Parent",
      role: "customer",
      account_type: "customer",
    } as Profile;
  }

  return null;
}

async function fetchProfiles({
  userId,
  partnerIds,
  bookedCustomerIds,
  adminRecipient,
  directRecipient,
}: {
  userId: string;
  partnerIds: Set<string>;
  bookedCustomerIds: Set<string>;
  adminRecipient?: Profile | null;
  directRecipient?: Profile | null;
}) {
  const profileMap = new Map<string, Profile>();
  const requiredIds = Array.from(new Set([...partnerIds, ...bookedCustomerIds])).filter((id) => id && id !== userId);

  if (directRecipient?.id && directRecipient.id !== userId) {
    profileMap.set(directRecipient.id, directRecipient);
    bookedCustomerIds.add(directRecipient.id);
  }

  if (adminRecipient?.id && adminRecipient.id !== userId) {
    profileMap.set(adminRecipient.id, adminRecipient);
  }

  if (requiredIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id,email,first_name,last_name,full_name,display_name,name,account_type,role,avatar_url,profile_photo_url,image_url")
      .in("id", requiredIds);

    ((data || []) as Profile[]).forEach((profile) => profileMap.set(profile.id, profile));
  }

  return Array.from(profileMap.values()).filter((profile) => {
    if (profile.id === directRecipient?.id) return true;
    if (isAdmin(profile)) return partnerIds.has(profile.id);
    if (partnerIds.has(profile.id)) return true;
    if (isCustomer(profile) && bookedCustomerIds.has(profile.id)) return true;
    return false;
  });
}

function GuruDashboardMessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRecipientId = searchParams.get("recipient");
  const requestedEmail = searchParams.get("email");
  const requestedBookingId = searchParams.get("booking");
  const requestedName = searchParams.get("name");

  const [userId, setUserId] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [guruRecord, setGuruRecord] = useState<GuruRecord | null>(null);
  const [adminRecipient, setAdminRecipient] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [bookedCustomerIds, setBookedCustomerIds] = useState<Set<string>>(() => new Set());
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [inboxFilter, setInboxFilter] = useState<"all" | "customers" | "admin">("all");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadData = useCallback(
    async (preferredSelectedUser?: string | null) => {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/guru/login");
          return;
        }

        setUserId(user.id);

        const [{ data: profileData }, guruData, adminData, { data: messageData, error: messageError }] = await Promise.all([
          supabase
            .from("profiles")
            .select("id,email,first_name,last_name,full_name,display_name,name,account_type,role,avatar_url,profile_photo_url,image_url")
            .eq("id", user.id)
            .maybeSingle(),
          fetchGuruRecord(user.id, user.email),
          fetchAdminRecipient(),
          supabase
            .from("messages")
            .select("id,sender_id,recipient_id,content,created_at,is_read,read_at")
            .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
            .order("created_at", { ascending: true }),
        ]);

        if (messageError) throw messageError;

        const safeMessages = ((messageData || []) as Message[]).filter((message) => {
          const content = String(message.content || "").trim().toLowerCase();
          return content !== "[deleted]" && content !== "deleted";
        });
        const safeGuru = guruData || null;
        const safeAdmin = adminData || null;
        const directRecipient = await fetchDirectRecipient({
          recipientId: requestedRecipientId,
          email: requestedEmail,
          name: requestedName,
          bookingId: requestedBookingId,
          activeUserId: user.id,
          guruId: safeGuru?.id,
        });
        const partnerIds = getPartnerIds(safeMessages, user.id);
        const safeBookedCustomerIds = await fetchBookedCustomerIds(user.id, safeGuru?.id);
        const safeProfiles = await fetchProfiles({
          userId: user.id,
          partnerIds,
          bookedCustomerIds: safeBookedCustomerIds,
          adminRecipient: safeAdmin,
          directRecipient,
        });

        setCurrentProfile((profileData || null) as Profile | null);
        setGuruRecord(safeGuru);
        setAdminRecipient(safeAdmin);
        setProfiles(safeProfiles);
        setMessages(safeMessages);
        setBookedCustomerIds(new Set(safeBookedCustomerIds));

        const preferred = preferredSelectedUser || directRecipient?.id || requestedRecipientId;
        if (preferred && safeProfiles.some((profile) => profile.id === preferred)) {
          setSelectedUser(preferred);
          return;
        }

        const lastPartner = [...safeMessages]
          .reverse()
          .map((message) => (message.sender_id === user.id ? message.recipient_id : message.sender_id))
          .find((id) => safeProfiles.some((profile) => profile.id === id && !isAdmin(profile)));

        const firstCustomer = safeProfiles.find((profile) => !isAdmin(profile));
        setSelectedUser(lastPartner || firstCustomer?.id || null);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [requestedBookingId, requestedEmail, requestedName, requestedRecipientId, router]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`guru-message-center-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const incoming = payload.new as Message;
        if (incoming.sender_id !== userId && incoming.recipient_id !== userId) return;
        setMessages((prev) => {
          if (prev.some((message) => message.id === incoming.id)) return prev;
          return [...prev, incoming].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        });
        void loadData(selectedUser);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const updated = payload.new as Message;
        if (updated.sender_id !== userId && updated.recipient_id !== userId) return;
        setMessages((prev) => prev.map((message) => (message.id === updated.id ? updated : message)));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, selectedUser, userId]);

  const conversationItems = useMemo<ConversationItem[]>(() => {
    if (!userId) return [];

    const byId = new Map<string, ConversationItem>();

    profiles.forEach((profile) => {
      if (!profile?.id || profile.id === userId) return;

      const thread = messages.filter(
        (message) =>
          (message.sender_id === userId && message.recipient_id === profile.id) ||
          (message.sender_id === profile.id && message.recipient_id === userId)
      );
      const isAdminContact = isAdmin(profile);
      const isBookedCustomer = isCustomer(profile) && bookedCustomerIds.has(profile.id);

      // This is the cleanup: no duplicate empty Admin HQ threads and no random empty contacts.
      if (thread.length === 0 && isAdminContact) return;
      if (thread.length === 0 && !isBookedCustomer) return;

      byId.set(profile.id, {
        profile,
        thread,
        lastMessage: thread[thread.length - 1] || null,
        unreadCount: thread.filter(
          (message) => message.sender_id === profile.id && message.recipient_id === userId && message.is_read === false
        ).length,
        isBookedCustomer,
        isAdmin: isAdminContact,
      });
    });

    return Array.from(byId.values()).sort((a, b) => {
      if (a.isAdmin && !b.isAdmin) return 1;
      if (!a.isAdmin && b.isAdmin) return -1;
      const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [bookedCustomerIds, messages, profiles, userId]);

  const filteredConversationItems = useMemo(() => {
    if (inboxFilter === "customers") return conversationItems.filter((item) => !item.isAdmin);
    if (inboxFilter === "admin") return conversationItems.filter((item) => item.isAdmin);
    return conversationItems;
  }, [conversationItems, inboxFilter]);

  const selectedProfile = useMemo(() => {
    return profiles.find((profile) => profile.id === selectedUser) || null;
  }, [profiles, selectedUser]);

  const activeMessages = useMemo(() => {
    if (!userId || !selectedUser) return [];
    return messages.filter(
      (message) =>
        (message.sender_id === userId && message.recipient_id === selectedUser) ||
        (message.sender_id === selectedUser && message.recipient_id === userId)
    );
  }, [messages, selectedUser, userId]);

  const unreadCount = useMemo(() => {
    if (!userId) return 0;
    return messages.filter((message) => message.recipient_id === userId && message.is_read === false).length;
  }, [messages, userId]);

  const customerConversationCount = conversationItems.filter((item) => !item.isAdmin).length;
  const adminConversationCount = conversationItems.filter((item) => item.isAdmin).length;

  const selectConversation = useCallback(
    async (profileId: string) => {
      setSelectedUser(profileId);
      if (!userId) return;

      const unreadIds = messages
        .filter((message) => message.sender_id === profileId && message.recipient_id === userId && message.is_read === false)
        .map((message) => message.id);

      if (!unreadIds.length) return;

      const readAt = new Date().toISOString();
      const { error } = await supabase.from("messages").update({ is_read: true, read_at: readAt }).in("id", unreadIds);
      if (!error) {
        setMessages((prev) => prev.map((message) => (unreadIds.includes(message.id) ? { ...message, is_read: true, read_at: readAt } : message)));
      }
    },
    [messages, userId]
  );

  const handleAdminSupport = useCallback(() => {
    if (!adminRecipient?.id) {
      setError("Admin HQ is not available yet. Please try again shortly.");
      return;
    }

    setProfiles((prev) => {
      if (prev.some((profile) => profile.id === adminRecipient.id)) return prev;
      return [...prev, adminRecipient];
    });
    setSelectedUser(adminRecipient.id);
    setInboxFilter("all");
  }, [adminRecipient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeMessages.length, selectedUser]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId || !selectedUser || !newMessage.trim()) return;

    try {
      setSending(true);
      setError("");
      const content = newMessage.trim();
      setNewMessage("");

      const { error: insertError } = await supabase.from("messages").insert({
        sender_id: userId,
        recipient_id: selectedUser,
        content,
        is_read: false,
      });

      if (insertError) throw insertError;
      await loadData(selectedUser);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  const guruName = getGuruDisplayName(currentProfile, guruRecord);
  const guruPhoto = getGuruPhotoUrl(currentProfile, guruRecord);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6fffb] px-4 py-8 !text-[#061638] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-emerald-100 bg-white p-8 shadow-sm">
          <div className="h-8 w-56 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-6 h-[560px] animate-pulse rounded-[2rem] bg-slate-50" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6fffb] px-4 py-6 !text-[#061638] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-br from-emerald-300 via-emerald-100 to-sky-200 p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] !text-emerald-900">SitGuru Guru Messaging</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight !text-[#061638] sm:text-5xl">Message Center</h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 !text-slate-700">
                  A cleaner inbox for Pet Parent conversations and Admin support. Deleted or empty duplicate threads stay hidden.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/guru/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#061638] px-5 py-3 text-sm font-black !text-white transition hover:bg-[#0b1436]">
                  Back to Dashboard
                </Link>
                <button type="button" onClick={handleAdminSupport} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black !text-emerald-800 transition hover:bg-emerald-50">
                  Message Admin HQ
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-emerald-100 bg-white p-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide !text-slate-500">Conversations</p>
              <p className="mt-1 text-3xl font-black !text-[#061638]">{conversationItems.length}</p>
              <p className="text-xs font-semibold !text-slate-600">{getStatusText(conversationItems.length)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide !text-slate-500">Pet Parents</p>
              <p className="mt-1 text-3xl font-black !text-[#061638]">{customerConversationCount}</p>
              <p className="text-xs font-semibold !text-slate-600">Booked and active</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide !text-slate-500">Unread</p>
              <p className="mt-1 text-3xl font-black !text-[#061638]">{unreadCount}</p>
              <p className="text-xs font-semibold !text-slate-600">Needs attention</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide !text-slate-500">Signed in as</p>
              <div className="mt-2 flex items-center gap-3">
                <MessageAvatar profile={currentProfile} photoUrl={guruPhoto} fallbackName={guruName} size="sm" />
                <p className="min-w-0 truncate text-sm font-black !text-[#061638]">{guruName}</p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold !text-rose-800">{error}</div>
        ) : null}

        <section className="grid min-h-[680px] overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)] lg:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-[#fbfffd] p-4 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] !text-emerald-700">Inbox</p>
                <h2 className="text-3xl font-black !text-[#061638]">Conversations</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black !text-emerald-700">{filteredConversationItems.length}</span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { key: "all", label: "All", count: conversationItems.length },
                { key: "customers", label: "Pet Parents", count: customerConversationCount },
                { key: "admin", label: "Admin", count: adminConversationCount },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setInboxFilter(tab.key as "all" | "customers" | "admin")}
                  className={`rounded-2xl px-3 py-2 text-xs font-black transition ${
                    inboxFilter === tab.key ? "bg-emerald-600 !text-white" : "bg-white !text-slate-700 ring-1 ring-slate-200 hover:bg-emerald-50"
                  }`}
                >
                  {tab.label} <span className="opacity-70">{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3 overflow-y-auto pr-1 lg:max-h-[560px]">
              {filteredConversationItems.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-6 text-center">
                  <p className="text-lg font-black !text-[#061638]">No visible conversations</p>
                  <p className="mt-2 text-sm font-semibold leading-6 !text-slate-600">
                    Real Pet Parent conversations will appear here after bookings or messages. Empty duplicate Admin HQ threads are hidden.
                  </p>
                  <button type="button" onClick={handleAdminSupport} className="mt-4 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black !text-white hover:bg-emerald-700">
                    Message Admin HQ
                  </button>
                </div>
              ) : (
                filteredConversationItems.map((item) => {
                  const active = selectedUser === item.profile.id;
                  return (
                    <button
                      key={item.profile.id}
                      type="button"
                      onClick={() => void selectConversation(item.profile.id)}
                      className={`w-full rounded-[1.35rem] border p-4 text-left transition ${
                        active ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar profile={item.profile} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black !text-[#061638]">{getName(item.profile)}</p>
                              <p className="mt-0.5 text-xs font-bold !text-slate-500">{item.isAdmin ? "Admin Support" : getRoleLabel(item.profile)}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-xs font-bold !text-slate-500">{formatTime(item.lastMessage?.created_at)}</p>
                              {item.unreadCount > 0 ? (
                                <span className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-black !text-white">
                                  {item.unreadCount}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 !text-slate-600">
                            {item.lastMessage?.content || (item.isBookedCustomer ? "Ready to start a booking conversation." : "No message preview.")}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-h-[680px] flex-col bg-white">
            {selectedProfile ? (
              <>
                <div className="border-b border-slate-200 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar profile={selectedProfile} size="lg" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] !text-emerald-700">Active Thread</p>
                        <h2 className="text-3xl font-black tracking-tight !text-[#061638]">{getName(selectedProfile)}</h2>
                        <p className="text-sm font-semibold !text-slate-600">{getRoleLabel(selectedProfile)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isAdmin(selectedProfile) ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black !text-emerald-800">Admin support</span>
                      ) : (
                        <Link href="/guru/dashboard/bookings" className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black !text-emerald-800 hover:bg-emerald-100">
                          View Bookings
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-[#fbfffd] p-4 sm:p-6">
                  {activeMessages.length === 0 ? (
                    <div className="flex min-h-[360px] items-center justify-center rounded-[1.5rem] border border-dashed border-emerald-200 bg-white p-8 text-center">
                      <div>
                        <p className="text-4xl">🐾</p>
                        <h3 className="mt-3 text-2xl font-black !text-[#061638]">Start the conversation</h3>
                        <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 !text-slate-600">
                          Keep booking details, PawReport questions, schedule updates, and support messages organized here.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeMessages.map((message) => {
                        const own = message.sender_id === userId;
                        return (
                          <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[82%] rounded-[1.4rem] px-5 py-4 shadow-sm ${own ? "bg-[#061638] !text-white" : "border border-slate-200 bg-white !text-[#061638]"}`}>
                              <p className="whitespace-pre-wrap text-sm font-semibold leading-6">{message.content}</p>
                              <p className={`mt-2 text-[11px] font-bold ${own ? "!text-white/65" : "!text-slate-500"}`}>{formatTime(message.created_at)}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-4 sm:p-5">
                  <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                    <textarea
                      value={newMessage}
                      onChange={(event) => setNewMessage(event.target.value)}
                      placeholder={isAdmin(selectedProfile) ? "Ask Admin HQ for help with booking, payout, safety, or platform support..." : "Type your message to the Pet Parent..."}
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold !text-[#061638] outline-none placeholder:!text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black !text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:!text-slate-500"
                    >
                      {sending ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center bg-[#fbfffd] p-8 text-center">
                <div className="max-w-xl rounded-[2rem] border border-dashed border-emerald-200 bg-white p-8 shadow-sm">
                  <p className="text-5xl">💬</p>
                  <h2 className="mt-4 text-3xl font-black !text-[#061638]">Select a conversation</h2>
                  <p className="mt-3 text-sm font-semibold leading-6 !text-slate-600">
                    Choose a Pet Parent conversation from the inbox, or message Admin HQ for support.
                  </p>
                  <button type="button" onClick={handleAdminSupport} className="mt-5 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black !text-white hover:bg-emerald-700">
                    Message Admin HQ
                  </button>
                </div>
              </div>
            )}
          </section>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] !text-emerald-700">Customer Messages</p>
            <p className="mt-2 text-sm font-semibold leading-6 !text-slate-600">Booked Pet Parents and active customer threads appear in your inbox.</p>
          </div>
          <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] !text-emerald-700">Admin Support</p>
            <p className="mt-2 text-sm font-semibold leading-6 !text-slate-600">Admin HQ is a single clean support thread, not repeated empty conversations.</p>
          </div>
          <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] !text-emerald-700">Care Notes</p>
            <p className="mt-2 text-sm font-semibold leading-6 !text-slate-600">Use messages for booking questions. Use PawReport for live care updates.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function GuruDashboardMessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f6fffb] px-4 py-8 !text-[#061638] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-emerald-100 bg-white p-8 shadow-sm">
            <div className="h-8 w-56 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-6 h-[560px] animate-pulse rounded-[2rem] bg-slate-50" />
          </div>
        </main>
      }
    >
      <GuruDashboardMessagesPageContent />
    </Suspense>
  );
}
