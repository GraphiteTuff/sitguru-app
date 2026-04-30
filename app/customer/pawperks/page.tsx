// app/customer/pawperks/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type SupabaseUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type RawProfileRow = {
  first_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  image_url?: string | null;
};

type CustomerProfile = {
  first_name: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type RawPetRow = {
  id?: string | number | null;
  name?: string | null;
  species?: string | null;
  breed?: string | null;
  age?: string | null;
  photo_url?: string | null;
};

type Pet = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  age: string | null;
  photo_url: string | null;
};

type ReferralProfile = {
  id: string;
  user_id: string;
  role: string;
  referral_code: string;
  referral_link: string | null;
  total_invites: number;
  completed_referrals: number;
  pending_rewards: number;
  earned_rewards: number;
  paid_rewards: number;
  available_credit: number;
};

type RawReferralProfileRow = {
  id?: string | null;
  user_id?: string | null;
  role?: string | null;
  referral_code?: string | null;
  referral_link?: string | null;
  total_invites?: number | null;
  completed_referrals?: number | null;
  pending_rewards?: number | null;
  earned_rewards?: number | null;
  paid_rewards?: number | null;
  available_credit?: number | null;
};

const routes = {
  dashboard: "/customer/dashboard",
  bookings: "/bookings",
  findGuru: "/search",
  pets: "/pets",
  messages: "/messages",
  payments: "/customer/dashboard#recent-bookings",
  profile: "/customer/dashboard#customer-profile",
  settings: "/customer/dashboard#customer-profile",
  help: "/help",
  login: "/login",
};

const CUSTOMER_PROFILE_PHOTO_SRC = "/images/customer-profile-photo.jpg";
const SIDEBAR_DOG_HUMAN_SRC =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80";
const HERO_DOG_SRC =
  "https://images.unsplash.com/photo-1611003229186-80e40cd54966?auto=format&fit=crop&w=1200&q=80";
const HERO_CAT_SRC =
  "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=900&q=80";
const INVITE_PARENTS_DOG_SRC =
  "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=900&q=80";
const INVITE_GURU_CAT_SRC =
  "https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=900&q=80";
const COMMUNITY_DOG_SRC =
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=700&q=80";
const COMMUNITY_CAT_SRC =
  "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=700&q=80";
const COMMUNITY_DOG_2_SRC =
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=700&q=80";
const COMMUNITY_FRENCHIE_SRC =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=700&q=80";
const DEFAULT_DOG_PET_PHOTO_SRC =
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80";
const DEFAULT_CAT_PET_PHOTO_SRC =
  "https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=800&q=80";

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[]
) {
  for (const key of keys) {
    const value = readString(metadata?.[key]);
    if (value) return value;
  }

  return null;
}

function buildCustomerProfile(
  row: RawProfileRow | null,
  user: SupabaseUserLike
): CustomerProfile {
  const metadata = user.user_metadata ?? null;

  const fullName =
    readString(row?.full_name) ||
    readString(row?.name) ||
    readMetadataString(metadata, ["full_name", "name"]) ||
    null;

  const firstName =
    readString(row?.first_name) ||
    readMetadataString(metadata, ["first_name", "given_name"]) ||
    fullName?.split(" ")[0] ||
    null;

  return {
    first_name: firstName,
    full_name: fullName,
    email: user.email ?? null,
    avatar_url:
      readString(row?.avatar_url) ||
      readString(row?.profile_photo_url) ||
      readString(row?.photo_url) ||
      readString(row?.image_url) ||
      readMetadataString(metadata, [
        "avatar_url",
        "profile_photo_url",
        "photo_url",
        "picture",
        "avatar",
      ]) ||
      null,
  };
}

function normalizePetRow(row: RawPetRow): Pet {
  return {
    id: String(row.id ?? crypto.randomUUID()),
    name: row.name?.trim() || "Pet",
    species: row.species ?? null,
    breed: row.breed ?? null,
    age: row.age ?? null,
    photo_url: row.photo_url ?? null,
  };
}

function normalizeReferralProfileRow(
  row: RawReferralProfileRow
): ReferralProfile {
  return {
    id: row.id ?? crypto.randomUUID(),
    user_id: row.user_id ?? "",
    role: row.role ?? "customer",
    referral_code: row.referral_code ?? "",
    referral_link: row.referral_link ?? null,
    total_invites: Number(row.total_invites ?? 0),
    completed_referrals: Number(row.completed_referrals ?? 0),
    pending_rewards: Number(row.pending_rewards ?? 0),
    earned_rewards: Number(row.earned_rewards ?? 0),
    paid_rewards: Number(row.paid_rewards ?? 0),
    available_credit: Number(row.available_credit ?? 0),
  };
}

