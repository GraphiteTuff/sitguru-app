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
  Camera,
  CheckCircle2,
  CircleAlert,
  Loader2,
  PawPrint,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type CustomerProfile = {
  id: string;
  first_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

type CustomerBasicInfoForm = {
  full_name: string;
  phone: string;
  avatar_url: string;
};

type RawProfileRow = {
  first_name?: string | null;
  full_name?: string | null;
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

type SetupStepStatus = "complete" | "required" | "recommended" | "optional";

const routes = {
  setupHub: "/customer/dashboard/profile",
  basicInfo: "/customer/dashboard/profile/basic-info",
  serviceLocation: "/customer/dashboard/profile/service-location",
  pets: "/customer/pets",
  careNotes: "/customer/dashboard/profile/care-notes",
  emergencyContact: "/customer/dashboard/profile/emergency-contact",
  notifications: "/customer/dashboard/profile/notifications",
  savedGurus: "/customer/dashboard/profile/saved-gurus",
  login: "/login",
};

const fallbackAvatar = "/images/customer-profile-photo.jpg";
const profilePhotoBuckets = ["profile-photos", "avatars"];
const maxProfilePhotoSize = 5 * 1024 * 1024;

const initialForm: CustomerBasicInfoForm = {
  full_name: "",
  phone: "",
  avatar_url: "",
};

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

function normalizePhone(value: string) {
  return value.trim();
}

function getProfilePhotoExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/webp") return "webp";

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "jpeg") return "jpg";
  if (extension === "png" || extension === "webp") return extension;

  return "jpg";
}

function getInitials(profile: CustomerProfile | null, form: CustomerBasicInfoForm) {
  const name =
    form.full_name.trim() ||
    profile?.full_name?.trim() ||
    profile?.first_name?.trim() ||
    profile?.email ||
    "Pet Parent";

  const parts = name
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  const firstInitial = parts[0]?.charAt(0) || "P";
  const secondInitial = parts[1]?.charAt(0) || "";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

function getStepBadgeClassName(status: SetupStepStatus) {
  if (status === "complete") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "required") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "recommended") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
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
    id: user.id,
    first_name: firstName,
    full_name: fullName,
    email: user.email ?? null,
    phone:
      readString(row?.phone) ||
      readString(row?.phone_number) ||
      readMetadataString(metadata, ["phone", "phone_number"]) ||
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

function profileToForm(profile: CustomerProfile | null): CustomerBasicInfoForm {
  return {
    full_name: profile?.full_name || profile?.first_name || "",
    phone: profile?.phone || "",
    avatar_url: profile?.avatar_url || "",
  };
}

async function fetchCustomerProfile(user: SupabaseUserLike) {
  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, full_name, phone, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!error) {
    return buildCustomerProfile((data as RawProfileRow | null) ?? null, user);
  }

  throw new Error(
    `Pet Parent basic info could not load: ${error.message}. Make sure the profiles table has first_name, full_name, phone, and avatar_url columns.`,
  );
}

async function saveBasicInfo(userId: string, form: CustomerBasicInfoForm) {
  const fullName = form.full_name.trim();
  const firstName = fullName.split(" ")[0] || fullName || null;

  const payload = {
    id: userId,
    full_name: fullName || null,
    first_name: firstName,
    phone: normalizePhone(form.phone) || null,
    avatar_url: form.avatar_url.trim() || null,
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    throw new Error(`Basic info did not save: ${error.message}`);
  }
}

async function uploadCustomerProfilePhoto(userId: string, file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Please upload a JPG, PNG, or WEBP profile picture.");
  }

  if (file.size > maxProfilePhotoSize) {
    throw new Error("Please upload a profile picture under 5MB.");
  }

  const extension = getProfilePhotoExtension(file);
  const filePath = `${userId}/customer-avatar-${Date.now()}.${extension}`;
  let lastError = "We could not upload your profile picture right now.";

  for (const bucket of profilePhotoBuckets) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
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
    `${lastError} Make sure Supabase Storage has a public bucket named profile-photos or avatars.`,
  );
}

