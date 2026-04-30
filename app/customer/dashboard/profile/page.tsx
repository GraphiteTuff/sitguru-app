// app/customer/dashboard/profile/page.tsx
"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type CustomerProfile = {
  first_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  service_address: string | null;
  emergency_contact: string | null;
  care_preferences: string | null;
  avatar_url: string | null;
};

type CustomerProfileForm = {
  full_name: string;
  phone: string;
  service_address: string;
  emergency_contact: string;
  care_preferences: string;
};

type RawProfileRow = {
  first_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  service_address?: string | null;
  address?: string | null;
  home_address?: string | null;
  emergency_contact?: string | null;
  emergency_contact_name?: string | null;
  care_preferences?: string | null;
  preferences?: string | null;
  notes?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  image_url?: string | null;
};

type SupabaseUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type Booking = {
  id: string;
  status: string;
  start_time: string;
  notes: string | null;
};

type RawBookingRow = {
  id?: string | number | null;
  status?: string | null;
  start_time?: string | null;
  date?: string | null;
  notes?: string | null;
};

type Pet = {
  id: string;
  name: string;
};

type RawPetRow = {
  id?: string | number | null;
  name?: string | null;
};

type SavedPlace = {
  id: string;
};

const routes = {
  dashboard: "/customer/dashboard",
  profile: "/customer/dashboard/profile",
  bookings: "/customer/dashboard/bookings",
  messages: "/customer/dashboard/messages",
  pets: "/customer/pets",
  saved: "/customer/dashboard/saved",
  settings: "/customer/dashboard/settings",
  pawPerks: "/customer/dashboard/pawperks",
  login: "/login",
};

const fallbackAvatar = "/images/customer-profile-photo.jpg";
const profilePhotoBuckets = ["profile-photos", "avatars"];
const maxProfilePhotoSize = 5 * 1024 * 1024;

const initialProfileForm: CustomerProfileForm = {
  full_name: "",
  phone: "",
  service_address: "",
  emergency_contact: "",
  care_preferences: "",
};

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
    phone:
      readString(row?.phone) ||
      readString(row?.phone_number) ||
      readMetadataString(metadata, ["phone", "phone_number"]) ||
      null,
    service_address:
      readString(row?.service_address) ||
      readString(row?.address) ||
      readString(row?.home_address) ||
      readMetadataString(metadata, [
        "service_address",
        "address",
        "home_address",
      ]) ||
      null,
    emergency_contact:
      readString(row?.emergency_contact) ||
      readString(row?.emergency_contact_name) ||
      readMetadataString(metadata, [
        "emergency_contact",
        "emergency_contact_name",
      ]) ||
      null,
    care_preferences:
      readString(row?.care_preferences) ||
      readString(row?.preferences) ||
      readString(row?.notes) ||
      readMetadataString(metadata, ["care_preferences", "preferences", "notes"]) ||
      null,
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

function customerProfileToForm(
  profile: CustomerProfile | null
): CustomerProfileForm {
  return {
    full_name: profile?.full_name || profile?.first_name || "",
    phone: profile?.phone || "",
    service_address: profile?.service_address || "",
    emergency_contact: profile?.emergency_contact || "",
    care_preferences: profile?.care_preferences || "",
  };
}

