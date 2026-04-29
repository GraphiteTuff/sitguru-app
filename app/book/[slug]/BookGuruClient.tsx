"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type BookingStep = 1 | 2 | 3;

type PetProfile = {
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

type BookGuruClientProps = {
  guruId?: string | number;
  guruSlug: string;
  guruName: string;

  // Current/new prop names from app/book/[slug]/page.tsx
  calendarUsername?: string | null;
  calendarEventTypeSlug?: string | null;

  // Older prop names kept so existing work does not break
  calUsername?: string | null;
  calEventTypeSlug?: string | null;
};

type CustomerProfile = {
  full_name: string | null;
};

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDisplayDate(value: string) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function StepBadge({
  number,
  label,
  active,
  complete,
}: {
  number: number;
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-black transition ${
          complete
            ? "border-emerald-400 bg-emerald-500 text-slate-950"
            : active
              ? "border-emerald-400 bg-emerald-500/10 text-emerald-300"
              : "border-slate-700 bg-slate-900 text-slate-400"
        }`}
      >
        {complete ? "✓" : number}
      </div>

      <div className="min-w-0">
        <p
          className={`text-sm font-bold ${
            active || complete ? "text-white" : "text-slate-400"
          }`}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

export default function BookGuruClient({
  guruId,
  guruSlug,
  guruName,
  calendarUsername,
  calendarEventTypeSlug,
  calUsername,
  calEventTypeSlug,
}: BookGuruClientProps) {
  const router = useRouter();

  const resolvedCalendarUsername = calendarUsername || calUsername || "";
  const resolvedCalendarEventTypeSlug =
    calendarEventTypeSlug || calEventTypeSlug || "";

  const [step, setStep] = useState<BookingStep>(1);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);

  const [selectedPetId, setSelectedPetId] = useState("");
  const [petName, setPetName] = useState("");
  const [serviceType, setServiceType] = useState("Drop-In Visit");
  const [bookingDate, setBookingDate] = useState("");
  const [timeWindow, setTimeWindow] = useState("Morning");
  const [visitLength, setVisitLength] = useState("30 minutes");
  const [notes, setNotes] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [detailsAccepted, setDetailsAccepted] = useState(false);
  const [paymentAccepted, setPaymentAccepted] = useState(false);
  const [payoutAccepted, setPayoutAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) ?? null,
    [pets, selectedPetId]
  );

  useEffect(() => {
    async function loadPetsAndCustomer() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPetsLoading(false);
        return;
      }

      setCustomerEmail(user.email ?? "");

      const [{ data: petData }, { data: profileData }] = await Promise.all([
        supabase
          .from("pets")
          .select(
            "id, name, species, breed, age, weight, temperament, medications, notes, photo_url, video_url"
          )
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle<CustomerProfile>(),
      ]);

      setPets(petData || []);
      setPetsLoading(false);

      if (profileData?.full_name) {
        setCustomerName(profileData.full_name);
      }
    }

    loadPetsAndCustomer();
  }, []);

  useEffect(() => {
    if (!selectedPet) return;

    setPetName(selectedPet.name || "");

    const autoNotes = [
      selectedPet.species ? `Species: ${selectedPet.species}` : "",
      selectedPet.breed ? `Breed: ${selectedPet.breed}` : "",
      selectedPet.age ? `Age: ${selectedPet.age}` : "",
      selectedPet.weight ? `Weight: ${selectedPet.weight}` : "",
      selectedPet.temperament ? `Temperament: ${selectedPet.temperament}` : "",
      selectedPet.medications ? `Medications: ${selectedPet.medications}` : "",
      selectedPet.notes ? `Pet notes: ${selectedPet.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    setNotes((current) => {
      if (current.trim().length > 0) return current;
      return autoNotes;
    });
  }, [selectedPet]);

  const servicePrice = useMemo(() => {
    if (visitLength === "60 minutes") return 40;
    if (visitLength === "90 minutes") return 55;
    return 25;
  }, [visitLength]);

  const platformFee = 5;
  const total = servicePrice + platformFee;

  const canContinueStep1 = petName.trim().length > 0 && bookingDate.length > 0;
  const canContinueStep2 = true;
  const allAcknowledgementsAccepted =
    detailsAccepted && paymentAccepted && payoutAccepted && termsAccepted;

  const handleNext = () => {
    setSubmitError("");

    if (step === 1 && canContinueStep1) {
      setStep(2);
      return;
    }

    if (step === 2 && canContinueStep2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setSubmitError("");

    if (step === 3) setStep(2);
    if (step === 2) setStep(1);
  };

  function extractApiError(data: unknown, fallback: string) {
    if (!data || typeof data !== "object") return fallback;

    const responseData = data as {
      error?: unknown;
      message?: unknown;
      details?: unknown;
    };

    if (typeof responseData.error === "string" && responseData.error.trim()) {
      return responseData.error.trim();
    }

    if (typeof responseData.message === "string" && responseData.message.trim()) {
      return responseData.message.trim();
    }

    if (typeof responseData.details === "string" && responseData.details.trim()) {
      return responseData.details.trim();
    }

    if (responseData.details && typeof responseData.details === "object") {
      const details = responseData.details as {
        message?: unknown;
        error?: unknown;
        hint?: unknown;
        details?: unknown;
        code?: unknown;
      };

      const detailParts = [
        typeof details.message === "string" ? details.message : "",
        typeof details.error === "string" ? details.error : "",
        typeof details.details === "string" ? details.details : "",
        typeof details.hint === "string" ? `Hint: ${details.hint}` : "",
        typeof details.code === "string" ? `Code: ${details.code}` : "",
      ].filter(Boolean);

      if (detailParts.length > 0) {
        return detailParts.join(" | ");
      }
    }

    return fallback;
  }

  async function readBookingResponse(response: Response) {
    const responseText = await response.text();
    const contentType = response.headers.get("content-type") || "";

    if (!responseText) {
      return null;
    }

    if (!contentType.includes("application/json")) {
      console.error("Booking API returned non-JSON response:", {
        status: response.status,
        contentType,
        responseText: responseText.slice(0, 1200),
      });

      throw new Error(
        "The booking service returned a webpage instead of booking data. Confirm app/api/stripe/bookings/route.ts exists, has no TypeScript errors, and restart npm run dev."
      );
    }

    try {
      return JSON.parse(responseText) as {
        success?: boolean;
        error?: string;
        message?: string;
        details?: unknown;
        booking?: {
          id?: string | number;
          uid?: string;
        };
        checkoutUrl?: string;
        url?: string;
        stripeSessionId?: string;
      };
    } catch (error) {
      console.error("Booking API returned invalid JSON:", {
        status: response.status,
        contentType,
        responseText: responseText.slice(0, 1200),
        error,
      });

      throw new Error(
        "The booking service returned invalid booking data. Check the server terminal for the API error."
      );
    }
  }

  const handleConfirm = async () => {
    try {
      setSubmitError("");

      if (!resolvedCalendarUsername || !resolvedCalendarEventTypeSlug) {
        setSubmitError(
          "This Guru is not fully connected to scheduling yet. Please try another Guru or contact support."
        );
        return;
      }

      if (!petName.trim() || !bookingDate) {
        setSubmitError("Please complete the booking details before confirming.");
        return;
      }

      if (!allAcknowledgementsAccepted) {
        setSubmitError(
          "Please check all acknowledgements before continuing to secure checkout."
        );
        return;
      }

      const finalName = customerName?.trim() || "SitGuru Customer";
      const finalEmail = customerEmail?.trim() || "customer@sitguru.com";

      setSubmitting(true);

      const bookingPayload = {
        guruId,
        guru_id: guruId,
        slug: guruSlug,
        guruSlug,
        calendarUsername: resolvedCalendarUsername,
        calendarEventTypeSlug: resolvedCalendarEventTypeSlug,
        bookingType: "instant_booking",
        booking_type: "instant_booking",
        start: new Date().toISOString(),
        customerName: finalName,
        customer_name: finalName,
        customerEmail: finalEmail,
        customer_email: finalEmail,
        petId: selectedPetId || null,
        pet_id: selectedPetId || null,
        petName: petName.trim(),
        pet_name: petName.trim(),
        serviceType,
        service_type: serviceType,
        requestedDate: bookingDate,
        requested_date: bookingDate,
        booking_date: bookingDate,
        date: bookingDate,
        timeWindow,
        time_window: timeWindow,
        visitLength,
        visit_length: visitLength,
        servicePrice,
        service_price: servicePrice,
        platformFee,
        platform_fee: platformFee,
        total,
        total_amount: total,
        amount_total: total,
        complianceAccepted: true,
        compliance_accepted: true,
        termsAccepted: true,
        terms_accepted: true,
        notes: [
          `Service: ${serviceType}`,
          `Requested date: ${bookingDate}`,
          `Time window: ${timeWindow}`,
          `Visit length: ${visitLength}`,
          "",
          notes.trim(),
        ]
          .filter(Boolean)
          .join("\n"),
      };

      const response = await fetch("/api/stripe/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingPayload),
      });

      const data = await readBookingResponse(response);

      if (!response.ok) {
        console.error("Booking API failed:", {
          status: response.status,
          data,
          bookingPayload,
        });

        throw new Error(
          extractApiError(data, "Unable to create the booking request. Check the VS Code terminal for the API error.")
        );
      }

      const checkoutUrl = data?.checkoutUrl || data?.url;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      const params = new URLSearchParams({
        booking: "confirmed",
        guru: guruSlug,
      });

      if (selectedPetId) {
        params.set("pet_id", selectedPetId);
      }

      if (data?.booking?.uid) {
        params.set("booking_uid", data.booking.uid);
      }

      if (data?.booking?.id) {
        params.set("booking_id", String(data.booking.id));
      }

      router.push(`/customer/dashboard?${params.toString()}`);
    } catch (error) {
      console.error("Booking submit failed:", error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the booking."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_22%),linear-gradient(180deg,#020617_0%,#07152f_42%,#08152f_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8">
          <Link
            href={`/guru/${guruSlug}`}
            className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            ← Back to Guru
          </Link>
        </div>

        <div className="mb-8 rounded-[2rem] border border-white/10 bg-slate-950/50 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Premium booking flow
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Book {guruName}
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
            A cleaner, guided flow that helps customers move from interest to
            secure checkout with more confidence.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StepBadge
              number={1}
              label="Care Details"
              active={step === 1}
              complete={step > 1}
            />
            <StepBadge
              number={2}
              label="Review Booking"
              active={step === 2}
              complete={step > 2}
            />
            <StepBadge
              number={3}
              label="Secure Checkout"
              active={step === 3}
              complete={false}
            />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="space-y-6">
            {step === 1 ? (
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
                  Step 1 of 3
                </p>

                <h2 className="mt-2 text-3xl font-black text-white">
                  Tell us about your pet and visit
                </h2>

                <p className="mt-3 text-base leading-7 text-slate-300">
                  Start with the essentials so your Guru can quickly understand
                  your request.
                </p>

                <div className="mt-8 grid gap-5">
                  <div>
                    <label
                      htmlFor="pet-profile"
                      className="mb-2 block text-sm font-bold text-white"
                    >
                      Saved pet profile
                    </label>

                    <select
                      id="pet-profile"
                      value={selectedPetId}
                      onChange={(e) => setSelectedPetId(e.target.value)}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-base font-semibold text-white outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    >
                      <option value="">
                        {petsLoading
                          ? "Loading saved pets..."
                          : "Select a saved pet or enter manually"}
                      </option>

                      {pets.map((pet) => (
                        <option key={pet.id} value={pet.id}>
                          {pet.name}
                          {pet.breed ? ` • ${pet.breed}` : ""}
                          {pet.age ? ` • ${pet.age}` : ""}
                        </option>
                      ))}
                    </select>

                    {pets.length === 0 && !petsLoading ? (
                      <p className="mt-2 text-sm text-slate-400">
                        No saved pets yet. You can still enter details manually
                        or add a pet from your dashboard.
                      </p>
                    ) : null}
                  </div>

                  {selectedPet ? (
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                          {selectedPet.photo_url ? (
                            <img
                              src={selectedPet.photo_url}
                              alt={selectedPet.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">🐾</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-lg font-black text-white">
                            {selectedPet.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-300">
                            {[
                              selectedPet.species,
                              selectedPet.breed,
                              selectedPet.age,
                            ]
                              .filter(Boolean)
                              .join(" • ") || "Saved pet profile"}
                          </p>

                          {selectedPet.temperament ? (
                            <p className="mt-2 text-sm text-slate-300">
                              <span className="font-semibold text-white">
                                Temperament:
                              </span>{" "}
                              {selectedPet.temperament}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label
                      htmlFor="pet-name"
                      className="mb-2 block text-sm font-bold text-white"
                    >
                      Pet name
                    </label>

                    <input
                      id="pet-name"
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                      placeholder="Ex. Scout"
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-base font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="service-type"
                        className="mb-2 block text-sm font-bold text-white"
                      >
                        Service
                      </label>

                      <select
                        id="service-type"
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-base font-semibold text-white outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      >
                        <option>Drop-In Visit</option>
                        <option>Dog Walking</option>
                        <option>Pet Sitting</option>
                        <option>Cat Care</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="booking-date"
                        className="mb-2 block text-sm font-bold text-white"
                      >
                        Requested date
                      </label>

                      <input
                        id="booking-date"
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-base font-semibold text-white outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="time-window"
                        className="mb-2 block text-sm font-bold text-white"
                      >
                        Time window
                      </label>

                      <select
                        id="time-window"
                        value={timeWindow}
                        onChange={(e) => setTimeWindow(e.target.value)}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-base font-semibold text-white outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      >
                        <option>Morning</option>
                        <option>Midday</option>
                        <option>Afternoon</option>
                        <option>Evening</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="visit-length"
                        className="mb-2 block text-sm font-bold text-white"
                      >
                        Visit length
                      </label>

                      <select
                        id="visit-length"
                        value={visitLength}
                        onChange={(e) => setVisitLength(e.target.value)}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-base font-semibold text-white outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      >
                        <option>30 minutes</option>
                        <option>60 minutes</option>
                        <option>90 minutes</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="booking-notes"
                      className="mb-2 block text-sm font-bold text-white"
                    >
                      Care notes
                    </label>

                    <textarea
                      id="booking-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Share temperament, routine, medication, feeding instructions, access notes, or anything your Guru should know."
                      rows={6}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-base font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canContinueStep1}
                    className={`inline-flex min-h-[56px] items-center justify-center rounded-2xl px-6 py-4 text-base font-black transition ${
                      canContinueStep1
                        ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                        : "cursor-not-allowed bg-slate-800 text-slate-500"
                    }`}
                  >
                    Continue to Review
                  </button>

                  {!canContinueStep1 ? (
                    <p className="text-sm font-medium text-slate-400">
                      Add a pet name and date to continue.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
                  Step 2 of 3
                </p>

                <h2 className="mt-2 text-3xl font-black text-white">
                  Review your booking
                </h2>

                <p className="mt-3 text-base leading-7 text-slate-300">
                  Confirm the details before moving to secure checkout.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                    <p className="text-sm font-semibold text-slate-400">Guru</p>
                    <p className="mt-2 text-xl font-black text-white">
                      {guruName}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                    <p className="text-sm font-semibold text-slate-400">Pet</p>
                    <p className="mt-2 text-xl font-black text-white">
                      {petName || "—"}
                    </p>

                    {selectedPet ? (
                      <p className="mt-2 text-sm text-slate-300">
                        Using saved profile: {selectedPet.name}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                    <p className="text-sm font-semibold text-slate-400">Date</p>
                    <p className="mt-2 text-xl font-black text-white">
                      {formatDisplayDate(bookingDate)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                    <p className="text-sm font-semibold text-slate-400">
                      Time window
                    </p>
                    <p className="mt-2 text-xl font-black text-white">
                      {timeWindow}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                    <p className="text-sm font-semibold text-slate-400">
                      Service
                    </p>
                    <p className="mt-2 text-xl font-black text-white">
                      {serviceType}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                    <p className="text-sm font-semibold text-slate-400">
                      Visit length
                    </p>
                    <p className="mt-2 text-xl font-black text-white">
                      {visitLength}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                  <p className="text-sm font-semibold text-slate-400">
                    Care notes
                  </p>
                  <p className="mt-3 whitespace-pre-line text-base leading-8 text-slate-200">
                    {notes || "No additional notes provided yet."}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex min-h-[56px] items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-black text-white transition hover:bg-white/10"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex min-h-[56px] items-center justify-center rounded-2xl bg-emerald-500 px-6 py-4 text-base font-black text-slate-950 transition hover:bg-emerald-400"
                  >
                    Continue to Secure Checkout
                  </button>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
                  Step 3 of 3
                </p>

                <h2 className="mt-2 text-3xl font-black text-white">
                  Secure checkout
                </h2>

                <p className="mt-3 text-base leading-7 text-slate-300">
                  Review the acknowledgements below before your booking request
                  continues to secure checkout.
                </p>

                <div className="mt-8 rounded-[1.6rem] border border-emerald-400/20 bg-emerald-500/10 p-5">
                  <p className="text-lg font-black text-emerald-300">
                    Protected payment flow
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-200">
                    SitGuru securely processes payment at checkout. Booking
                    records, acknowledgements, and payment status are saved to
                    support customer protection, Guru payouts, and admin review.
                  </p>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                    <p className="text-sm font-semibold text-slate-400">
                      Billing summary
                    </p>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-sm text-slate-200">
                        <span>{serviceType}</span>
                        <span className="font-bold">
                          {formatMoney(servicePrice)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-slate-200">
                        <span>Platform fee</span>
                        <span className="font-bold">
                          {formatMoney(platformFee)}
                        </span>
                      </div>

                      <div className="border-t border-white/10 pt-3 text-base font-black text-white">
                        <div className="flex items-center justify-between">
                          <span>Total</span>
                          <span>{formatMoney(total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                    <p className="text-sm font-semibold text-slate-400">
                      What happens after checkout
                    </p>

                    <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-200">
                      <li>• Your request is saved to your customer dashboard</li>
                      <li>• Your Guru receives the booking information</li>
                      <li>• Payment status is tracked securely</li>
                      <li>• Support can review refunds or disputes if needed</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <label className="flex cursor-pointer gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07]">
                    <input
                      type="checkbox"
                      checked={detailsAccepted}
                      onChange={(e) => setDetailsAccepted(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-slate-500 accent-emerald-500"
                    />
                    <span className="text-sm font-semibold leading-7 text-slate-200">
                      I confirm the pet care details, requested date, visit
                      length, notes, and pricing are accurate to the best of my
                      knowledge.
                    </span>
                  </label>

                  <label className="flex cursor-pointer gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07]">
                    <input
                      type="checkbox"
                      checked={paymentAccepted}
                      onChange={(e) => setPaymentAccepted(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-slate-500 accent-emerald-500"
                    />
                    <span className="text-sm font-semibold leading-7 text-slate-200">
                      I understand SitGuru securely processes payment at
                      checkout and that payment handling, refunds, disputes, and
                      chargebacks are managed through SitGuru&apos;s platform
                      policies.
                    </span>
                  </label>

                  <label className="flex cursor-pointer gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07]">
                    <input
                      type="checkbox"
                      checked={payoutAccepted}
                      onChange={(e) => setPayoutAccepted(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-slate-500 accent-emerald-500"
                    />
                    <span className="text-sm font-semibold leading-7 text-slate-200">
                      I understand Guru payouts are released after completed
                      care unless a support case, refund request, chargeback, or
                      safety review is open.
                    </span>
                  </label>

                  <label className="flex cursor-pointer gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07]">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-slate-500 accent-emerald-500"
                    />
                    <span className="text-sm font-semibold leading-7 text-slate-200">
                      I agree to SitGuru&apos;s{" "}
                      <Link
                        href="/terms"
                        className="font-black text-emerald-300 hover:text-emerald-200"
                      >
                        Terms
                      </Link>
                      ,{" "}
                      <Link
                        href="/privacy"
                        className="font-black text-emerald-300 hover:text-emerald-200"
                      >
                        Privacy Policy
                      </Link>
                      , cancellation/refund policies, and booking agreement
                      acknowledgements.
                    </span>
                  </label>
                </div>

                {submitError ? (
                  <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4">
                    <p className="text-sm font-semibold text-rose-200">
                      {submitError}
                    </p>
                  </div>
                ) : null}

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={submitting}
                    className="inline-flex min-h-[56px] items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={submitting || !allAcknowledgementsAccepted}
                    className={`inline-flex min-h-[56px] items-center justify-center rounded-2xl px-6 py-4 text-base font-black transition disabled:cursor-not-allowed ${
                      submitting || !allAcknowledgementsAccepted
                        ? "bg-slate-800 text-slate-500"
                        : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    }`}
                  >
                    {submitting
                      ? "Submitting Booking..."
                      : "I Agree — Continue to Secure Checkout"}
                  </button>
                </div>

                <p className="mt-4 text-sm font-semibold leading-7 text-slate-400">
                  Your booking request, pet details, compliance
                  acknowledgements, and payment status will appear in your
                  customer dashboard after checkout begins.
                </p>
              </div>
            ) : null}
          </section>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-300 bg-white p-5 text-slate-900 shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-6 lg:sticky lg:top-6">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full border border-emerald-400 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                  Booking Summary
                </span>

                <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {step === 1
                    ? "Care Details"
                    : step === 2
                      ? "Review"
                      : "Checkout"}
                </span>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-slate-300 bg-slate-50 p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-300 bg-white text-sm font-black text-slate-800 shadow-sm">
                    {initialsFromName(guruName)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-lg font-black text-slate-900">
                      {guruName}
                    </p>

                    <p className="truncate text-sm font-semibold text-slate-700">
                      Premium booking experience
                    </p>
                  </div>
                </div>
              </div>

              {selectedPet ? (
                <div className="mt-5 rounded-[1.5rem] border border-slate-300 bg-slate-50 p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Selected pet profile
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white">
                      {selectedPet.photo_url ? (
                        <img
                          src={selectedPet.photo_url}
                          alt={selectedPet.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">🐾</span>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {selectedPet.name}
                      </p>

                      <p className="text-xs text-slate-600">
                        {[
                          selectedPet.species,
                          selectedPet.breed,
                          selectedPet.age,
                        ]
                          .filter(Boolean)
                          .join(" • ") || "Saved profile"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-300 bg-white p-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-slate-600">Pet</span>
                    <span className="text-right font-black text-slate-900">
                      {petName || "—"}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-300 bg-white p-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-slate-600">Date</span>
                    <span className="text-right font-black text-slate-900">
                      {formatDisplayDate(bookingDate)}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-300 bg-white p-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-slate-600">Service</span>
                    <span className="text-right font-black text-slate-900">
                      {serviceType}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-300 bg-white p-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-slate-600">Length</span>
                    <span className="text-right font-black text-slate-900">
                      {visitLength}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.6rem] border border-slate-300 bg-slate-50 p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>{serviceType}</span>
                    <span className="font-black text-slate-900">
                      {formatMoney(servicePrice)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>Platform fee</span>
                    <span className="font-black text-slate-900">
                      {formatMoney(platformFee)}
                    </span>
                  </div>

                  <div className="border-t border-slate-300 pt-3">
                    <div className="flex items-center justify-between text-base">
                      <span className="font-black text-slate-900">Total</span>
                      <span className="font-black text-slate-900">
                        {formatMoney(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs font-medium leading-6 text-slate-600">
                  Secure checkout and payment confirmation happen before the
                  booking is finalized.
                </p>
              </div>

              <div className="mt-6 rounded-[1.6rem] border border-slate-300 bg-white p-5">
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-slate-500">
                  What happens next
                </p>

                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 shadow-sm">
                    <p className="text-sm font-black text-slate-900">
                      Your Guru reviews the request
                    </p>

                    <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                      Your details and care notes help them respond more quickly.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 shadow-sm">
                    <p className="text-sm font-black text-slate-900">
                      Secure confirmation follows
                    </p>

                    <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                      You will move through a protected payment and confirmation
                      experience.
                    </p>
                  </div>
                </div>

                <Link
                  href="/find-care"
                  className="mt-5 inline-flex items-center text-sm font-black text-emerald-700 transition hover:text-emerald-600"
                >
                  Browse more Gurus →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}