"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PetProfile = {
  id: string;
  name: string | null;
  species?: string | null;
  pet_type?: string | null;
  breed?: string | null;
  temperament?: string | null;
  medications?: string | null;
  notes?: string | null;
  photo_url?: string | null;
};

type GuruQuickBookingFormProps = {
  guruId: string;
  guruSlug: string;
  guruName: string;
  guruHeadline?: string | null;
  guruPhotoUrl?: string | null;
  serviceOptions: string[];
  primaryService: string;
  hourlyRate: number | null;
  defaultCity?: string;
  defaultState?: string;
};

type ComplianceKey = "details" | "payments" | "payouts" | "terms";

const PLATFORM_FEE = 5;

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function todayForInput() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${today.getFullYear()}-${month}-${day}`;
}

function getPetType(pet: PetProfile | null) {
  return pet?.species || pet?.pet_type || "";
}

function getPetNotes(pet: PetProfile | null) {
  if (!pet) return "";

  return [
    pet.breed ? `Breed: ${pet.breed}` : "",
    pet.temperament ? `Temperament: ${pet.temperament}` : "",
    pet.medications ? `Medications: ${pet.medications}` : "",
    pet.notes ? `Pet notes: ${pet.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      response.ok
        ? "The server returned an unreadable response."
        : "The booking service returned a webpage instead of booking data. Confirm app/api/bookings/create/route.ts exists, has no TypeScript errors, and restart npm run dev."
    );
  }
}

