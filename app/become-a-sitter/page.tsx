"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type AuthUser = {
  id: string;
  email: string;
};

type GuruProfile = {
  display_name?: string | null;
  full_name?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  service_area?: string | null;
  service_zip_code?: string | null;
  hourly_rate?: number | null;
};

type ZipLookupResult = {
  city: string;
  state: string;
  stateAbbreviation: string;
};

type ZipLookupStatus = "idle" | "loading" | "found" | "not-found" | "error";

const zipCodeFallbackMap: Record<
  string,
  { city: string; state: string; stateAbbreviation: string }
> = {
  "08030": {
    city: "Camden",
    state: "New Jersey",
    stateAbbreviation: "NJ",
  },
  "18018": {
    city: "Bethlehem",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
  "18073": {
    city: "Pennsburg",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
  "18101": {
    city: "Allentown",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
  "18951": {
    city: "Quakertown",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
  "19103": {
    city: "Philadelphia",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
};

function normalizeZipCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

function normalizeState(value: string) {
  return value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
}

function normalizeServiceZipCode(value: string) {
  return value.replace(/[^0-9,\s-]/g, "").slice(0, 120);
}

async function lookupZipCode(zipCode: string): Promise<ZipLookupResult | null> {
  const normalizedZip = normalizeZipCode(zipCode);

  if (normalizedZip.length !== 5) return null;

  const fallback = zipCodeFallbackMap[normalizedZip];

  if (fallback) return fallback;

  const response = await fetch(`https://api.zippopotam.us/us/${normalizedZip}`);

  if (!response.ok) return null;

  const payload = await response.json();
  const place = payload?.places?.[0];

  if (!place) return null;

  return {
    city: String(place["place name"] || "").trim(),
    state: String(place.state || "").trim(),
    stateAbbreviation: String(place["state abbreviation"] || "").trim(),
  };
}

function buildDefaultServiceArea(city: string, state: string) {
  const cleanCity = city.trim();
  const cleanState = state.trim();

  if (cleanCity && cleanState) {
    return `${cleanCity}, ${cleanState} and nearby areas`;
  }

  if (cleanCity) {
    return `${cleanCity} and nearby areas`;
  }

  return "";
}

export default function BecomeGuruPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasGuruRecord, setHasGuruRecord] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [serviceZipCode, setServiceZipCode] = useState("");
  const [rate, setRate] = useState("");

  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zipLookupStatus, setZipLookupStatus] =
    useState<ZipLookupStatus>("idle");
  const [zipLookupMessage, setZipLookupMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoadingPage(true);

      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;

      if (!isMounted) return;

      if (!currentUser) {
        setUser(null);
        setLoadingPage(false);
        return;
      }

      const nextUser = {
        id: currentUser.id,
        email: currentUser.email || "",
      };

      setUser(nextUser);

      const { data: guru } = await supabase
        .from("gurus")
        .select(
          "display_name, full_name, bio, city, state, zip_code, service_area, service_zip_code, hourly_rate",
        )
        .eq("user_id", currentUser.id)
        .maybeSingle<GuruProfile>();

      if (!isMounted) return;

      if (guru) {
        setHasGuruRecord(true);
        setDisplayName(guru.display_name || guru.full_name || "");
        setBio(guru.bio || "");
        setCity(guru.city || "");
        setState(guru.state || "");
        setZipCode(guru.zip_code || "");
        setServiceArea(guru.service_area || "");
        setServiceZipCode(guru.service_zip_code || "");
        setRate(guru.hourly_rate ? String(guru.hourly_rate) : "");
      }

      setLoadingPage(false);
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const normalizedZip = normalizeZipCode(zipCode);

    if (!normalizedZip) {
      setZipLookupStatus("idle");
      setZipLookupMessage("");
      return;
    }

    if (normalizedZip.length < 5) {
      setZipLookupStatus("idle");
      setZipLookupMessage("Enter a 5-digit ZIP code to autofill city and state.");
      return;
    }

    let isMounted = true;

    async function runLookup() {
      setZipLookupStatus("loading");
      setZipLookupMessage("Looking up ZIP code...");

      try {
        const result = await lookupZipCode(normalizedZip);

        if (!isMounted) return;

        if (!result?.city || !result?.state) {
          setZipLookupStatus("not-found");
          setZipLookupMessage(
            "We could not autofill that ZIP code. Please enter city and state manually.",
          );
          return;
        }

        const nextState = result.stateAbbreviation || result.state;

        setCity((previous) => previous || result.city);
        setState((previous) => previous || nextState);
        setServiceArea((previous) =>
          previous || buildDefaultServiceArea(result.city, nextState),
        );
        setServiceZipCode((previous) => previous || normalizedZip);

        setZipLookupStatus("found");
        setZipLookupMessage(`Autofilled ${result.city}, ${nextState}.`);
      } catch (error) {
        console.error("Guru ZIP code lookup failed:", error);

        if (!isMounted) return;

        setZipLookupStatus("error");
        setZipLookupMessage(
          "ZIP autofill is unavailable right now. Please enter city and state manually.",
        );
      }
    }

    const timeout = window.setTimeout(runLookup, 350);

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [zipCode]);

  function handleZipChange(value: string) {
    setZipCode(normalizeZipCode(value));
    setFormError("");
    setFormSuccess("");
  }

  function handleCityChange(value: string) {
    setCity(value);
    setFormError("");
    setFormSuccess("");
  }

  function handleStateChange(value: string) {
    setState(normalizeState(value));
    setFormError("");
    setFormSuccess("");
  }

  function handleServiceAreaChange(value: string) {
    setServiceArea(value);
    setFormError("");
    setFormSuccess("");
  }

  function handleServiceZipCodeChange(value: string) {
    setServiceZipCode(normalizeServiceZipCode(value));
    setFormError("");
    setFormSuccess("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormError("");
    setFormSuccess("");

    if (!user) {
      setFormError("You must be logged in to become a Guru.");
      return;
    }

    const cleanDisplayName = displayName.trim();
    const cleanBio = bio.trim();
    const cleanCity = city.trim();
    const cleanState = state.trim().toUpperCase();
    const cleanZipCode = normalizeZipCode(zipCode);
    const cleanServiceArea = serviceArea.trim();
    const cleanServiceZipCode = serviceZipCode.trim();
    const cleanRate = Number(rate);

    if (!cleanDisplayName) {
      setFormError("Please enter your display name.");
      return;
    }

    if (!cleanBio) {
      setFormError("Please tell Pet Parents about yourself.");
      return;
    }

    if (!cleanZipCode || cleanZipCode.length !== 5) {
      setFormError("Please enter a valid 5-digit ZIP code.");
      return;
    }

    if (!cleanCity) {
      setFormError("Please enter your city.");
      return;
    }

    if (!cleanState) {
      setFormError("Please enter your state.");
      return;
    }

    if (!cleanServiceArea) {
      setFormError("Please enter your service area.");
      return;
    }

    if (!cleanServiceZipCode) {
      setFormError("Please enter at least one service ZIP code.");
      return;
    }

    if (!Number.isFinite(cleanRate) || cleanRate <= 0) {
      setFormError("Please enter a valid hourly rate.");
      return;
    }

    setSaving(true);

    try {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email,
          full_name: cleanDisplayName,
          city: cleanCity,
          state: cleanState,
          zip_code: cleanZipCode,
          role: "guru",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      );

      if (profileError) throw profileError;

      const { error: userRoleError } = await supabase.from("user_roles").upsert({
        user_id: user.id,
        role: "guru",
      });

      if (userRoleError) throw userRoleError;

      const guruPayload: Record<string, unknown> = {
        user_id: user.id,
        email: user.email,
        display_name: cleanDisplayName,
        full_name: cleanDisplayName,
        bio: cleanBio,
        city: cleanCity,
        state: cleanState,
        zip_code: cleanZipCode,
        service_area: cleanServiceArea,
        service_zip_code: cleanServiceZipCode,
        hourly_rate: cleanRate,
        updated_at: new Date().toISOString(),
      };

      if (!hasGuruRecord) {
        guruPayload.is_verified = false;
        guruPayload.is_active = false;
        guruPayload.is_public = false;
      }

      const { error: guruError } = await supabase.from("gurus").upsert(
        guruPayload,
        {
          onConflict: "user_id",
        },
      );

      if (guruError) throw guruError;

      setHasGuruRecord(true);
      setFormSuccess("Guru profile saved! Redirecting to your dashboard...");

      window.setTimeout(() => {
        window.location.href = "/guru/dashboard";
      }, 700);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save your Guru profile right now.";

      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loadingPage) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
        <div className="mx-auto max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-600">
            Loading Guru signup...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
        <div className="mx-auto max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">
            Become a Guru 🐾
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Please log in or create a SitGuru account first. After that, you can
            complete your Guru profile.
          </p>

          <div className="mt-6 grid gap-3">
            <Link
              href="/login?mode=email&next=/become-a-guru"
              className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              Log in with email
            </Link>

            <Link
              href="/signup?role=guru&next=/become-a-guru"
              className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
            >
              Create Guru account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
        <div className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              SitGuru Guru Signup
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
              Become a Guru 🐾
            </h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Complete your location and service area so Pet Parents know where
              you provide care.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-black text-slate-800">
                Display Name <span className="text-rose-600">*</span>
              </span>
              <input
                type="text"
                placeholder="Bethany Staab"
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setFormError("");
                  setFormSuccess("");
                }}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-black text-slate-800">
                About You <span className="text-rose-600">*</span>
              </span>
              <textarea
                placeholder="Tell Pet Parents about your pet care experience, reliability, and the services you enjoy offering..."
                value={bio}
                onChange={(event) => {
                  setBio(event.target.value);
                  setFormError("");
                  setFormSuccess("");
                }}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold leading-6 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                rows={5}
                required
              />
            </label>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <h2 className="text-base font-black text-slate-950">
                Location <span className="text-rose-600">*</span>
              </h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Enter your ZIP code first. SitGuru will try to autofill your city
                and state.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1.2fr_0.7fr]">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    ZIP Code <span className="text-rose-600">*</span>
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="18073"
                    value={zipCode}
                    onChange={(event) => handleZipChange(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    City <span className="text-rose-600">*</span>
                  </span>
                  <input
                    type="text"
                    placeholder="Pennsburg"
                    value={city}
                    onChange={(event) => handleCityChange(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    State <span className="text-rose-600">*</span>
                  </span>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="PA"
                    value={state}
                    onChange={(event) => handleStateChange(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold uppercase outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    required
                  />
                </label>
              </div>

              {zipLookupMessage ? (
                <p
                  className={`mt-3 text-xs font-bold ${
                    zipLookupStatus === "found"
                      ? "text-emerald-700"
                      : zipLookupStatus === "loading"
                        ? "text-slate-500"
                        : "text-amber-700"
                  }`}
                >
                  {zipLookupMessage}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
              <h2 className="text-base font-black text-slate-950">
                Service Area <span className="text-rose-600">*</span>
              </h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Tell Pet Parents where you are willing to provide services.
              </p>

              <div className="mt-4 grid gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Service Area <span className="text-rose-600">*</span>
                  </span>
                  <input
                    type="text"
                    placeholder="Pennsburg, PA and nearby areas"
                    value={serviceArea}
                    onChange={(event) =>
                      handleServiceAreaChange(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Service ZIP Code(s) <span className="text-rose-600">*</span>
                  </span>
                  <input
                    type="text"
                    placeholder="18073"
                    value={serviceZipCode}
                    onChange={(event) =>
                      handleServiceZipCodeChange(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    required
                  />
                  <p className="mt-1.5 text-xs font-semibold text-slate-500">
                    You can enter one ZIP code or multiple ZIP codes separated by
                    commas.
                  </p>
                </label>
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-black text-slate-800">
                Hourly Rate ($) <span className="text-rose-600">*</span>
              </span>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="25"
                value={rate}
                onChange={(event) => {
                  setRate(event.target.value);
                  setFormError("");
                  setFormSuccess("");
                }}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                required
              />
            </label>

            {formError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {formError}
              </div>
            ) : null}

            {formSuccess ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                {formSuccess}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Guru Profile"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}