import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type GuruProfile = {
  id?: string | number | null;
  user_id?: string | null;
  slug?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  title?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  rate?: number | null;
  hourly_rate?: number | null;
  image_url?: string | null;
  services?: string[] | string | null;
  email?: string | null;
};

type BookingRow = Record<string, any>;

type PetMediaRow = {
  pet_id?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  visibility?: string | null;
  created_at?: string | null;
};

type EnrichedBookingRow = BookingRow & {
  resolved_pet_photo_url?: string | null;
};

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  booking_id?: string | null;
  subject?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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
  profile_photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  role?: string | null;
  [key: string]: unknown;
};

type DashboardConversation = {
  id: string;
  otherUserId: string | null;
  otherUserName: string;
  otherUserRole: string;
  otherUserPhotoUrl: string | null;
  subject: string;
  preview: string;
  status: string;
  lastActivity: string | null;
  href: string;
};

function getDisplayName(email?: string | null) {
  if (!email) return "Guru";

  const local = email.split("@")[0] ?? "Guru";

  return local
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "Date pending";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
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

function getBookingStatus(booking: BookingRow) {
  return (
    booking.status ||
    booking.booking_status ||
    booking.state ||
    booking.payment_status ||
    "pending"
  );
}

function getCustomerName(booking: BookingRow) {
  return (
    booking.customer_name ||
    booking.pet_parent_name ||
    booking.owner_name ||
    booking.parent_name ||
    booking.user_name ||
    booking.customer_email ||
    "Customer"
  );
}

function getPetName(booking: BookingRow) {
  return booking.pet_name || booking.petName || booking.animal_name || "Pet";
}

function getServiceName(booking: BookingRow) {
  return (
    booking.service ||
    booking.service_type ||
    booking.booking_type ||
    "Service"
  );
}

function getBookingDate(booking: BookingRow) {
  return (
    booking.booking_date ||
    booking.date ||
    booking.start_date ||
    booking.start_time ||
    booking.created_at
  );
}

function getStatusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("complete")) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (
    normalized.includes("confirm") ||
    normalized.includes("active") ||
    normalized === "paid"
  ) {
    return "border-sky-400/20 bg-sky-400/10 text-sky-300";
  }

  if (normalized.includes("cancel")) {
    return "border-rose-400/20 bg-rose-400/10 text-rose-300";
  }

  return "border-amber-400/20 bg-amber-400/10 text-amber-300";
}

function getConversationStatusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("closed")) {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  if (normalized.includes("archived")) {
    return "border-amber-400/20 bg-amber-400/10 text-amber-200";
  }

  return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
}

function normalizeServices(value: GuruProfile["services"]) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function calculateProfileCompletion(profile: GuruProfile | null) {
  if (!profile) return 10;

  const checks = [
    Boolean(profile.full_name || profile.display_name),
    Boolean(profile.title),
    Boolean(profile.bio),
    Boolean(profile.city),
    Boolean(profile.state),
    Boolean(
      profile.rate ||
        profile.rate === 0 ||
        profile.hourly_rate ||
        profile.hourly_rate === 0
    ),
    Boolean(profile.image_url),
    Boolean(normalizeServices(profile.services).length > 0),
  ];

  const completed = checks.filter(Boolean).length;
  return Math.max(10, Math.round((completed / checks.length) * 100));
}

function getMissingProfileItems(profile: GuruProfile | null) {
  const missing: string[] = [];
  const services = normalizeServices(profile?.services ?? null);

  if (!profile?.full_name && !profile?.display_name) {
    missing.push("Add your display name");
  }

  if (!profile?.title) {
    missing.push("Add a service title");
  }

  if (!profile?.bio) {
    missing.push("Write your Guru bio");
  }

  if (!profile?.city || !profile?.state) {
    missing.push("Set your location");
  }

  if (
    !profile?.rate &&
    profile?.rate !== 0 &&
    !profile?.hourly_rate &&
    profile?.hourly_rate !== 0
  ) {
    missing.push("Add your pricing");
  }

  if (!profile?.image_url) {
    missing.push("Upload a profile image");
  }

  if (services.length === 0) {
    missing.push("Select your services");
  }

  return missing;
}

