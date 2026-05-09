"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Loader2,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type PhotoColumn = "avatar_url" | "profile_photo_url" | "photo_url" | "image_url";

type ProfileSource = {
  table: string;
  matchColumn: string;
  matchValue: string;
};

type BasicInfoProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  first_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  photo_column: PhotoColumn | null;
  source: ProfileSource;
};

type BasicInfoForm = {
  full_name: string;
  phone: string;
  avatar_url: string;
};

type RawProfileRow = Record<string, unknown> & {
  id?: string | null;
  user_id?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  name?: string | null;
  phone?: string | null;
  phone_number?: string | null;
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

type SetupStatus = {
  basicInfoComplete: boolean;
  serviceLocationComplete: boolean;
  petPassportsComplete: boolean;
  careNotesComplete: boolean;
  emergencyContactComplete: boolean;
  notificationsComplete: boolean;
};

type SetupStepStatus = "complete" | "required" | "recommended";

type UploadResult = {
  bucket: string;
  path: string;
  publicUrl: string;
};

const routes = {
  setupHub: "/customer/dashboard/profile",
  basicInfo: "/customer/dashboard/profile/basic-info",
  serviceLocation: "/customer/dashboard/profile/service-location",
  pets: "/customer/pets",
  careNotes: "/customer/dashboard/profile/care-notes",
  emergencyContact: "/customer/dashboard/profile/emergency-contact",
  notifications: "/customer/dashboard/profile/notifications",
  login: "/login",
};

const PHOTO_BUCKETS = ["profile-photos", "avatars", "pet-photos"];

const initialForm: BasicInfoForm = {
  full_name: "",
  phone: "",
  avatar_url: "",
};

const fallbackAvatar = "/images/customer-profile-photo.jpg";

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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

function normalizePhotoUrl(value: string | null) {
  if (!value) return null;

  const cleanValue = value.trim();

  if (!cleanValue) return null;
  if (cleanValue.startsWith("http://")) return cleanValue;
  if (cleanValue.startsWith("https://")) return cleanValue;
  if (cleanValue.startsWith("/")) return cleanValue;
  if (cleanValue.startsWith("data:image")) return cleanValue;

  return `/${cleanValue}`;
}

function formatPhoneWithDashes(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;

  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function getFileExtension(file: File) {
  const nameExtension = file.name.split(".").pop()?.toLowerCase();

  if (nameExtension) return nameExtension === "jpeg" ? "jpg" : nameExtension;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return "jpg";
}

function isValidPhoto(file: File) {
  return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
    file.type,
  );
}

function getExistingPhoto(row: RawProfileRow | null) {
  const avatarUrl = normalizePhotoUrl(readString(row?.avatar_url));
  const profilePhotoUrl = normalizePhotoUrl(readString(row?.profile_photo_url));
  const photoUrl = normalizePhotoUrl(readString(row?.photo_url));
  const imageUrl = normalizePhotoUrl(readString(row?.image_url));

  if (avatarUrl) {
    return {
      url: avatarUrl,
      column: "avatar_url" as const,
    };
  }

  if (profilePhotoUrl) {
    return {
      url: profilePhotoUrl,
      column: "profile_photo_url" as const,
    };
  }

  if (photoUrl) {
    return {
      url: photoUrl,
      column: "photo_url" as const,
    };
  }

  if (imageUrl) {
    return {
      url: imageUrl,
      column: "image_url" as const,
    };
  }

  return {
    url: null,
    column: null,
  };
}

function getCustomerInitials(profile: BasicInfoProfile | null) {
  const name =
    profile?.full_name ||
    profile?.first_name ||
    profile?.email?.split("@")[0] ||
    "Pet Parent";

  const parts = name
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  const firstInitial = parts[0]?.charAt(0) || "P";
  const secondInitial = parts[1]?.charAt(0) || "P";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

function buildBasicInfoProfile(
  row: RawProfileRow | null,
  user: SupabaseUserLike,
  source: ProfileSource,
): BasicInfoProfile {
  const metadata = user.user_metadata ?? null;
  const existingPhoto = getExistingPhoto(row);

  const metadataPhoto = normalizePhotoUrl(
    readMetadataString(metadata, [
      "avatar_url",
      "profile_photo_url",
      "photo_url",
      "image_url",
      "picture",
      "avatar",
    ]),
  );

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
    id: user.id,
    email: user.email ?? null,
    full_name: fullName,
    first_name: firstName,
    phone:
      readString(row?.phone) ||
      readString(row?.phone_number) ||
      readMetadataString(metadata, ["phone", "phone_number"]) ||
      null,
    avatar_url: existingPhoto.url || metadataPhoto,
    photo_column: existingPhoto.column,
    source,
  };
}

function profileToForm(profile: BasicInfoProfile | null): BasicInfoForm {
  return {
    full_name: profile?.full_name || "",
    phone: formatPhoneWithDashes(profile?.phone || ""),
    avatar_url: profile?.avatar_url || "",
  };
}

function getStepBadgeClassName(status: SetupStepStatus) {
  if (status === "complete") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "required") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

async function uploadProfilePhoto(file: File, userId: string) {
  const extension = getFileExtension(file);
  const path = `${userId}/customer-profile-${Date.now()}.${extension}`;
  let lastError = "Could not upload profile photo.";

  for (const bucket of PHOTO_BUCKETS) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);

      return {
        bucket,
        path,
        publicUrl: data.publicUrl,
      } satisfies UploadResult;
    }

    lastError = error.message || lastError;
  }

  throw new Error(lastError);
}

