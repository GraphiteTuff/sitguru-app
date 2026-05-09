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

type CustomerLocationProfile = {
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

type ZipLookupResult = {
  city: string;
  state: string;
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
  findCare: "/find-care",
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

function normalizeZip(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

function normalizeState(value: string) {
  return value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
}

function formatLocation(profile: CustomerLocationProfile | null, form: ServiceLocationForm) {
  const street = form.service_address.trim() || profile?.service_address?.trim();
  const city = form.service_city.trim() || profile?.service_city?.trim();
  const state = form.service_state.trim() || profile?.service_state?.trim();
  const zip = form.service_zip.trim() || profile?.service_zip?.trim();

  const cityState = [city, state].filter(Boolean).join(", ");
  const cityStateZip = [cityState, zip].filter(Boolean).join(" ");

  if (street && cityStateZip) return `${street}, ${cityStateZip}`;
  return street || cityStateZip || "Location not added yet";
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

async function lookupZipCode(zip: string): Promise<ZipLookupResult | null> {
  const normalizedZip = normalizeZip(zip);

  if (normalizedZip.length !== 5) {
    return null;
  }

  const response = await fetch(`https://api.zippopotam.us/us/${normalizedZip}`);

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    places?: Array<{
      "place name"?: string;
      "state abbreviation"?: string;
    }>;
  };

  const firstPlace = data.places?.[0];

  if (!firstPlace?.["place name"] || !firstPlace?.["state abbreviation"]) {
    return null;
  }

  return {
    city: firstPlace["place name"],
    state: firstPlace["state abbreviation"],
  };
}

function buildLocationProfile(
  row: RawProfileRow | null,
  user: SupabaseUserLike,
): CustomerLocationProfile {
  const metadata = user.user_metadata ?? null;

  return {
    id: user.id,
    email: user.email ?? null,
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

function profileToForm(profile: CustomerLocationProfile | null): ServiceLocationForm {
  return {
    service_address: profile?.service_address || "",
    service_city: profile?.service_city || "",
    service_state: profile?.service_state || "",
    service_zip: profile?.service_zip || "",
  };
}

async function fetchLocationProfile(user: SupabaseUserLike) {
  const { data, error } = await supabase
    .from("profiles")
    .select("service_address, service_city, service_state, service_zip")
    .eq("id", user.id)
    .maybeSingle();

  if (!error) {
    return buildLocationProfile((data as RawProfileRow | null) ?? null, user);
  }

  throw new Error(
    `Service Location could not load: ${error.message}. Make sure the profiles table has service_address, service_city, service_state, and service_zip columns.`,
  );
}

async function saveServiceLocation(userId: string, form: ServiceLocationForm) {
  const payload = {
    id: userId,
    service_address: form.service_address.trim() || null,
    service_city: form.service_city.trim() || null,
    service_state: normalizeState(form.service_state) || null,
    service_zip: normalizeZip(form.service_zip) || null,
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    throw new Error(`Service Location did not save: ${error.message}`);
  }
}

function SetupNavigation({
  serviceLocationComplete,
}: {
  serviceLocationComplete: boolean;
}) {
  const steps = [
    {
      number: 1,
      label: "Basic Info",
      href: routes.basicInfo,
      status: "complete",
    },
    {
      number: 2,
      label: "Service Location",
      href: routes.serviceLocation,
      status: serviceLocationComplete ? "complete" : "required",
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

export default function CustomerServiceLocationPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerLocationProfile | null>(null);
  const [form, setForm] = useState<ServiceLocationForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [zipLookupLoading, setZipLookupLoading] = useState(false);
  const [zipLookupMessage, setZipLookupMessage] = useState("");
  const [zipLookupError, setZipLookupError] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const serviceLocationComplete = useMemo(() => {
    return Boolean(
      form.service_address.trim() &&
        form.service_city.trim() &&
        form.service_state.trim() &&
        normalizeZip(form.service_zip).length === 5,
    );
  }, [form]);

  const statusLabel = serviceLocationComplete ? "Complete" : "Required";
  const statusTone = serviceLocationComplete
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-red-200 bg-red-50 text-red-700";

  const fullAddress = useMemo(
    () => formatLocation(profile, form),
    [form, profile],
  );

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
      const profileData = await fetchLocationProfile(user);
      setProfile(profileData);
      setForm(profileToForm(profileData));
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
    const normalizedZip = normalizeZip(form.service_zip);

    if (normalizedZip.length !== 5) {
      setZipLookupMessage("");
      setZipLookupError("");
      return;
    }

    const timer = window.setTimeout(() => {
      void handleZipLookup(normalizedZip);
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.service_zip]);

  async function handleZipLookup(zip: string) {
    const normalizedZip = normalizeZip(zip);

    if (normalizedZip.length !== 5) {
      return;
    }

    setZipLookupLoading(true);
    setZipLookupMessage("");
    setZipLookupError("");

    try {
      const result = await lookupZipCode(normalizedZip);

      if (!result) {
        setZipLookupError("We could not find a city and state for that ZIP code.");
        return;
      }

      setForm((currentForm) => ({
        ...currentForm,
        service_zip: normalizedZip,
        service_city: result.city,
        service_state: result.state,
      }));

      setZipLookupMessage(`City and state filled: ${result.city}, ${result.state}`);
    } catch {
      setZipLookupError("City/state autofill is unavailable right now.");
    } finally {
      setZipLookupLoading(false);
    }
  }

  async function handleSave(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!profile?.id || saving) return;

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    if (!form.service_address.trim()) {
      setErrorMessage("Please enter the street address where care will happen.");
      setSaving(false);
      return;
    }

    if (normalizeZip(form.service_zip).length !== 5) {
      setErrorMessage("Please enter a valid 5-digit ZIP code.");
      setSaving(false);
      return;
    }

    if (!form.service_city.trim() || !form.service_state.trim()) {
      setErrorMessage("Please complete city and state. ZIP autofill can help.");
      setSaving(false);
      return;
    }

    try {
      await saveServiceLocation(profile.id, form);
      const refreshedProfile = await fetchLocationProfile({
        id: profile.id,
        email: profile.email,
        user_metadata: {},
      });

      setProfile(refreshedProfile);
      setForm(profileToForm(refreshedProfile));
      setMessage("Service Location saved. Step 2 is complete.");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not save your Service Location.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndContinue() {
    await handleSave();
    router.push(routes.pets);
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

          <div className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${statusTone}`}>
            Step 2 · {statusLabel}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="bg-[linear-gradient(120deg,#10b981_0%,#34d399_52%,#a7f3d0_100%)] px-6 py-8 sm:px-8 lg:px-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-950/80">
              Pet Parent Setup · Step 2 of 7
            </p>

            <h1 className="mt-4 text-5xl font-black tracking-[-0.065em] text-slate-950 md:text-6xl">
              Service Location
            </h1>

            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-800/75">
              Add the location where care will happen so SitGuru can support
              local Guru matching, service-radius filtering, maps, and booking
              details.
            </p>
          </div>

          <div className="p-5 sm:p-6 lg:p-8">
            <SetupNavigation serviceLocationComplete={serviceLocationComplete} />

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
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <MapPin className="h-6 w-6" />
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
                        Current service location
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-slate-950">
                        {serviceLocationComplete ? "Location Ready" : "Needs Location"}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-950">
                      Care address
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {fullAddress}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-2">
                    {[
                      ["Street Address", Boolean(form.service_address.trim())],
                      ["ZIP Code", normalizeZip(form.service_zip).length === 5],
                      ["City", Boolean(form.service_city.trim())],
                      ["State", Boolean(form.service_state.trim())],
                    ].map(([label, complete]) => (
                      <div
                        key={String(label)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-black ${
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
                    <h2 className="text-3xl font-black tracking-tight text-slate-950">
                      Where will care happen?
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      This should be the primary location used for SitGuru care,
                      matching, and bookings.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5">
                  <label className="grid gap-2 text-sm">
                    <span className="font-black text-slate-700">
                      Street Address
                    </span>
                    <input
                      type="text"
                      value={form.service_address}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          service_address: event.target.value,
                        })
                      }
                      placeholder="Example: 123 Main Street"
                      className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="font-black text-slate-700">ZIP Code</span>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={form.service_zip}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            service_zip: normalizeZip(event.target.value),
                          })
                        }
                        onBlur={() => void handleZipLookup(form.service_zip)}
                        placeholder="Example: 08030"
                        className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 pr-12 font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      />
                      {zipLookupLoading ? (
                        <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-600" />
                      ) : (
                        <LocateFixed className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                      )}
                    </div>

                    {zipLookupMessage ? (
                      <span className="text-xs font-bold text-emerald-700">
                        {zipLookupMessage}
                      </span>
                    ) : null}

                    {zipLookupError ? (
                      <span className="text-xs font-bold text-amber-700">
                        {zipLookupError}
                      </span>
                    ) : null}

                    <span className="text-xs font-semibold leading-5 text-slate-500">
                      Enter a ZIP code and SitGuru will autofill city/state when
                      available.
                    </span>
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm">
                      <span className="font-black text-slate-700">City</span>
                      <input
                        type="text"
                        value={form.service_city}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            service_city: event.target.value,
                          })
                        }
                        placeholder="Auto-filled from ZIP"
                        className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      />
                    </label>

                    <label className="grid gap-2 text-sm">
                      <span className="font-black text-slate-700">State</span>
                      <input
                        type="text"
                        value={form.service_state}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            service_state: normalizeState(event.target.value),
                          })
                        }
                        placeholder="NJ"
                        maxLength={2}
                        className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 font-bold uppercase text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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