function getPetInitial(name?: string | null) {
  const value = String(name || "P").trim();
  return value.charAt(0).toUpperCase() || "P";
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

function getProfilePhotoUrl(profile?: ProfileRow | null) {
  if (!profile) return null;

  const candidate =
    profile.profile_photo_url ||
    profile.avatar_url ||
    profile.image_url ||
    null;

  return candidate ? String(candidate) : null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getMessagePreview(message?: MessageRow | null) {
  const value = message?.content || message?.body || "";
  return String(value).trim();
}

function PetAvatar({
  imageUrl,
  petName,
}: {
  imageUrl?: string | null;
  petName?: string | null;
}) {
  if (imageUrl) {
    return (
      <div className="h-24 w-24 overflow-hidden rounded-[22px] border border-white/10 bg-white/5 shadow-sm sm:h-28 sm:w-28">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={petName ? `${petName} photo` : "Pet photo"}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-[22px] border border-white/10 bg-white/5 text-3xl font-black text-emerald-200 shadow-sm sm:h-28 sm:w-28">
      {getPetInitial(petName)}
    </div>
  );
}

function ConversationAvatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  if (imageUrl) {
    return (
      <div className="h-14 w-14 overflow-hidden rounded-[18px] border border-white/10 bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/5 text-lg font-black text-emerald-200">
      {getInitials(name)}
    </div>
  );
}

async function getGuruProfile(userId: string, email?: string | null) {
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

  return null;
}

async function getGuruBookings(guruId: string | number) {
  const byCreatedAt = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("sitter_id", guruId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (!byCreatedAt.error && byCreatedAt.data) {
    return byCreatedAt.data as BookingRow[];
  }

  const byBookingDate = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("sitter_id", guruId)
    .order("booking_date", { ascending: false })
    .limit(25);

  if (!byBookingDate.error && byBookingDate.data) {
    return byBookingDate.data as BookingRow[];
  }

  console.error(
    "Guru dashboard bookings fetch error:",
    byCreatedAt.error?.message || byBookingDate.error?.message || "Unknown error"
  );

  return [];
}

async function enrichBookingsWithPetMedia(
  bookings: BookingRow[]
): Promise<EnrichedBookingRow[]> {
  if (!bookings.length) return [];

  const petIds = Array.from(
    new Set(
      bookings
        .map((booking) => String(booking.pet_id || "").trim())
        .filter(Boolean)
    )
  );

  if (petIds.length === 0) {
    return bookings.map<EnrichedBookingRow>((booking) => ({
      ...booking,
      resolved_pet_photo_url: booking.pet_photo_url || null,
    }));
  }

  const { data, error } = await supabaseAdmin
    .from("pet_media")
    .select("pet_id, file_url, file_type, visibility, created_at")
    .in("pet_id", petIds)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return bookings.map<EnrichedBookingRow>((booking) => ({
      ...booking,
      resolved_pet_photo_url: booking.pet_photo_url || null,
    }));
  }

  const petImageMap = new Map<string, string>();

  for (const row of data as PetMediaRow[]) {
    const petId = String(row.pet_id || "").trim();
    if (!petId || petImageMap.has(petId)) continue;

    const fileType = String(row.file_type || "").toLowerCase();
    if (!fileType.includes("image")) continue;
    if (!row.file_url) continue;

    petImageMap.set(petId, row.file_url);
  }

  return bookings.map<EnrichedBookingRow>((booking) => {
    const petId = String(booking.pet_id || "").trim();

    return {
      ...booking,
      resolved_pet_photo_url:
        booking.pet_photo_url || (petId ? petImageMap.get(petId) || null : null),
    };
  });
}

async function getGuruConversations(
  userId: string,
  guruProfile: GuruProfile | null
) {
  const guruIds = Array.from(
    new Set(
      [userId, guruProfile?.user_id, guruProfile?.id]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )
  );

  if (guruIds.length === 0) {
    return {
      customerConversations: [] as DashboardConversation[],
      adminConversations: [] as DashboardConversation[],
    };
  }

  const { data: conversationsData, error: conversationsError } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .in("guru_id", guruIds)
    .order("last_message_at", { ascending: false })
    .limit(20);

  if (conversationsError || !conversationsData) {
    console.error(
      "Guru dashboard conversations fetch error:",
      conversationsError?.message || "Unknown error"
    );

    return {
      customerConversations: [] as DashboardConversation[],
      adminConversations: [] as DashboardConversation[],
    };
  }

  const conversations = conversationsData as ConversationRow[];

  if (!conversations.length) {
    return {
      customerConversations: [] as DashboardConversation[],
      adminConversations: [] as DashboardConversation[],
    };
  }

  const conversationIds = conversations.map((conversation) => conversation.id);

  const { data: messagesData, error: messagesError } = await supabaseAdmin
    .from("messages")
    .select("*")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  if (messagesError) {
    console.error("Guru dashboard messages fetch error:", messagesError.message);
  }

  const latestMessageByConversation = new Map<string, MessageRow>();

  for (const message of (messagesData ?? []) as MessageRow[]) {
    const conversationId = String(message.conversation_id || "").trim();
    if (!conversationId || latestMessageByConversation.has(conversationId)) {
      continue;
    }

    latestMessageByConversation.set(conversationId, message);
  }

  const otherUserIds = Array.from(
    new Set(
      conversations
        .map((conversation) => String(conversation.customer_id || "").trim())
        .filter(Boolean)
    )
  );

  const { data: profilesData, error: profilesError } =
    otherUserIds.length > 0
      ? await supabaseAdmin.from("profiles").select("*").in("id", otherUserIds)
      : { data: [], error: null as { message?: string } | null };

  if (profilesError) {
    console.error("Guru dashboard profiles fetch error:", profilesError.message);
  }

  const profileMap = new Map<string, ProfileRow>();
  for (const profile of (profilesData ?? []) as ProfileRow[]) {
    profileMap.set(String(profile.id), profile);
  }

  const mapped = conversations.map((conversation) => {
    const otherUserId = String(conversation.customer_id || "").trim() || null;
    const otherUserProfile = otherUserId ? profileMap.get(otherUserId) ?? null : null;
    const latestMessage = latestMessageByConversation.get(conversation.id) ?? null;
    const rawRole =
      typeof otherUserProfile?.role === "string" &&
      otherUserProfile.role.trim().length > 0
        ? otherUserProfile.role.trim()
        : "Customer";

    return {
      id: conversation.id,
      otherUserId,
      otherUserName: getProfileName(otherUserProfile),
      otherUserRole: rawRole,
      otherUserPhotoUrl: getProfilePhotoUrl(otherUserProfile),
      subject: conversation.subject?.trim() || "Direct conversation",
      preview:
        conversation.last_message_preview?.trim() ||
        getMessagePreview(latestMessage) ||
        "Open this thread to confirm details and respond.",
      status: conversation.status?.trim() || "open",
      lastActivity:
        conversation.last_message_at ||
        latestMessage?.created_at ||
        conversation.updated_at ||
        conversation.created_at ||
        null,
      href: `/messages/${conversation.id}`,
    };
  });

  const adminConversations = mapped.filter(
    (conversation) => conversation.otherUserRole.toLowerCase() === "admin"
  );

  const customerConversations = mapped.filter(
    (conversation) => conversation.otherUserRole.toLowerCase() !== "admin"
  );

  return {
    customerConversations,
    adminConversations,
  };
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

  if (!guruProfile?.id) {
    redirect("/guru/login");
  }

  const [bookings, conversationBuckets] = await Promise.all([
    getGuruBookings(guruProfile.id),
    getGuruConversations(user.id, guruProfile),
  ]);

  const enrichedBookings = await enrichBookingsWithPetMedia(bookings);

  const customerConversations = conversationBuckets.customerConversations;
  const adminConversations = conversationBuckets.adminConversations;
  const adminConversation = adminConversations[0] ?? null;

  const displayName =
    guruProfile?.full_name ||
    guruProfile?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    getDisplayName(user.email);

  const profileCompletion = calculateProfileCompletion(guruProfile);
  const missingProfileItems = getMissingProfileItems(guruProfile);

  const pendingCount = enrichedBookings.filter((booking) => {
    const status = String(getBookingStatus(booking)).toLowerCase();
    return status.includes("pending");
  }).length;

  const activeCount = enrichedBookings.filter((booking) => {
    const status = String(getBookingStatus(booking)).toLowerCase();
    return (
      status.includes("confirm") ||
      status.includes("active") ||
      status === "paid"
    );
  }).length;

  const completedCount = enrichedBookings.filter((booking) => {
    const status = String(getBookingStatus(booking)).toLowerCase();
    return status.includes("complete");
  }).length;

  const recentBookings = enrichedBookings.slice(0, 6);

  const services =
    normalizeServices(guruProfile?.services) || ["Pet Sitting", "Dog Walking"];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_20%),linear-gradient(180deg,#020617_0%,#0b1220_46%,#020617_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.94),rgba(15,23,42,0.96))] shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                Guru Control Center
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Welcome back, {displayName}.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                This dashboard is your operational center. It should feel similar
                to the Admin dashboard in structure, but focused on your own
                customer interactions, bookings, service visibility, and the
                profile information that appears on the customer side.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                  Customer-facing profile controls
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                  Live booking visibility
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                  Admin feed alignment
                </span>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/guru/profile"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                >
                  Update Guru Profile
                </Link>

                <Link
                  href="/guru/bookings"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Open Bookings
                </Link>

                <Link
                  href="/messages/admin"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-6 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15"
                >
                  Message Admin
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Guru account
                </p>
                <p className="mt-3 text-lg font-bold text-white">
                  {guruProfile?.title || "Pet Care Guru"}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {guruProfile?.city || "City pending"}
                  {guruProfile?.city && guruProfile?.state ? ", " : ""}
                  {guruProfile?.state || ""}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Changes you make to your public profile should appear on the
                  customer-facing Guru page and remain aligned with Admin review.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                    Profile completion
                  </p>
                  <span className="text-sm font-bold text-white">
                    {profileCompletion}%
                  </span>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-300">
                  The stronger your profile, the better it presents to customers
                  and Admin alike.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
              Pending
            </p>
            <p className="mt-3 text-3xl font-black text-white">
              {pendingCount}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Requests or bookings still waiting on action or confirmation.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
              Active
            </p>
            <p className="mt-3 text-3xl font-black text-white">
              {activeCount}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Confirmed or active care that requires ongoing visibility.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              Completed
            </p>
            <p className="mt-3 text-3xl font-black text-white">
              {completedCount}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Finished services that still feed reporting and admin oversight.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              Services
            </p>
            <p className="mt-3 text-3xl font-black text-white">
              {services.length}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Public service categories currently visible on your Guru profile.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                    Recent customer activity
                  </p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                    Bookings connected to your account
                  </h2>
                </div>

                <Link
                  href="/guru/bookings"
                  className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
                >
                  View all bookings
                </Link>
              </div>

              {recentBookings.length === 0 ? (
                <div className="mt-6 rounded-[22px] border border-dashed border-white/10 bg-slate-950/35 p-6">
                  <p className="text-base font-semibold text-white">
                    No live bookings found yet
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Once customers book you, those records should appear here and
                    also remain visible to Admin for platform oversight.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {recentBookings.map((booking, index) => {
                    const status = String(getBookingStatus(booking));
                    const petName = getPetName(booking);
                    const bookingKey =
                      typeof booking.id === "string" || typeof booking.id === "number"
                        ? String(booking.id)
                        : `${getCustomerName(booking)}-${index}`;

                    return (
                      <div
                        key={bookingKey}
                        className="min-h-[132px] rounded-[22px] border border-white/10 bg-slate-950/40 p-5"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center gap-4">
                            <PetAvatar
                              imageUrl={booking.resolved_pet_photo_url || null}
                              petName={petName}
                            />

                            <div>
                              <p className="text-lg font-bold text-white">
                                {getCustomerName(booking)}
                              </p>
                              <p className="mt-1 text-sm text-slate-300">
                                {petName} • {getServiceName(booking)}
                              </p>
                              <p className="mt-2 text-sm text-slate-400">
                                {formatDate(getBookingDate(booking))}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              status
                            )}`}
                          >
                            {status}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                Customer-facing display
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                Information pushed to the customer side
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-slate-950/40 p-5">
                  <p className="text-sm font-semibold text-slate-300">
                    Display name
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {guruProfile?.full_name ||
                      guruProfile?.display_name ||
                      displayName}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-slate-950/40 p-5">
                  <p className="text-sm font-semibold text-slate-300">
                    Public title
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {guruProfile?.title || "Pet Care Guru"}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-slate-950/40 p-5">
                  <p className="text-sm font-semibold text-slate-300">
                    Service area
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {guruProfile?.city || "City pending"}
                    {guruProfile?.city && guruProfile?.state ? ", " : ""}
                    {guruProfile?.state || ""}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-slate-950/40 p-5">
                  <p className="text-sm font-semibold text-slate-300">
                    Starting rate
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {guruProfile?.rate || guruProfile?.rate === 0
                      ? `$${guruProfile.rate}`
                      : guruProfile?.hourly_rate || guruProfile?.hourly_rate === 0
                      ? `$${guruProfile.hourly_rate}`
                      : "Rate pending"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[22px] border border-white/10 bg-slate-950/40 p-5">
                <p className="text-sm font-semibold text-slate-300">
                  Bio shown to customers
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-200">
                  {guruProfile?.bio ||
                    "Your bio has not been added yet. Add it so customers and Admin both see a stronger professional presentation."}
                </p>
              </div>

              <div className="mt-4 rounded-[22px] border border-white/10 bg-slate-950/40 p-5">
                <p className="text-sm font-semibold text-slate-300">
                  Services shown publicly
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {services.map((service) => (
                    <span
                      key={service}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                    Message board
                  </p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                    Direct customer conversations
                  </h2>
                </div>

                <Link
                  href="/messages"
                  className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
                >
                  Open inbox
                </Link>
              </div>

              {customerConversations.length === 0 ? (
                <div className="mt-6 rounded-[22px] border border-dashed border-white/10 bg-slate-950/35 p-6">
                  <p className="text-base font-semibold text-white">
                    No customer threads yet
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    When customers message you, their conversations will appear
                    here for quick access and fast replies.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {customerConversations.slice(0, 4).map((conversation) => (
                    <Link
                      key={conversation.id}
                      href={conversation.href}
                      className="block rounded-[22px] border border-white/10 bg-slate-950/40 p-4 transition hover:border-emerald-400/25 hover:bg-slate-950/55"
                    >
                      <div className="flex items-start gap-4">
                        <ConversationAvatar
                          name={conversation.otherUserName}
                          imageUrl={conversation.otherUserPhotoUrl}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-base font-bold text-white">
                                {conversation.otherUserName}
                              </p>
                              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                {conversation.otherUserRole}
                              </p>
                            </div>

                            <div
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold capitalize ${getConversationStatusClasses(
                                conversation.status
                              )}`}
                            >
                              {conversation.status}
                            </div>
                          </div>

                          <p className="mt-3 truncate text-sm font-semibold text-slate-100">
                            {conversation.subject}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-300">
                            {conversation.preview}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs font-medium text-slate-400">
                              {formatDateTime(conversation.lastActivity)}
                            </p>

                            <span className="text-sm font-semibold text-emerald-300">
                              Open thread →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/messages"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  View All Messages
                </Link>

                <Link
                  href="/guru/bookings"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Open Booking Threads
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(5,150,105,0.14),rgba(15,23,42,0.78))] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                    Admin support
                  </p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                    Private thread with Admin only
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-200">
                    Use this space for platform issues, approvals, account help,
                    or operational questions. Customers are not part of this card
                    or this thread.
                  </p>
                </div>

                {adminConversation ? (
                  <div
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold capitalize ${getConversationStatusClasses(
                      adminConversation.status
                    )}`}
                  >
                    {adminConversation.status}
                  </div>
                ) : null}
              </div>

              {adminConversation ? (
                <div className="mt-6 rounded-[22px] border border-white/10 bg-slate-950/35 p-4">
                  <div className="flex items-start gap-4">
                    <ConversationAvatar
                      name={adminConversation.otherUserName}
                      imageUrl={adminConversation.otherUserPhotoUrl}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold text-white">
                        {adminConversation.otherUserName}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {adminConversation.otherUserRole}
                      </p>
                      <p className="mt-3 truncate text-sm font-semibold text-slate-100">
                        {adminConversation.subject}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-300">
                        {adminConversation.preview}
                      </p>
                      <p className="mt-3 text-xs font-medium text-slate-400">
                        {formatDateTime(adminConversation.lastActivity)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-[22px] border border-dashed border-white/10 bg-slate-950/35 p-5">
                  <p className="text-base font-semibold text-white">
                    No Admin thread started yet
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Click below to open a direct Admin-only message thread.
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/messages/admin"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  {adminConversation ? "Open Admin Thread" : "Start Admin Message"}
                </Link>

                <Link
                  href="/messages"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Open Full Inbox
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                Profile actions
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                Keep your Guru profile strong
              </h2>

              {missingProfileItems.length === 0 ? (
                <div className="mt-6 rounded-[22px] border border-emerald-400/20 bg-emerald-400/10 p-5">
                  <p className="text-base font-bold text-white">
                    Your profile looks strong
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-200">
                    Your main display information is filled out and ready for the
                    customer-facing experience.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {missingProfileItems.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-start gap-4 rounded-[20px] border border-white/10 bg-slate-950/40 px-4 py-4"
                    >
                      <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      <p className="pt-1 text-sm font-medium leading-6 text-slate-200">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/guru/profile"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Edit Public Guru Profile
                </Link>

                <Link
                  href="/messages"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  View Public Guru Messaging
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                Admin alignment
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                What feeds the Admin dashboard
              </h2>

              <div className="mt-6 space-y-3">
                {[
                  "Booking activity tied directly to your Guru record",
                  "Customer request visibility and service status updates",
                  "Profile display details that appear publicly",
                  "Service offerings, pricing, and location information",
                  "Operational transparency between Guru and Admin views",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[18px] border border-white/10 bg-slate-950/40 px-4 py-4 text-sm font-medium text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(5,150,105,0.14),rgba(15,23,42,0.78))] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                Guru workflow
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                Built to interact directly with customers
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                This dashboard should remain Guru-focused: manage your own
                bookings, maintain your public profile, keep customer interactions
                organized, and maintain a direct private line with Admin when
                needed.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/guru/bookings"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Manage Customer Bookings
                </Link>

                <Link
                  href="/messages/admin"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Contact Admin
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}