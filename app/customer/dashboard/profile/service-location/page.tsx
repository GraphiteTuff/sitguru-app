"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Home,
  Loader2,
  LocateFixed,
  MapPin,
  PawPrint,
  ShieldCheck,
} from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type ServiceLocationProfile = {
  id: string;
  email: string | null;
  service_address: string | null;
  service_city: string | null;
  service_state: string | null;
  service_zip: string | null;
};

type ServiceLocationForm = {
  service_address: string;
  service_city: string;
  service_state: string;
  service_zip: string;
};

type RawProfileRow = {
  service_address?: string | null;
  address?: string | null;
  home_address?: string | null;
  street_address?: string | null;
  service_city?: string | null;
  city?: string | null;
  home_city?: string | null;
  service_state?: string | null;
  state?: string | null;
  home_state?: string | null;
  service_zip?: string | null;
  zip?: string | null;
  zip_code?: string | null;
  zipcode?: string | null;
  postal_code?: string | null;
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

type ZipLookupLocation = {
  zip: string;
  city: string;
  state: string;
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

const initialForm: ServiceLocationForm = {
  service_address: "",
  service_city: "",
  service_state: "",
  service_zip: "",
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

function cleanZip(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

function buildAddressLine(profile: ServiceLocationProfile | null) {
  const street = profile?.service_address?.trim();
  const city = profile?.service_city?.trim();
  const state = profile?.service_state?.trim();
  const zip = profile?.service_zip?.trim();

  const cityState = [city, state].filter(Boolean).join(", ");
  const cityStateZip = [cityState, zip].filter(Boolean).join(" ");

  if (street && cityStateZip) return `${street}, ${cityStateZip}`;
  return street || cityStateZip || "Not added yet";
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

function buildServiceLocationProfile(
  row: RawProfileRow | null,
  user: SupabaseUserLike,
): ServiceLocationProfile {
  const metadata = user.user_metadata ?? null;

  return {
    id: user.id,
    email: user.email ?? null,
    service_address:
      readString(row?.service_address) ||
      readString(row?.address) ||
      readString(row?.home_address) ||
      readString(row?.street_address) ||
      readMetadataString(metadata, [
        "service_address",
        "address",
        "home_address",
        "street_address",
      ]) ||
      null,
    service_city:
      readString(row?.service_city) ||
      readString(row?.city) ||
      readString(row?.home_city) ||
      readMetadataString(metadata, ["service_city", "city", "home_city"]) ||
      null,
    service_state:
      readString(row?.service_state) ||
      readString(row?.state) ||
      readString(row?.home_state) ||
      readMetadataString(metadata, ["service_state", "state", "home_state"]) ||
      null,
    service_zip:
      readString(row?.service_zip) ||
      readString(row?.zip) ||
      readString(row?.zip_code) ||
      readString(row?.zipcode) ||
      readString(row?.postal_code) ||
      readMetadataString(metadata, [
        "service_zip",
        "zip",
        "zip_code",
        "zipcode",
        "postal_code",
      ]) ||
      null,
  };
}

function profileToForm(
  profile: ServiceLocationProfile | null,
): ServiceLocationForm {
  return {
    service_address: profile?.service_address || "",
    service_city: profile?.service_city || "",
    service_state: profile?.service_state || "",
    service_zip: cleanZip(profile?.service_zip || ""),
  };
}

async function lookupZipLocation(zip: string): Promise<ZipLookupLocation | null> {
  const clean = cleanZip(zip);

  if (clean.length !== 5) return null;

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${clean}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const place = data?.places?.[0];

    if (!place) return null;

    return {
      zip: clean,
      city: String(place?.["place name"] || ""),
      state: String(place?.["state abbreviation"] || ""),
    };
  } catch {
    return null;
  }
}

async function fetchServiceLocationProfile(user: SupabaseUserLike) {
  const selectAttempts = [
    "service_address, address, home_address, street_address, service_city, city, home_city, service_state, state, home_state, service_zip, zip, zip_code, zipcode, postal_code",
    "service_address, service_city, service_state, service_zip",
    "address, city, state, zip_code",
    "address, city, state, zip",
  ];

  for (const selectColumns of selectAttempts) {
    const { data, error } = await supabase
      .from("profiles")
      .select(selectColumns)
      .eq("id", user.id)
      .maybeSingle();

    if (!error) {
      return buildServiceLocationProfile(
        (data as RawProfileRow | null) ?? null,
        user,
      );
    }
  }

  return buildServiceLocationProfile(null, user);
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
  userId: string,
  payload: Record<string, string | null>,
) {
  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId);

  return error;
}

async function saveServiceLocation(
  userId: string,
  form: ServiceLocationForm,
) {
  const cleanServiceAddress = form.service_address.trim() || null;
  const cleanServiceCity = form.service_city.trim() || null;
  const cleanServiceState = form.service_state.trim().toUpperCase() || null;
  const cleanServiceZip = cleanZip(form.service_zip) || null;

  const payloadAttempts: Array<Record<string, string | null>> = [
    {
      service_address: cleanServiceAddress,
      service_city: cleanServiceCity,
      service_state: cleanServiceState,
      service_zip: cleanServiceZip,
    },
    {
      address: cleanServiceAddress,
      city: cleanServiceCity,
      state: cleanServiceState,
      zip_code: cleanServiceZip,
    },
    {
      address: cleanServiceAddress,
      city: cleanServiceCity,
      state: cleanServiceState,
      zip: cleanServiceZip,
    },
  ];

  let lastErrorMessage = "";

  for (const payload of payloadAttempts) {
    const error = await updateProfileWithPayload(userId, payload);

    if (!error) return;

    lastErrorMessage = error.message;
  }

  throw new Error(
    `Service Location did not save: ${
      lastErrorMessage || "Unknown database error"
    }`,
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
        const active = step.number === 2;

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
      className={`rounded-2xl border px-4 py-3 text-sm font-black ${
        complete
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {complete ? "✓" : "!"} {label}
    </div>
  );
}

export default function CustomerServiceLocationPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ServiceLocationProfile | null>(null);
  const [form, setForm] = useState<ServiceLocationForm>(initialForm);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    basicInfoComplete: false,
    serviceLocationComplete: false,
    petPassportsComplete: false,
    careNotesComplete: false,
    emergencyContactComplete: false,
    notificationsComplete: false,
  });

  const [saving, setSaving] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipMessage, setZipMessage] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const streetComplete = Boolean(form.service_address.trim());
  const zipComplete = cleanZip(form.service_zip).length === 5;
  const cityComplete = Boolean(form.service_city.trim());
  const stateComplete = Boolean(form.service_state.trim());

  const serviceLocationComplete = useMemo(() => {
    return Boolean(
      streetComplete && zipComplete && cityComplete && stateComplete,
    );
  }, [streetComplete, zipComplete, cityComplete, stateComplete]);

  const statusLabel = serviceLocationComplete ? "Complete" : "Required";
  const statusTone = serviceLocationComplete
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-red-200 bg-red-50 text-red-700";

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
        fetchServiceLocationProfile(user),
        fetchSetupStatus(user.id),
      ]);

      setProfile(profileData);
      setForm(profileToForm(profileData));
      setSetupStatus(setupData);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not load your Service Location.",
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

  async function handleZipChange(value: string) {
    const nextZip = cleanZip(value);

    setForm((current) => ({
      ...current,
      service_zip: nextZip,
    }));

    setZipMessage("");

    if (nextZip.length !== 5) return;

    setZipLoading(true);

    try {
      const location = await lookupZipLocation(nextZip);

      if (!location) {
        setZipMessage("ZIP code found, but city/state could not be filled.");
        return;
      }

      setForm((current) => ({
        ...current,
        service_zip: location.zip,
        service_city: location.city,
        service_state: location.state,
      }));

      setZipMessage(`City and state filled: ${location.city}, ${location.state}`);
    } finally {
      setZipLoading(false);
    }
  }

  async function handleSave(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!profile?.id || saving) return false;

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    if (!form.service_address.trim()) {
      setErrorMessage("Please enter your street address.");
      setSaving(false);
      return false;
    }

    if (cleanZip(form.service_zip).length !== 5) {
      setErrorMessage("Please enter a valid 5-digit ZIP code.");
      setSaving(false);
      return false;
    }

    if (!form.service_city.trim()) {
      setErrorMessage("Please enter your city.");
      setSaving(false);
      return false;
    }

    if (!form.service_state.trim()) {
      setErrorMessage("Please enter your state.");
      setSaving(false);
      return false;
    }

    try {
      await saveServiceLocation(profile.id, form);

      const [profileData, setupData] = await Promise.all([
        fetchServiceLocationProfile({
          id: profile.id,
          email: profile.email,
          user_metadata: {},
        }),
        fetchSetupStatus(profile.id),
      ]);

      setProfile(profileData);
      setForm(profileToForm(profileData));
      setSetupStatus(setupData);
      setMessage("Service Location saved. Step 2 is complete.");
      router.refresh();
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not save your Service Location.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndContinue() {
    const saved = await handleSave();

    if (saved) {
      router.push(routes.pets);
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
              Loading Service Location...
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

          <div
            className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${statusTone}`}
          >
            Step 2 · {statusLabel}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="bg-[linear-gradient(120deg,#10b981_0%,#34d399_52%,#a7f3d0_100%)] px-6 py-8 sm:px-8 lg:px-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-950/80">
              Pet Parent Setup · Step 2 of 6
            </p>

            <h1 className="mt-4 text-5xl font-black tracking-[-0.065em] text-slate-950 md:text-6xl">
              Service Location
            </h1>

            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-800/75">
              Add the primary care location SitGuru uses for Guru matching,
              booking details, radius filtering, maps, and local availability.
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
                <div className="rounded-[1.7rem] border border-emerald-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <MapPin className="h-7 w-7" />
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                        Current Service Location
                      </p>
                      <h2 className="mt-1 text-4xl font-black tracking-[-0.05em] text-slate-950">
                        {serviceLocationComplete
                          ? "Location Ready"
                          : "Location Needed"}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-950">
                      Care address
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {buildAddressLine({
                        id: profile?.id || "",
                        email: profile?.email || null,
                        service_address: form.service_address || null,
                        service_city: form.service_city || null,
                        service_state: form.service_state || null,
                        service_zip: form.service_zip || null,
                      })}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-2">
                    <CompletionPill
                      label="Street Address"
                      complete={streetComplete}
                    />
                    <CompletionPill label="ZIP Code" complete={zipComplete} />
                    <CompletionPill label="City" complete={cityComplete} />
                    <CompletionPill label="State" complete={stateComplete} />
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-700" />
                    <p className="text-sm font-black text-slate-950">
                      Why this step matters
                    </p>
                  </div>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    Service Location feeds Find Care, Guru radius matching,
                    maps, booking address context, local availability, and
                    future locality-based logic across SitGuru.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSave}
                className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Home className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                      Where will care happen?
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      This should be the primary location used for SitGuru care,
                      matching, and bookings.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5">
                  <label htmlFor="service_address" className="grid gap-2">
                    <span className="text-sm font-black text-slate-950">
                      Street Address
                    </span>
                    <input
                      id="service_address"
                      value={form.service_address}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          service_address: event.target.value,
                        })
                      }
                      placeholder="Example: 100 Main Street"
                      className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 text-sm font-bold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label htmlFor="service_zip" className="grid gap-2">
                    <span className="text-sm font-black text-slate-950">
                      ZIP Code
                    </span>
                    <div className="relative">
                      <input
                        id="service_zip"
                        value={form.service_zip}
                        inputMode="numeric"
                        maxLength={5}
                        onChange={(event) => void handleZipChange(event.target.value)}
                        placeholder="Example: 18951"
                        className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 pr-12 text-sm font-bold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      />

                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-700">
                        {zipLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LocateFixed className="h-4 w-4" />
                        )}
                      </div>
                    </div>

                    {zipMessage ? (
                      <span className="text-xs font-black text-emerald-700">
                        {zipMessage}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500">
                        Enter a ZIP code and SitGuru will autofill city/state
                        when available.
                      </span>
                    )}
                  </label>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label htmlFor="service_city" className="grid gap-2">
                      <span className="text-sm font-black text-slate-950">
                        City
                      </span>
                      <input
                        id="service_city"
                        value={form.service_city}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            service_city: event.target.value,
                          })
                        }
                        placeholder="Example: Quakertown"
                        className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 text-sm font-bold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      />
                    </label>

                    <label htmlFor="service_state" className="grid gap-2">
                      <span className="text-sm font-black text-slate-950">
                        State
                      </span>
                      <input
                        id="service_state"
                        value={form.service_state}
                        maxLength={2}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            service_state: event.target.value.toUpperCase(),
                          })
                        }
                        placeholder="Example: PA"
                        className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 text-sm font-bold uppercase text-slate-950 placeholder:normal-case placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      />
                    </label>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-center gap-3">
                      <PawPrint className="h-5 w-5 text-emerald-700" />
                      <p className="text-sm font-black text-slate-950">
                        SitGuru matching impact
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      A complete location helps prevent Gurus outside your area
                      from showing as good matches and supports better local care
                      results.
                    </p>
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
                      {saving ? "Saving..." : "Save Service Location"}
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
                      href={routes.basicInfo}
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous: Basic Info
                    </Link>

                    <Link
                      href={routes.pets}
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Next: Pet Passports
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