export default function GuruQuickBookingForm({
  guruId,
  guruSlug,
  guruName,
  guruHeadline,
  guruPhotoUrl,
  serviceOptions,
  primaryService,
  hourlyRate,
  defaultCity = "",
  defaultState = "",
}: GuruQuickBookingFormProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [loadingPets, setLoadingPets] = useState(true);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [bookingType, setBookingType] = useState("request");
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("");
  const [serviceType, setServiceType] = useState(primaryService || "General care");
  const [bookingDate, setBookingDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("Flexible");
  const [careZipCode, setCareZipCode] = useState("");
  const [careCity, setCareCity] = useState(defaultCity);
  const [careState, setCareState] = useState(defaultState);
  const [careNotes, setCareNotes] = useState("");
  const [emergencyInstructions, setEmergencyInstructions] = useState("");
  const [savePetToDashboard, setSavePetToDashboard] = useState(true);

  const [compliance, setCompliance] = useState<Record<ComplianceKey, boolean>>({
    details: false,
    payments: false,
    payouts: false,
    terms: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) || null,
    [pets, selectedPetId]
  );

  const services = useMemo(() => {
    const cleaned = serviceOptions.map((service) => service.trim()).filter(Boolean);
    return Array.from(
      new Set([primaryService || "General care", ...cleaned, "General care"])
    );
  }, [primaryService, serviceOptions]);

  const servicePrice = typeof hourlyRate === "number" && hourlyRate > 0 ? hourlyRate : 25;
  const estimatedTotalBeforeTax = servicePrice + PLATFORM_FEE;
  const allComplianceChecked = Object.values(compliance).every(Boolean);

  const canCheckout =
    petName.trim().length > 0 &&
    petType.trim().length > 0 &&
    serviceType.trim().length > 0 &&
    bookingDate.trim().length > 0 &&
    careZipCode.trim().length > 0 &&
    careCity.trim().length > 0 &&
    careState.trim().length > 0 &&
    allComplianceChecked &&
    !submitting;

  useEffect(() => {
    async function loadCustomerPets() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoggedIn(false);
        setLoadingPets(false);
        return;
      }

      setIsLoggedIn(true);

      const { data, error } = await supabase
        .from("pets")
        .select("id,name,species,pet_type,breed,temperament,medications,notes,photo_url")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setPets((data || []) as PetProfile[]);
      }

      setLoadingPets(false);
    }

    loadCustomerPets();
  }, []);

  useEffect(() => {
    if (!selectedPet) return;

    setPetName(selectedPet.name || "");
    setPetType(getPetType(selectedPet));

    const notes = getPetNotes(selectedPet);
    if (notes && careNotes.trim().length === 0) {
      setCareNotes(notes);
    }
    // Only react to changing the selected saved pet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPetId]);

  function toggleCompliance(key: ComplianceKey) {
    setCompliance((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  async function handleCheckout() {
    try {
      setError("");

      if (!isLoggedIn) {
        const returnTo = pathname || `/guru/${guruSlug}`;
        router.push(`/customer/login?redirect=${encodeURIComponent(returnTo)}`);
        return;
      }

      if (!canCheckout) {
        setError("Please complete the booking details and required acknowledgments before checkout.");
        return;
      }

      setSubmitting(true);

      const createResponse = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          guruId,
          guruSlug,
          guruName,

          bookingType,
          petId: selectedPetId || null,
          savePetToDashboard: selectedPetId ? false : savePetToDashboard,

          petName: petName.trim(),
          petType: petType.trim(),

          serviceType: serviceType.trim(),
          bookingDate,
          requestedDate: bookingDate,

          preferredTime,
          timeWindow: preferredTime,

          careZipCode: careZipCode.trim(),
          careCity: careCity.trim(),
          careState: careState.trim().toUpperCase(),
          careArea: [careCity.trim(), careState.trim().toUpperCase(), careZipCode.trim()]
            .filter(Boolean)
            .join(", "),

          careNotes: careNotes.trim(),
          notes: careNotes.trim(),
          emergencyInstructions: emergencyInstructions.trim(),

          servicePrice,
          platformFee: PLATFORM_FEE,
          totalAmount: estimatedTotalBeforeTax,
          total: estimatedTotalBeforeTax,

          complianceAccepted: true,
          termsAccepted: true,
        }),
      });

      const created = await readJsonResponse(createResponse);

      if (!createResponse.ok || !created?.success) {
        throw new Error(
          created?.error ||
            created?.details?.message ||
            "Unable to create the booking request."
        );
      }

      const checkoutUrl = created.checkoutUrl || created.checkout_url || created.url;

      if (!checkoutUrl) {
        throw new Error("Booking was created, but no secure checkout URL was returned.");
      }

      window.location.href = checkoutUrl;
    } catch (err) {
      console.error("Checkout error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while preparing checkout."
      );

      setSubmitting(false);
    }
  }

  return (
    <div className="p-5 sm:p-6">
      <div className="rounded-[1.5rem] border border-emerald-100 !bg-emerald-50 p-5">
        <p className="!text-emerald-700 text-xs font-black uppercase tracking-[0.22em]">
          Selected Guru
        </p>

        <div className="mt-4 flex items-start gap-4">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-emerald-200 !bg-white shadow-sm">
            {guruPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={guruPhotoUrl}
                alt={guruName}
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center !text-slate-900 text-sm font-bold">
                {guruName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate !text-slate-950 text-lg font-black">{guruName}</p>
            <p className="mt-1 line-clamp-2 !text-slate-600 text-sm font-semibold leading-6">
              {guruHeadline || "Trusted SitGuru pet care provider"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 !bg-white px-3 py-1 !text-slate-900 text-xs font-bold">
                {money(servicePrice)}/hr
              </span>
              <span className="rounded-full border border-slate-200 !bg-white px-3 py-1 !text-slate-900 text-xs font-bold">
                {primaryService}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <label htmlFor="booking-type" className="mb-2 block !text-slate-900 text-sm font-black">
            Booking type
          </label>
          <select
            id="booking-type"
            value={bookingType}
            onChange={(event) => setBookingType(event.target.value)}
            className="min-h-[56px] w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3 !text-slate-900 text-base font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
          >
            <option value="request">Request Booking</option>
            <option value="instant">Instant Booking, if available</option>
          </select>
          <p className="mt-2 !text-slate-500 text-xs font-medium leading-6">
            Complete the details once. SitGuru will create the request and take you to secure checkout.
          </p>
        </div>

        {isLoggedIn ? (
          <div>
            <label htmlFor="saved-pet" className="mb-2 block !text-slate-900 text-sm font-black">
              Saved pet profile
            </label>
            <select
              id="saved-pet"
              value={selectedPetId}
              onChange={(event) => setSelectedPetId(event.target.value)}
              className="min-h-[56px] w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3 !text-slate-900 text-base font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            >
              <option value="">
                {loadingPets ? "Loading saved pets..." : "Choose saved pet or enter a new pet"}
              </option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name || "Unnamed pet"}
                  {getPetType(pet) ? ` • ${getPetType(pet)}` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 !bg-amber-50 p-4">
            <p className="!text-amber-900 text-sm font-black">Login required before checkout</p>
            <p className="mt-1 !text-amber-800 text-sm leading-6">
              You can review the form now. When you continue, SitGuru will ask you to log in so the booking appears in your dashboard.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pet-name" className="mb-2 block !text-slate-900 text-sm font-black">
              Pet name
            </label>
            <input
              id="pet-name"
              value={petName}
              onChange={(event) => setPetName(event.target.value)}
              placeholder="Ex. Scout"
              className="min-h-[56px] w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3 !text-slate-900 text-base font-semibold outline-none transition placeholder:!text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            />
          </div>

          <div>
            <label htmlFor="pet-type" className="mb-2 block !text-slate-900 text-sm font-black">
              Pet type
            </label>
            <select
              id="pet-type"
              value={petType}
              onChange={(event) => setPetType(event.target.value)}
              className="min-h-[56px] w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3 !text-slate-900 text-base font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            >
              <option value="">Choose pet type</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Bird">Bird</option>
              <option value="Small animal">Small animal</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {!selectedPetId && isLoggedIn ? (
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 !bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={savePetToDashboard}
              onChange={() => setSavePetToDashboard((current) => !current)}
              className="mt-1 h-4 w-4 accent-emerald-600"
            />
            <span className="!text-slate-700 text-sm font-semibold leading-6">
              Save this pet to my customer dashboard for faster future bookings.
            </span>
          </label>
        ) : null}

        <div>
          <label htmlFor="service-type" className="mb-2 block !text-slate-900 text-sm font-black">
            Service
          </label>
          <select
            id="service-type"
            value={serviceType}
            onChange={(event) => setServiceType(event.target.value)}
            className="min-h-[56px] w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3 !text-slate-900 text-base font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
          >
            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="booking-date" className="mb-2 block !text-slate-900 text-sm font-black">
              Requested date
            </label>
            <input
              id="booking-date"
              type="date"
              min={todayForInput()}
              value={bookingDate}
              onChange={(event) => setBookingDate(event.target.value)}
              className="min-h-[56px] w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3 !text-slate-900 text-base font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            />
          </div>

          <div>
            <label htmlFor="preferred-time" className="mb-2 block !text-slate-900 text-sm font-black">
              Preferred time
            </label>
            <select
              id="preferred-time"
              value={preferredTime}
              onChange={(event) => setPreferredTime(event.target.value)}
              className="min-h-[56px] w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3 !text-slate-900 text-base font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            >
              <option>Flexible</option>
              <option>Morning</option>
              <option>Midday</option>
              <option>Afternoon</option>
              <option>Evening</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[0.9fr_1fr_0.7fr]">
          <div>
            <label htmlFor="care-zip" className="mb-2 block !text-slate-900 text-sm font-black">
              ZIP code
            </label>
            <input
              id="care-zip"
              value={careZipCode}
              onChange={(event) => setCareZipCode(event.target.value)}
              placeholder="Ex. 18951"
              className="min-h-[56px] w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3 !text-slate-900 text-base font-semibold outline-none transition placeholder:!text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            />
          </div>

          <div>
            <label htmlFor="care-city" className="mb-2 block !text-slate-900 text-sm font-black">
              City
            </label>
            <input
              id="care-city"
              value={careCity}
              onChange={(event) => setCareCity(event.target.value)}
              placeholder="Ex. Quakertown"
              className="min-h-[56px] w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3 !text-slate-900 text-base font-semibold outline-none transition placeholder:!text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            />
          </div>

          <div>
            <label htmlFor="care-state" className="mb-2 block !text-slate-900 text-sm font-black">
              State
            </label>
            <input
              id="care-state"
              value={careState}
              onChange={(event) => setCareState(event.target.value.toUpperCase())}
              placeholder="PA"
              maxLength={2}
              className="min-h-[56px] w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3 !text-slate-900 text-base font-semibold uppercase outline-none transition placeholder:!text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            />
          </div>
        </div>

        <div>
          <label htmlFor="care-notes" className="mb-2 block !text-slate-900 text-sm font-black">
            Care notes
          </label>
          <textarea
            id="care-notes"
            value={careNotes}
            onChange={(event) => setCareNotes(event.target.value)}
            placeholder="Share pet routine, temperament, medications, feeding, timing, or home-access notes."
            rows={4}
            className="w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3 !text-slate-900 text-base font-semibold outline-none transition placeholder:!text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
          />
        </div>

        <div>
          <label htmlFor="emergency-instructions" className="mb-2 block !text-slate-900 text-sm font-black">
            Emergency or special instructions
          </label>
          <textarea
            id="emergency-instructions"
            value={emergencyInstructions}
            onChange={(event) => setEmergencyInstructions(event.target.value)}
            placeholder="Emergency contact, allergies, behavior notes, access instructions, or anything your Guru should review."
            rows={3}
            className="w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3 !text-slate-900 text-base font-semibold outline-none transition placeholder:!text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
          />
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 !bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="!text-slate-950 text-lg font-black">Review before checkout</p>
            <span className="rounded-full border border-emerald-200 !bg-white px-3 py-1 !text-emerald-700 text-xs font-black">
              Transparent pricing
            </span>
          </div>

          <div className="mt-4 space-y-3 text-sm font-semibold">
            <div className="flex items-center justify-between gap-4 !text-slate-700">
              <span>{serviceType || "Service"}</span>
              <span className="!text-slate-950">{money(servicePrice)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 !text-slate-700">
              <span>SitGuru platform fee</span>
              <span className="!text-slate-950">{money(PLATFORM_FEE)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 !text-slate-700">
              <span>Taxes</span>
              <span className="!text-slate-950">Calculated at checkout</span>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between gap-4 text-base">
                <span className="!text-slate-950 font-black">Estimated total before tax</span>
                <span className="!text-slate-950 font-black">{money(estimatedTotalBeforeTax)}</span>
              </div>
            </div>
          </div>

          <p className="mt-4 !text-slate-500 text-xs font-semibold leading-6">
            Taxes, if applicable, are calculated securely during Stripe Checkout based on your billing/location details. Your final total will be shown before payment is completed.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 !bg-white p-4">
            <input
              type="checkbox"
              checked={compliance.details}
              onChange={() => toggleCompliance("details")}
              className="mt-1 h-4 w-4 accent-emerald-600"
            />
            <span className="!text-slate-700 text-sm font-semibold leading-6">
              I confirm the booking details, booking type, care date, service type, pet information, ZIP code, city/state, and care notes are accurate to the best of my knowledge.
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 !bg-white p-4">
            <input
              type="checkbox"
              checked={compliance.payments}
              onChange={() => toggleCompliance("payments")}
              className="mt-1 h-4 w-4 accent-emerald-600"
            />
            <span className="!text-slate-700 text-sm font-semibold leading-6">
              I understand SitGuru securely processes payment at checkout and that payment handling, refunds, disputes, and chargebacks are managed through SitGuru’s platform policies.
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 !bg-white p-4">
            <input
              type="checkbox"
              checked={compliance.payouts}
              onChange={() => toggleCompliance("payouts")}
              className="mt-1 h-4 w-4 accent-emerald-600"
            />
            <span className="!text-slate-700 text-sm font-semibold leading-6">
              I understand Guru payouts are released 48 hours after completed care unless a support case, refund request, chargeback, or safety review is open.
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 !bg-white p-4">
            <input
              type="checkbox"
              checked={compliance.terms}
              onChange={() => toggleCompliance("terms")}
              className="mt-1 h-4 w-4 accent-emerald-600"
            />
            <span className="!text-slate-700 text-sm font-semibold leading-6">
              I agree to SitGuru’s{" "}
              <a href="/terms" className="font-black !text-emerald-700 underline-offset-4 hover:underline">
                Terms
              </a>
              ,{" "}
              <a href="/privacy" className="font-black !text-emerald-700 underline-offset-4 hover:underline">
                Privacy Policy
              </a>
              , cancellation/refund policies, and booking agreement acknowledgments.
            </span>
          </label>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 !bg-red-50 p-4">
            <p className="!text-red-700 text-sm font-black">{error}</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={!canCheckout}
          className="inline-flex min-h-[64px] w-full items-center justify-center rounded-2xl !bg-emerald-500 px-6 py-4 text-center text-lg font-black tracking-tight !text-slate-950 shadow-[0_18px_40px_rgba(16,185,129,0.20)] transition hover:!bg-emerald-400 disabled:cursor-not-allowed disabled:!bg-slate-200 disabled:!text-slate-500"
        >
          {submitting ? "Preparing Secure Checkout..." : "I Agree — Continue to Secure Checkout"}
        </button>

        <p className="!text-slate-500 text-xs font-medium leading-6">
          Your booking request, pet details, compliance acknowledgments, and payment status will appear in your customer dashboard after checkout begins.
        </p>
      </div>
    </div>
  );
}