function getCustomerInitials(profile: CustomerProfile | null) {
  const name =
    profile?.full_name || profile?.first_name || profile?.email || "Customer";

  const parts = name
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  const firstInitial = parts[0]?.charAt(0) || "C";
  const secondInitial = parts[1]?.charAt(0) || "";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

function getDisplayValue(value: string | null | undefined) {
  return value?.trim() || "Not added yet";
}

function normalizeBookingRow(row: RawBookingRow): Booking {
  return {
    id: String(row.id ?? crypto.randomUUID()),
    status: row.status?.trim() || "pending",
    start_time:
      row.start_time?.trim() || row.date?.trim() || new Date(0).toISOString(),
    notes: row.notes ?? null,
  };
}

function formatActivityDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime()) || value === new Date(0).toISOString()) {
    return "Date pending";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function fetchCustomerProfile(user: SupabaseUserLike) {
  const selectAttempts = [
    "first_name, full_name, phone, service_address, emergency_contact, care_preferences, avatar_url",
    "first_name, full_name, phone, address, emergency_contact, care_preferences, avatar_url",
    "first_name, full_name, phone, service_address, emergency_contact, care_preferences, profile_photo_url",
    "first_name, full_name, phone, address, emergency_contact, care_preferences, profile_photo_url",
    "first_name, full_name, phone, service_address, emergency_contact, care_preferences, photo_url",
    "first_name, full_name, phone, address, emergency_contact, care_preferences, photo_url",
    "first_name, full_name, phone, service_address, emergency_contact, care_preferences",
    "first_name, full_name, phone, address, emergency_contact, care_preferences",
    "first_name, full_name, phone, service_address, avatar_url",
    "first_name, full_name, phone, address, avatar_url",
    "first_name, full_name, phone, service_address",
    "first_name, full_name, phone, address",
    "first_name, full_name, avatar_url",
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

async function saveCustomerProfile(userId: string, form: CustomerProfileForm) {
  const fullName = form.full_name.trim();
  const firstName = fullName.split(" ")[0] || fullName || null;

  const saveAttempts: Array<Record<string, string | null>> = [
    {
      id: userId,
      full_name: fullName || null,
      first_name: firstName,
      phone: form.phone.trim() || null,
      service_address: form.service_address.trim() || null,
      emergency_contact: form.emergency_contact.trim() || null,
      care_preferences: form.care_preferences.trim() || null,
    },
    {
      id: userId,
      full_name: fullName || null,
      first_name: firstName,
      phone: form.phone.trim() || null,
      address: form.service_address.trim() || null,
      emergency_contact: form.emergency_contact.trim() || null,
      care_preferences: form.care_preferences.trim() || null,
    },
    {
      id: userId,
      full_name: fullName || null,
      first_name: firstName,
      phone: form.phone.trim() || null,
      service_address: form.service_address.trim() || null,
    },
    {
      id: userId,
      full_name: fullName || null,
      first_name: firstName,
      phone: form.phone.trim() || null,
      address: form.service_address.trim() || null,
    },
    {
      id: userId,
      full_name: fullName || null,
      first_name: firstName,
    },
  ];

  let lastError = "We could not save your profile right now.";

  for (const payload of saveAttempts) {
    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (!error) return;

    lastError = error.message || lastError;
  }

  throw new Error(lastError);
}

function getProfilePhotoExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";

  const fileNameExtension = file.name.split(".").pop()?.toLowerCase();
  return fileNameExtension === "png" ? "png" : "jpg";
}

async function uploadCustomerProfilePhoto(userId: string, file: File) {
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("Please upload a JPG or PNG profile picture.");
  }

  if (file.size > maxProfilePhotoSize) {
    throw new Error("Please upload a profile picture under 5MB.");
  }

  const extension = getProfilePhotoExtension(file);
  const filePath = `${userId}/customer-avatar-${Date.now()}.${extension}`;
  let lastError = "We could not upload your profile picture right now.";

  for (const bucket of profilePhotoBuckets) {
    const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

      if (data.publicUrl) {
        return data.publicUrl;
      }
    }

    lastError =
      error?.message ||
      `We could not upload your profile picture to the ${bucket} bucket.`;
  }

  throw new Error(
    `${lastError} Make sure Supabase Storage has a public bucket named profile-photos or avatars.`
  );
}

async function saveCustomerProfilePhotoUrl(userId: string, avatarUrl: string) {
  const saveAttempts = [
    { id: userId, avatar_url: avatarUrl },
    { id: userId, profile_photo_url: avatarUrl },
    { id: userId, photo_url: avatarUrl },
  ];

  let lastError =
    "The photo uploaded, but we could not connect it to your profile.";

  for (const payload of saveAttempts) {
    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (!error) return;

    lastError = error.message || lastError;
  }

  throw new Error(lastError);
}

