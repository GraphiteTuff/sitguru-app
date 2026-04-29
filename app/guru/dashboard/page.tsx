import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import GuruMediaUploader from "@/components/guru/GuruMediaUploader";
import GuruDashboardHeader from "@/components/guru/GuruDashboardHeader";

export const dynamic = "force-dynamic";


const SITE_FONT_STYLE = {
  fontFamily:
    '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 300,
};

type GuruProfile = {
  id?: string | number | null;
  user_id?: string | null;
  email?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  title?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  image_url?: string | null;
  avatar_url?: string | null;
  photo_url?: string | null;
  profile_photo_url?: string | null;
  video_url?: string | null;
  profile_video_url?: string | null;
  intro_video_url?: string | null;
  rate?: number | null;
  hourly_rate?: number | null;
  price?: number | null;
  services?: string[] | string | null;
  application_status?: string | null;
  status?: string | null;
  is_bookable?: boolean | null;
  profile_completion?: number | null;
};

type BookingRow = {
  id?: string | number | null;
  customer_id?: string | null;
  sitter_id?: string | number | null;
  guru_id?: string | number | null;
  status?: string | null;
  booking_status?: string | null;
  payment_status?: string | null;
  service?: string | null;
  service_type?: string | null;
  booking_type?: string | null;
  pet_name?: string | null;
  customer_name?: string | null;
  pet_parent_name?: string | null;
  start_time?: string | null;
  start_date?: string | null;
  booking_date?: string | null;
  created_at?: string | null;
};

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  subject?: string | null;
  status?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
};

type MessageRow = {
  id: string;
  conversation_id?: string | null;
  sender_id?: string | null;
  recipient_id?: string | null;
  content?: string | null;
  body?: string | null;
  created_at?: string | null;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: string | null;
  account_type?: string | null;
  profile_photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  profile_video_url?: string | null;
  intro_video_url?: string | null;
};

type DashboardConversation = {
  id: string;
  name: string;
  role: string;
  subject: string;
  preview: string;
  lastActivity: string | null;
  href: string;
};

type GuruTier = {
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  stars: number;
  badgeClassName: string;
  cardClassName: string;
};

function normalizeRole(value?: string | null) {
  const role = String(value || "").trim().toLowerCase();

  if (role === "provider" || role === "sitter") return "guru";

  return role;
}

