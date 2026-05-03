// app/customer/dashboard/page.tsx
"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  HeartHandshake,
  MessageCircle,
  PawPrint,
  Receipt,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";

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

type Pet = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  age: string | null;
  weight: string | null;
  temperament: string | null;
  medications: string | null;
  notes: string | null;
  photo_url: string | null;
  video_url: string | null;
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

type Booking = {
  id: string;
  status: string;
  payment_status: string;
  payout_status: string | null;
  start_time: string;
  booking_date: string | null;
  requested_date: string | null;
  service_type: string | null;
  service_key: string | null;
  pet_name: string | null;
  guru_name: string | null;
  guru_id: string | null;
  guru_avatar_url: string | null;
  pet_id: string | null;
  notes: string | null;
  time_window: string | null;
  visit_length: string | null;
  care_city: string | null;
  care_state: string | null;
  care_zip_code: string | null;
  subtotal_amount: number;
  marketplace_fee_percent: number;
  marketplace_fee_amount: number;
  tip_amount: number;
  guru_payout_amount: number;
  total_customer_paid: number;
  stripe_session_id: string | null;
  created_at: string | null;
};

type RawBookingRow = {
  id?: string | number | null;
  customer_id?: string | number | null;
  pet_owner_id?: string | number | null;
  user_id?: string | number | null;
  customer_email?: string | null;
  email?: string | null;
  status?: string | null;
  payment_status?: string | null;
  payout_status?: string | null;
  start_time?: string | null;
  booking_date?: string | null;
  requested_date?: string | null;
  date?: string | null;
  service_type?: string | null;
  service_key?: string | null;
  pet_name?: string | null;
  guru_name?: string | null;
  sitter_name?: string | null;
  provider_name?: string | null;
  guru_id?: string | number | null;
  guru_avatar_url?: string | null;
  guru_photo_url?: string | null;
  sitter_avatar_url?: string | null;
  sitter_photo_url?: string | null;
  provider_avatar_url?: string | null;
  provider_photo_url?: string | null;
  pet_id?: string | number | null;
  notes?: string | null;
  time_window?: string | null;
  visit_length?: string | null;
  care_city?: string | null;
  care_state?: string | null;
  care_zip_code?: string | null;
  subtotal_amount?: number | string | null;
  service_price?: number | string | null;
  total_amount?: number | string | null;
  marketplace_fee_percent?: number | string | null;
  marketplace_fee_amount?: number | string | null;
  sitguru_fee_amount?: number | string | null;
  tip_amount?: number | string | null;
  guru_tip_amount?: number | string | null;
  guru_payout_amount?: number | string | null;
  guru_estimated_total_payout?: number | string | null;
  total_customer_paid?: number | string | null;
  customer_total_amount?: number | string | null;
  amount_total?: number | string | null;
  stripe_session_id?: string | null;
  stripe_checkout_session_id?: string | null;
  created_at?: string | null;
};

type RawPetRow = {
  id?: string | number | null;
  name?: string | null;
  species?: string | null;
  breed?: string | null;
  age?: string | null;
  weight?: string | null;
  temperament?: string | null;
  medications?: string | null;
  notes?: string | null;
  photo_url?: string | null;
  video_url?: string | null;
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

type PetMediaKind = "photo" | "video";

type UploadingPetMedia = {
  petId: string;
  kind: PetMediaKind;
};

type ConfettiPiece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotate: number;
  color: string;
};

const initialPetForm = {
  name: "",
  species: "",
  breed: "",
  age: "",
  weight: "",
  temperament: "",
  medications: "",
  notes: "",
  photo_url: "",
  video_url: "",
};

const initialProfileForm: CustomerProfileForm = {
  full_name: "",
  phone: "",
  service_address: "",
  emergency_contact: "",
  care_preferences: "",
};

const routes = {
  home: "/",
  dashboard: "/customer/dashboard",
  findGuru: "/search",
  bookGuru: "/bookings/new",
  bookings: "/customer/dashboard/bookings",
  allBookings: "/customer/dashboard/bookings",
  messages: "/customer/dashboard/messages",
  adminMessages: "/customer/dashboard/messages?support=admin",
  pets: "/customer/dashboard/pets",
  profile: "/customer/dashboard/profile",
  pawPerks: "/customer/dashboard/pawperks",
  search: "/search",
  login: "/login",
};

const CUSTOMER_PROFILE_PHOTO_SRC = "/images/customer-profile-photo.jpg";
const PAWPERKS_PREVIEW_DOG_SRC =
  "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80";
const PAWPERKS_PREVIEW_CAT_SRC =
  "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=900&q=80";

const PROFILE_PHOTO_BUCKETS = ["profile-photos", "avatars"];
const PET_PHOTO_BUCKETS = ["pet-photos", "pets"];
const PET_VIDEO_BUCKETS = ["pet-videos", "pets"];
const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024;
const MAX_PET_PHOTO_SIZE = 8 * 1024 * 1024;
const MAX_PET_VIDEO_SIZE = 75 * 1024 * 1024;

const confettiColors = [
  "#10b981",
  "#34d399",
  "#38bdf8",
  "#facc15",
  "#fb7185",
  "#a78bfa",
];