function generateCustomerReferralCode(userId: string) {
  const cleanId = userId.replace(/-/g, "").slice(0, 10).toUpperCase();
  return `CUST-${cleanId}`;
}

function buildCustomerReferralLink(referralCode: string) {
  return `https://sitguru.com/signup?ref=${encodeURIComponent(
    referralCode
  )}&type=customer`;
}

function buildGuruReferralLink(referralCode: string) {
  return `https://sitguru.com/become-a-guru?ref=${encodeURIComponent(
    referralCode
  )}&type=guru`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getSafeFirstName(profile: CustomerProfile | null, email?: string | null) {
  if (profile?.first_name?.trim()) return profile.first_name.trim();

  if (profile?.full_name?.trim()) {
    return profile.full_name.trim().split(" ")[0] || "there";
  }

  if (email?.trim()) {
    const emailPrefix = email.trim().split("@")[0];
    if (emailPrefix) {
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
  }

  return "there";
}

function getCustomerInitials(profile: CustomerProfile | null) {
  const name = profile?.full_name || profile?.first_name || profile?.email || "Customer";
  const parts = name
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  const firstInitial = parts[0]?.charAt(0) || "C";
  const secondInitial = parts[1]?.charAt(0) || "U";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

async function fetchCustomerProfile(user: SupabaseUserLike) {
  const selectAttempts = [
    "first_name, full_name, avatar_url",
    "first_name, full_name, profile_photo_url",
    "first_name, full_name, photo_url",
    "first_name, full_name",
  ];

  for (const selectColumns of selectAttempts) {
    const { data, error } = await supabase
      .from("profiles")
      .select(selectColumns)
      .eq("id", user.id)
      .maybeSingle();

    if (!error) {
      return buildCustomerProfile((data as RawProfileRow | null) ?? null, user);
    }
  }

  return buildCustomerProfile(null, user);
}

async function fetchPetsForUser(userId: string) {
  const attempts: Array<{
    matchColumn: string;
    orderByCreatedAt: boolean;
  }> = [
    { matchColumn: "owner_id", orderByCreatedAt: true },
    { matchColumn: "user_id", orderByCreatedAt: true },
    { matchColumn: "owner_id", orderByCreatedAt: false },
    { matchColumn: "user_id", orderByCreatedAt: false },
  ];

  for (const attempt of attempts) {
    let query = supabase
      .from("pets")
      .select("id, name, species, breed, age, photo_url")
      .eq(attempt.matchColumn, userId);

    if (attempt.orderByCreatedAt) {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (!error) {
      return (data as RawPetRow[] | null)?.map(normalizePetRow) || [];
    }
  }

  return [] as Pet[];
}

async function getOrCreateReferralProfile(userId: string) {
  const { data, error } = await supabase
    .from("referral_profiles")
    .select(
      "id, user_id, role, referral_code, referral_link, total_invites, completed_referrals, pending_rewards, earned_rewards, paid_rewards, available_credit"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (!error && data) {
    return normalizeReferralProfileRow(data as RawReferralProfileRow);
  }

  const referralCode = generateCustomerReferralCode(userId);
  const referralLink = buildCustomerReferralLink(referralCode);

  const { data: createdProfile, error: createError } = await supabase
    .from("referral_profiles")
    .insert({
      user_id: userId,
      role: "customer",
      referral_code: referralCode,
      referral_link: referralLink,
      total_invites: 0,
      completed_referrals: 0,
      pending_rewards: 0,
      earned_rewards: 0,
      paid_rewards: 0,
      available_credit: 0,
    })
    .select(
      "id, user_id, role, referral_code, referral_link, total_invites, completed_referrals, pending_rewards, earned_rewards, paid_rewards, available_credit"
    )
    .maybeSingle();

  if (createError || !createdProfile) {
    console.error("Referral profile error:", createError);
    return null;
  }

  return normalizeReferralProfileRow(createdProfile as RawReferralProfileRow);
}

function SidebarLink({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition ${
        active
          ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100"
          : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function RewardStatCard({
  icon,
  label,
  value,
  tone = "emerald",
}: {
  icon: string;
  label: string;
  value: string;
  tone?: "emerald" | "amber" | "green";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    green: "bg-green-50 text-green-700 ring-green-100",
  };

  return (
    <div className="rounded-[1.65rem] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200">
      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl ring-1 ${tones[tone]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="text-sm font-medium text-slate-400">USD</p>
        </div>
      </div>
    </div>
  );
}

function InviteCard({
  title,
  description,
  imageSrc,
  copyTone,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: {
  title: string;
  description: string;
  imageSrc: string;
  copyTone: "emerald" | "amber";
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  const primaryClass =
    copyTone === "amber"
      ? "bg-amber-500 text-white hover:bg-amber-600"
      : "bg-emerald-600 text-white hover:bg-emerald-700";

  const secondaryClass =
    copyTone === "amber"
      ? "border-amber-200 text-amber-700 hover:bg-amber-50"
      : "border-emerald-200 text-emerald-700 hover:bg-emerald-50";

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#fbfdfb_100%)] shadow-sm">
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_180px] lg:items-end">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-slate-950">{title}</h3>
          <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-600">{description}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onPrimary}
              className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-black transition ${primaryClass}`}
            >
              {primaryLabel}
            </button>
            <button
              type="button"
              onClick={onSecondary}
              className={`inline-flex items-center justify-center rounded-2xl border bg-white px-5 py-3 text-sm font-black transition ${secondaryClass}`}
            >
              {secondaryLabel}
            </button>
          </div>
        </div>

        <div className="ml-auto h-44 w-full max-w-[180px] overflow-hidden rounded-[1.5rem] bg-slate-50 lg:h-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt={title} className="h-full w-full object-cover" />
        </div>
      </div>
    </div>
  );
}

function CommunityCircle({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-full border-4 border-white bg-white shadow-lg ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}

function PetThumb({ pet }: { pet: Pet }) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="h-40 bg-emerald-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            pet.photo_url ||
            (pet.species?.toLowerCase().includes("cat")
              ? DEFAULT_CAT_PET_PHOTO_SRC
              : DEFAULT_DOG_PET_PHOTO_SRC)
          }
          alt={pet.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-4">
        <p className="truncate text-base font-black text-slate-950">{pet.name}</p>
        <p className="mt-1 truncate text-sm font-medium text-slate-500">
          {[pet.species, pet.breed].filter(Boolean).join(" • ") || "Pet profile"}
        </p>
      </div>
    </div>
  );
}

export default function CustomerPawPerksPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [referralProfile, setReferralProfile] = useState<ReferralProfile | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);

  const loadPawPerks = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    const [profileData, petsData, referralData] = await Promise.all([
      fetchCustomerProfile(user),
      fetchPetsForUser(user.id),
      getOrCreateReferralProfile(user.id),
    ]);

    setProfile(profileData);
    setPets(petsData);
    setReferralProfile(referralData);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadPawPerks();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace(routes.login);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadPawPerks, router]);

  const firstName = getSafeFirstName(profile, profile?.email);
  const displayName = profile?.full_name || profile?.first_name || firstName;
  const avatarSrc = profile?.avatar_url?.trim() || CUSTOMER_PROFILE_PHOTO_SRC;
  const showAvatar = Boolean(avatarSrc) && !photoFailed;

  const customerReferralLink = useMemo(() => {
    if (!referralProfile?.referral_code) return "https://sitguru.com/signup";
    return buildCustomerReferralLink(referralProfile.referral_code);
  }, [referralProfile]);

  const guruReferralLink = useMemo(() => {
    if (!referralProfile?.referral_code) return "https://sitguru.com/become-a-guru";
    return buildGuruReferralLink(referralProfile.referral_code);
  }, [referralProfile]);

  async function copyReferralLink(link: string, label: string) {
    setCopyMessage("");

    try {
      await navigator.clipboard.writeText(link);
      setCopyMessage(`${label} copied. Share it with your community.`);
    } catch {
      setCopyMessage("We could not copy the link. Please copy it manually.");
    }
  }

  async function shareReferralLink(link: string, title: string) {
    setCopyMessage("");

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: "Join SitGuru and discover trusted pet care.",
          url: link,
        });
        setCopyMessage(`${title} shared.`);
        return;
      }

      await navigator.clipboard.writeText(link);
      setCopyMessage(`${title} copied. Share it with your community.`);
    } catch {
      setCopyMessage("Sharing was canceled or unavailable.");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace(routes.login);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7fbf7] px-4 py-10 text-slate-950">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-emerald-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl ring-1 ring-emerald-100">
            🎁
          </div>
          <p className="text-lg font-semibold text-slate-700">Loading your PawPerks page...</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#f7fbf7] text-slate-950"
      style={{
        fontFamily:
          '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div className="mx-auto max-w-[1600px] p-4 lg:p-5">
        <div className="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-white p-6 lg:border-b-0 lg:border-r">
            <Link href={routes.dashboard} className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sitguru-logo-cropped.png"
                alt="SitGuru"
                className="h-auto w-[170px] max-w-full object-contain"
              />
            </Link>
            <p className="mt-2 text-lg font-medium text-slate-500">At home. Happy pets.</p>

            <nav className="mt-8 grid gap-2">
              <SidebarLink href={routes.dashboard} label="Dashboard" icon="🏠" />
              <SidebarLink href={routes.bookings} label="Bookings" icon="📅" />
              <SidebarLink href={routes.pets} label="Pets" icon="🐾" />
              <SidebarLink href={routes.messages} label="Messages" icon="💬" />
              <SidebarLink href={routes.payments} label="Payments" icon="💳" />
              <SidebarLink href="/customer/pawperks" label="PawPerks" icon="🎁" active />
              <SidebarLink href={routes.profile} label="Profile" icon="👤" />
              <SidebarLink href={routes.help} label="Help Center" icon="❓" />
            </nav>

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-5 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Log Out
            </button>

            <div className="mt-8 overflow-hidden rounded-[1.85rem] border border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f7fcf7_100%)] p-5 shadow-sm">
              <p className="text-[18px] font-semibold leading-10 text-slate-800">
                Happy pets.<br />
                Happy people.<br />
                Stronger together.
              </p>
              <div className="mt-4 h-64 overflow-hidden rounded-[1.5rem] bg-emerald-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SIDEBAR_DOG_HUMAN_SRC}
                  alt="Happy pet parent hugging a dog"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </aside>

          <div className="bg-[#fcfdfc] p-5 md:p-7 lg:p-8">
            <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-[2.25rem]">
                  Welcome back, {firstName}! 👋
                </h1>
                <p className="mt-2 text-lg font-medium text-slate-500">
                  Thanks for being part of our community.
                </p>
              </div>

              <div className="flex items-center gap-4 self-start rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <span className="text-2xl">🔔</span>
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-emerald-50 ring-2 ring-white">
                  {showAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarSrc}
                      alt={`${displayName} profile photo`}
                      className="h-full w-full object-cover"
                      onError={() => setPhotoFailed(true)}
                    />
                  ) : (
                    <span className="text-sm font-black text-emerald-700">{getCustomerInitials(profile)}</span>
                  )}
                </div>
                <div className="pr-1">
                  <p className="text-base font-bold text-slate-800">{displayName}</p>
                  <p className="text-sm font-medium text-slate-500">Pet Parent</p>
                </div>
              </div>
            </header>

            {copyMessage ? (
              <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {copyMessage}
              </div>
            ) : null}

            <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-[linear-gradient(135deg,#eef6e8_0%,#f7faf0_40%,#ffffff_100%)] shadow-sm">
              <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:p-8">
                <div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#6f9c34] text-4xl text-white shadow-sm">
                      🐾
                    </div>
                    <h2 className="text-5xl font-black tracking-tight text-[#234222] md:text-[4.25rem]">
                      PawPerks
                    </h2>
                  </div>
                  <p className="mt-5 text-2xl font-semibold text-slate-700">
                    Share SitGuru. Earn rewards. Grow trusted pet care.
                  </p>
                </div>

                <div className="relative min-h-[250px]">
                  <div className="absolute bottom-0 right-0 left-0 flex items-end justify-end gap-4">
                    <div className="z-10 mb-3 h-56 w-40 overflow-hidden rounded-[1.75rem] border-4 border-white bg-white shadow-xl md:h-64 md:w-48">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={HERO_CAT_SRC} alt="Cat on PawPerks hero" className="h-full w-full object-cover" />
                    </div>
                    <div className="h-64 w-56 overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-xl md:h-72 md:w-72">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={HERO_DOG_SRC} alt="Golden retriever on PawPerks hero" className="h-full w-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 px-6 pb-6 md:grid-cols-3 lg:px-8 lg:pb-8">
                <RewardStatCard
                  icon="👛"
                  label="Available Credit"
                  value={formatMoney(referralProfile?.available_credit ?? 0)}
                />
                <RewardStatCard
                  icon="🕒"
                  label="Pending Rewards"
                  value={formatMoney(referralProfile?.pending_rewards ?? 0)}
                  tone="amber"
                />
                <RewardStatCard
                  icon="✅"
                  label="Completed"
                  value={formatMoney(referralProfile?.earned_rewards ?? 0)}
                  tone="green"
                />
              </div>
            </section>

            <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
              <h3 className="text-4xl font-black tracking-tight text-[#234222]">
                Invite Pet Parents and Gurus
              </h3>
              <p className="mt-3 text-lg font-medium text-slate-500">
                Spread the word and earn credit for each friend or trusted pet sitter who joins.
              </p>

              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                <InviteCard
                  title="Invite Pet Parents"
                  description="Share SitGuru with Pet Parents. They get a discount on their first booking, and you earn credit after their first completed stay."
                  imageSrc={INVITE_PARENTS_DOG_SRC}
                  copyTone="emerald"
                  primaryLabel="Copy Link"
                  secondaryLabel="Share"
                  onPrimary={() => copyReferralLink(customerReferralLink, "Customer invite link")}
                  onSecondary={() => shareReferralLink(customerReferralLink, "Customer invite link")}
                />

                <InviteCard
                  title="Invite Trusted Gurus"
                  description="Refer a trusted pet sitter. When they complete onboarding and their first eligible booking, you earn a reward."
                  imageSrc={INVITE_GURU_CAT_SRC}
                  copyTone="amber"
                  primaryLabel="Copy Link"
                  secondaryLabel="Share"
                  onPrimary={() => copyReferralLink(guruReferralLink, "Guru invite link")}
                  onSecondary={() => shareReferralLink(guruReferralLink, "Guru invite link")}
                />
              </div>
            </section>

            <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
              <h3 className="text-4xl font-black tracking-tight text-[#234222]">Our Community is Growing</h3>
              <p className="mt-3 max-w-3xl text-lg font-medium leading-8 text-slate-500">
                Because of Pet Parents and Gurus like you, more pets are getting the love and care they deserve—right at home.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-slate-200 bg-[#fbfdf9] p-5">
                  <p className="text-4xl font-black text-slate-950">25,000+</p>
                  <p className="mt-1 text-base font-medium text-slate-500">Happy Pet Parents</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-[#fbfdf9] p-5">
                  <p className="text-4xl font-black text-slate-950">8,500+</p>
                  <p className="mt-1 text-base font-medium text-slate-500">Trusted Gurus</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-[#fbfdf9] p-5">
                  <p className="text-4xl font-black text-slate-950">100,000+</p>
                  <p className="mt-1 text-base font-medium text-slate-500">Pets Cared For</p>
                </div>
              </div>

              <div className="mt-7 overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-[linear-gradient(135deg,#ffffff_0%,#fbfdf9_100%)] p-5 lg:p-6">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                  <div>
                    <p className="text-lg font-semibold leading-8 text-slate-600">
                      Every referral helps build a more caring, connected pet community.
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#2a6b31]">
                      Thank you for being a part of it!
                    </p>
                  </div>

                  <div className="relative min-h-[220px] overflow-hidden rounded-[1.75rem] bg-[#f8fbf7]">
                    <div className="absolute left-6 top-10 h-px w-[72%] rotate-[10deg] bg-emerald-400" />
                    <div className="absolute left-14 top-24 h-px w-[64%] -rotate-[8deg] bg-emerald-400" />
                    <div className="absolute left-10 top-36 h-px w-[72%] rotate-[8deg] bg-emerald-400" />
                    <CommunityCircle src={COMMUNITY_DOG_SRC} alt="Community dog" className="absolute left-2 top-4 h-24 w-24" />
                    <CommunityCircle src={COMMUNITY_CAT_SRC} alt="Community cat" className="absolute left-[38%] top-[38%] h-24 w-24" />
                    <CommunityCircle src={COMMUNITY_FRENCHIE_SRC} alt="Community french bulldog" className="absolute right-4 top-3 h-20 w-20" />
                    <CommunityCircle src={COMMUNITY_DOG_2_SRC} alt="Community puppy" className="absolute right-7 bottom-4 h-20 w-20" />
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-[2rem] border border-emerald-100 bg-[linear-gradient(135deg,#eff8ef_0%,#ffffff_100%)] p-5 shadow-sm lg:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#6f9c34] text-2xl text-white shadow-sm">
                    🐾
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-600">
                      Every referral helps build a more caring, connected pet community.
                    </p>
                    <p className="mt-1 text-2xl font-black text-[#2a6b31]">Thank you for being a part of it!</p>
                  </div>
                </div>
                <Link
                  href={routes.help}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  Learn More →
                </Link>
              </div>
            </section>

            {pets.length > 0 ? (
              <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Your pets</p>
                    <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Your pet profiles</h3>
                  </div>
                  <Link href={routes.pets} className="text-sm font-black text-emerald-700 hover:text-emerald-800">
                    Manage Pets
                  </Link>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {pets.slice(0, 4).map((pet) => (
                    <PetThumb key={pet.id} pet={pet} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
