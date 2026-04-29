"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

type BookingStep = "details" | "review";

type LocationLookup = {
  city: string;
  state: string;
  zip?: string;
};

const BOOKING_TYPE_OPTIONS = [
  "Request Booking",
  "Instant Booking",
  "Meet & Greet First",
];

const PET_TYPE_OPTIONS = [
  "Dog",
  "Cat",
  "Puppy",
  "Kitten",
  "Senior Dog",
  "Senior Cat",
  "Multiple Pets",
  "Other",
];

const SERVICE_OPTIONS = [
  "Dog Walking",
  "Pet Sitting",
  "Drop-In Visits",
  "House Sitting",
  "Boarding",
  "Doggy Day Care",
  "Cat Care",
  "Puppy Care",
  "Medication Help",
  "General care",
];

const TIME_OPTIONS = [
  "Flexible",
  "Morning",
  "Midday",
  "Afternoon",
  "Evening",
  "Overnight",
  "Specific time needed",
];

const ZIP_LOOKUP: Record<string, LocationLookup> = {
  "18951": { city: "Quakertown", state: "PA", zip: "18951" },
  "19102": { city: "Philadelphia", state: "PA", zip: "19102" },
  "19103": { city: "Philadelphia", state: "PA", zip: "19103" },
  "19104": { city: "Philadelphia", state: "PA", zip: "19104" },
  "19106": { city: "Philadelphia", state: "PA", zip: "19106" },
  "19107": { city: "Philadelphia", state: "PA", zip: "19107" },
  "19123": { city: "Philadelphia", state: "PA", zip: "19123" },
  "19125": { city: "Philadelphia", state: "PA", zip: "19125" },
  "19130": { city: "Philadelphia", state: "PA", zip: "19130" },
  "19146": { city: "Philadelphia", state: "PA", zip: "19146" },
  "19147": { city: "Philadelphia", state: "PA", zip: "19147" },
  "15201": { city: "Pittsburgh", state: "PA", zip: "15201" },
  "15203": { city: "Pittsburgh", state: "PA", zip: "15203" },
  "15206": { city: "Pittsburgh", state: "PA", zip: "15206" },
  "15213": { city: "Pittsburgh", state: "PA", zip: "15213" },
  "15217": { city: "Pittsburgh", state: "PA", zip: "15217" },
  "55726": { city: "Cromwell", state: "MN", zip: "55726" },
};

const CITY_LOOKUP: Record<string, LocationLookup> = {
  quakertown: { city: "Quakertown", state: "PA", zip: "18951" },
  philadelphia: { city: "Philadelphia", state: "PA" },
  philly: { city: "Philadelphia", state: "PA" },
  pittsburgh: { city: "Pittsburgh", state: "PA" },
  cromwell: { city: "Cromwell", state: "MN", zip: "55726" },
};