async function fetchBasicInfoProfile(user: SupabaseUserLike) {
  const tableAttempts: ProfileSource[] = [
    {
      table: "profiles",
      matchColumn: "id",
      matchValue: user.id,
    },
    {
      table: "profiles",
      matchColumn: "user_id",
      matchValue: user.id,
    },
    {
      table: "customer_profiles",
      matchColumn: "user_id",
      matchValue: user.id,
    },
    {
      table: "customer_profiles",
      matchColumn: "id",
      matchValue: user.id,
    },
    {
      table: "customers",
      matchColumn: "user_id",
      matchValue: user.id,
    },
    {
      table: "customers",
      matchColumn: "id",
      matchValue: user.id,
    },
  ];

  for (const source of tableAttempts) {
    const { data, error } = await supabase
      .from(source.table)
      .select("*")
      .eq(source.matchColumn, source.matchValue)
      .maybeSingle();

    if (!error && data) {
      return buildBasicInfoProfile(data as RawProfileRow, user, source);
    }
  }

  return buildBasicInfoProfile(null, user, {
    table: "profiles",
    matchColumn: "id",
    matchValue: user.id,
  });
}

async function fetchSetupStatus(userId: string): Promise<SetupStatus> {
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, first_name, phone, service_address, service_city, service_state, service_zip, care_preferences, emergency_contact, emergency_contact_name, emergency_contact_phone, email_notifications, push_notifications, text_notifications",
    )
    .eq("id", userId)
    .maybeSingle();

  const { data: pets } = await supabase
    .from("pets")
    .select("id")
    .eq("owner_id", userId)
    .limit(1);

  return {
    basicInfoComplete: Boolean(
      profile && (profile.full_name || profile.first_name) && profile.phone,
    ),
    serviceLocationComplete: Boolean(
      profile &&
        profile.service_address &&
        profile.service_city &&
        profile.service_state &&
        profile.service_zip,
    ),
    petPassportsComplete: Boolean(pets && pets.length > 0),
    careNotesComplete: Boolean(profile?.care_preferences),
    emergencyContactComplete: Boolean(
      profile?.emergency_contact ||
        (profile?.emergency_contact_name && profile?.emergency_contact_phone),
    ),
    notificationsComplete: Boolean(
      profile?.email_notifications ||
        profile?.push_notifications ||
        profile?.text_notifications,
    ),
  };
}

async function updateProfileWithPayload(
  source: ProfileSource,
  payload: Record<string, string | null>,
) {
  const { error } = await supabase
    .from(source.table)
    .update(payload)
    .eq(source.matchColumn, source.matchValue);

  return error;
}

async function saveBasicInfo(
  profile: BasicInfoProfile,
  form: BasicInfoForm,
) {
  const cleanFullName = form.full_name.trim();
  const firstName = cleanFullName.split(" ").filter(Boolean)[0] || null;
  const formattedPhone = formatPhoneWithDashes(form.phone) || null;
  const photoUrl = form.avatar_url.trim() || profile.avatar_url || null;

  const basePayloadAttempts: Array<Record<string, string | null>> = [
    {
      full_name: cleanFullName || null,
      first_name: firstName,
      phone: formattedPhone,
    },
    {
      full_name: cleanFullName || null,
      phone: formattedPhone,
    },
    {
      name: cleanFullName || null,
      phone: formattedPhone,
    },
    {
      phone: formattedPhone,
    },
  ];

  const photoColumnOrder = [
    profile.photo_column,
    "avatar_url",
    "profile_photo_url",
    "photo_url",
    "image_url",
  ].filter((column, index, columns): column is PhotoColumn => {
    return Boolean(column) && columns.indexOf(column) === index;
  });

  let lastErrorMessage = "";

  for (const basePayload of basePayloadAttempts) {
    if (photoUrl) {
      for (const photoColumn of photoColumnOrder) {
        const payload = {
          ...basePayload,
          [photoColumn]: photoUrl,
        };

        const error = await updateProfileWithPayload(profile.source, payload);

        if (!error) return;

        lastErrorMessage = error.message;
      }
    }

    const error = await updateProfileWithPayload(profile.source, basePayload);

    if (!error) return;

    lastErrorMessage = error.message;
  }

  throw new Error(
    `Basic info did not save: ${lastErrorMessage || "Unknown database error"}`,
  );
}