function SetupNavigation({
  basicInfoComplete,
}: {
  basicInfoComplete: boolean;
}) {
  const steps = [
    {
      number: 1,
      label: "Basic Info",
      href: routes.basicInfo,
      status: basicInfoComplete ? "complete" : "required",
    },
    {
      number: 2,
      label: "Service Location",
      href: routes.serviceLocation,
      status: "required",
    },
    {
      number: 3,
      label: "Pet Passports",
      href: routes.pets,
      status: "required",
    },
    {
      number: 4,
      label: "Care Notes",
      href: routes.careNotes,
      status: "recommended",
    },
    {
      number: 5,
      label: "Emergency",
      href: routes.emergencyContact,
      status: "recommended",
    },
    {
      number: 6,
      label: "Notifications",
      href: routes.notifications,
      status: "recommended",
    },
    {
      number: 7,
      label: "Saved Gurus",
      href: routes.savedGurus,
      status: "optional",
    },
  ] satisfies Array<{
    number: number;
    label: string;
    href: string;
    status: SetupStepStatus;
  }>;

  return (
    <div className="grid gap-2 md:grid-cols-7">
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

export default function CustomerBasicInfoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [form, setForm] = useState<CustomerBasicInfoForm>(initialForm);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const avatarSrc = form.avatar_url.trim() || profile?.avatar_url || fallbackAvatar;
  const showAvatar = Boolean(avatarSrc) && !photoFailed;

  const basicInfoComplete = useMemo(() => {
    return Boolean(profile?.email?.trim() && form.full_name.trim() && form.phone.trim());
  }, [form.full_name, form.phone, profile?.email]);

  const statusLabel = basicInfoComplete ? "Complete" : "Required";
  const statusTone = basicInfoComplete
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-red-200 bg-red-50 text-red-700";

  const initials = useMemo(() => getInitials(profile, form), [form, profile]);

  const loadProfile = useCallback(async () => {
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
      const profileData = await fetchCustomerProfile(user);
      setProfile(profileData);
      setForm(profileToForm(profileData));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not load your basic info.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();

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

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !profile?.id) return;

    setUploadingPhoto(true);
    setMessage("");
    setErrorMessage("");

    try {
      const publicUrl = await uploadCustomerProfilePhoto(profile.id, file);
      setForm((currentForm) => ({
        ...currentForm,
        avatar_url: publicUrl,
      }));
      setPhotoFailed(false);
      setMessage("Profile picture uploaded. Save this step to keep it.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not upload your profile picture.",
      );
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  }

  async function handleSave(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!profile?.id || saving) return;

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    if (!form.full_name.trim()) {
      setErrorMessage("Please enter your full name.");
      setSaving(false);
      return;
    }

    if (!form.phone.trim()) {
      setErrorMessage("Please enter your phone number.");
      setSaving(false);
      return;
    }

    try {
      await saveBasicInfo(profile.id, form);
      const refreshedProfile = await fetchCustomerProfile({
        id: profile.id,
        email: profile.email,
        user_metadata: {},
      });

      setProfile(refreshedProfile);
      setForm(profileToForm(refreshedProfile));
      setMessage("Basic Info saved. Step 1 is complete.");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not save your basic info.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndContinue() {
    await handleSave();
    router.push(routes.serviceLocation);
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
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={routes.setupHub}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Setup Hub
          </Link>

          <div className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${statusTone}`}>
            Step 1 · {statusLabel}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="bg-[linear-gradient(120deg,#10b981_0%,#34d399_52%,#a7f3d0_100%)] px-6 py-8 sm:px-8 lg:px-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-950/80">
              Pet Parent Setup · Step 1 of 7
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
            <SetupNavigation basicInfoComplete={basicInfoComplete} />

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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />

                  <label className="group mx-auto block h-36 w-36 cursor-pointer overflow-hidden rounded-full bg-emerald-50 text-4xl font-black text-emerald-700 ring-4 ring-emerald-100">
                    {showAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarSrc}
                        alt="Pet Parent profile photo"
                        onError={() => setPhotoFailed(true)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        {initials}
                      </span>
                    )}
                  </label>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="mt-5 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                  </button>

                  <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
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
                    <h2 className="text-3xl font-black tracking-tight text-slate-950">
                      Personal Information
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      Required before your profile is ready for smooth booking.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5">
                  <label className="grid gap-2 text-sm">
                    <span className="font-black text-slate-700">Full Name</span>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(event) =>
                        setForm({ ...form, full_name: event.target.value })
                      }
                      placeholder="Example: Jason Graff"
                      className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="font-black text-slate-700">Login Email</span>
                    <input
                      type="email"
                      value={profile?.email || ""}
                      disabled
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-bold text-slate-600 outline-none"
                    />
                    <span className="text-xs font-semibold leading-5 text-slate-500">
                      Email changes are handled through account security.
                    </span>
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="font-black text-slate-700">Phone Number</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) =>
                        setForm({ ...form, phone: event.target.value })
                      }
                      placeholder="Example: 555-555-5555"
                      className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-950">
                      Completion status
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {[
                        ["Email", Boolean(profile?.email?.trim())],
                        ["Full Name", Boolean(form.full_name.trim())],
                        ["Phone", Boolean(form.phone.trim())],
                      ].map(([label, complete]) => (
                        <div
                          key={String(label)}
                          className={`rounded-2xl border px-3 py-2 text-xs font-black ${
                            complete
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {complete ? "✓" : "!"} {String(label)}
                        </div>
                      ))}
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
                      className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                    >
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