function getDisplayNameFromEmail(email?: string | null) {
  if (!email) return "Guru";

  return email
    .split("@")[0]
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFirstName(name?: string | null) {
  return String(name || "Guru").trim().split(/\s+/)[0] || "Guru";
}

function getProfileName(profile?: ProfileRow | null) {
  if (!profile) return "SitGuru User";

  const candidate =
    profile.full_name ||
    profile.display_name ||
    profile.name ||
    (profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : null) ||
    profile.first_name ||
    profile.last_name ||
    profile.email?.split("@")[0] ||
    "SitGuru User";

  return String(candidate).trim() || "SitGuru User";
}

function getGuruName(
  profile: GuruProfile | null,
  fallbackEmail?: string | null
) {
  return (
    profile?.full_name ||
    profile?.display_name ||
    profile?.name ||
    getDisplayNameFromEmail(profile?.email || fallbackEmail)
  );
}

function getGuruTitle(profile: GuruProfile | null) {
  return profile?.title || "Trusted Pet Care Guru";
}

function getGuruLocation(profile: GuruProfile | null) {
  const city = String(profile?.city || "").trim();
  const state = String(profile?.state || "").trim();

  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;

  return "Service area pending";
}

function getGuruImage(profile: GuruProfile | null) {
  return (
    profile?.image_url ||
    profile?.avatar_url ||
    profile?.photo_url ||
    profile?.profile_photo_url ||
    null
  );
}


function normalizeServices(value: GuruProfile["services"]) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getRate(profile: GuruProfile | null) {
  const value = profile?.rate ?? profile?.hourly_rate ?? profile?.price ?? null;

  if (typeof value === "number" && Number.isFinite(value)) {
    return `$${value}/hr`;
  }

  return "Rate pending";
}

function normalizeApplicationStatus(profile: GuruProfile | null) {
  const raw = String(profile?.application_status || profile?.status || "")
    .trim()
    .toLowerCase();

  if (profile?.is_bookable || raw === "bookable" || raw === "active") {
    return "Bookable";
  }

  if (raw === "approved") return "Approved";
  if (raw === "reviewing") return "Under Review";
  if (raw === "submitted") return "Submitted";
  if (raw === "needs_info" || raw === "needs-info") return "Needs Info";
  if (raw === "rejected") return "Not Approved";
  if (raw === "suspended" || raw === "paused") return "Paused";

  return "Profile Setup";
}

function isBookable(profile: GuruProfile | null) {
  const status = normalizeApplicationStatus(profile).toLowerCase();

  return Boolean(profile?.is_bookable) || status === "bookable";
}

function calculateProfileCompletion(profile: GuruProfile | null) {
  if (!profile) return 10;

  if (
    typeof profile.profile_completion === "number" &&
    profile.profile_completion > 0
  ) {
    return Math.max(0, Math.min(100, profile.profile_completion));
  }

  const checks = [
    Boolean(profile.full_name || profile.display_name || profile.name),
    Boolean(profile.title),
    Boolean(profile.bio),
    Boolean(profile.city || profile.state),
    Boolean(getGuruImage(profile)),
    Boolean(profile.rate || profile.hourly_rate || profile.price),
    normalizeServices(profile.services).length > 0,
  ];

  return Math.max(
    10,
    Math.round((checks.filter(Boolean).length / checks.length) * 100)
  );
}

function getBookingStatus(booking: BookingRow) {
  return String(
    booking.status ||
      booking.booking_status ||
      booking.payment_status ||
      "pending"
  );
}

function getBookingService(booking: BookingRow) {
  return String(
    booking.service ||
      booking.service_type ||
      booking.booking_type ||
      "Pet Care"
  );
}

function getPetName(booking: BookingRow) {
  return String(booking.pet_name || "Pet");
}

function getCustomerName(booking: BookingRow) {
  return String(
    booking.customer_name || booking.pet_parent_name || "Pet Parent"
  );
}

function getBookingDate(booking: BookingRow) {
  const value =
    booking.start_time ||
    booking.start_date ||
    booking.booking_date ||
    booking.created_at ||
    null;

  if (!value) return "Date pending";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "Date pending";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatActivity(value?: string | null) {
  if (!value) return "No recent activity";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "No recent activity";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getMessagePreview(message?: MessageRow | null) {
  return String(message?.content || message?.body || "").trim();
}

function getGuruTier(
  completedBookingsCount: number,
  profileCompletion: number,
  bookable: boolean
): GuruTier {
  if (completedBookingsCount >= 25 && profileCompletion >= 90 && bookable) {
    return {
      label: "Elite Guru",
      shortLabel: "Elite",
      description:
        "You are in the top SitGuru pack — a polished, highly active Guru trusted by pet families for reliable, loving care.",
      icon: "🏆",
      stars: 5,
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
      cardClassName:
        "border-amber-200 bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_100%)]",
    };
  }

  if (completedBookingsCount >= 10 && profileCompletion >= 75 && bookable) {
    return {
      label: "Super Guru",
      shortLabel: "Super",
      description:
        "You are building a strong SitGuru reputation with more completed care, a stronger profile, and growing trust from pet families.",
      icon: "⭐",
      stars: 4,
      badgeClassName: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
      cardClassName:
        "border-fuchsia-200 bg-[linear-gradient(180deg,#fff7ff_0%,#ffffff_100%)]",
    };
  }

  if (bookable) {
    return {
      label: "Trusted Guru",
      shortLabel: "Trusted",
      description:
        "You are approved, bookable, and ready to help pets feel safe, loved, and cared for through SitGuru.",
      icon: "🛡️",
      stars: 3,
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
      cardClassName:
        "border-emerald-200 bg-[linear-gradient(180deg,#f2fffb_0%,#ffffff_100%)]",
    };
  }

  return {
    label: "Rising Guru",
    shortLabel: "Rising",
    description:
      "You are on the path to becoming bookable. Finish your profile and keep building trust so pet families can choose you with confidence.",
    icon: "🐾",
    stars: 2,
    badgeClassName: "border-cyan-200 bg-cyan-50 text-cyan-800",
    cardClassName:
      "border-cyan-200 bg-[linear-gradient(180deg,#f3fbff_0%,#ffffff_100%)]",
  };
}

function getEliteProgress({
  completedBookingsCount,
  profileCompletion,
  bookable,
}: {
  completedBookingsCount: number;
  profileCompletion: number;
  bookable: boolean;
}) {
  const bookingProgress = Math.min(
    100,
    Math.round((completedBookingsCount / 25) * 100)
  );

  const profileProgress = Math.min(
    100,
    Math.round((profileCompletion / 90) * 100)
  );

  const bookableProgress = bookable ? 100 : 0;

  return Math.round((bookingProgress + profileProgress + bookableProgress) / 3);
}

async function getGuruProfile(
  userId: string,
  email?: string | null
): Promise<GuruProfile | null> {
  const byUserId = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!byUserId.error && byUserId.data) {
    return byUserId.data as GuruProfile;
  }

  if (email) {
    const byEmail = await supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!byEmail.error && byEmail.data) {
      return byEmail.data as GuruProfile;
    }
  }

  const profileFallback = await supabaseAdmin
    .from("profiles")
    .select(
      "id, full_name, display_name, name, email, role, account_type, profile_photo_url, avatar_url, image_url"
    )
    .eq("id", userId)
    .maybeSingle();

  if (!profileFallback.error && profileFallback.data) {
    const role = normalizeRole(
      profileFallback.data.role || profileFallback.data.account_type
    );

    if (role === "guru") {
      return {
        id: profileFallback.data.id,
        user_id: userId,
        email: profileFallback.data.email || email,
        full_name:
          profileFallback.data.full_name ||
          profileFallback.data.display_name ||
          profileFallback.data.name,
        profile_photo_url: profileFallback.data.profile_photo_url,
        avatar_url: profileFallback.data.avatar_url,
        image_url: profileFallback.data.image_url,
        video_url: null,
        profile_video_url: null,
        intro_video_url: null,
        services: null,
        rate: null,
        hourly_rate: null,
        price: null,
        profile_completion: null,
        application_status: "profile_incomplete",
        status: "profile_incomplete",
        is_bookable: false,
      };
    }
  }

  return null;
}

async function getGuruBookings(
  guruProfile: GuruProfile | null,
  userId: string
) {
  const guruIds = Array.from(
    new Set(
      [guruProfile?.id, guruProfile?.user_id, userId]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )
  );

  if (!guruIds.length) return [] as BookingRow[];

  const bySitter = await supabaseAdmin
    .from("bookings")
    .select("*")
    .in("sitter_id", guruIds)
    .order("created_at", { ascending: false })
    .limit(25);

  if (!bySitter.error && bySitter.data) {
    return bySitter.data as BookingRow[];
  }

  const byGuru = await supabaseAdmin
    .from("bookings")
    .select("*")
    .in("guru_id", guruIds)
    .order("created_at", { ascending: false })
    .limit(25);

  if (!byGuru.error && byGuru.data) {
    return byGuru.data as BookingRow[];
  }

  return [] as BookingRow[];
}

async function getGuruConversations(
  guruProfile: GuruProfile | null,
  userId: string
) {
  const guruIds = Array.from(
    new Set(
      [guruProfile?.id, guruProfile?.user_id, userId]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )
  );

  if (!guruIds.length) return [] as DashboardConversation[];

  const { data: conversations } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .in("guru_id", guruIds)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(12);

  const safeConversations = (conversations || []) as ConversationRow[];

  if (!safeConversations.length) return [] as DashboardConversation[];

  const conversationIds = safeConversations.map(
    (conversation) => conversation.id
  );

  const { data: messages } = await supabaseAdmin
    .from("messages")
    .select("*")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  const safeMessages = (messages || []) as MessageRow[];
  const latestMessageByConversation = new Map<string, MessageRow>();

  safeMessages.forEach((message) => {
    const conversationId = String(message.conversation_id || "").trim();

    if (conversationId && !latestMessageByConversation.has(conversationId)) {
      latestMessageByConversation.set(conversationId, message);
    }
  });

  const profileIds = Array.from(
    new Set(
      safeConversations
        .flatMap((conversation) => [
          conversation.customer_id || "",
          ...safeMessages
            .filter((message) => message.conversation_id === conversation.id)
            .flatMap((message) => [
              message.sender_id || "",
              message.recipient_id || "",
            ]),
        ])
        .filter(Boolean)
        .filter((id) => !guruIds.includes(id))
    )
  );

  const { data: profiles } = profileIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select(
          "id, full_name, display_name, name, first_name, last_name, email, role, account_type, profile_photo_url, avatar_url, image_url"
        )
        .in("id", profileIds)
    : { data: [] as ProfileRow[] };

  const profileMap = new Map<string, ProfileRow>();

  ((profiles || []) as ProfileRow[]).forEach((profile) => {
    profileMap.set(profile.id, profile);
  });

  return safeConversations.map((conversation) => {
    const latestMessage = latestMessageByConversation.get(conversation.id);
    const otherUserId =
      conversation.customer_id ||
      latestMessage?.sender_id ||
      latestMessage?.recipient_id ||
      "";

    const otherProfile = profileMap.get(otherUserId) || null;
    const role = normalizeRole(
      otherProfile?.role || otherProfile?.account_type || "customer"
    );

    return {
      id: conversation.id,
      name: getProfileName(otherProfile),
      role: role === "admin" ? "Admin" : role === "guru" ? "Guru" : "Customer",
      subject: conversation.subject || "Care conversation",
      preview:
        conversation.last_message_preview ||
        getMessagePreview(latestMessage) ||
        "Open this thread to review the details.",
      lastActivity:
        conversation.last_message_at ||
        latestMessage?.created_at ||
        conversation.updated_at ||
        conversation.created_at ||
        null,
      href: `/messages/${conversation.id}`,
    };
  });
}

function GuruAvatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  if (imageUrl) {
    return (
      <div className="h-40 w-40 overflow-hidden rounded-full border-[7px] border-white bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] lg:h-48 lg:w-48">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-40 w-40 items-center justify-center rounded-full border-[7px] border-white bg-[linear-gradient(135deg,#dbfff3_0%,#dcebff_100%)] text-6xl font-black text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.16)] lg:h-48 lg:w-48">
      {getFirstName(name).charAt(0).toUpperCase()}
    </div>
  );
}

function GuruPawCrest({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 96 108"
        className="h-full w-full drop-shadow-[0_9px_16px_rgba(5,150,105,0.22)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M48 4.8C57.4 13.7 71.2 17.5 84.5 18.3C86.8 18.4 88.7 20.2 88.8 22.5C91.1 61.2 77.3 88.2 50.1 103.2C48.8 103.9 47.2 103.9 45.9 103.2C18.7 88.2 4.9 61.2 7.2 22.5C7.3 20.2 9.2 18.4 11.5 18.3C24.8 17.5 38.6 13.7 48 4.8Z"
          fill="url(#guruShieldGradient)"
        />
        <path
          d="M48 12.8C56 19.2 67.1 22.7 80.1 23.8C81.2 55.7 70.4 80.2 48 93.9C25.6 80.2 14.8 55.7 15.9 23.8C28.9 22.7 40 19.2 48 12.8Z"
          fill="url(#guruInnerGradient)"
          stroke="rgba(255,255,255,0.72)"
          strokeWidth="4"
        />
        <path
          d="M48 48.5C40.4 48.5 34.3 54.6 34.3 62.1C34.3 69.4 40 74.7 48 74.7C56 74.7 61.7 69.4 61.7 62.1C61.7 54.6 55.6 48.5 48 48.5Z"
          fill="white"
        />
        <path
          d="M32.4 45.4C35.8 44.5 37.7 40.2 36.7 35.9C35.7 31.6 32.1 28.8 28.7 29.7C25.3 30.6 23.4 34.9 24.4 39.2C25.4 43.5 29 46.3 32.4 45.4Z"
          fill="white"
        />
        <path
          d="M43.1 41.5C46.7 41.1 49.1 37 48.6 32.4C48.1 27.8 44.8 24.4 41.2 24.8C37.6 25.2 35.2 29.3 35.7 33.9C36.2 38.5 39.5 41.9 43.1 41.5Z"
          fill="white"
        />
        <path
          d="M52.9 41.5C56.5 41.9 59.8 38.5 60.3 33.9C60.8 29.3 58.4 25.2 54.8 24.8C51.2 24.4 47.9 27.8 47.4 32.4C46.9 37 49.3 41.1 52.9 41.5Z"
          fill="white"
        />
        <path
          d="M63.6 45.4C67 46.3 70.6 43.5 71.6 39.2C72.6 34.9 70.7 30.6 67.3 29.7C63.9 28.8 60.3 31.6 59.3 35.9C58.3 40.2 60.2 44.5 63.6 45.4Z"
          fill="white"
        />
        <defs>
          <linearGradient
            id="guruShieldGradient"
            x1="7"
            y1="4"
            x2="90"
            y2="104"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#01D59B" />
            <stop offset="0.54" stopColor="#27C6B7" />
            <stop offset="1" stopColor="#78C7FF" />
          </linearGradient>
          <linearGradient
            id="guruInnerGradient"
            x1="18"
            y1="15"
            x2="82"
            y2="93"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#0B1534" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

function TierStars({ stars }: { stars: number }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${stars} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={`text-base ${
            index < stars ? "text-amber-400" : "text-slate-300"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: string;
}) {
  return (
    <div className="rounded-[1.65rem] border border-slate-200 bg-white px-6 py-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black !text-slate-800">{label}</p>
          <p className="mt-2 text-5xl font-black tracking-tight !text-slate-900">
            {value}
          </p>
        </div>

        {icon ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-2xl ring-1 ring-cyan-100">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: BookingRow }) {
  const status = getBookingStatus(booking);

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] !text-slate-700">
            {getBookingService(booking)}
          </p>
          <h3 className="mt-2 text-xl font-black !text-slate-900">
            {getPetName(booking)}
          </h3>
          <p className="mt-1 text-sm font-bold !text-slate-700">
            {getCustomerName(booking)}
          </p>
        </div>

        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase !text-emerald-800">
          {status}
        </span>
      </div>

      <p className="mt-4 text-sm font-bold !text-slate-700">
        {getBookingDate(booking)}
      </p>
    </div>
  );
}

function ConversationCard({
  conversation,
}: {
  conversation: DashboardConversation;
}) {
  return (
    <Link
      href={conversation.href}
      className="block rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black !text-slate-900">
            {conversation.name}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] !text-slate-700">
            {conversation.role}
          </p>
        </div>

        <span className="text-xs font-bold !text-slate-700">
          {formatActivity(conversation.lastActivity)}
        </span>
      </div>

      <p className="mt-3 text-sm font-black !text-slate-900">
        {conversation.subject}
      </p>
      <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 !text-slate-700">
        {conversation.preview}
      </p>
    </Link>
  );
}

function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <h3 className="text-xl font-black !text-slate-900">{title}</h3>

      <p className="mx-auto mt-2 max-w-xl text-sm font-bold leading-6 !text-slate-700">
        {body}
      </p>

      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-black !text-white transition hover:bg-emerald-600"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function EliteProgressRow({
  label,
  value,
  goal,
  percent,
  icon,
}: {
  label: string;
  value: string;
  goal: string;
  percent: number;
  icon: string;
}) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black !text-slate-900">
            {icon} {label}
          </p>
          <p className="mt-1 text-xs font-bold !text-slate-600">
            Current: {value}
          </p>
        </div>

        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black !text-slate-900 ring-1 ring-cyan-100">
          Goal: {goal}
        </span>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#39c8b4_0%,#49aaf0_100%)]"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}

export default async function GuruDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/guru/login");
  }

  const guruProfile = await getGuruProfile(user.id, user.email);

  if (!guruProfile) {
    redirect("/guru/application");
  }

  const [bookings, conversations] = await Promise.all([
    getGuruBookings(guruProfile, user.id),
    getGuruConversations(guruProfile, user.id),
  ]);

  const displayName = getGuruName(guruProfile, user.email);
  const welcomeName = getFirstName(displayName);
  const imageUrl = getGuruImage(guruProfile);
  const services = normalizeServices(guruProfile.services);
  const profileCompletion = calculateProfileCompletion(guruProfile);
  const status = normalizeApplicationStatus(guruProfile);
  const bookable = isBookable(guruProfile);

  const upcomingBookings = bookings.filter((booking) => {
    const statusText = getBookingStatus(booking).toLowerCase();

    return (
      statusText.includes("pending") ||
      statusText.includes("confirm") ||
      statusText.includes("active") ||
      statusText === "paid"
    );
  });

  const completedBookings = bookings.filter((booking) =>
    getBookingStatus(booking).toLowerCase().includes("complete")
  );

  const completedBookingsCount = completedBookings.length;

  const guruTier = getGuruTier(
    completedBookingsCount,
    profileCompletion,
    bookable
  );

  const eliteProgress = getEliteProgress({
    completedBookingsCount,
    profileCompletion,
    bookable,
  });

  const completedCarePercent = Math.min(
    100,
    Math.round((completedBookingsCount / 25) * 100)
  );

  const profilePercent = Math.min(
    100,
    Math.round((profileCompletion / 90) * 100)
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_40%,#ecfdf5_100%)] font-light text-slate-900" style={SITE_FONT_STYLE}>
      <GuruDashboardHeader
        active="dashboard"
        displayName={displayName}
        imageUrl={imageUrl}
        tierLabel={guruTier.label}
        profileCompletion={profileCompletion}
      />

      <section className="mx-auto max-w-[1440px] px-5 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2.3rem] border border-white bg-[radial-gradient(circle_at_18%_15%,rgba(255,255,255,0.42)_0%,transparent_28%),linear-gradient(105deg,#03d39c_0%,#72dec5_45%,#b9e3ff_100%)] shadow-[0_24px_52px_rgba(15,23,42,0.12)]">
          <div className="grid gap-8 p-8 lg:grid-cols-[1.15fr_340px] lg:items-center lg:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.34em] !text-[#07132f]">
                SitGuru Guru Portal
              </p>

              <h1 className="mt-4 text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] !text-[#07132f] sm:text-6xl lg:text-7xl">
                Welcome back, {welcomeName} 👋
              </h1>

              <p className="mt-5 max-w-3xl text-xl font-light leading-9 !text-slate-700">
                Manage bookings, messages, availability, earnings, and profile photos —
                all in one polished Guru workspace.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${guruTier.badgeClassName}`}
                >
                  <GuruPawCrest className="h-6 w-6" />
                  <span>{guruTier.label}</span>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2">
                  <TierStars stars={guruTier.stars} />
                  <span className="text-sm font-black !text-slate-900">
                    {eliteProgress}% to Elite Guru
                  </span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/guru/bookings"
                  className="rounded-[1.2rem] bg-[#07132f] px-7 py-4 text-base font-extrabold !text-white shadow-[0_12px_28px_rgba(7,19,47,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0b1436]"
                >
                  My Bookings
                </Link>

                <Link
                  href="/guru/messages"
                  className="rounded-[1.2rem] bg-white/90 px-7 py-4 text-base font-extrabold !text-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.08)] ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Open Messages
                </Link>

                <Link
                  href="/guru/availability"
                  className="rounded-[1.2rem] bg-white/90 px-7 py-4 text-base font-extrabold !text-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.08)] ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Availability
                </Link>

                <Link
                  href="/guru/dashboard/profile"
                  className="rounded-[1.2rem] bg-white/90 px-7 py-4 text-base font-extrabold !text-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.08)] ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  My Profile
                </Link>

                <Link
                  href="/guru/dashboard/earnings"
                  className="rounded-[1.2rem] bg-white/90 px-7 py-4 text-base font-extrabold !text-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.08)] ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Earnings
                </Link>
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <GuruAvatar name={displayName} imageUrl={imageUrl} />

              <h2 className="mt-5 text-4xl font-extrabold tracking-[-0.04em] !text-[#07132f] lg:text-5xl">
                {displayName}
              </h2>

              <div className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm ring-1 ring-white/80">
                <GuruPawCrest className="h-8 w-8" />
                <p className="text-2xl font-extrabold !text-slate-900">
                  {guruTier.label}
                </p>
              </div>

              <div className="mt-2">
                <TierStars stars={guruTier.stars} />
              </div>

              <p className="mt-3 text-lg font-semibold !text-slate-700">
                {getGuruTitle(guruProfile)}
              </p>

              <p className="mt-1 text-lg font-semibold !text-slate-700">
                {getGuruLocation(guruProfile)}
              </p>

              <GuruMediaUploader
                userId={user.id}
                guruProfileId={String(guruProfile.id ?? "")}
                displayName={displayName}
                initialPhotoUrl={imageUrl}
              />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Bookings" value={bookings.length} icon="🗓️" />
          <StatCard label="Upcoming" value={upcomingBookings.length} icon="🕘" />
          <StatCard
            label="Completed"
            value={completedBookings.length}
            icon="✅"
          />
          <StatCard label="Unread" value={conversations.length} icon="💬" />
          <StatCard label="Profile" value={`${profileCompletion}%`} icon="⭐" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-black uppercase tracking-[0.25em] !text-slate-800">
                Bookings
              </p>

              <Link
                href="/guru/bookings"
                className="rounded-full border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black !text-slate-900 transition hover:bg-cyan-100"
              >
                View all bookings
              </Link>
            </div>

            <div className="mt-6">
              {upcomingBookings.slice(0, 4).length ? (
                <div className="grid gap-4">
                  {upcomingBookings.slice(0, 4).map((booking, index) => (
                    <BookingCard
                      key={String(booking.id || index)}
                      booking={booking}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No upcoming bookings yet"
                  body="Once customers book you, upcoming care will appear here."
                />
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-black uppercase tracking-[0.25em] !text-slate-800">
                Messages
              </p>

              <Link
                href="/guru/messages"
                className="rounded-full border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black !text-slate-900 transition hover:bg-cyan-100"
              >
                Open inbox
              </Link>
            </div>

            <div className="mt-6">
              {conversations.slice(0, 4).length ? (
                <div className="grid gap-4">
                  {conversations.slice(0, 4).map((conversation) => (
                    <ConversationCard
                      key={conversation.id}
                      conversation={conversation}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No messages yet"
                  body="Customer and Admin messages will appear here."
                />
              )}
            </div>
          </section>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.06)] lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] !text-slate-800">
                  Guru Recognition
                </p>

                <h3 className="mt-3 text-4xl font-black leading-tight !text-slate-900">
                  Become an Elite Guru 🐾
                </h3>

                <p className="mt-3 max-w-3xl text-base font-bold leading-7 !text-slate-700">
                  Elite Guru is SitGuru’s top recognition for Gurus who build
                  trust one happy pet, one safe walk, and one completed booking
                  at a time. Think of it like earning your place at the front of
                  the pack.
                </p>
              </div>

              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${guruTier.badgeClassName}`}
              >
                <GuruPawCrest className="h-6 w-6" />
                <span>{guruTier.label}</span>
              </div>
            </div>

            <div
              className={`mt-6 rounded-[1.5rem] border p-5 ${guruTier.cardClassName}`}
            >
              <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white bg-white shadow-sm">
                    <GuruPawCrest className="h-20 w-20" />
                  </div>

                  <p className="mt-5 text-2xl font-black !text-slate-900">
                    Current crest: {guruTier.label}
                  </p>

                  <p className="mt-2 text-sm font-bold leading-6 !text-slate-700">
                    {guruTier.description}
                  </p>

                  <div className="mt-5 flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-white px-4 py-3">
                    <TierStars stars={guruTier.stars} />
                    <span className="text-sm font-black !text-slate-900">
                      {guruTier.shortLabel} Level
                    </span>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] !text-slate-600">
                        Elite Guru Progress
                      </p>
                      <p className="mt-1 text-3xl font-black !text-slate-900">
                        {eliteProgress}%
                      </p>
                    </div>

                    <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-black !text-amber-800 ring-1 ring-amber-200">
                      Goal: Elite Guru
                    </span>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#39c8b4_0%,#49aaf0_50%,#f59e0b_100%)]"
                      style={{ width: `${eliteProgress}%` }}
                    />
                  </div>

                  <div className="mt-5 grid gap-3">
                    <EliteProgressRow
                      icon="🐕"
                      label="Complete happy pet care bookings"
                      value={`${completedBookingsCount} completed`}
                      goal="25 completed"
                      percent={completedCarePercent}
                    />

                    <EliteProgressRow
                      icon="🐾"
                      label="Keep your Guru profile polished"
                      value={`${profileCompletion}% complete`}
                      goal="90% complete"
                      percent={profilePercent}
                    />

                    <EliteProgressRow
                      icon="🦴"
                      label="Stay bookable for pet parents"
                      value={bookable ? "Bookable" : "Not bookable yet"}
                      goal="Bookable"
                      percent={bookable ? 100 : 0}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-lg font-black !text-slate-900">
                  How to move up the pack
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[1rem] bg-white p-4 ring-1 ring-emerald-100">
                    <p className="text-sm font-black !text-slate-900">
                      🐶 Give pet parents confidence
                    </p>
                    <p className="mt-2 text-sm font-bold leading-6 !text-slate-700">
                      Keep your bio, services, location, rate, and photo updated.
                    </p>
                  </div>

                  <div className="rounded-[1rem] bg-white p-4 ring-1 ring-emerald-100">
                    <p className="text-sm font-black !text-slate-900">
                      🐕 Complete more care
                    </p>
                    <p className="mt-2 text-sm font-bold leading-6 !text-slate-700">
                      The more confirmed care you complete, the stronger your
                      SitGuru reputation becomes.
                    </p>
                  </div>

                  <div className="rounded-[1rem] bg-white p-4 ring-1 ring-emerald-100">
                    <p className="text-sm font-black !text-slate-900">
                      💬 Be responsive and friendly
                    </p>
                    <p className="mt-2 text-sm font-bold leading-6 !text-slate-700">
                      Quick, kind updates help families feel their pets are in
                      good hands.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-black uppercase tracking-[0.25em] !text-slate-800">
              Public Profile
            </p>

            <div className="mt-8 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#39c8c1_0%,#66a8f4_100%)]"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>

            <p className="mt-3 text-sm font-black !text-slate-800">
              {profileCompletion}% complete
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {(services.length
                ? services
                : ["Dog Walking", "Drop-In Visits", "Pet Sitting"]
              )
                .slice(0, 6)
                .map((service) => (
                  <span
                    key={service}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black !text-slate-900"
                  >
                    {service}
                  </span>
                ))}
            </div>

            <div className="mt-5 rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] !text-slate-600">
                Current Booking Status
              </p>
              <p className="mt-2 text-lg font-black !text-slate-900">
                {status}
              </p>
            </div>

            <div className="mt-5 rounded-[1rem] border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] !text-emerald-700">
                Profile Photo
              </p>
              <p className="mt-2 text-sm font-bold leading-6 !text-slate-700">
                Use the upload button in your hero card to add a polished profile photo customers can recognize.
              </p>
            </div>

            <Link
              href="/guru/dashboard/profile"
              className="mt-8 inline-flex w-full items-center justify-center rounded-[1rem] bg-[#020826] px-6 py-4 text-base font-black !text-white transition hover:bg-[#0b1436]"
            >
              Update Profile
            </Link>
          </section>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] !text-slate-800">
                Availability & Earnings
              </p>

              <h3 className="mt-5 text-4xl font-black leading-tight !text-slate-900">
                Stay ready to book
              </h3>

              <p className="mt-4 text-base font-black leading-7 !text-slate-800">
                Keep your calendar current and make it easy for pet parents to
                trust and choose you.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] !text-slate-600">
                  Availability
                </p>
                <p className="mt-2 text-lg font-black !text-slate-900">
                  Keep your schedule updated
                </p>

                <Link
                  href="/guru/availability"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(90deg,#39c8b4_0%,#49aaf0_100%)] px-6 py-4 text-base font-black !text-white transition hover:opacity-95"
                >
                  Manage Availability
                </Link>
              </div>

              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] !text-slate-600">
                  Rate
                </p>
                <p className="mt-2 text-lg font-black !text-slate-900">
                  {getRate(guruProfile)}
                </p>

                <Link
                  href="/guru/dashboard/earnings"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-[1rem] border border-cyan-200 bg-cyan-50 px-6 py-4 text-base font-black !text-slate-900 transition hover:bg-cyan-100"
                >
                  View Earnings
                </Link>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}