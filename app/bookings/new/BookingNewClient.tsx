"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function cleanString(value: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getDefaultDate() {
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.toISOString().slice(0, 10);
}

export default function BookingNewClient() {
  const searchParams = useSearchParams();

  const guruSlugFromUrl = cleanString(searchParams.get("guru_slug"));
  const guruIdFromUrl = cleanString(searchParams.get("guru_id"));
  const petIdFromUrl = cleanString(searchParams.get("pet_id"));
  const petNameFromUrl = cleanString(searchParams.get("pet_name"));
  const petPhotoUrlFromUrl = cleanString(searchParams.get("pet_photo_url"));
  const serviceFromUrl = cleanString(searchParams.get("service"));

  const [petName, setPetName] = useState(petNameFromUrl || "");
  const [date, setDate] = useState(getDefaultDate());
  const [service, setService] = useState(serviceFromUrl || "General care");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedGuruLabel = useMemo(() => {
    if (guruSlugFromUrl) return guruSlugFromUrl;
    if (guruIdFromUrl) return guruIdFromUrl;
    return "No guru selected";
  }, [guruIdFromUrl, guruSlugFromUrl]);

  const hasSelectedPet = Boolean(petIdFromUrl || petNameFromUrl);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (!guruSlugFromUrl && !guruIdFromUrl) {
        setError("Missing guru information in booking link.");
        setLoading(false);
        return;
      }

      if (!petName.trim()) {
        setError("Pet name is required.");
        setLoading(false);
        return;
      }

      if (!date.trim()) {
        setError("Requested date is required.");
        setLoading(false);
        return;
      }

      const bookingPayload = {
        guruSlug: guruSlugFromUrl || undefined,
        guru_slug: guruSlugFromUrl || undefined,
        guruId: guruIdFromUrl || undefined,
        guru_id: guruIdFromUrl || undefined,
        petId: petIdFromUrl || undefined,
        pet_id: petIdFromUrl || undefined,
        petName: petName.trim(),
        pet_name: petName.trim(),
        petPhotoUrl: petPhotoUrlFromUrl || undefined,
        pet_photo_url: petPhotoUrlFromUrl || undefined,
        date: date.trim(),
        booking_date: date.trim(),
        service: service.trim(),
        service_name: service.trim(),
        notes: notes.trim(),
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

      window.location.href = stripeData.url;
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[75vh] max-w-5xl items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl rounded-[32px] bg-white p-6 text-black shadow-2xl md:p-8"
        >
          <h1 className="text-5xl font-black leading-none text-slate-950">
            SitGuru
            <br />
            Booking
            <br />
            Request
          </h1>

          <p className="mt-4 text-sm font-medium text-slate-600">
            Continue to secure checkout for the selected Guru and selected pet.
          </p>

          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
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

          <div className="mt-5 space-y-4">
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
                Service
              </label>
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="General care"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500"
              />
            </div>

            <div>
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
          </div>

          {error ? (
            <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-emerald-500 py-3.5 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            {loading ? "Redirecting to Stripe..." : "Continue to Secure Checkout"}
          </button>
        </form>
      </div>
    </main>
  );
}