function SetupNavigation({ setupStatus }: { setupStatus: SetupStatus }) {
  const steps = [
    {
      number: 1,
      label: "Basic Info",
      href: routes.basicInfo,
      status: setupStatus.basicInfoComplete ? "complete" : "required",
    },
    {
      number: 2,
      label: "Service Location",
      href: routes.serviceLocation,
      status: setupStatus.serviceLocationComplete ? "complete" : "required",
    },
    {
      number: 3,
      label: "Pet Passports",
      href: routes.pets,
      status: setupStatus.petPassportsComplete ? "complete" : "required",
    },
    {
      number: 4,
      label: "Care Notes",
      href: routes.careNotes,
      status: setupStatus.careNotesComplete ? "complete" : "recommended",
    },
    {
      number: 5,
      label: "Emergency",
      href: routes.emergencyContact,
      status: setupStatus.emergencyContactComplete
        ? "complete"
        : "recommended",
    },
    {
      number: 6,
      label: "Notifications",
      href: routes.notifications,
      status: setupStatus.notificationsComplete ? "complete" : "recommended",
    },
  ] satisfies Array<{
    number: number;
    label: string;
    href: string;
    status: SetupStepStatus;
  }>;

  return (
    <div className="grid gap-2 md:grid-cols-6">
      {steps.map((step) => {
        const active = step.number === 1;

        return (
          <Link
            key={step.number}
            href={step.href}
            className={`rounded-2xl border px-3 py-3 text-center transition hover:-translate-y-0.5 ${
              active
                ? "border-emerald-300 bg-emerald-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
            }`}
          >
            <span
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black ${getStepBadgeClassName(
                step.status,
              )}`}
            >
              {step.status === "complete" ? "✓" : step.number}
            </span>
            <span className="mt-2 block text-xs font-black text-slate-800">
              {step.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function CompletionPill({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div
      className={`rounded-full border px-4 py-2 text-xs font-black ${
        complete
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {complete ? "✓" : "!"} {label}
    </div>
  );
}

export default function CustomerBasicInfoPage() {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BasicInfoProfile | null>(null);
  const [form, setForm] = useState<BasicInfoForm>(initialForm);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    basicInfoComplete: false,
    serviceLocationComplete: false,
    petPassportsComplete: false,
    careNotesComplete: false,
    emergencyContactComplete: false,
    notificationsComplete: false,
  });

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fullNameComplete = Boolean(form.full_name.trim());
  const emailComplete = Boolean(profile?.email);
  const phoneComplete = Boolean(form.phone.trim());

  const basicInfoComplete = useMemo(() => {
    return Boolean(fullNameComplete && emailComplete && phoneComplete);
  }, [fullNameComplete, emailComplete, phoneComplete]);

  const statusLabel = basicInfoComplete ? "Complete" : "Required";
  const statusTone = basicInfoComplete
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-red-200 bg-red-50 text-red-700";

  const avatarSrc = normalizePhotoUrl(form.avatar_url) || fallbackAvatar;
  const showImage = Boolean(avatarSrc && !photoFailed);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    try {
      const [profileData, setupData] = await Promise.all([
        fetchBasicInfoProfile(user),
        fetchSetupStatus(user.id),
      ]);

      setProfile(profileData);
      setForm(profileToForm(profileData));
      setSetupStatus(setupData);
      setPhotoFailed(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not load your Basic Info.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadPage();

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
  }, [loadPage, router]);

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || uploadingPhoto) return;

    setUploadingPhoto(true);
    setMessage("");
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace(routes.login);
        return;
      }

      if (!isValidPhoto(file)) {
        setErrorMessage("Please upload a JPG, PNG, or WEBP profile photo.");
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        setErrorMessage("Profile photos must be 8MB or smaller.");
        return;
      }

      const uploaded = await uploadProfilePhoto(file, user.id);

      setForm((current) => ({
        ...current,
        avatar_url: uploaded.publicUrl,
      }));

      setPhotoFailed(false);
      setMessage("Profile photo uploaded. Save Basic Info to keep it.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not upload your profile photo.",
      );
    } finally {
      setUploadingPhoto(false);

      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  }

  async function handleSave(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!profile?.id || saving) return false;

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    if (!form.full_name.trim()) {
      setErrorMessage("Please enter your full name.");
      setSaving(false);
      return false;
    }

    if (!form.phone.trim()) {
      setErrorMessage("Please enter your phone number.");
      setSaving(false);
      return false;
    }

    try {
      await saveBasicInfo(profile, form);

      const refreshedProfile = await fetchBasicInfoProfile({
        id: profile.id,
        email: profile.email,
        user_metadata: {},
      });

      const setupData = await fetchSetupStatus(profile.id);

      setProfile(refreshedProfile);
      setForm(profileToForm(refreshedProfile));
      setSetupStatus(setupData);
      setPhotoFailed(false);
      setMessage("Basic Info saved. Step 1 is complete.");
      router.refresh();
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not save your Basic Info.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndContinue() {
    const saved = await handleSave();

    if (saved) {
      router.push(routes.serviceLocation);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_45%,#ecfdf5_100%)]">
        <Header />
        <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-16">
          <div className="rounded-[2rem] border border-emerald-100 bg-white px-8 py-6 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-3 text-base font-bold text-slate-700">
              Loading Basic Info...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] text-slate-950">
      <Header />

      <section className="mx-auto max-w-[1350px] px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:py-10">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handlePhotoUpload}
        />

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={routes.setupHub}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Setup Hub
          </Link>

          <div
            className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${statusTone}`}
          >
            Step 1 · {statusLabel}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="bg-[linear-gradient(120deg,#10b981_0%,#34d399_52%,#a7f3d0_100%)] px-6 py-8 sm:px-8 lg:px-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-950/80">
              Pet Parent Setup · Step 1 of 6
            </p>

            <h1 className="mt-4 text-5xl font-black tracking-[-0.065em] text-slate-950 md:text-6xl">
              Basic Info
            </h1>

            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-800/75">
              Add the key contact details SitGuru uses for bookings, messages,
              support, and Guru care coordination.
            </p>
          </div>

          <div className="p-5 sm:p-6 lg:p-8">
            <SetupNavigation setupStatus={setupStatus} />

            {message || errorMessage ? (
              <div
                className={`mt-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-black ${
                  errorMessage
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {errorMessage ? (
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                )}
                {errorMessage || message}
              </div>
            ) : null}

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
              <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6">
                <div className="rounded-[1.7rem] border border-emerald-100 bg-white p-5 text-center shadow-sm">
                  <div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-emerald-100 bg-emerald-50 text-4xl font-black text-emerald-700">
                    {showImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarSrc}
                        alt="Pet Parent profile"
                        className="h-full w-full object-cover"
                        onError={() => setPhotoFailed(true)}
                      />
                    ) : (
                      getCustomerInitials(profile)
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => photoInputRef.current?.click()}
                    className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                  </button>

                  <p className="mx-auto mt-4 max-w-sm text-sm font-semibold leading-6 text-slate-600">
                    A clear photo makes your profile feel more personal for
                    bookings, messages, and future care coordination.
                  </p>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-700" />
                    <p className="text-sm font-black text-slate-950">
                      Why this step matters
                    </p>
                  </div>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    SitGuru uses Basic Info to display your Pet Parent profile,
                    support booking communication, help Gurus confirm who they
                    are working with, and support admin/help requests.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSave}
                className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <UserRound className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                      Personal Information
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      Required before your profile is ready for smooth booking.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5">
                  <label htmlFor="full_name" className="grid gap-2">
                    <span className="text-sm font-black text-slate-950">
                      Full Name
                    </span>
                    <input
                      id="full_name"
                      value={form.full_name}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          full_name: event.target.value,
                        })
                      }
                      placeholder="Example: Joe Rogan"
                      className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 text-sm font-bold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label htmlFor="email" className="grid gap-2">
                    <span className="text-sm font-black text-slate-950">
                      Login Email
                    </span>
                    <input
                      id="email"
                      value={profile?.email || ""}
                      disabled
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-500 outline-none"
                    />
                    <span className="text-xs font-semibold leading-5 text-slate-500">
                      Email changes are handled through account security.
                    </span>
                  </label>

                  <label htmlFor="phone" className="grid gap-2">
                    <span className="text-sm font-black text-slate-950">
                      Phone Number
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      value={form.phone}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          phone: formatPhoneWithDashes(event.target.value),
                        })
                      }
                      placeholder="Example: 555-555-5555"
                      className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 text-sm font-bold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-950">
                      Completion status
                    </p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <CompletionPill label="Email" complete={emailComplete} />
                      <CompletionPill
                        label="Full Name"
                        complete={fullNameComplete}
                      />
                      <CompletionPill label="Phone" complete={phoneComplete} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {saving ? "Saving..." : "Save Basic Info"}
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSaveAndContinue}
                      className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60"
                    >
                      Save & Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap justify-between gap-3 border-t border-emerald-50 pt-5">
                    <Link
                      href={routes.setupHub}
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Hub
                    </Link>

                    <Link
                      href={routes.serviceLocation}
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Next: Service Location
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}