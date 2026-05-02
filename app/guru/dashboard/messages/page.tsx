"use client";

import Link from "next/link";
import {
  FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

type AdminRecipientResponse = {
  admin?: Profile | null;
  error?: string;
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

type DirectRecipientRequest = {
  recipientId?: string | null;
  email?: string | null;
  name?: string | null;
  bookingId?: string | null;
  activeUserId: string;
  guruId?: string | number | null;
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

function getProfilePhotoUrl(profile?: Profile | null) {
  if (!profile) return null;

  return (
    profile.profile_photo_url ||
    profile.avatar_url ||
    profile.image_url ||
    null
  );
}

function getGuruDisplayName(profile?: Profile | null, guru?: GuruRecord | null) {
  return (
    guru?.full_name ||
    guru?.display_name ||
    guru?.name ||
    getName(profile) ||
    "Guru"
  );
}

function getGuruPhotoUrl(profile?: Profile | null, guru?: GuruRecord | null) {
  return (
    guru?.profile_photo_url ||
    guru?.avatar_url ||
    guru?.image_url ||
    getProfilePhotoUrl(profile)
  );
}

function getInitialsFromLabel(value?: string | null) {
  if (!value) return "SG";

  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "SG";

  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function MessageAvatar({
  profile,
  photoUrl,
  fallbackName,
}: {
  profile?: Profile | null;
  photoUrl?: string | null;
  fallbackName?: string;
}) {
  const label = fallbackName || getName(profile);

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={label}
        className="h-11 w-11 rounded-full border border-slate-200 object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-black text-slate-700 shadow-sm">
      {getInitialsFromLabel(label)}
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Something went wrong.";
}

function normalizeRole(value?: string | null) {
  const role = String(value || "").trim().toLowerCase();

  if (role === "provider" || role === "sitter" || role === "walker") {
    return "guru";
  }

  if (role === "pet_parent" || role === "pet owner" || role === "owner") {
    return "customer";
  }

  return role;
}

function getReadableRole(profile?: Profile | null) {
  const role = normalizeRole(profile?.role || profile?.account_type);

  if (role === "admin") return "Admin HQ";
  if (role === "customer") return "Customer";
  if (role === "guru") return "Guru";

  return profile?.account_type || profile?.role || "Member";
}

function getInitials(profile?: Profile | null) {
  const name = getName(profile);
  const initials = name
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "SU";
}

function getStatusText(conversationCount: number) {
  if (conversationCount === 0) {
    return "No conversations yet";
  }

  if (conversationCount === 1) {
    return "1 active conversation";
  }

  return `${conversationCount} active conversations`;
}

function isCustomerRole(profile?: Profile | null) {
  const role = normalizeRole(profile?.role || profile?.account_type);
  return role === "customer";
}

function isAdminRole(profile?: Profile | null) {
  const role = normalizeRole(profile?.role || profile?.account_type);
  return role === "admin";
}

function isGuruRole(profile?: Profile | null) {
  const role = normalizeRole(profile?.role || profile?.account_type);
  return role === "guru";
}

function isAllowedGuruContact({
  profile,
  partnerIdsWithMessages,
  bookedCustomerIds,
}: {
  profile: Profile;
  partnerIdsWithMessages: Set<string>;
  bookedCustomerIds: Set<string>;
}) {
  if (isAdminRole(profile)) return true;

  if (partnerIdsWithMessages.has(profile.id)) {
    return true;
  }

  if (isCustomerRole(profile) && bookedCustomerIds.has(profile.id)) {
    return true;
  }

  return false;
}

function sortConversationPartners(
  safeProfiles: Profile[],
  safeMessages: Message[],
  activeUserId: string
) {
  const lastMessageTimeByPartner = new Map<string, number>();

  for (const message of safeMessages) {
    const partnerId =
      message.sender_id === activeUserId
        ? message.recipient_id
        : message.sender_id;

    const messageTime = new Date(message.created_at).getTime();
    const current = lastMessageTimeByPartner.get(partnerId) || 0;

    if (messageTime > current) {
      lastMessageTimeByPartner.set(partnerId, messageTime);
    }
  }

  return [...safeProfiles].sort((a, b) => {
    const aIsAdmin = isAdminRole(a);
    const bIsAdmin = isAdminRole(b);

    if (aIsAdmin && !bIsAdmin) return -1;
    if (!aIsAdmin && bIsAdmin) return 1;

    const aTime = lastMessageTimeByPartner.get(a.id) || 0;
    const bTime = lastMessageTimeByPartner.get(b.id) || 0;

    return bTime - aTime;
  });
}

function getPartnerIdsFromMessages(messages: Message[], activeUserId: string) {
  const partnerIds = new Set<string>();

  messages.forEach((message) => {
    if (message.sender_id === activeUserId) {
      partnerIds.add(message.recipient_id);
    }

    if (message.recipient_id === activeUserId) {
      partnerIds.add(message.sender_id);
    }
  });

  return partnerIds;
}

async function fetchGuruRecord(userId: string, email?: string | null) {
  const byUserId = await supabase
    .from("gurus")
    .select(
      "id, user_id, email, full_name, display_name, name, profile_photo_url, avatar_url, image_url"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (!byUserId.error && byUserId.data) {
    return byUserId.data as GuruRecord;
  }

  if (email) {
    const byEmail = await supabase
      .from("gurus")
      .select(
        "id, user_id, email, full_name, display_name, name, profile_photo_url, avatar_url, image_url"
      )
      .eq("email", email)
      .maybeSingle();

    if (!byEmail.error && byEmail.data) {
      return byEmail.data as GuruRecord;
    }
  }

  return null;
}

async function fetchBookedCustomerIds({
  userId,
  guruId,
}: {
  userId: string;
  guruId?: string | number | null;
}) {
  const bookedCustomerIds = new Set<string>();

  const possibleGuruValues = [userId, guruId ? String(guruId) : ""].filter(
    Boolean
  );

  const attempts = [
    {
      select: "customer_id, pet_owner_id, owner_id, user_id, guru_id",
      guruColumn: "guru_id",
      customerColumns: ["customer_id", "pet_owner_id", "owner_id", "user_id"],
    },
    {
      select: "customer_id, pet_owner_id, owner_id, user_id, provider_id",
      guruColumn: "provider_id",
      customerColumns: ["customer_id", "pet_owner_id", "owner_id", "user_id"],
    },
    {
      select: "customer_id, pet_owner_id, owner_id, user_id, sitter_id",
      guruColumn: "sitter_id",
      customerColumns: ["customer_id", "pet_owner_id", "owner_id", "user_id"],
    },
    {
      select: "customer_id, pet_owner_id, owner_id, user_id, guru_user_id",
      guruColumn: "guru_user_id",
      customerColumns: ["customer_id", "pet_owner_id", "owner_id", "user_id"],
    },
  ];

  for (const attempt of attempts) {
    for (const guruValue of possibleGuruValues) {
      const { data, error } = await supabase
        .from("bookings")
        .select(attempt.select)
        .eq(attempt.guruColumn, guruValue);

      if (error || !data) {
        continue;
      }

      (data as unknown as BookingRow[]).forEach((booking) => {
        attempt.customerColumns.forEach((column) => {
          const value = booking[column];

          if (value) {
            const stringValue = String(value);

            if (stringValue !== String(guruValue) && stringValue !== userId) {
              bookedCustomerIds.add(stringValue);
            }
          }
        });
      });
    }

    if (bookedCustomerIds.size > 0) {
      break;
    }
  }

  return bookedCustomerIds;
}

async function fetchAdminRecipientProfile() {
  try {
    const response = await fetch("/api/guru/admin-recipient", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = (await response
      .json()
      .catch(() => null)) as AdminRecipientResponse | null;

    if (!response.ok || !data?.admin?.id) {
      return null;
    }

    return {
      ...data.admin,
      role: "admin",
      account_type: data.admin.account_type || "admin",
      display_name: "Admin HQ",
      full_name:
        data.admin.full_name ||
        data.admin.display_name ||
        data.admin.name ||
        "Admin HQ",
    } as Profile;
  } catch (error) {
    console.warn("Could not load Admin HQ recipient:", error);
    return null;
  }
}

function getBookingStringValue(booking: BookingRow | null, keys: string[]) {
  if (!booking) return null;

  for (const key of keys) {
    const value = booking[key];

    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value).trim();
    }
  }

  return null;
}

async function fetchProfileById(profileId?: string | null) {
  if (!profileId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, account_type, role")
    .eq("id", profileId)
    .maybeSingle();

  return (data || null) as Profile | null;
}

async function fetchProfileByEmail(email?: string | null) {
  if (!email) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, account_type, role")
    .ilike("email", email)
    .maybeSingle();

  return (data || null) as Profile | null;
}

async function fetchDirectRecipientProfile({
  recipientId,
  email,
  name,
  bookingId,
  activeUserId,
  guruId,
}: DirectRecipientRequest) {
  const directProfile = await fetchProfileById(recipientId);

  if (directProfile?.id && directProfile.id !== activeUserId) {
    return directProfile;
  }

  const emailProfile = await fetchProfileByEmail(email);

  if (emailProfile?.id && emailProfile.id !== activeUserId) {
    return emailProfile;
  }

  if (!bookingId) return null;

  const { data: bookingData } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  const booking = (bookingData || null) as BookingRow | null;

  if (!booking) return null;

  const possibleRecipientIds = [
    getBookingStringValue(booking, ["customer_id"]),
    getBookingStringValue(booking, ["pet_owner_id"]),
    getBookingStringValue(booking, ["owner_id"]),
    getBookingStringValue(booking, ["customer_user_id"]),
    getBookingStringValue(booking, ["user_id"]),
  ].filter(Boolean) as string[];

  const blockedIds = new Set(
    [
      activeUserId,
      guruId ? String(guruId) : null,
      getBookingStringValue(booking, ["guru_id"]),
      getBookingStringValue(booking, ["sitter_id"]),
    ]
      .filter(Boolean)
      .map(String)
  );

  const bookingEmail = getBookingStringValue(booking, [
    "customer_email",
    "owner_email",
    "pet_parent_email",
    "email",
  ]);

  const bookingName = getBookingStringValue(booking, [
    "customer_name",
    "owner_name",
    "pet_parent_name",
    "name",
  ]);

  for (const id of possibleRecipientIds) {
    if (blockedIds.has(id)) continue;

    const profile = await fetchProfileById(id);

    if (profile?.id && profile.id !== activeUserId) {
      return {
        ...profile,
        full_name:
          profile.full_name || bookingName || name || profile.email || "Pet Parent",
        email: profile.email || bookingEmail || email || null,
        role: profile.role || profile.account_type || "customer",
        account_type: profile.account_type || profile.role || "customer",
      } as Profile;
    }

    return {
      id,
      email: bookingEmail || email || null,
      full_name: bookingName || name || bookingEmail || email || "Pet Parent",
      account_type: "customer",
      role: "customer",
    } as Profile;
  }

  const bookingEmailProfile = await fetchProfileByEmail(bookingEmail || email);

  if (bookingEmailProfile?.id && bookingEmailProfile.id !== activeUserId) {
    return {
      ...bookingEmailProfile,
      full_name:
        bookingEmailProfile.full_name ||
        bookingName ||
        name ||
        bookingEmailProfile.email ||
        "Pet Parent",
      role: bookingEmailProfile.role || bookingEmailProfile.account_type || "customer",
      account_type:
        bookingEmailProfile.account_type || bookingEmailProfile.role || "customer",
    } as Profile;
  }

  return null;
}

async function fetchProfilesForGuruInbox({
  userId,
  partnerIdsWithMessages,
  bookedCustomerIds,
  adminRecipient,
  directRecipient,
}: {
  userId: string;
  partnerIdsWithMessages: Set<string>;
  bookedCustomerIds: Set<string>;
  adminRecipient?: Profile | null;
  directRecipient?: Profile | null;
}) {
  const profileColumns = "id, email, full_name, account_type, role";

  const requiredProfileIds = Array.from(
    new Set([...partnerIdsWithMessages, ...bookedCustomerIds])
  ).filter((id) => id && id !== userId);

  const profileMap = new Map<string, Profile>();

  if (directRecipient?.id && directRecipient.id !== userId) {
    profileMap.set(directRecipient.id, directRecipient);
    bookedCustomerIds.add(directRecipient.id);
  }

  if (adminRecipient?.id && adminRecipient.id !== userId) {
    profileMap.set(adminRecipient.id, {
      ...adminRecipient,
      role: "admin",
      account_type: adminRecipient.account_type || "admin",
    });
  }

  if (requiredProfileIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select(profileColumns)
      .in("id", requiredProfileIds);

    ((data || []) as Profile[]).forEach((profile) => {
      profileMap.set(profile.id, profile);
    });
  }

  if (!adminRecipient?.id) {
    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select(profileColumns)
      .eq("role", "admin")
      .limit(1);

    const fallbackAdmin = ((adminProfiles || []) as Profile[])[0];

    if (fallbackAdmin?.id && fallbackAdmin.id !== userId) {
      profileMap.set(fallbackAdmin.id, {
        ...fallbackAdmin,
        full_name: fallbackAdmin.full_name || "Admin HQ",
        role: "admin",
        account_type: fallbackAdmin.account_type || "admin",
      });
    }
  }

  const fallbackAllProfiles =
    profileMap.size === 0 || requiredProfileIds.length === 0;

  if (fallbackAllProfiles) {
    const { data } = await supabase
      .from("profiles")
      .select(profileColumns)
      .neq("id", userId);

    ((data || []) as Profile[])
      .filter((profile) =>
        isAllowedGuruContact({
          profile,
          partnerIdsWithMessages,
          bookedCustomerIds,
        })
      )
      .forEach((profile) => {
        profileMap.set(profile.id, profile);
      });
  }

  return Array.from(profileMap.values()).filter((profile) =>
    isAllowedGuruContact({
      profile,
      partnerIdsWithMessages,
      bookedCustomerIds,
    })
  );
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
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [bookedCustomerIds, setBookedCustomerIds] = useState<Set<string>>(
    () => new Set()
  );
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

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

        const [
          { data: currentProfileData },
          guruData,
          adminRecipient,
          { data: messagesData, error: messagesError },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, email, full_name, account_type, role")
            .eq("id", user.id)
            .maybeSingle(),
          fetchGuruRecord(user.id, user.email),
          fetchAdminRecipientProfile(),
          supabase
            .from("messages")
            .select(
              "id, sender_id, recipient_id, content, created_at, is_read, read_at"
            )
            .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
            .order("created_at", { ascending: true }),
        ]);

        if (messagesError) throw messagesError;

        const safeCurrentProfile = (currentProfileData || null) as Profile | null;
        const safeGuruRecord = guruData || null;
        const safeMessages = (messagesData || []) as Message[];
        const directRecipient = await fetchDirectRecipientProfile({
          recipientId: requestedRecipientId,
          email: requestedEmail,
          name: requestedName,
          bookingId: requestedBookingId,
          activeUserId: user.id,
          guruId: safeGuruRecord?.id,
        });
        const partnerIdsWithMessages = getPartnerIdsFromMessages(
          safeMessages,
          user.id
        );

        const safeBookedCustomerIds = await fetchBookedCustomerIds({
          userId: user.id,
          guruId: safeGuruRecord?.id,
        });

        const safeProfiles = await fetchProfilesForGuruInbox({
          userId: user.id,
          partnerIdsWithMessages,
          bookedCustomerIds: safeBookedCustomerIds,
          adminRecipient,
          directRecipient,
        });

        const sortedProfiles = sortConversationPartners(
          safeProfiles,
          safeMessages,
          user.id
        );

        setCurrentProfile(safeCurrentProfile);
        setGuruRecord(safeGuruRecord);
        setProfiles(sortedProfiles);
        setMessages(safeMessages);
        setBookedCustomerIds(safeBookedCustomerIds);

        const preferredRecipient =
          preferredSelectedUser || directRecipient?.id || requestedRecipientId || null;

        if (
          preferredRecipient &&
          sortedProfiles.some((p) => p.id === preferredRecipient)
        ) {
          setSelectedUser(preferredRecipient);
        } else if (sortedProfiles.length > 0) {
          const existingConversationPartner = [...safeMessages]
            .reverse()
            .map((message) =>
              message.sender_id === user.id
                ? message.recipient_id
                : message.sender_id
            )
            .find((id) => sortedProfiles.some((profile) => profile.id === id));

          const adminContact = sortedProfiles.find((profile) =>
            isAdminRole(profile)
          );

          setSelectedUser(
            existingConversationPartner ||
              adminContact?.id ||
              sortedProfiles[0].id
          );
        } else {
          setSelectedUser(null);
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err) || "Failed to load messages.");
      } finally {
        setLoading(false);
      }
    },
    [requestedBookingId, requestedEmail, requestedName, requestedRecipientId, router]
  );

  const markConversationAsRead = useCallback(
    async (activeUserId: string, partnerId: string) => {
      const unreadIncoming = messages.filter(
        (message) =>
          message.sender_id === partnerId &&
          message.recipient_id === activeUserId &&
          message.is_read === false
      );

      if (unreadIncoming.length === 0) return;

      const unreadIds = unreadIncoming.map((message) => message.id);
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
        prev.map((message) =>
          unreadIds.includes(message.id)
            ? { ...message, is_read: true, read_at: readTimestamp }
            : message
        )
      );
    },
    [messages]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`guru-messages-live-${userId}`)
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
            const exists = prev.some((message) => message.id === incoming.id);
            if (exists) return prev;

            return [...prev, incoming].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );
          });

          void loadData(selectedUser);
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
            prev.map((message) =>
              message.id === updated.id ? updated : message
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, selectedUser, userId]);

  const selectedProfile = useMemo(() => {
    return profiles.find((profile) => profile.id === selectedUser) || null;
  }, [profiles, selectedUser]);

  const conversationItems = useMemo(() => {
    if (!userId) return [];

    return profiles
      .map((profile) => {
        const thread = messages.filter(
          (message) =>
            (message.sender_id === userId && message.recipient_id === profile.id) ||
            (message.sender_id === profile.id && message.recipient_id === userId)
        );

        const lastMessage = thread[thread.length - 1] || null;
        const unreadCount = thread.filter(
          (message) =>
            message.sender_id === profile.id &&
            message.recipient_id === userId &&
            message.is_read === false
        ).length;

        return {
          profile,
          thread,
          lastMessage,
          unreadCount,
          isBookedCustomer:
            isCustomerRole(profile) && bookedCustomerIds.has(profile.id),
        };
      })
      .filter(
        (item) =>
          item.thread.length > 0 ||
          isAdminRole(item.profile) ||
          item.isBookedCustomer
      )
      .sort((a, b) => {
        const aAdmin = isAdminRole(a.profile);
        const bAdmin = isAdminRole(b.profile);

        if (aAdmin && !bAdmin) return -1;
        if (!aAdmin && bAdmin) return 1;

        const aTime = a.lastMessage
          ? new Date(a.lastMessage.created_at).getTime()
          : 0;
        const bTime = b.lastMessage
          ? new Date(b.lastMessage.created_at).getTime()
          : 0;

        return bTime - aTime;
      });
  }, [bookedCustomerIds, messages, profiles, userId]);

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

    return messages.filter(
      (message) => message.recipient_id === userId && message.is_read === false
    ).length;
  }, [messages, userId]);

  const customerConversationCount = useMemo(() => {
    return conversationItems.filter(
      (item) => isCustomerRole(item.profile) || item.isBookedCustomer
    ).length;
  }, [conversationItems]);

  const adminConversationCount = useMemo(() => {
    return conversationItems.filter((item) => isAdminRole(item.profile)).length;
  }, [conversationItems]);

  const selectedContactLabel = selectedProfile
    ? getReadableRole(selectedProfile)
    : "No contact selected";

  const recipientOptions = useMemo(() => {
    const options: { id: string; label: string }[] = [];
    let adminAdded = false;
    const seenLabels = new Set<string>();

    conversationItems.forEach((item) => {
      const isAdmin = isAdminRole(item.profile);

      if (isAdmin) {
        if (adminAdded) return;
        adminAdded = true;
      }

      const label = `${
        isAdmin ? "Admin HQ" : getName(item.profile)
      } · ${item.isBookedCustomer ? "Pet Parent" : getReadableRole(item.profile)}`;

      const labelKey = label.toLowerCase();

      if (seenLabels.has(labelKey)) return;
      seenLabels.add(labelKey);

      options.push({
        id: item.profile.id,
        label,
      });
    });

    return options;
  }, [conversationItems]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  useEffect(() => {
    if (!userId || !selectedUser) return;
    void markConversationAsRead(userId, selectedUser);
  }, [activeMessages.length, markConversationAsRead, selectedUser, userId]);

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
        body: messageText,
        is_read: false,
        read_at: null,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setNewMessage("");
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main
        className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] pb-10 text-slate-950"
        style={{
          fontFamily:
            '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontWeight: 300,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl ring-1 ring-emerald-100">
              💬
            </div>
            <h1 className="text-2xl font-black text-slate-950">Messages</h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Loading your Guru inbox...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] pb-10 text-slate-950"
      style={{
        fontFamily:
          '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: 300,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#00d69f_0%,#66e3c7_48%,#b8e5ff_100%)] px-6 py-8 md:px-10 md:py-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-900/80 md:text-sm">
                  SitGuru Guru Messaging
                </p>

                <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-[-0.045em] !text-slate-950 md:text-6xl">
                  Message Center
                </h1>

                <p className="mt-5 max-w-3xl text-base leading-8 !text-slate-800 md:text-xl">
                  Communicate directly with booked customers and SitGuru Admin
                  without leaving your Guru dashboard.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/guru/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Back to Dashboard
                </Link>

                <Link
                  href="/guru/dashboard/profile"
                  className="inline-flex items-center justify-center rounded-2xl bg-white/90 px-5 py-3 text-sm font-black !text-slate-950 shadow-sm ring-1 ring-white/80 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Update Profile
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 bg-white px-6 py-6 md:grid-cols-3 md:px-8">
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-sm font-bold !text-slate-600">Conversations</p>
              <p className="mt-2 text-3xl font-extrabold !text-slate-950">
                {conversationItems.length}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-sm font-bold !text-slate-600">Customers</p>
              <p className="mt-2 text-3xl font-extrabold !text-slate-950">
                {customerConversationCount}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-sm font-bold !text-slate-600">Unread</p>
              <p className="mt-2 text-3xl font-extrabold !text-slate-950">
                {unreadCount}
              </p>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.24em] !text-slate-600">
                Inbox
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight !text-slate-950">
                Conversations
              </h2>
              <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                {getStatusText(conversationItems.length)}
              </span>
            </div>

            <div className="space-y-2">
              {conversationItems.map(
                ({
                  profile,
                  lastMessage,
                  unreadCount: itemUnreadCount,
                  isBookedCustomer,
                }) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => setSelectedUser(profile.id)}
                    className={`w-full rounded-2xl p-4 text-left transition ${
                      selectedUser === profile.id
                        ? "border border-emerald-300 bg-emerald-50 shadow-sm"
                        : itemUnreadCount > 0
                          ? "border border-emerald-200 bg-white hover:bg-emerald-50"
                          : "border border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-black !text-slate-950 ring-1 ring-slate-200">
                        {getProfilePhotoUrl(profile) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getProfilePhotoUrl(profile) || ""}
                            alt={getName(profile)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(profile)
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="truncate text-sm font-black !text-slate-950">
                              {getName(profile)}
                            </p>
                            <p className="mt-0.5 text-xs font-bold !text-slate-600">
                              {isBookedCustomer
                                ? "Pet Parent"
                                : getReadableRole(profile)}
                            </p>
                          </div>

                          {itemUnreadCount > 0 ? (
                            <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-black text-white">
                              {itemUnreadCount}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 !text-slate-700">
                          {lastMessage
                            ? lastMessage.content
                            : isBookedCustomer
                              ? "Ready to start a care conversation."
                              : "Start a new conversation"}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              )}

              {conversationItems.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-5 text-sm font-semibold leading-6 !text-slate-800">
                  No customer messages yet. When a customer books you or starts a
                  care conversation, it will appear here. Admin support remains
                  available for account, booking, payout, or safety questions.
                </div>
              ) : null}
            </div>
          </aside>

          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] !text-slate-600">
                    Active thread
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight !text-slate-950">
                    {selectedProfile
                      ? getName(selectedProfile)
                      : "Select a message recipient"}
                  </h2>
                  <p className="mt-1 text-sm font-bold !text-slate-600">
                    {selectedContactLabel}
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                  <label className="w-full sm:min-w-[280px] xl:w-[320px]">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] !text-slate-600">
                      Send messages to
                    </span>
                    <select
                      value={selectedUser || ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setSelectedUser(value || null);
                      }}
                      disabled={false}
                      className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-black !text-slate-950 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:!text-slate-700"
                    >
                      <option value="">Choose recipient</option>

                      {recipientOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <Link
                    href="/messages/admin"
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700 sm:self-end"
                  >
                    Message Admin HQ
                  </Link>

                  <Link
                    href="/guru/bookings"
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-700 transition hover:bg-emerald-50 sm:self-end"
                  >
                    View Bookings
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex min-h-[650px] flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto bg-white p-5">
                {!selectedUser ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-bold leading-6 !text-slate-800">
                    Choose Admin HQ from the dropdown or green button to open
                    your support thread, or select a customer conversation from
                    the list to message them.
                  </div>
                ) : null}

                {selectedUser && activeMessages.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center text-sm font-semibold leading-6 !text-slate-800">
                    No messages yet. Type below to start the conversation.
                  </div>
                ) : null}

                {activeMessages.map((message) => {
                  const mine = message.sender_id === userId;
                  const senderName = mine
                    ? getGuruDisplayName(currentProfile, guruRecord)
                    : selectedProfile
                      ? getName(selectedProfile)
                      : "Pet Parent";
                  const senderPhoto = mine
                    ? getGuruPhotoUrl(currentProfile, guruRecord)
                    : getProfilePhotoUrl(selectedProfile);

                  return (
                    <div
                      key={message.id}
                      className={`flex items-end gap-3 ${
                        mine ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!mine ? (
                        <MessageAvatar
                          profile={selectedProfile}
                          photoUrl={senderPhoto}
                          fallbackName={senderName}
                        />
                      ) : null}

                      <div
                        className={`flex max-w-[80%] flex-col ${
                          mine ? "items-end" : "items-start"
                        }`}
                      >
                        <div className="mb-1 px-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                          {mine ? "You" : senderName}
                        </div>

                        <div
                          className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                            mine
                              ? "bg-emerald-600 text-white"
                              : message.is_read === false
                                ? "border border-emerald-200 bg-emerald-50 text-slate-950"
                                : "border border-slate-200 bg-slate-100 text-slate-950"
                          }`}
                        >
                          <div className="whitespace-pre-wrap font-semibold leading-6">
                            {message.content}
                          </div>
                          <div
                            className={`mt-2 text-[11px] font-bold ${
                              mine ? "text-emerald-100" : "text-slate-500"
                            }`}
                          >
                            {new Date(message.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {mine ? (
                        <MessageAvatar
                          profile={currentProfile}
                          photoUrl={senderPhoto}
                          fallbackName={senderName}
                        />
                      ) : null}
                    </div>
                  );
                })}

                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={sendMessage}
                className="border-t border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row">
                  <textarea
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    placeholder={
                      selectedUser
                        ? "Type your message here..."
                        : "Choose Admin HQ or a customer recipient first..."
                    }
                    disabled={!selectedUser || sending}
                    rows={3}
                    className="min-h-[110px] flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold !text-slate-950 outline-none transition placeholder:!text-slate-600 focus:border-emerald-500 disabled:bg-slate-50 disabled:!text-slate-700 disabled:placeholder:!text-slate-700"
                  />

                  <button
                    type="submit"
                    disabled={!selectedUser || !newMessage.trim() || sending}
                    className="inline-flex min-w-[180px] items-center justify-center rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border disabled:border-slate-300 disabled:bg-slate-100 disabled:!text-slate-700"
                  >
                    {sending ? "Sending..." : "Send message"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] !text-slate-600">
              Customer messages
            </p>
            <p className="mt-3 text-sm font-semibold leading-6 !text-slate-700">
              Booked customers and existing customer conversations appear in your
              inbox so care details stay organized.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] !text-slate-600">
              Admin support
            </p>
            <p className="mt-3 text-sm font-semibold leading-6 !text-slate-700">
              Use Admin messaging for booking, payout, account, safety, or
              platform support.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] !text-slate-600">
              Clear care notes
            </p>
            <p className="mt-3 text-sm font-semibold leading-6 !text-slate-700">
              Include pet names, care dates, routines, medications, and access
              instructions when messaging.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function GuruDashboardMessagesFallback() {
  return (
    <main
      className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] pb-10 text-slate-950"
      style={{
        fontFamily:
          '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: 300,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl ring-1 ring-emerald-100">
            💬
          </div>
          <h1 className="text-2xl font-black text-slate-950">Messages</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Loading your Guru inbox...
          </p>
        </div>
      </div>
    </main>
  );
}

export default function GuruDashboardMessagesPage() {
  return (
    <Suspense fallback={<GuruDashboardMessagesFallback />}>
      <GuruDashboardMessagesPageContent />
    </Suspense>
  );
}