async function fetchBookingsForUser(userId: string) {
  const attempts: Array<{
    matchColumn: string;
    dateColumn: "start_time" | "date";
  }> = [
    { matchColumn: "pet_owner_id", dateColumn: "start_time" },
    { matchColumn: "customer_id", dateColumn: "start_time" },
    { matchColumn: "user_id", dateColumn: "start_time" },
    { matchColumn: "pet_owner_id", dateColumn: "date" },
    { matchColumn: "customer_id", dateColumn: "date" },
    { matchColumn: "user_id", dateColumn: "date" },
  ];

  for (const attempt of attempts) {
    const selectColumns =
      attempt.dateColumn === "start_time"
        ? "id, status, start_time, notes"
        : "id, status, date, notes";

    const { data, error } = await supabase
      .from("bookings")
      .select(selectColumns)
      .eq(attempt.matchColumn, userId)
      .order(attempt.dateColumn, { ascending: false });

    if (!error) {
      return (data as RawBookingRow[] | null)?.map(normalizeBookingRow) || [];
    }
  }

  return [] as Booking[];
}

async function fetchPetsForUser(userId: string) {
  const attempts = ["owner_id", "user_id"];

  for (const matchColumn of attempts) {
    const { data, error } = await supabase
      .from("pets")
      .select("id, name")
      .eq(matchColumn, userId);

    if (!error) {
      return (
        (data as RawPetRow[] | null)?.map((pet) => ({
          id: String(pet.id ?? crypto.randomUUID()),
          name: pet.name?.trim() || "Pet",
        })) || []
      );
    }
  }

  return [] as Pet[];
}

async function fetchSavedPlacesForUser(userId: string) {
  const attempts = [
    { table: "saved_places", column: "user_id" },
    { table: "saved_gurus", column: "user_id" },
    { table: "favorite_gurus", column: "user_id" },
    { table: "saved_places", column: "customer_id" },
    { table: "saved_gurus", column: "customer_id" },
    { table: "favorite_gurus", column: "customer_id" },
  ];

  for (const attempt of attempts) {
    const { data, error } = await supabase
      .from(attempt.table)
      .select("id")
      .eq(attempt.column, userId);

    if (!error) {
      return (data as SavedPlace[] | null) || [];
    }
  }

  return [] as SavedPlace[];
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M6 4.8A2.8 2.8 0 0 1 8.8 2h6.4A2.8 2.8 0 0 1 18 4.8V21l-6-3.5L6 21V4.8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M12 3 5 6v5c0 4.4 2.8 8.4 7 10 4.2-1.6 7-5.6 7-10V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M4 7h5m4 0h7M9 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM4 17h9m4 0h3m-7 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="m9 18 6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MobileActionCard({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-[1.4rem] border border-emerald-100 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_20px_50px_rgba(16,185,129,0.12)]"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl ring-1 ring-emerald-100 transition group-hover:bg-emerald-100">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-black text-slate-950">{title}</span>
        <span className="mt-1 block text-sm font-semibold leading-5 text-slate-500">
          {text}
        </span>
      </span>
      <span className="text-emerald-500">
        <ChevronRightIcon />
      </span>
    </Link>
  );
}