function createConfettiPieces() {
  return Array.from({ length: 90 }, (_, index) => ({
    id: index,
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 2.8 + Math.random() * 2.2,
    size: 7 + Math.random() * 9,
    rotate: Math.random() * 360,
    color: confettiColors[index % confettiColors.length],
  }));
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function parseMoneyFromText(source: string | null | undefined, patterns: RegExp[]) {
  if (!source) return 0;

  for (const pattern of patterns) {
    const match = source.match(pattern);
    const rawValue = match?.[1]?.replace(/,/g, "");

    if (rawValue) {
      const parsed = Number(rawValue);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return 0;
}

function readBookingMoney(row: RawBookingRow, keys: Array<keyof RawBookingRow>, fallback = 0) {
  for (const key of keys) {
    const parsed = readNumber(row[key], Number.NaN);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return fallback;
}

function getBestBookingTip(row: RawBookingRow) {
  const directTip = readBookingMoney(row, ["tip_amount", "guru_tip_amount"], 0);
  if (directTip > 0) return directTip;

  return parseMoneyFromText(row.notes, [
    /guru\s+tip\s+selected[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /tip\s+selected[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /tip\s+amount[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);
}

function getBestBookingFee(row: RawBookingRow) {
  const directFee = readBookingMoney(row, ["marketplace_fee_amount", "sitguru_fee_amount"], 0);
  if (directFee > 0) return directFee;

  return parseMoneyFromText(row.notes, [
    /marketplace\s+fee\s+amount[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /sitguru\s+marketplace\s+fee\s+amount[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);
}

function getBestBookingPayout(row: RawBookingRow) {
  const directPayout = readBookingMoney(
    row,
    ["guru_payout_amount", "guru_estimated_total_payout"],
    0,
  );

  if (directPayout > 0) return directPayout;

  return parseMoneyFromText(row.notes, [
    /estimated\s+guru\s+payout[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);
}

function getBestCustomerTotal(row: RawBookingRow) {
  const directTotal = readBookingMoney(
    row,
    [
      "total_customer_paid",
      "customer_total_amount",
      "amount_total",
      "total_amount",
      "service_price",
      "subtotal_amount",
    ],
    0,
  );

  if (directTotal > 0) return directTotal;

  const servicePrice = parseMoneyFromText(row.notes, [
    /service(?:\s+price|\s+amount)?[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /subtotal[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);
  const fee = getBestBookingFee(row);
  const tip = getBestBookingTip(row);
  const payout = getBestBookingPayout(row);

  if (servicePrice > 0 || fee > 0 || tip > 0) {
    return servicePrice + fee + tip;
  }

  if (payout > 0 || fee > 0) {
    return payout + fee;
  }

  return 0;
}

function readMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[],
) {
  for (const key of keys) {
    const value = readString(metadata?.[key]);
    if (value) return value;
  }

  return null;
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMoney(value: number, cents = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents ? 2 : 0,
  }).format(value || 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date pending";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date pending";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "No upcoming booking";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date pending";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(value: string | null | undefined) {
  if (!value) return "Flexible";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Flexible";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (["pending", "requested", "checkout_started", "unpaid"].includes(normalized)) {
    return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
  }

  if (["confirmed", "paid", "completed", "succeeded"].includes(normalized)) {
    return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
  }

  if (["in_progress", "processing"].includes(normalized)) {
    return "bg-sky-50 text-sky-800 ring-1 ring-sky-200";
  }

  if (["cancelled", "canceled", "failed", "refunded"].includes(normalized)) {
    return "bg-rose-50 text-rose-800 ring-1 ring-rose-200";
  }

  return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
}

function getBookingDisplayDate(booking: Booking) {
  return booking.start_time || booking.booking_date || booking.requested_date || booking.created_at;
}

function isUpcomingBooking(booking: Booking) {
  const rawDate = getBookingDisplayDate(booking);
  if (!rawDate) return false;

  const date = new Date(rawDate).getTime();

  if (!Number.isFinite(date)) return false;

  const status = booking.status.toLowerCase();
  const payment = booking.payment_status.toLowerCase();

  return (
    date >= Date.now() - 24 * 60 * 60 * 1000 &&
    !["cancelled", "canceled", "completed"].includes(status) &&
    !["refunded", "failed"].includes(payment)
  );
}

function getBookingDetailHref(bookingId: string) {
  return `/customer/dashboard/bookings/${encodeURIComponent(bookingId)}`;
}

function getBookingLocation(booking: Booking) {
  return [booking.care_city, booking.care_state, booking.care_zip_code]
    .filter(Boolean)
    .join(", ");
}

function findPetForBooking(booking: Booking, pets: Pet[]) {
  const bookingPetId = booking.pet_id?.trim();
  const bookingPetName = booking.pet_name?.trim().toLowerCase();

  return (
    pets.find((pet) => (bookingPetId ? pet.id === bookingPetId : false)) ||
    pets.find((pet) => (bookingPetName ? pet.name.trim().toLowerCase() === bookingPetName : false)) ||
    (pets.length === 1 ? pets[0] : null)
  );
}

function getBookingCareSummary(booking: Booking) {
  const service = booking.service_type || "Pet care";
  const petName = booking.pet_name || "your pet";
  const guruName = booking.guru_name?.trim();

  if (guruName) {
    return `${service} with ${guruName} for ${petName}`;
  }

  return `${service} arranged for ${petName}`;
}

function getBookingNextStep(booking: Booking) {
  const status = booking.status.toLowerCase();
  const payment = booking.payment_status.toLowerCase();

  if (["pending", "requested"].includes(status)) {
    return "Your request is in review. We’ll keep your care plan and updates easy to follow here.";
  }

  if (["checkout_started", "unpaid"].includes(payment)) {
    return "Your booking is saved and ready for final care coordination.";
  }

  if (["confirmed", "paid", "succeeded"].includes(payment) || ["confirmed"].includes(status)) {
    return "You’re all set. Review your timing, pet details, and support options anytime.";
  }

  if (["completed"].includes(status)) {
    return "This visit is complete. Rebook or revisit the care summary whenever you need it.";
  }

  return "Everything for this booking is organized in one place for easy, stress-free care.";
}

function buildCustomerProfile(
  row: RawProfileRow | null,
  user: SupabaseUserLike,
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
      readMetadataString(metadata, ["service_address", "address", "home_address"]) ||
      null,
    emergency_contact:
      readString(row?.emergency_contact) ||
      readString(row?.emergency_contact_name) ||
      readMetadataString(metadata, ["emergency_contact", "emergency_contact_name"]) ||
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

function customerProfileToForm(profile: CustomerProfile | null): CustomerProfileForm {
  return {
    full_name: profile?.full_name || profile?.first_name || "",
    phone: profile?.phone || "",
    service_address: profile?.service_address || "",
    emergency_contact: profile?.emergency_contact || "",
    care_preferences: profile?.care_preferences || "",
  };
}

function getSafeFirstName(profile: CustomerProfile | null, email?: string | null) {
  if (profile?.first_name?.trim()) return profile.first_name.trim();
  if (profile?.full_name?.trim()) return profile.full_name.trim().split(" ")[0] || "there";

  if (email?.trim()) {
    const emailPrefix = email.trim().split("@")[0];
    if (emailPrefix) return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }

  return "there";
}

function getCustomerInitials(profile: CustomerProfile | null) {
  const name = profile?.full_name || profile?.first_name || profile?.email || "Customer";
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);

  const firstInitial = parts[0]?.charAt(0) || "C";
  const secondInitial = parts[1]?.charAt(0) || "U";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

function getDisplayValue(value: string | null | undefined) {
  return value?.trim() || "Not added yet";
}

function normalizeBookingRow(row: RawBookingRow): Booking {
  const subtotal = readNumber(row.subtotal_amount ?? row.service_price ?? row.total_amount, 0);
  const marketplaceFee = getBestBookingFee(row);
  const tip = getBestBookingTip(row);
  const customerTotal = getBestCustomerTotal(row);
  const guruPayout = getBestBookingPayout(row) || Math.max(0, customerTotal - marketplaceFee);

  return {
    id: String(row.id ?? crypto.randomUUID()),
    status: row.status?.trim() || "pending",
    payment_status: row.payment_status?.trim() || "unpaid",
    payout_status: row.payout_status?.trim() || null,
    start_time:
      row.start_time?.trim() ||
      row.booking_date?.trim() ||
      row.requested_date?.trim() ||
      row.date?.trim() ||
      row.created_at?.trim() ||
      new Date(0).toISOString(),
    booking_date: row.booking_date ?? null,
    requested_date: row.requested_date ?? row.date ?? null,
    service_type: row.service_type ?? "Pet Care",
    service_key: row.service_key ?? null,
    pet_name: row.pet_name ?? "Pet",
    guru_name: row.guru_name ?? row.sitter_name ?? row.provider_name ?? null,
    guru_id: row.guru_id ? String(row.guru_id) : null,
    guru_avatar_url:
      row.guru_avatar_url ??
      row.guru_photo_url ??
      row.sitter_avatar_url ??
      row.sitter_photo_url ??
      row.provider_avatar_url ??
      row.provider_photo_url ??
      null,
    pet_id: row.pet_id ? String(row.pet_id) : null,
    notes: row.notes ?? null,
    time_window: row.time_window ?? null,
    visit_length: row.visit_length ?? null,
    care_city: row.care_city ?? null,
    care_state: row.care_state ?? null,
    care_zip_code: row.care_zip_code ?? null,
    subtotal_amount: subtotal,
    marketplace_fee_percent: readNumber(row.marketplace_fee_percent, 15),
    marketplace_fee_amount: marketplaceFee,
    tip_amount: tip,
    guru_payout_amount: guruPayout,
    total_customer_paid: customerTotal || subtotal + tip,
    stripe_session_id: row.stripe_session_id ?? row.stripe_checkout_session_id ?? null,
    created_at: row.created_at ?? null,
  };
}

function normalizePetRow(row: RawPetRow): Pet {
  return {
    id: String(row.id ?? crypto.randomUUID()),
    name: row.name?.trim() || "Pet",
    species: row.species ?? null,
    breed: row.breed ?? null,
    age: row.age ?? null,
    weight: row.weight ?? null,
    temperament: row.temperament ?? null,
    medications: row.medications ?? null,
    notes: row.notes ?? null,
    photo_url: row.photo_url ?? null,
    video_url: row.video_url ?? null,
  };
}

function normalizeReferralProfileRow(row: RawReferralProfileRow): ReferralProfile {
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
  return `https://sitguru.com/signup?ref=${encodeURIComponent(referralCode)}&type=customer`;
}

function buildGuruReferralLink(referralCode: string) {
  return `https://sitguru.com/become-a-guru?ref=${encodeURIComponent(referralCode)}&type=guru`;
}

function buildPetMessageHref(pet: Pet) {
  const intro = `Hi! I would like to talk about care for ${pet.name}.`;
  return `/messages?pet=${encodeURIComponent(pet.id)}&petName=${encodeURIComponent(
    pet.name,
  )}&message=${encodeURIComponent(intro)}`;
}

function buildPetAdminHref(pet: Pet) {
  return `/messages/admin?pet=${encodeURIComponent(pet.id)}&petName=${encodeURIComponent(
    pet.name,
  )}`;
}

function buildPetBookingHref(pet: Pet) {
  return `/search?pet=${encodeURIComponent(pet.id)}&petName=${encodeURIComponent(pet.name)}`;
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

  const saveAttempts: Array<{
    label: "full" | "contact" | "basic";
    payload: Record<string, string | null>;
  }> = [
    {
      label: "full",
      payload: {
        id: userId,
        full_name: fullName || null,
        first_name: firstName,
        phone: form.phone.trim() || null,
        service_address: form.service_address.trim() || null,
        emergency_contact: form.emergency_contact.trim() || null,
        care_preferences: form.care_preferences.trim() || null,
      },
    },
    {
      label: "full",
      payload: {
        id: userId,
        full_name: fullName || null,
        first_name: firstName,
        phone: form.phone.trim() || null,
        address: form.service_address.trim() || null,
        emergency_contact: form.emergency_contact.trim() || null,
        care_preferences: form.care_preferences.trim() || null,
      },
    },
    {
      label: "contact",
      payload: {
        id: userId,
        full_name: fullName || null,
        first_name: firstName,
        phone: form.phone.trim() || null,
        service_address: form.service_address.trim() || null,
      },
    },
    {
      label: "contact",
      payload: {
        id: userId,
        full_name: fullName || null,
        first_name: firstName,
        phone: form.phone.trim() || null,
        address: form.service_address.trim() || null,
      },
    },
    {
      label: "basic",
      payload: {
        id: userId,
        full_name: fullName || null,
        first_name: firstName,
      },
    },
  ];

  let lastError = "We could not save your profile right now.";

  for (const attempt of saveAttempts) {
    const { error } = await supabase
      .from("profiles")
      .upsert(attempt.payload, { onConflict: "id" });

    if (!error) return attempt.label;

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

  if (file.size > MAX_PROFILE_PHOTO_SIZE) {
    throw new Error("Please upload a profile picture under 5MB.");
  }

  const extension = getProfilePhotoExtension(file);
  const filePath = `${userId}/customer-avatar-${Date.now()}.${extension}`;
  let lastError = "We could not upload your profile picture right now.";

  for (const bucket of PROFILE_PHOTO_BUCKETS) {
    const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

      if (data.publicUrl) return data.publicUrl;
    }

    lastError =
      error?.message || `We could not upload your profile picture to the ${bucket} bucket.`;
  }

  throw new Error(
    `${lastError} Make sure Supabase Storage has a public bucket named profile-photos or avatars.`,
  );
}

async function saveCustomerProfilePhotoUrl(userId: string, avatarUrl: string) {
  const saveAttempts = [
    { id: userId, avatar_url: avatarUrl },
    { id: userId, profile_photo_url: avatarUrl },
    { id: userId, photo_url: avatarUrl },
  ];

  let lastError = "The photo uploaded, but we could not connect it to your profile.";

  for (const payload of saveAttempts) {
    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (!error) return;

    lastError = error.message || lastError;
  }

  throw new Error(lastError);
}

function getPetMediaExtension(file: File, kind: PetMediaKind) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (kind === "photo") {
    if (file.type === "image/png") return "png";
    if (file.type === "image/jpeg") return "jpg";
    return extension === "png" ? "png" : "jpg";
  }

  if (file.type === "video/quicktime") return "mov";
  if (file.type === "video/webm") return "webm";

  return extension && ["mp4", "mov", "webm"].includes(extension) ? extension : "mp4";
}

function validatePetMediaFile(file: File, kind: PetMediaKind) {
  if (kind === "photo") {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      throw new Error("Please upload a JPG or PNG pet photo.");
    }

    if (file.size > MAX_PET_PHOTO_SIZE) {
      throw new Error("Please upload a pet photo under 8MB.");
    }

    return;
  }

  if (!["video/mp4", "video/quicktime", "video/webm"].includes(file.type)) {
    throw new Error("Please upload an MP4, MOV, or WEBM pet video.");
  }

  if (file.size > MAX_PET_VIDEO_SIZE) {
    throw new Error("Please upload a pet video under 75MB.");
  }
}

async function uploadPetMedia(
  userId: string,
  petId: string,
  file: File,
  kind: PetMediaKind,
) {
  validatePetMediaFile(file, kind);

  const extension = getPetMediaExtension(file, kind);
  const safePetId = petId.replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = `${userId}/${safePetId}/${kind}-${Date.now()}.${extension}`;
  const buckets = kind === "photo" ? PET_PHOTO_BUCKETS : PET_VIDEO_BUCKETS;
  let lastError = `We could not upload your pet ${kind} right now.`;

  for (const bucket of buckets) {
    const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

      if (data.publicUrl) return data.publicUrl;
    }

    lastError = error?.message || `We could not upload to the ${bucket} bucket.`;
  }

  throw new Error(
    `${lastError} Make sure Supabase Storage has public buckets named pet-photos and pet-videos.`,
  );
}

async function savePetMediaUrl(petId: string, kind: PetMediaKind, publicUrl: string) {
  const payload = kind === "photo" ? { photo_url: publicUrl } : { video_url: publicUrl };

  const { error } = await supabase.from("pets").update(payload).eq("id", petId);

  if (error) {
    throw new Error(
      error.message ||
        `The ${kind} uploaded, but we could not connect it to the pet profile.`,
    );
  }
}

async function fetchBookingsForUser(userId: string, userEmail?: string | null) {
  const richSelect =
    "id,status,payment_status,payout_status,start_time,booking_date,requested_date,service_type,service_key,pet_name,guru_name,sitter_name,provider_name,guru_id,guru_avatar_url,guru_photo_url,sitter_avatar_url,sitter_photo_url,provider_avatar_url,provider_photo_url,pet_id,notes,time_window,visit_length,care_city,care_state,care_zip_code,subtotal_amount,service_price,total_amount,marketplace_fee_percent,marketplace_fee_amount,sitguru_fee_amount,tip_amount,guru_tip_amount,guru_payout_amount,guru_estimated_total_payout,total_customer_paid,customer_total_amount,amount_total,stripe_session_id,stripe_checkout_session_id,created_at";

  const fallbackSelect = "id,status,start_time,booking_date,requested_date,notes,created_at";
  const normalizedEmail = userEmail?.trim().toLowerCase() || null;
  let firstSuccessfulEmptyResult: Booking[] | null = null;

  const idAttempts: Array<{
    matchColumn: string;
    matchValue: string;
    dateColumn: "start_time" | "booking_date" | "requested_date" | "created_at";
    selectColumns: string;
  }> = [
    { matchColumn: "pet_owner_id", matchValue: userId, dateColumn: "start_time", selectColumns: richSelect },
    { matchColumn: "customer_id", matchValue: userId, dateColumn: "start_time", selectColumns: richSelect },
    { matchColumn: "user_id", matchValue: userId, dateColumn: "start_time", selectColumns: richSelect },
    { matchColumn: "pet_owner_id", matchValue: userId, dateColumn: "booking_date", selectColumns: richSelect },
    { matchColumn: "customer_id", matchValue: userId, dateColumn: "booking_date", selectColumns: richSelect },
    { matchColumn: "user_id", matchValue: userId, dateColumn: "booking_date", selectColumns: richSelect },
    { matchColumn: "pet_owner_id", matchValue: userId, dateColumn: "created_at", selectColumns: fallbackSelect },
    { matchColumn: "customer_id", matchValue: userId, dateColumn: "created_at", selectColumns: fallbackSelect },
    { matchColumn: "user_id", matchValue: userId, dateColumn: "created_at", selectColumns: fallbackSelect },
  ];

  const emailAttempts: Array<{
    matchColumn: string;
    matchValue: string;
    dateColumn: "start_time" | "booking_date" | "requested_date" | "created_at";
    selectColumns: string;
  }> = normalizedEmail
    ? [
        { matchColumn: "customer_email", matchValue: normalizedEmail, dateColumn: "start_time", selectColumns: richSelect },
        { matchColumn: "email", matchValue: normalizedEmail, dateColumn: "start_time", selectColumns: richSelect },
        { matchColumn: "customer_email", matchValue: normalizedEmail, dateColumn: "booking_date", selectColumns: richSelect },
        { matchColumn: "email", matchValue: normalizedEmail, dateColumn: "booking_date", selectColumns: richSelect },
        { matchColumn: "customer_email", matchValue: normalizedEmail, dateColumn: "created_at", selectColumns: fallbackSelect },
        { matchColumn: "email", matchValue: normalizedEmail, dateColumn: "created_at", selectColumns: fallbackSelect },
      ]
    : [];

  for (const attempt of [...idAttempts, ...emailAttempts]) {
    const { data, error } = await supabase
      .from("bookings")
      .select(attempt.selectColumns)
      .eq(attempt.matchColumn, attempt.matchValue)
      .order(attempt.dateColumn, { ascending: false })
      .limit(12);

    if (error) continue;

    const normalizedRows = (data as RawBookingRow[] | null)?.map(normalizeBookingRow) || [];

    if (normalizedRows.length > 0) {
      return normalizedRows;
    }

    if (!firstSuccessfulEmptyResult) {
      firstSuccessfulEmptyResult = normalizedRows;
    }
  }

  return firstSuccessfulEmptyResult || [];
}

async function fetchPetsForUser(userId: string) {
  const attempts: Array<{ matchColumn: string; orderByCreatedAt: boolean }> = [
    { matchColumn: "owner_id", orderByCreatedAt: true },
    { matchColumn: "user_id", orderByCreatedAt: true },
    { matchColumn: "owner_id", orderByCreatedAt: false },
    { matchColumn: "user_id", orderByCreatedAt: false },
  ];

  for (const attempt of attempts) {
    let query = supabase
      .from("pets")
      .select(
        "id, name, species, breed, age, weight, temperament, medications, notes, photo_url, video_url",
      )
      .eq(attempt.matchColumn, userId);

    if (attempt.orderByCreatedAt) {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (!error) return (data as RawPetRow[] | null)?.map(normalizePetRow) || [];
  }

  return [] as Pet[];
}

async function getOrCreateReferralProfile(userId: string) {
  const { data, error } = await supabase
    .from("referral_profiles")
    .select(
      "id, user_id, role, referral_code, referral_link, total_invites, completed_referrals, pending_rewards, earned_rewards, paid_rewards, available_credit",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (!error && data) return normalizeReferralProfileRow(data as RawReferralProfileRow);

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
      "id, user_id, role, referral_code, referral_link, total_invites, completed_referrals, pending_rewards, earned_rewards, paid_rewards, available_credit",
    )
    .maybeSingle();

  if (createError || !createdProfile) {
    console.error("Referral profile error:", createError);
    return null;
  }

  return normalizeReferralProfileRow(createdProfile as RawReferralProfileRow);
}

function BookingCard({
  booking,
  featured = false,
  petPhotoUrl = null,
}: {
  booking: Booking;
  featured?: boolean;
  petPhotoUrl?: string | null;
}) {
  const displayDate = getBookingDisplayDate(booking);
  const location = getBookingLocation(booking);
  const totalAmount = booking.total_customer_paid || booking.subtotal_amount;

  return (
    <article
      className={[
        "overflow-hidden rounded-[1.9rem] border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl",
        featured ? "border-emerald-200 ring-4 ring-emerald-50" : "border-slate-200",
      ].join(" ")}
    >
      <div
        className={[
          "relative overflow-hidden p-5 sm:p-6",
          featured
            ? "bg-gradient-to-br from-emerald-50 via-white to-sky-50"
            : "bg-gradient-to-br from-slate-50 via-white to-white",
        ].join(" ")}
      >
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100/60 blur-2xl" />

        <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-800">
                Trusted care
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(booking.status)}`}>
                {formatStatus(booking.status)}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(booking.payment_status)}`}>
                {formatStatus(booking.payment_status)}
              </span>
            </div>

            <div className="mt-4 flex min-w-0 items-start gap-4">
              <div className="relative shrink-0">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.4rem] bg-white text-3xl shadow-sm ring-1 ring-slate-200">
                  {petPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={petPhotoUrl} alt={booking.pet_name || "Pet"} className="h-full w-full object-cover" />
                  ) : (
                    <PawPrint className="h-7 w-7 text-emerald-600" />
                  )}
                </div>

                {booking.guru_avatar_url ? (
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm ring-1 ring-emerald-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={booking.guru_avatar_url} alt={booking.guru_name || "Guru"} className="h-full w-full object-cover" />
                  </div>
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                  {booking.pet_name || "Your pet"}
                </h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  {getBookingCareSummary(booking)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-slate-200">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Date
                </p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-slate-950">
                  <CalendarDays className="h-4 w-4 text-emerald-600" />
                  {formatDate(displayDate)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-slate-200">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Time
                </p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-slate-950">
                  <Clock3 className="h-4 w-4 text-emerald-600" />
                  {booking.time_window || formatTime(displayDate)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-slate-200 md:col-span-2 xl:col-span-1">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Location
                </p>
                <p className="mt-1 text-sm font-black leading-5 text-slate-950 break-words">
                  {location || "Location details ready in booking view"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Total
                </p>
                <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                  {formatMoney(totalAmount, true)}
                </p>
              </div>

              <ShieldCheck className="h-9 w-9 text-emerald-600" />
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {getBookingNextStep(booking)}
            </p>

            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold leading-5 text-emerald-800">
              Need to adjust timing or care notes? Message your Guru or support first so we can help before you cancel.
            </div>

            {booking.tip_amount > 0 ? (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                Includes {formatMoney(booking.tip_amount, true)} tip for your Guru
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t border-slate-100 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href={getBookingDetailHref(booking.id)}
          className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
        >
          View Details
        </Link>

        <Link
          href={routes.messages}
          className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
        >
          Message Guru
        </Link>

        <Link
          href={routes.findGuru}
          className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
        >
          Rebook
        </Link>

        <Link
          href={routes.adminMessages}
          className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
        >
          Get Help
        </Link>
      </div>
    </article>
  );
}

export default function CustomerDashboardPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [referralProfile, setReferralProfile] = useState<ReferralProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("there");
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<CustomerProfileForm>(initialProfileForm);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [showPetForm, setShowPetForm] = useState(false);
  const [savingPet, setSavingPet] = useState(false);
  const [petForm, setPetForm] = useState(initialPetForm);
  const [formError, setFormError] = useState("");
  const [referralMessage, setReferralMessage] = useState("");
  const [showBookingCelebration, setShowBookingCelebration] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [customerPhotoFailed, setCustomerPhotoFailed] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarMessage, setAvatarMessage] = useState("");
  const [uploadingPetMedia, setUploadingPetMedia] = useState<UploadingPetMedia | null>(null);
  const [petMediaError, setPetMediaError] = useState("");
  const [petMediaMessage, setPetMediaMessage] = useState("");

  const customerAvatarSrc =
    customerProfile?.avatar_url?.trim() || CUSTOMER_PROFILE_PHOTO_SRC;

  const showCustomerProfilePhoto = Boolean(customerAvatarSrc) && !customerPhotoFailed;

  const customerReferralLink = useMemo(() => {
    if (!referralProfile?.referral_code) return "https://sitguru.com/signup";
    return buildCustomerReferralLink(referralProfile.referral_code);
  }, [referralProfile]);

  const guruReferralLink = useMemo(() => {
    if (!referralProfile?.referral_code) return "https://sitguru.com/become-a-guru";
    return buildGuruReferralLink(referralProfile.referral_code);
  }, [referralProfile]);

  const profileCompletion = useMemo(() => {
    const fields = [
      customerProfile?.full_name || customerProfile?.first_name,
      customerProfile?.email,
      customerProfile?.phone,
      customerProfile?.service_address,
      customerProfile?.emergency_contact,
      customerProfile?.care_preferences,
    ];

    const completedFields = fields.filter((field) => field?.trim()).length;
    return Math.round((completedFields / fields.length) * 100);
  }, [customerProfile]);

  const loadDashboard = useCallback(async () => {
    setFormError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    const [profileData, bookingsData, petsData, referralData] = await Promise.all([
      fetchCustomerProfile(user),
      fetchBookingsForUser(user.id, user.email),
      fetchPetsForUser(user.id),
      getOrCreateReferralProfile(user.id),
    ]);

    setCustomerProfile(profileData);
    setProfileForm(customerProfileToForm(profileData));
    setFirstName(getSafeFirstName(profileData, user.email));
    setBookings(bookingsData);
    setPets(petsData);
    setReferralProfile(referralData);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        await loadDashboard();
      } finally {
        if (!active) return;
      }
    }

    run();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace(routes.login);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadDashboard, router]);

  useEffect(() => {
    setCustomerPhotoFailed(false);
  }, [customerAvatarSrc]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingStatus = params.get("booking");

    if (bookingStatus !== "confirmed" && bookingStatus !== "created") return;

    const bookingId = params.get("booking_id") || params.get("session_id") || "recent";
    const celebrationKey = `sitguru-booking-celebration-${bookingId}`;

    if (window.sessionStorage.getItem(celebrationKey)) return;

    window.sessionStorage.setItem(celebrationKey, "shown");
    setConfettiPieces(createConfettiPieces());
    setShowBookingCelebration(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    const hideTimer = window.setTimeout(() => {
      setShowBookingCelebration(false);
    }, 6500);

    return () => {
      window.clearTimeout(hideTimer);
    };
  }, []);

  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter(isUpcomingBooking)
        .sort(
          (a, b) =>
            new Date(getBookingDisplayDate(a) || 0).getTime() -
            new Date(getBookingDisplayDate(b) || 0).getTime(),
        ),
    [bookings],
  );

  const recentBookings = useMemo(
    () =>
      bookings
        .slice()
        .sort(
          (a, b) =>
            new Date(getBookingDisplayDate(b) || 0).getTime() -
            new Date(getBookingDisplayDate(a) || 0).getTime(),
        ),
    [bookings],
  );

  const latestBooking = recentBookings[0] || null;

  const stats = useMemo(() => {
    const pending = bookings.filter((booking) =>
      ["pending", "requested"].includes(booking.status.toLowerCase()),
    ).length;

    const confirmed = bookings.filter((booking) =>
      ["confirmed", "paid", "checkout_started"].includes(booking.status.toLowerCase()) ||
      ["paid", "checkout_started"].includes(booking.payment_status.toLowerCase()),
    ).length;

    const totalTips = bookings.reduce((sum, booking) => sum + booking.tip_amount, 0);
    const totalSpent = bookings.reduce(
      (sum, booking) => sum + (booking.total_customer_paid || booking.subtotal_amount || 0),
      0,
    );

    return {
      total: bookings.length,
      upcoming: upcomingBookings.length,
      pending,
      confirmed,
      pets: pets.length,
      totalTips,
      totalSpent,
      nextBooking: upcomingBookings[0],
    };
  }, [bookings, pets, upcomingBookings]);

  const nextBookingLabel = useMemo(() => {
    if (!stats.nextBooking) return "No upcoming booking";
    return formatShortDate(getBookingDisplayDate(stats.nextBooking));
  }, [stats.nextBooking]);

  async function handleCustomerAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
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

      setCustomerProfile(profileWithPhoto);
      setProfileForm(customerProfileToForm(profileWithPhoto));
      setFirstName(getSafeFirstName(profileWithPhoto, user.email));
      setCustomerPhotoFailed(false);
      setAvatarMessage("Profile picture updated.");
    } catch (error) {
      setAvatarError(
        error instanceof Error
          ? error.message
          : "We could not upload your profile picture right now.",
      );
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  }

  async function handlePetMediaUpload(
    event: ChangeEvent<HTMLInputElement>,
    pet: Pet,
    kind: PetMediaKind,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadingPetMedia({ petId: pet.id, kind });
    setPetMediaError("");
    setPetMediaMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    try {
      const publicUrl = await uploadPetMedia(user.id, pet.id, file, kind);
      await savePetMediaUrl(pet.id, kind, publicUrl);

      setPets((currentPets) =>
        currentPets.map((currentPet) =>
          currentPet.id === pet.id
            ? {
                ...currentPet,
                photo_url: kind === "photo" ? publicUrl : currentPet.photo_url,
                video_url: kind === "video" ? publicUrl : currentPet.video_url,
              }
            : currentPet,
        ),
      );

      setPetMediaMessage(
        `${pet.name}'s ${kind === "photo" ? "photo" : "video"} was uploaded.`,
      );
    } catch (error) {
      setPetMediaError(
        error instanceof Error
          ? error.message
          : `We could not upload ${pet.name}'s ${kind} right now.`,
      );
    } finally {
      setUploadingPetMedia(null);
      event.target.value = "";
    }
  }

  async function handleSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    setProfileMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    try {
      const savedLevel = await saveCustomerProfile(user.id, profileForm);
      const refreshedProfile = await fetchCustomerProfile(user);

      setCustomerProfile(refreshedProfile);
      setProfileForm(customerProfileToForm(refreshedProfile));
      setFirstName(getSafeFirstName(refreshedProfile, user.email));
      setShowProfileForm(false);
      setProfileMessage(
        savedLevel === "basic"
          ? "Basic profile saved. Contact and preference fields will appear once your profiles table includes those columns."
          : "Customer profile saved.",
      );
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "We could not save your profile right now.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function copyReferralLink(link: string, label: string) {
    setReferralMessage("");

    try {
      await navigator.clipboard.writeText(link);
      setReferralMessage(`${label} copied. Share it with your community.`);
    } catch {
      setReferralMessage("We could not copy the link. Please copy it manually.");
    }
  }

  async function handleAddPet(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingPet(true);
    setFormError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    if (!petForm.name.trim()) {
      setFormError("Pet name is required.");
      setSavingPet(false);
      return;
    }

    const ownerPayload = {
      owner_id: user.id,
      name: petForm.name.trim(),
      species: petForm.species.trim() || null,
      breed: petForm.breed.trim() || null,
      age: petForm.age.trim() || null,
      weight: petForm.weight.trim() || null,
      temperament: petForm.temperament.trim() || null,
      medications: petForm.medications.trim() || null,
      notes: petForm.notes.trim() || null,
      photo_url: petForm.photo_url.trim() || null,
      video_url: petForm.video_url.trim() || null,
    };

    const { error: ownerError } = await supabase.from("pets").insert(ownerPayload);

    if (ownerError) {
      const userPayload = {
        user_id: user.id,
        name: petForm.name.trim(),
        species: petForm.species.trim() || null,
        breed: petForm.breed.trim() || null,
        age: petForm.age.trim() || null,
        weight: petForm.weight.trim() || null,
        temperament: petForm.temperament.trim() || null,
        medications: petForm.medications.trim() || null,
        notes: petForm.notes.trim() || null,
        photo_url: petForm.photo_url.trim() || null,
        video_url: petForm.video_url.trim() || null,
      };

      const { error: userIdError } = await supabase.from("pets").insert(userPayload);

      if (userIdError) {
        setFormError(userIdError.message || "We could not save your pet profile.");
        setSavingPet(false);
        return;
      }
    }

    setPetForm(initialPetForm);
    setShowPetForm(false);
    await loadDashboard();
    setSavingPet(false);
  }

  const customerDisplayName = useMemo(() => {
    return customerProfile?.full_name?.trim() || customerProfile?.first_name?.trim() || firstName;
  }, [customerProfile, firstName]);

  const customerInitials = useMemo(
    () => getCustomerInitials(customerProfile),
    [customerProfile],
  );

  if (loading) {
    return (
      <main
        className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_45%,#ecfdf5_100%)] px-4 py-10 font-light md:px-6 lg:px-8"
        style={{
          fontFamily:
            '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontWeight: 300,
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-center">
          <div className="rounded-[2rem] border border-emerald-100 bg-white px-8 py-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl ring-1 ring-emerald-100">
              🐾
            </div>
            <p className="text-base font-semibold text-slate-700">
              Loading your customer dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      {showBookingCelebration ? (
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
          <style>{`
            @keyframes sitguru-confetti-fall {
              0% { transform: translate3d(0, -20vh, 0) rotate(0deg); opacity: 1; }
              70% { opacity: 1; }
              100% { transform: translate3d(0, 110vh, 0) rotate(720deg); opacity: 0; }
            }
            @keyframes sitguru-success-pop {
              0% { transform: translateY(-18px) scale(0.96); opacity: 0; }
              100% { transform: translateY(0) scale(1); opacity: 1; }
            }
          `}</style>

          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="absolute top-0 rounded-sm"
              style={{
                left: `${piece.left}%`,
                width: `${piece.size}px`,
                height: `${piece.size * 1.5}px`,
                backgroundColor: piece.color,
                transform: `rotate(${piece.rotate}deg)`,
                animation: `sitguru-confetti-fall ${piece.duration}s linear ${piece.delay}s forwards`,
              }}
            />
          ))}

          <div className="absolute left-1/2 top-6 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-[2rem] border border-emerald-200 bg-white/95 p-5 text-center shadow-2xl backdrop-blur">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-3xl shadow-lg"
              style={{ animation: "sitguru-success-pop 0.35s ease-out forwards" }}
            >
              🎉
            </div>
            <p className="mt-3 text-xl font-black tracking-tight text-slate-950">
              Booking confirmed!
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              Your booking is now organized in your SitGuru dashboard.
            </p>
          </div>
        </div>
      ) : null}

      <main
        className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_40%,#ecfdf5_100%)] font-light text-slate-950"
        style={{
          fontFamily:
            '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontWeight: 300,
        }}
      >
        <Header />

        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
          <section
            id="care-start"
            className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
          >
            <div className="grid gap-8 bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#00d69f_0%,#66e3c7_48%,#b8e5ff_100%)] px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-900/80 md:text-sm">
                  SitGuru Customer Dashboard
                </p>

                <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-[-0.045em] text-slate-950 md:text-6xl lg:text-7xl">
                  Welcome back, {firstName} <span aria-hidden="true">👋</span>
                </h1>

                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-900/75 md:text-xl">
                  Manage your pets, book Gurus, review messages, and keep your care details organized in one simple place.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-extrabold text-emerald-800 shadow-sm ring-1 ring-white/70">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-sm">
                      🐾
                    </span>
                    Pet Parent
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-extrabold text-slate-800 shadow-sm ring-1 ring-white/70">
                    <span className="text-amber-400">★ ★ ★</span>
                    {profileCompletion}% profile ready
                  </span>

                  {latestBooking ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-extrabold text-slate-800 shadow-sm ring-1 ring-white/70">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Last booking: {formatStatus(latestBooking.status)}
                    </span>
                  ) : null}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href={routes.findGuru}
                    className="inline-flex min-h-[52px] min-w-[150px] items-center justify-center rounded-full bg-emerald-600 px-7 py-3 text-base font-black text-white shadow-sm shadow-emerald-900/10 ring-1 ring-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg"
                  >
                    Find a Guru
                  </Link>

                  <Link
                    href={routes.bookGuru}
                    className="inline-flex min-h-[52px] min-w-[150px] items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3 text-base font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-lg"
                  >
                    Book a Guru
                  </Link>

                  <Link
                    href={routes.messages}
                    className="inline-flex min-h-[52px] min-w-[150px] items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3 text-base font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-lg"
                  >
                    Messages
                  </Link>

                  <Link
                    href={routes.pets}
                    className="inline-flex min-h-[52px] min-w-[150px] items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3 text-base font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-lg"
                  >
                    My Pets
                  </Link>

                  <Link
                    href={routes.profile}
                    className="inline-flex min-h-[52px] min-w-[150px] items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3 text-base font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-lg"
                  >
                    My Profile
                  </Link>
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-white/30 blur-xl" />
                  <div className="relative flex h-44 w-44 items-center justify-center overflow-hidden rounded-full border-[8px] border-white bg-gradient-to-br from-emerald-50 to-white text-5xl font-extrabold text-emerald-700 shadow-2xl md:h-56 md:w-56">
                    {showCustomerProfilePhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={customerAvatarSrc}
                        alt={`${customerDisplayName} profile photo`}
                        onError={() => setCustomerPhotoFailed(true)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      customerInitials
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-2xl shadow-lg">
                    🐾
                  </div>
                </div>

                <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
                  {customerDisplayName}
                </h2>
                <p className="mt-2 text-lg font-semibold text-slate-700">
                  SitGuru Pet Parent
                </p>
                <p className="mt-1 max-w-xs text-sm font-semibold leading-6 text-slate-600">
                  {pets.length > 0
                    ? `${pets.length} pet profile${pets.length === 1 ? "" : "s"} ready for care`
                    : "Add your first pet profile to get started"}
                </p>

                <label className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white/90 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-sm ring-1 ring-white/80 transition hover:-translate-y-0.5 hover:bg-white">
                  <Upload className="h-4 w-4" />
                  {uploadingAvatar ? "Uploading..." : "Upload profile photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    disabled={uploadingAvatar}
                    onChange={handleCustomerAvatarUpload}
                    className="sr-only"
                  />
                </label>

                {avatarMessage ? (
                  <p className="mt-3 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100">
                    {avatarMessage}
                  </p>
                ) : null}

                {avatarError ? (
                  <p className="mt-3 max-w-sm rounded-2xl bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700 ring-1 ring-red-100">
                    {avatarError}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 bg-white px-6 py-6 md:grid-cols-2 lg:grid-cols-5 md:px-8">
              {[
                {
                  label: "Upcoming Booking",
                  value: nextBookingLabel,
                  helper: stats.nextBooking ? "View details" : "Book care",
                  href: stats.nextBooking ? getBookingDetailHref(stats.nextBooking.id) : routes.findGuru,
                  icon: <CalendarDays className="h-5 w-5" />,
                },
                {
                  label: "My Pets",
                  value: `${stats.pets} ${stats.pets === 1 ? "Pet" : "Pets"}`,
                  helper: "Manage pets",
                  href: routes.pets,
                  icon: <PawPrint className="h-5 w-5" />,
                },
                {
                  label: "Total Bookings",
                  value: String(stats.total),
                  helper: "View history",
                  href: routes.allBookings,
                  icon: <ShieldCheck className="h-5 w-5" />,
                },
                {
                  label: "Tips Given",
                  value: formatMoney(stats.totalTips),
                  helper: "Guru appreciation",
                  href: routes.allBookings,
                  icon: <HeartHandshake className="h-5 w-5" />,
                },
                {
                  label: "SitGuru Credit",
                  value: formatMoney(referralProfile?.available_credit ?? 0),
                  helper: "Open PawPerks",
                  href: routes.pawPerks,
                  icon: <Star className="h-5 w-5" />,
                },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                      <p className="mt-2 truncate text-2xl font-extrabold text-slate-950">
                        {item.value}
                      </p>
                      <p className="mt-3 text-sm font-bold text-emerald-700">
                        {item.helper} <span aria-hidden="true">→</span>
                      </p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 transition group-hover:scale-105">
                      {item.icon}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[2rem] border border-emerald-200 bg-white shadow-sm">
                <div className="bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_54%,#dff7ef_100%)] p-6">
                  <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
                        PawPerks Rewards
                      </p>
                      <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                        Grow SitGuru with PawPerks.
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        Invite Pet Parents and Gurus, earn rewards, and help SitGuru expand trusted pet care in more communities.
                      </p>
                    </div>

                    <div className="relative hidden min-h-[180px] lg:block">
                      <div className="absolute inset-x-6 bottom-0 h-24 rounded-full bg-emerald-100/70 blur-2xl" />
                      <div className="relative flex items-end justify-center gap-4">
                        <div className="h-40 w-32 overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={PAWPERKS_PREVIEW_DOG_SRC}
                            alt="Golden retriever for PawPerks preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="mb-2 h-32 w-28 overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={PAWPERKS_PREVIEW_CAT_SRC}
                            alt="Tabby cat for PawPerks preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-100">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                        Available credit
                      </p>
                      <p className="mt-2 text-2xl font-black text-slate-950">
                        {formatMoney(referralProfile?.available_credit ?? 0)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-amber-100">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                        Pending rewards
                      </p>
                      <p className="mt-2 text-2xl font-black text-slate-950">
                        {formatMoney(referralProfile?.pending_rewards ?? 0)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sky-100">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
                        Completed
                      </p>
                      <p className="mt-2 text-2xl font-black text-slate-950">
                        {referralProfile?.completed_referrals ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={routes.pawPerks}
                      className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      Open PawPerks
                    </Link>

                    <button
                      type="button"
                      onClick={() => copyReferralLink(customerReferralLink, "Customer referral link")}
                      className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
                    >
                      Copy Customer Invite
                    </button>

                    <button
                      type="button"
                      onClick={() => copyReferralLink(guruReferralLink, "Guru invite link")}
                      className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
                    >
                      Copy Guru Invite
                    </button>
                  </div>

                  {referralMessage ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-800">
                      {referralMessage}
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                id="customer-profile"
                className="rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
                      Customer profile
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                      Your care account details
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Keep household notes, emergency contacts, and preferences ready for your Guru.
                    </p>
                  </div>

                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-xl font-black text-emerald-700 shadow-sm ring-4 ring-emerald-100">
                    {showCustomerProfilePhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={customerAvatarSrc}
                        alt={`${customerDisplayName} profile photo`}
                        onError={() => setCustomerPhotoFailed(true)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getCustomerInitials(customerProfile)
                    )}
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] bg-emerald-50 p-4 ring-1 ring-emerald-100">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">Profile completion</p>
                    <p className="text-sm font-black text-emerald-700">{profileCompletion}%</p>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white ring-1 ring-emerald-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                </div>

                {profileMessage ? (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                    {profileMessage}
                  </div>
                ) : null}

                {profileError ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {profileError}
                  </div>
                ) : null}

                <div className="mt-5 grid gap-3">
                  {[
                    ["Name", getDisplayValue(customerProfile?.full_name || customerProfile?.first_name)],
                    ["Email", getDisplayValue(customerProfile?.email)],
                    ["Phone", getDisplayValue(customerProfile?.phone)],
                    ["Service address", getDisplayValue(customerProfile?.service_address)],
                    ["Emergency contact", getDisplayValue(customerProfile?.emergency_contact)],
                    ["Care preferences", getDisplayValue(customerProfile?.care_preferences)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        {label}
                      </p>
                      <p className="mt-1 break-words text-sm font-black leading-6 text-slate-950">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileError("");
                      setProfileMessage("");
                      setProfileForm(customerProfileToForm(customerProfile));
                      setShowProfileForm((value) => !value);
                    }}
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                  >
                    {showProfileForm ? "Close profile form" : "Edit Profile"}
                  </button>

                  <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100">
                    {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      disabled={uploadingAvatar}
                      onChange={handleCustomerAvatarUpload}
                      className="sr-only"
                    />
                  </label>

                  <Link
                    href={routes.adminMessages}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Ask Admin for help
                  </Link>
                </div>

                {showProfileForm ? (
                  <form onSubmit={handleSaveProfile} className="mt-5 grid gap-3">
                    <input
                      type="text"
                      placeholder="Full name"
                      value={profileForm.full_name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, full_name: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    />

                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, phone: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    />

                    <input
                      type="text"
                      placeholder="Home or service address"
                      value={profileForm.service_address}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, service_address: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    />

                    <input
                      type="text"
                      placeholder="Emergency contact"
                      value={profileForm.emergency_contact}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, emergency_contact: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    />

                    <textarea
                      placeholder="Care preferences, home access notes, or communication preferences"
                      rows={4}
                      value={profileForm.care_preferences}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, care_preferences: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    />

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {savingProfile ? "Saving profile..." : "Save customer profile"}
                    </button>
                  </form>
                ) : null}
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Communication center
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                  Clear next steps for you and your pets
                </h2>

                <div className="mt-5 grid gap-3">
                  <Link
                    href={routes.messages}
                    className="rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Open messages
                  </Link>

                  <Link
                    href={routes.pets}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
                  >
                    Manage Pet Care Passports
                  </Link>

                  <Link
                    href={routes.adminMessages}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Message Admin support
                  </Link>

                  <Link
                    href={routes.findGuru}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Find a Guru for your pets
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <section
                id="upcoming-care"
                className="rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-600">
                      Upcoming care
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                      Your next booking, clearly organized
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      View details, message your Guru, rebook, or get help without being sent back to search.
                    </p>
                  </div>

                  <Link
                    href={routes.findGuru}
                    className="inline-flex items-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                  >
                    Book more care
                  </Link>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">A calmer customer experience, built for trust</p>
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                        Plans can change. If timing, notes, or details need an adjustment, message your Guru or support first and we’ll help keep your care on track.
                      </p>

                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2">
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">Confidence</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">Care details stay organized.</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2">
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">Support</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">Message before canceling.</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2">
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">Updates</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">Review every next step.</p>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={routes.adminMessages}
                      className="inline-flex min-h-[42px] shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      Need help first?
                    </Link>
                  </div>
                </div>

                {upcomingBookings.length === 0 ? (
                  <div className="mt-6 rounded-[1.75rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center">
                    <Sparkles className="mx-auto h-10 w-10 text-emerald-600" />
                    <p className="mt-4 text-lg font-black text-slate-900">
                      No upcoming bookings yet
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Find a trusted Guru and book care when your pet needs support.
                    </p>
                    <Link
                      href={routes.findGuru}
                      className="mt-5 inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                    >
                      Find a Guru
                    </Link>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4">
                    {upcomingBookings.slice(0, 3).map((booking, index) => {
                      const matchedPet = findPetForBooking(booking, pets);

                      return (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          featured={index === 0}
                          petPhotoUrl={matchedPet?.photo_url || null}
                        />
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                      My pets
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                      Pet profiles your Gurus can understand
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={routes.pets}
                      className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      Full Passport
                    </Link>

                    <button
                      type="button"
                      onClick={() => setShowPetForm((value) => !value)}
                      className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                    >
                      {showPetForm ? "Close pet form" : "Add a pet"}
                    </button>
                  </div>
                </div>

                {formError ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {formError}
                  </div>
                ) : null}

                {petMediaMessage ? (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                    {petMediaMessage}
                  </div>
                ) : null}

                {petMediaError ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {petMediaError}
                  </div>
                ) : null}

                {showPetForm ? (
                  <form onSubmit={handleAddPet} className="mt-5 grid gap-3">
                    <input
                      required
                      type="text"
                      placeholder="Pet name"
                      value={petForm.name}
                      onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Species"
                        value={petForm.species}
                        onChange={(e) =>
                          setPetForm({ ...petForm, species: e.target.value })
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                      />

                      <input
                        type="text"
                        placeholder="Breed"
                        value={petForm.breed}
                        onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Age"
                        value={petForm.age}
                        onChange={(e) => setPetForm({ ...petForm, age: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                      />

                      <input
                        type="text"
                        placeholder="Weight"
                        value={petForm.weight}
                        onChange={(e) =>
                          setPetForm({ ...petForm, weight: e.target.value })
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Temperament"
                      value={petForm.temperament}
                      onChange={(e) =>
                        setPetForm({ ...petForm, temperament: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    />

                    <input
                      type="text"
                      placeholder="Medications"
                      value={petForm.medications}
                      onChange={(e) =>
                        setPetForm({ ...petForm, medications: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    />

                    <input
                      type="url"
                      placeholder="Optional photo URL, or upload after saving"
                      value={petForm.photo_url}
                      onChange={(e) =>
                        setPetForm({ ...petForm, photo_url: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    />

                    <input
                      type="url"
                      placeholder="Optional video URL, or upload after saving"
                      value={petForm.video_url}
                      onChange={(e) =>
                        setPetForm({ ...petForm, video_url: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    />

                    <textarea
                      placeholder="Care notes for your Guru"
                      rows={4}
                      value={petForm.notes}
                      onChange={(e) => setPetForm({ ...petForm, notes: e.target.value })}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    />

                    <button
                      type="submit"
                      disabled={savingPet}
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {savingPet ? "Saving pet..." : "Save pet profile"}
                    </button>
                  </form>
                ) : null}

                {pets.length === 0 ? (
                  <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">
                      No pet profiles yet.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Add your first pet profile so booking and Guru communication feel easier.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4">
                    {pets.slice(0, 3).map((pet) => (
                      <div
                        key={pet.id}
                        className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row">
                          <div className="flex shrink-0 flex-col items-center gap-2">
                            <div className="h-24 w-24 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                              {pet.photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={pet.photo_url}
                                  alt={pet.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-2xl">
                                  🐾
                                </div>
                              )}
                            </div>

                            {pet.video_url ? (
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-700 ring-1 ring-emerald-100">
                                Video ready
                              </span>
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-black text-slate-900">
                                {pet.name}
                              </h3>

                              {pet.species ? (
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                  {pet.species}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 text-sm text-slate-600">
                              {[pet.breed, pet.age, pet.weight].filter(Boolean).join(" • ") ||
                                "Profile details can be added anytime."}
                            </p>

                            {pet.notes ? (
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700">
                                {pet.notes}
                              </p>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-2">
                              <Link
                                href={buildPetBookingHref(pet)}
                                className="inline-flex items-center rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
                              >
                                Book care
                              </Link>

                              <Link
                                href={routes.pets}
                                className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                              >
                                Edit Passport
                              </Link>

                              <label className="inline-flex cursor-pointer items-center rounded-xl border border-emerald-200 bg-white px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50">
                                {uploadingPetMedia?.petId === pet.id &&
                                uploadingPetMedia.kind === "photo"
                                  ? "Uploading photo..."
                                  : pet.photo_url
                                    ? "Change Photo"
                                    : "Upload Photo"}
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png"
                                  disabled={Boolean(uploadingPetMedia)}
                                  onChange={(event) => handlePetMediaUpload(event, pet, "photo")}
                                  className="sr-only"
                                />
                              </label>

                              <label className="inline-flex cursor-pointer items-center rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-xs font-bold text-sky-800 transition hover:bg-sky-50">
                                {uploadingPetMedia?.petId === pet.id &&
                                uploadingPetMedia.kind === "video"
                                  ? "Uploading video..."
                                  : pet.video_url
                                    ? "Change Video"
                                    : "Upload Video"}
                                <input
                                  type="file"
                                  accept="video/mp4,video/quicktime,video/webm"
                                  disabled={Boolean(uploadingPetMedia)}
                                  onChange={(event) => handlePetMediaUpload(event, pet, "video")}
                                  className="sr-only"
                                />
                              </label>

                              <Link
                                href={buildPetMessageHref(pet)}
                                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
                              >
                                Message Guru
                              </Link>

                              <Link
                                href={buildPetAdminHref(pet)}
                                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
                              >
                                Message Admin
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section
                id="recent-bookings"
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Recent bookings
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                      Your pet care activity
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      A cleaner timeline of requests, checkout, tips, payments, and care history. Use the full Bookings page for the Trust & Care overview.
                    </p>
                  </div>

                  <Link
                    href={routes.bookings}
                    className="inline-flex items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
                  >
                    Open Bookings Overview
                  </Link>
                </div>

                {bookings.length === 0 ? (
                  <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <p className="text-lg font-bold text-slate-900">
                      No bookings yet
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Start exploring trusted pet care options and request your first booking with a Guru who feels right for your pet.
                    </p>

                    <Link
                      href={routes.findGuru}
                      className="mt-5 inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                    >
                      Find a Guru
                    </Link>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4">
                    {recentBookings.slice(0, 5).map((booking) => {
                      const matchedPet = findPetForBooking(booking, pets);
                      const location = getBookingLocation(booking);

                      return (
                        <div
                          key={booking.id}
                          className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5"
                        >
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start gap-3">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1.1rem] bg-white shadow-sm ring-1 ring-slate-200">
                                  {matchedPet?.photo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={matchedPet.photo_url} alt={booking.pet_name || matchedPet.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <PawPrint className="h-6 w-6 text-emerald-600" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-base font-black text-slate-900">
                                      {booking.pet_name || "Pet Care"} • {booking.service_type || "Booking"}
                                    </p>
                                    <span
                                      className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-bold ${getStatusClasses(
                                        booking.status,
                                      )}`}
                                    >
                                      {formatStatus(booking.status)}
                                    </span>
                                  </div>

                                  <p className="mt-1 text-sm font-medium text-slate-500">
                                    {formatDate(getBookingDisplayDate(booking))}
                                    {location ? ` • ${location}` : ""}
                                  </p>
                                  <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {getBookingNextStep(booking)}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                    Payment
                                  </p>
                                  <p className="mt-1 text-sm font-black text-slate-950">
                                    {formatStatus(booking.payment_status)}
                                  </p>
                                </div>
                                <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                    Tip
                                  </p>
                                  <p className="mt-1 text-sm font-black text-emerald-700">
                                    {formatMoney(booking.tip_amount, true)}
                                  </p>
                                </div>
                                <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                    Total
                                  </p>
                                  <p className="mt-1 text-sm font-black text-slate-950">
                                    {formatMoney(
                                      booking.total_customer_paid || booking.subtotal_amount,
                                      true,
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                <Link
                                  href={getBookingDetailHref(booking.id)}
                                  className="inline-flex items-center rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white transition hover:bg-emerald-700"
                                >
                                  View Details
                                </Link>

                                <Link
                                  href={routes.messages}
                                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
                                >
                                  Open messages
                                </Link>

                                <Link
                                  href={routes.adminMessages}
                                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
                                >
                                  Get support
                                </Link>

                                <Link
                                  href={routes.bookings}
                                  className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
                                >
                                  All bookings
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}