function cleanString(value: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLookupKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getDefaultDate() {
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.toISOString().slice(0, 10);
}

function formatDisplayDate(value: string) {
  if (!value) return "Not selected";

  const parsed = new Date(`${value}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatService(value: string) {
  return value.trim() || "General care";
}

function formatCareLocation({
  zip,
  city,
  state,
}: {
  zip: string;
  city: string;
  state: string;
}) {
  const cityState = [city, state].filter(Boolean).join(", ");

  if (zip && cityState) {
    return `${cityState} ${zip}`;
  }

  return cityState || zip;
}

function getZipDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

export default function BookingNewClient() {
  const searchParams = useSearchParams();

  const guruSlugFromUrl = cleanString(searchParams.get("guru_slug"));
  const guruIdFromUrl = cleanString(searchParams.get("guru_id"));
  const guruNameFromUrl = cleanString(searchParams.get("guru_name"));
  const petIdFromUrl = cleanString(searchParams.get("pet_id"));
  const petNameFromUrl = cleanString(searchParams.get("pet_name"));
  const petPhotoUrlFromUrl = cleanString(searchParams.get("pet_photo_url"));
  const serviceFromUrl = cleanString(searchParams.get("service"));

  const cityFromUrl =
    cleanString(searchParams.get("city")) ||
    cleanString(searchParams.get("guru_city")) ||
    cleanString(searchParams.get("service_city"));

  const stateFromUrl =
    cleanString(searchParams.get("state")) ||
    cleanString(searchParams.get("guru_state")) ||
    cleanString(searchParams.get("service_state"));

  const zipFromUrl =
    cleanString(searchParams.get("zip")) ||
    cleanString(searchParams.get("zip_code")) ||
    cleanString(searchParams.get("guru_zip")) ||
    cleanString(searchParams.get("service_zip"));

  const [step, setStep] = useState<BookingStep>("details");

  const [bookingType, setBookingType] = useState("Request Booking");
  const [petName, setPetName] = useState(petNameFromUrl || "");
  const [petType, setPetType] = useState("");
  const [date, setDate] = useState(getDefaultDate());
  const [preferredTime, setPreferredTime] = useState("Flexible");
  const [customPreferredTime, setCustomPreferredTime] = useState("");
  const [service, setService] = useState(serviceFromUrl || "General care");

  const [careZipCode, setCareZipCode] = useState(getZipDigits(zipFromUrl));
  const [careCity, setCareCity] = useState(cityFromUrl);
  const [careState, setCareState] = useState(stateFromUrl.toUpperCase());

  const [notes, setNotes] = useState("");
  const [emergencyNotes, setEmergencyNotes] = useState("");

  const [detailsAgreement, setDetailsAgreement] = useState(false);
  const [paymentAgreement, setPaymentAgreement] = useState(false);
  const [policyAgreement, setPolicyAgreement] = useState(false);
  const [platformAgreement, setPlatformAgreement] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");

  const hasSelectedGuru = Boolean(guruSlugFromUrl || guruIdFromUrl);
  const hasSelectedPet = Boolean(petIdFromUrl || petNameFromUrl);

  const selectedGuruLabel = useMemo(() => {
    if (guruNameFromUrl) return guruNameFromUrl;
    if (guruSlugFromUrl) return guruSlugFromUrl;
    if (guruIdFromUrl) return guruIdFromUrl;
    return "No Guru selected yet";
  }, [guruIdFromUrl, guruNameFromUrl, guruSlugFromUrl]);

  const displayPreferredTime =
    preferredTime === "Specific time needed"
      ? customPreferredTime.trim() || "Specific time needed"
      : preferredTime;

  const careLocation = formatCareLocation({
    zip: careZipCode,
    city: careCity,
    state: careState,
  });

  const allAgreementsChecked =
    detailsAgreement &&
    paymentAgreement &&
    policyAgreement &&
    platformAgreement;

  function autofillFromZip(nextZip: string) {
    const cleanZip = getZipDigits(nextZip);

    setCareZipCode(cleanZip);

    if (cleanZip.length < 5) {
      setLocationMessage("");
      return;
    }

    const match = ZIP_LOOKUP[cleanZip];

    if (!match) {
      setLocationMessage(
        "ZIP not recognized yet. You can still enter the city and state manually."
      );
      return;
    }

    setCareCity(match.city);
    setCareState(match.state);
    setLocationMessage(`Autofilled ${match.city}, ${match.state}.`);
  }

  function autofillFromCity(nextCity: string) {
    setCareCity(nextCity);

    const key = normalizeLookupKey(nextCity);

    if (!key) {
      setLocationMessage("");
      return;
    }

    const match = CITY_LOOKUP[key];

    if (!match) {
      return;
    }

    setCareCity(match.city);
    setCareState(match.state);

    if (!careZipCode && match.zip) {
      setCareZipCode(match.zip);
      setLocationMessage(
        `Autofilled ${match.city}, ${match.state} ${match.zip}.`
      );
      return;
    }

    setLocationMessage(`Autofilled ${match.city}, ${match.state}.`);
  }

  function validateBookingDetails() {
    if (!hasSelectedGuru) {
      return "Please choose a Guru before continuing to checkout. You can browse available Gurus from Find Care.";
    }

    if (!bookingType.trim()) {
      return "Please choose a booking type.";
    }

    if (!petName.trim()) {
      return "Pet name is required.";
    }

    if (!petType.trim()) {
      return "Please choose a pet type.";
    }

    if (!date.trim()) {
      return "Requested date is required.";
    }

    if (!service.trim()) {
      return "Please choose a service.";
    }

    if (preferredTime === "Specific time needed" && !customPreferredTime.trim()) {
      return "Please enter the specific preferred time.";
    }

    if (!careZipCode.trim() && (!careCity.trim() || !careState.trim())) {
      return "Please enter a care ZIP code or city and state.";
    }

    if (careZipCode.trim() && careZipCode.trim().length !== 5) {
      return "Please enter a valid 5-digit ZIP code.";
    }

    return "";
  }

  function handleReviewBooking(e: FormEvent) {
    e.preventDefault();

    setError("");

    const validationError = validateBookingDetails();

    if (validationError) {
      setError(validationError);
      return;
    }

    setStep("review");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleCheckout() {
    setLoading(true);
    setError("");

    try {
      const validationError = validateBookingDetails();

      if (validationError) {
        setError(validationError);
        setLoading(false);
        setStep("details");
        return;
      }

      if (!allAgreementsChecked) {
        setError(
          "Please review and agree to the booking acknowledgments before continuing to secure checkout."
        );
        setLoading(false);
        return;
      }

      const combinedNotes = [
        `Booking type: ${bookingType}`,
        notes.trim() ? `Care notes: ${notes.trim()}` : "",
        petType.trim() ? `Pet type: ${petType.trim()}` : "",
        displayPreferredTime.trim()
          ? `Preferred time: ${displayPreferredTime.trim()}`
          : "",
        careZipCode.trim() ? `Care ZIP code: ${careZipCode.trim()}` : "",
        careCity.trim() ? `Care city: ${careCity.trim()}` : "",
        careState.trim() ? `Care state: ${careState.trim()}` : "",
        careLocation.trim() ? `Care location: ${careLocation.trim()}` : "",
        emergencyNotes.trim()
          ? `Emergency notes: ${emergencyNotes.trim()}`
          : "",
        "Customer acknowledged SitGuru booking terms, payment handling, 48-hour payout review window, support/refund review policy, and platform relationship before checkout.",
      ]
        .filter(Boolean)
        .join("\n\n");

      const bookingPayload = {
        guruSlug: guruSlugFromUrl || undefined,
        guru_slug: guruSlugFromUrl || undefined,
        guruId: guruIdFromUrl || undefined,
        guru_id: guruIdFromUrl || undefined,
        guruName: guruNameFromUrl || undefined,
        guru_name: guruNameFromUrl || undefined,
        guruCity: cityFromUrl || undefined,
        guru_city: cityFromUrl || undefined,
        guruState: stateFromUrl || undefined,
        guru_state: stateFromUrl || undefined,
        guruZip: zipFromUrl || undefined,
        guru_zip: zipFromUrl || undefined,

        petId: petIdFromUrl || undefined,
        pet_id: petIdFromUrl || undefined,
        petName: petName.trim(),
        pet_name: petName.trim(),
        petType: petType.trim() || undefined,
        pet_type: petType.trim() || undefined,
        petPhotoUrl: petPhotoUrlFromUrl || undefined,
        pet_photo_url: petPhotoUrlFromUrl || undefined,

        bookingType,
        booking_type: bookingType,
        date: date.trim(),
        booking_date: date.trim(),
        preferredTime: displayPreferredTime.trim() || undefined,
        preferred_time: displayPreferredTime.trim() || undefined,
        service: service.trim(),
        service_name: service.trim(),

        careZipCode: careZipCode.trim() || undefined,
        care_zip_code: careZipCode.trim() || undefined,
        careCity: careCity.trim() || undefined,
        care_city: careCity.trim() || undefined,
        careState: careState.trim() || undefined,
        care_state: careState.trim() || undefined,
        careLocation: careLocation.trim() || undefined,
        care_location: careLocation.trim() || undefined,

        emergencyNotes: emergencyNotes.trim() || undefined,
        emergency_notes: emergencyNotes.trim() || undefined,
        notes: combinedNotes,
        customer_agreed_to_booking_terms: true,
        customer_agreement_version: "booking-checkout-v1",
        customer_agreement_accepted_at: new Date().toISOString(),
      };

      const bookingRes = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingPayload),
      });

      const bookingData = await bookingRes.json().catch(() => null);

      const returnedBookingId =
        bookingData?.bookingId ||
        bookingData?.booking?.id ||
        bookingData?.id ||
        "";

      if (!bookingRes.ok || !returnedBookingId) {
        setError(bookingData?.error || "Booking failed");
        setLoading(false);
        return;
      }

      const stripeRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: returnedBookingId,
        }),
      });

      const stripeData = await stripeRes.json().catch(() => null);

      if (!stripeRes.ok || !stripeData?.url) {
        setError(stripeData?.error || "Stripe checkout failed");
        setLoading(false);
        return;
      }

      window.location.assign(stripeData.url);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                SitGuru Booking
              </p>

              <h1
                className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl"
                style={{
                  color: "#f8fafc",
                  lineHeight: 0.95,
                }}
              >
                Request trusted pet care with confidence.
              </h1>

              <p className="mt-5 text-base leading-8 text-slate-200 sm:text-lg">
                Tell us about your pet, preferred care date, service, ZIP code,
                and special instructions. Before checkout, you will review the
                details and accept SitGuru’s booking acknowledgments.
              </p>

              <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <p className="text-lg font-black text-emerald-50">
                  Payment protection built in
                </p>
                <p className="mt-2 text-base leading-8 text-emerald-50/90">
                  Pet parents pay securely at checkout. Guru payouts are
                  released 48 hours after completed care unless a support case,
                  refund request, chargeback, or safety review is open.
                </p>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
                How booking works
              </p>

              <div className="mt-5 space-y-3">
                {[
                  "Choose a Guru and select the type of booking you need.",
                  "Add pet type, service, date, time, ZIP code, and instructions.",
                  "SitGuru autofills city and state when it recognizes the ZIP or city.",
                  "Review the booking summary and required acknowledgments.",
                  "After completed care, the 48-hour review window protects both pet parents and Gurus.",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-slate-950">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {!hasSelectedGuru ? (
              <div className="rounded-[32px] border border-amber-400/20 bg-amber-400/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.22)]">
                <p className="text-sm font-black text-amber-100">
                  No Guru selected yet
                </p>
                <p className="mt-2 text-sm leading-7 text-amber-50/90">
                  Choose a Guru first so your booking request can be routed to
                  the right provider. You can return here after selecting a
                  Guru.
                </p>

                <Link
                  href="/search"
                  className="mt-5 inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
                >
                  Find a Guru
                </Link>
              </div>
            ) : null}
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl md:p-8">
            {step === "details" ? (
              <form onSubmit={handleReviewBooking}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                      Step 1 of 2
                    </p>
                    <h2 className="mt-2 text-4xl font-black leading-none text-slate-950 sm:text-5xl">
                      Booking request details
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                      Choose the booking type, pet type, service, date, care ZIP
                      code, and instructions your Guru should review before
                      checkout.
                    </p>
                  </div>

                  <Link
                    href="/search"
                    className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                  >
                    Find Care
                  </Link>
                </div>

                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Selected Guru
                  </p>
                  <p className="mt-1 text-sm font-bold text-emerald-900">
                    {selectedGuruLabel}
                  </p>
                </div>

                {hasSelectedPet ? (
                  <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">
                      Selected Pet
                    </p>

                    <div className="mt-3 flex items-center gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-2xl border border-sky-200 bg-white">
                        {petPhotoUrlFromUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={petPhotoUrlFromUrl}
                            alt={petName || "Selected pet"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-black text-sky-700">
                            {(petName || "P").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {petName || "Selected pet"}
                        </p>
                        <p className="text-xs font-medium text-slate-600">
                          This pet will be forwarded into the Guru booking.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-800">
                      Booking type
                    </label>
                    <select
                      value={bookingType}
                      onChange={(e) => setBookingType(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500"
                    >
                      {BOOKING_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Instant Booking can be used when a Guru allows faster
                      confirmation. Otherwise, the Guru reviews the request.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-800">
                      Pet name
                    </label>
                    <input
                      type="text"
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                      placeholder="Ex. Bella"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-800">
                      Pet type
                    </label>
                    <select
                      value={petType}
                      onChange={(e) => setPetType(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500"
                    >
                      <option value="">Choose pet type</option>
                      {PET_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-800">
                      Service
                    </label>
                    <select
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500"
                    >
                      {SERVICE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-800">
                      Requested date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-800">
                      Preferred time
                    </label>
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500"
                    >
                      {TIME_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    {preferredTime === "Specific time needed" ? (
                      <input
                        type="text"
                        value={customPreferredTime}
                        onChange={(e) => setCustomPreferredTime(e.target.value)}
                        placeholder="Ex. 10:30 AM"
                        className="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500"
                      />
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-800">
                      Care ZIP code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={careZipCode}
                      onChange={(e) => autofillFromZip(e.target.value)}
                      placeholder="Ex. 18951"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500"
                    />
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Enter a ZIP code and SitGuru will autofill city and state
                      when recognized.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-800">
                      City
                    </label>
                    <input
                      type="text"
                      value={careCity}
                      onChange={(e) => autofillFromCity(e.target.value)}
                      placeholder="Ex. Quakertown"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500"
                    />
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Typing a recognized city can autofill state and ZIP.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-800">
                      State
                    </label>
                    <input
                      type="text"
                      value={careState}
                      onChange={(e) => setCareState(e.target.value.toUpperCase())}
                      placeholder="PA"
                      maxLength={2}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium uppercase text-slate-900 outline-none transition focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-800">
                      Autofilled care area
                    </label>
                    <div className="flex min-h-[46px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800">
                      {careLocation || "Enter ZIP code or city"}
                    </div>
                    {locationMessage ? (
                      <p className="mt-2 text-xs font-semibold text-emerald-700">
                        {locationMessage}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-bold text-slate-800">
                    Care notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Anything your Guru should know before the booking."
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500"
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-bold text-slate-800">
                    Emergency or special instructions
                  </label>
                  <textarea
                    value={emergencyNotes}
                    onChange={(e) => setEmergencyNotes(e.target.value)}
                    rows={3}
                    placeholder="Medication, allergies, emergency contact, behavior notes, access instructions, etc."
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500"
                  />
                </div>

                {error ? (
                  <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="mt-6 w-full rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
                >
                  Review Booking Before Checkout
                </button>
              </form>
            ) : (
              <div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                      Step 2 of 2
                    </p>
                    <h2 className="mt-2 text-4xl font-black leading-none text-slate-950 sm:text-5xl">
                      Review and agree before checkout
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                      Please review your booking details and SitGuru’s care,
                      payment, cancellation, refund, and support acknowledgments
                      before continuing to secure checkout.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setStep("details");
                    }}
                    className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                  >
                    Edit Details
                  </button>
                </div>

                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                  <div className="bg-slate-50 px-5 py-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Booking Summary
                    </p>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {[
                      ["Booking type", bookingType],
                      ["Guru", selectedGuruLabel],
                      ["Pet", petName.trim() || "Not provided"],
                      ["Pet type", petType.trim() || "Not provided"],
                      ["Service", formatService(service)],
                      ["Date", formatDisplayDate(date)],
                      [
                        "Preferred time",
                        displayPreferredTime.trim() ||
                          "Flexible / not provided",
                      ],
                      ["Care ZIP code", careZipCode.trim() || "Not provided"],
                      ["Care city", careCity.trim() || "Not provided"],
                      ["Care state", careState.trim() || "Not provided"],
                      ["Care area", careLocation.trim() || "Not provided"],
                      ["Care notes", notes.trim() || "No care notes added"],
                      [
                        "Emergency instructions",
                        emergencyNotes.trim() ||
                          "No emergency instructions added",
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[180px_1fr]"
                      >
                        <p className="font-black uppercase tracking-[0.14em] text-slate-500">
                          {label}
                        </p>
                        <p className="font-semibold leading-6 text-slate-900">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-sm font-black text-emerald-900">
                    SitGuru booking protection
                  </p>
                  <p className="mt-2 text-sm leading-7 text-emerald-900/80">
                    Your payment is processed securely through SitGuru. Guru
                    payouts are released 48 hours after completed care unless a
                    support case, refund request, chargeback, or trust and
                    safety review is open.
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <label className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    <input
                      type="checkbox"
                      checked={detailsAgreement}
                      onChange={(e) => setDetailsAgreement(e.target.checked)}
                      className="mt-1 h-5 w-5 shrink-0 accent-emerald-600"
                    />
                    <span>
                      I confirm the booking details, booking type, care date,
                      service type, pet information, ZIP code, city/state, and
                      care notes are accurate to the best of my knowledge.
                    </span>
                  </label>

                  <label className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    <input
                      type="checkbox"
                      checked={paymentAgreement}
                      onChange={(e) => setPaymentAgreement(e.target.checked)}
                      className="mt-1 h-5 w-5 shrink-0 accent-emerald-600"
                    />
                    <span>
                      I understand SitGuru securely processes payment at checkout
                      and that payment handling, refunds, disputes, and
                      chargebacks are managed through SitGuru’s platform
                      policies.
                    </span>
                  </label>

                  <label className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    <input
                      type="checkbox"
                      checked={policyAgreement}
                      onChange={(e) => setPolicyAgreement(e.target.checked)}
                      className="mt-1 h-5 w-5 shrink-0 accent-emerald-600"
                    />
                    <span>
                      I understand Guru payouts are released 48 hours after
                      completed care unless a support case, refund request,
                      chargeback, or safety review is open.
                    </span>
                  </label>

                  <label className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    <input
                      type="checkbox"
                      checked={platformAgreement}
                      onChange={(e) => setPlatformAgreement(e.target.checked)}
                      className="mt-1 h-5 w-5 shrink-0 accent-emerald-600"
                    />
                    <span>
                      I agree to SitGuru’s{" "}
                      <Link
                        href="/terms"
                        className="font-black text-emerald-700 hover:text-emerald-800"
                        target="_blank"
                      >
                        Terms
                      </Link>
                      ,{" "}
                      <Link
                        href="/privacy"
                        className="font-black text-emerald-700 hover:text-emerald-800"
                        target="_blank"
                      >
                        Privacy Policy
                      </Link>
                      , cancellation/refund policies, and booking agreement
                      acknowledgments. I understand SitGuru connects pet parents
                      with independent Gurus and that care expectations should be
                      communicated clearly before service begins.
                    </span>
                  </label>
                </div>

                {error ? (
                  <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled={loading || !allAgreementsChecked}
                  onClick={handleCheckout}
                  className="mt-6 w-full rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                >
                  {loading
                    ? "Starting Secure Checkout..."
                    : "I Agree — Continue to Secure Checkout"}
                </button>

                {!allAgreementsChecked ? (
                  <p className="mt-3 text-center text-xs font-semibold text-slate-500">
                    Check all booking acknowledgments to continue.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}