export default function CustomerDashboardProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileForm, setProfileForm] =
    useState<CustomerProfileForm>(initialProfileForm);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarMessage, setAvatarMessage] = useState("");

  const avatarSrc = profile?.avatar_url?.trim() || fallbackAvatar;
  const showAvatar = Boolean(avatarSrc) && !photoFailed;

  const displayName = useMemo(() => {
    return (
      profile?.full_name?.trim() ||
      profile?.first_name?.trim() ||
      profile?.email?.split("@")[0] ||
      "Customer"
    );
  }, [profile]);

  const initials = useMemo(() => getCustomerInitials(profile), [profile]);

  const completedBookings = useMemo(() => {
    return bookings.filter(
      (booking) => booking.status.toLowerCase() === "completed"
    ).length;
  }, [bookings]);

  const careReadiness = useMemo(() => {
    const contactReady = Boolean(profile?.phone?.trim());
    const addressReady = Boolean(profile?.service_address?.trim());
    const petReady = pets.length > 0;
    const notesReady = Boolean(profile?.care_preferences?.trim());

    const items = [contactReady, addressReady, petReady, notesReady];
    const completed = items.filter(Boolean).length;
    const score = Math.round((completed / items.length) * 100);

    return {
      contactReady,
      addressReady,
      petReady,
      notesReady,
      score,
      completed,
      total: items.length,
      bookingReady: contactReady && addressReady && petReady,
    };
  }, [profile, pets.length]);

  const recentActivity = useMemo(() => {
    const bookingActivities = bookings.slice(0, 3).map((booking) => ({
      id: booking.id,
      icon: "📅",
      title:
        booking.status.toLowerCase() === "completed"
          ? "You completed a SitGuru booking"
          : "You booked pet care with SitGuru",
      date: formatActivityDate(booking.start_time),
    }));

    if (bookingActivities.length > 0) return bookingActivities;

    return [
      {
        id: "profile",
        icon: "👤",
        title: "Your customer profile is ready to manage",
        date: "Today",
      },
      {
        id: "pets",
        icon: "🐾",
        title:
          pets.length > 0
            ? `${pets.length} pet profile${pets.length === 1 ? "" : "s"} connected`
            : "Add a pet profile to improve booking details",
        date: "SitGuru",
      },
      {
        id: "saved",
        icon: "🔖",
        title:
          savedPlaces.length > 0
            ? `${savedPlaces.length} saved favorite${
                savedPlaces.length === 1 ? "" : "s"
              }`
            : "Save favorite Gurus for faster booking",
        date: "SitGuru",
      },
    ];
  }, [bookings, pets.length, savedPlaces.length]);

  const loadProfile = useCallback(async () => {
    setProfileError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    const [profileData, bookingsData, petsData, savedData] = await Promise.all([
      fetchCustomerProfile(user),
      fetchBookingsForUser(user.id),
      fetchPetsForUser(user.id),
      fetchSavedPlacesForUser(user.id),
    ]);

    setProfile(profileData);
    setProfileForm(customerProfileToForm(profileData));
    setBookings(bookingsData);
    setPets(petsData);
    setSavedPlaces(savedData);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace(routes.login);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile, router]);

  useEffect(() => {
    setPhotoFailed(false);
  }, [avatarSrc]);

  async function handleSaveProfile(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();

    setSavingProfile(true);
    setProfileMessage("");
    setProfileError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    try {
      await saveCustomerProfile(user.id, profileForm);
      const refreshedProfile = await fetchCustomerProfile(user);

      setProfile(refreshedProfile);
      setProfileForm(customerProfileToForm(refreshedProfile));
      setEditMode(false);
      setProfileMessage("Saved");
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "We could not save your profile right now."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleCustomerAvatarUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadingAvatar(true);
    setAvatarError("");
    setAvatarMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    try {
      const publicUrl = await uploadCustomerProfilePhoto(user.id, file);
      await saveCustomerProfilePhotoUrl(user.id, publicUrl);

      const refreshedProfile = await fetchCustomerProfile(user);
      const profileWithPhoto = refreshedProfile.avatar_url
        ? refreshedProfile
        : { ...refreshedProfile, avatar_url: publicUrl };

      setProfile(profileWithPhoto);
      setProfileForm(customerProfileToForm(profileWithPhoto));
      setPhotoFailed(false);
      setAvatarMessage("Profile picture updated.");
    } catch (error) {
      setAvatarError(
        error instanceof Error
          ? error.message
          : "We could not upload your profile picture right now."
      );
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_45%,#ecfdf5_100%)]">
        <Header />

        <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-16">
          <div className="rounded-[2rem] border border-emerald-100 bg-white px-8 py-6 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl ring-1 ring-emerald-100">
              🐾
            </div>
            <p className="text-base font-bold text-slate-700">
              Loading your SitGuru profile...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] text-slate-950">
      <Header />

      <section className="mx-auto max-w-[1500px] px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.92),transparent_18%),linear-gradient(120deg,#10b981_0%,#34d399_48%,#a7f3d0_100%)] px-6 py-8 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-950/80">
                  SitGuru Customer Profile
                </p>

                <h1 className="mt-4 text-5xl font-black tracking-[-0.065em] text-slate-950 md:text-6xl">
                  My Profile
                </h1>

                <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-800/75">
                  Manage your personal information, pet care preferences, saved
                  Gurus, bookings, and account settings.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMessage("");
                    setProfileError("");
                    setProfileForm(customerProfileToForm(profile));
                    setEditMode((value) => !value);
                  }}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-6 text-sm font-black text-slate-950 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
                >
                  ✎ {editMode ? "Cancel Edit" : "Edit Profile"}
                </button>

                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={() => handleSaveProfile()}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60"
                >
                  ✓ {savingProfile ? "Saving..." : profileMessage || "Save Changes"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 lg:p-7">
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm lg:p-7">
              <div className="grid gap-6 lg:grid-cols-[1.45fr_0.75fr_0.75fr_0.75fr] lg:items-center lg:divide-x lg:divide-emerald-100">
                <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                  <label className="group relative h-28 w-28 shrink-0 cursor-pointer overflow-hidden rounded-full bg-emerald-50 text-3xl font-black text-emerald-700 ring-4 ring-emerald-100 lg:h-32 lg:w-32">
                    {showAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarSrc}
                        alt={`${displayName} profile photo`}
                        onError={() => setPhotoFailed(true)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        {initials}
                      </span>
                    )}

                    <span className="absolute inset-0 hidden items-center justify-center bg-slate-950/45 text-xs font-black text-white group-hover:flex">
                      {uploadingAvatar ? "Uploading" : "Change"}
                    </span>

                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      disabled={uploadingAvatar}
                      onChange={handleCustomerAvatarUpload}
                      className="sr-only"
                    />
                  </label>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      <h2 className="text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">
                        {displayName}
                      </h2>
                      <span className="flex h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                    </div>

                    <p className="mt-2 break-words text-sm font-bold text-slate-500">
                      {profile?.email || "No email connected"}
                    </p>

                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-800">
                      🐾 Pet Parent
                    </div>

                    {avatarMessage ? (
                      <p className="mt-2 text-xs font-bold text-emerald-700">
                        {avatarMessage}
                      </p>
                    ) : null}

                    {avatarError ? (
                      <p className="mt-2 max-w-sm text-xs font-bold text-red-600">
                        {avatarError}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-0 divide-x divide-emerald-100 lg:contents lg:divide-x-0">
                  <div className="flex flex-col items-center justify-center px-2 py-2 text-center lg:px-6">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <BookmarkIcon />
                    </span>
                    <p className="mt-3 text-2xl font-black text-slate-950">
                      {savedPlaces.length}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">
                      Saved Gurus
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center px-2 py-2 text-center lg:px-6">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <CalendarIcon />
                    </span>
                    <p className="mt-3 text-2xl font-black text-slate-950">
                      {bookings.length}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">
                      Bookings
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center px-2 py-2 text-center lg:px-6">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <StarIcon />
                    </span>
                    <p className="mt-3 text-2xl font-black text-slate-950">
                      {completedBookings}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">
                      Completed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {profileMessage || profileError ? (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-black ${
                  profileError
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {profileError || profileMessage}
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 lg:hidden">
              <MobileActionCard
                href="#personal-info"
                icon="👤"
                title="Personal Information"
                text="Manage your personal details and contact information."
              />
              <MobileActionCard
                href="#preferences"
                icon="🐾"
                title="Care Preferences"
                text="Set pet care preferences, services, and notifications."
              />
              <MobileActionCard
                href="#security"
                icon="🛡️"
                title="Security"
                text="Change password, manage 2FA and active sessions."
              />
              <MobileActionCard
                href="#care-readiness"
                icon="✅"
                title="Care Readiness"
                text="See what is complete before booking pet care."
              />
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="mt-6 grid gap-5 lg:grid-cols-3"
            >
              <div
                id="personal-info"
                className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:shadow-[0_20px_50px_rgba(16,185,129,0.08)]"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <ProfileIcon />
                    </span>
                    <h3 className="text-xl font-black text-slate-950">
                      Personal Information
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="text-xl font-black text-emerald-500 hover:text-emerald-700"
                  >
                    ⋮
                  </button>
                </div>

                <div className="divide-y divide-emerald-50">
                  {editMode ? (
                    <>
                      <label className="grid gap-2 py-3 text-sm">
                        <span className="font-black text-slate-600">Full Name</span>
                        <input
                          type="text"
                          value={profileForm.full_name}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              full_name: e.target.value,
                            })
                          }
                          className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-3 font-bold text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white"
                        />
                      </label>

                      <label className="grid gap-2 py-3 text-sm">
                        <span className="font-black text-slate-600">Phone</span>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              phone: e.target.value,
                            })
                          }
                          className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-3 font-bold text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white"
                        />
                      </label>

                      <label className="grid gap-2 py-3 text-sm">
                        <span className="font-black text-slate-600">Location</span>
                        <input
                          type="text"
                          value={profileForm.service_address}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              service_address: e.target.value,
                            })
                          }
                          className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-3 font-bold text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white"
                        />
                      </label>

                      <label className="grid gap-2 py-3 text-sm">
                        <span className="font-black text-slate-600">
                          Emergency Contact
                        </span>
                        <input
                          type="text"
                          value={profileForm.emergency_contact}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              emergency_contact: e.target.value,
                            })
                          }
                          className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-3 font-bold text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white"
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      {[
                        [
                          "Full Name",
                          getDisplayValue(profile?.full_name || profile?.first_name),
                        ],
                        ["Email", getDisplayValue(profile?.email)],
                        ["Phone", getDisplayValue(profile?.phone)],
                        ["Emergency", getDisplayValue(profile?.emergency_contact)],
                        ["Location", getDisplayValue(profile?.service_address)],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="grid grid-cols-[115px_1fr_20px] items-center gap-3 py-3 text-sm"
                        >
                          <p className="font-black text-slate-600">{label}</p>
                          <p className="break-words font-bold text-slate-950">
                            {value}
                          </p>
                          <button
                            type="button"
                            onClick={() => setEditMode(true)}
                            className="text-emerald-500 hover:text-emerald-700"
                          >
                            ✎
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div
                id="preferences"
                className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:shadow-[0_20px_50px_rgba(16,185,129,0.08)]"
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <SlidersIcon />
                  </span>
                  <h3 className="text-xl font-black text-slate-950">
                    Care Preferences
                  </h3>
                </div>

                <div className="divide-y divide-emerald-50">
                  <div className="grid grid-cols-[1fr_auto] gap-3 py-3 text-sm">
                    <p className="font-black text-slate-600">Care Type</p>
                    <div className="flex flex-wrap justify-end gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                        Dog Care
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                        Cat Care
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-3 py-3 text-sm">
                    <p className="font-black text-slate-600">Favorite Services</p>
                    <div className="flex flex-wrap justify-end gap-2">
                      {["🐕", "🏠", "🌙", "🐾", "+2"].map((item) => (
                        <span
                          key={item}
                          className="flex h-8 min-w-8 items-center justify-center rounded-full bg-emerald-50 px-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_20px] items-center gap-3 py-3 text-sm">
                    <p className="font-black text-slate-600">Notifications</p>
                    <p className="text-right font-bold text-slate-500">
                      Email, Push, SMS
                    </p>
                    <ChevronRightIcon />
                  </div>

                  <div className="grid grid-cols-[1fr_auto_20px] items-center gap-3 py-3 text-sm">
                    <p className="font-black text-slate-600">Care Notes</p>
                    <p className="max-w-[150px] truncate text-right font-bold text-slate-500">
                      {getDisplayValue(profile?.care_preferences)}
                    </p>
                    <ChevronRightIcon />
                  </div>

                  {editMode ? (
                    <label className="grid gap-2 py-3 text-sm">
                      <span className="font-black text-slate-600">
                        Care Preferences
                      </span>
                      <textarea
                        rows={4}
                        value={profileForm.care_preferences}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            care_preferences: e.target.value,
                          })
                        }
                        className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-3 font-bold text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white"
                      />
                    </label>
                  ) : null}
                </div>
              </div>

              <div
                id="security"
                className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:shadow-[0_20px_50px_rgba(16,185,129,0.08)]"
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <ShieldIcon />
                  </span>
                  <h3 className="text-xl font-black text-slate-950">Security</h3>
                </div>

                <div className="divide-y divide-emerald-50">
                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-4 text-sm">
                    <p className="font-black text-slate-600">Password</p>
                    <div className="flex items-center gap-4">
                      <span className="font-black tracking-[0.25em] text-slate-950">
                        ••••••••
                      </span>
                      <Link
                        href={routes.settings}
                        className="font-black text-emerald-600 hover:text-emerald-700"
                      >
                        Change
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-4 text-sm">
                    <p className="font-black text-slate-600">Account Status</p>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-4 text-sm">
                    <p className="font-black text-slate-600">Support</p>
                    <Link
                      href={routes.messages}
                      className="font-black text-emerald-600 hover:text-emerald-700"
                    >
                      Message Admin
                    </Link>
                  </div>
                </div>
              </div>

              <div
                id="care-readiness"
                className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:shadow-[0_20px_50px_rgba(16,185,129,0.08)]"
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    ✅
                  </span>
                  <div>
                    <h3 className="text-xl font-black text-slate-950">
                      Care Readiness
                    </h3>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {careReadiness.completed} of {careReadiness.total} setup steps complete
                    </p>
                  </div>
                </div>

                <div className="mb-5 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">
                      Booking readiness
                    </p>
                    <p className="text-sm font-black text-emerald-700">
                      {careReadiness.score}%
                    </p>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white ring-1 ring-emerald-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${careReadiness.score}%` }}
                    />
                  </div>
                </div>

                <div className="divide-y divide-emerald-50">
                  {[
                    {
                      label: "Contact Info",
                      ready: careReadiness.contactReady,
                      value: careReadiness.contactReady ? "Added" : "Needs phone",
                    },
                    {
                      label: "Service Address",
                      ready: careReadiness.addressReady,
                      value: careReadiness.addressReady ? "Added" : "Needs address",
                    },
                    {
                      label: "Pet Profiles",
                      ready: careReadiness.petReady,
                      value:
                        pets.length > 0
                          ? `${pets.length} pet${pets.length === 1 ? "" : "s"}`
                          : "Add first pet",
                    },
                    {
                      label: "Care Notes",
                      ready: careReadiness.notesReady,
                      value: careReadiness.notesReady ? "Added" : "Recommended",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 text-sm"
                    >
                      <p className="font-black text-slate-600">{item.label}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          item.ready
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                        }`}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {!careReadiness.contactReady || !careReadiness.addressReady ? (
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700"
                    >
                      Complete Profile
                    </button>
                  ) : null}

                  <Link
                    href={routes.pets}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                  >
                    Manage Pets
                  </Link>
                </div>

                <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
                  {careReadiness.bookingReady
                    ? "You are ready to book trusted care with SitGuru."
                    : "Complete the missing items to make booking smoother for you and your Guru."}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:shadow-[0_20px_50px_rgba(16,185,129,0.08)] lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      🐾
                    </span>
                    <h3 className="text-xl font-black text-slate-950">
                      Recent Activity
                    </h3>
                  </div>

                  <Link
                    href={routes.bookings}
                    className="text-sm font-black text-emerald-600 hover:text-emerald-700"
                  >
                    View All Activity
                  </Link>
                </div>

                <div className="divide-y divide-emerald-50">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="grid grid-cols-[42px_1fr_auto] items-center gap-4 py-4"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg ring-1 ring-emerald-100">
                        {activity.icon}
                      </span>
                      <p className="text-sm font-bold text-slate-700">
                        {activity.title}
                      </p>
                      <p className="hidden text-right text-sm font-bold text-slate-500 sm:block">
                        {activity.date}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {editMode ? (
                <div className="flex flex-wrap gap-3 lg:col-span-3">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-emerald-600 px-6 text-sm font-black text-white shadow-sm shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm(customerProfileToForm(profile));
                      setEditMode(false);
                      setProfileError("");
                      setProfileMessage("");
                    }}
                    className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-emerald-100 bg-white px-6 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}