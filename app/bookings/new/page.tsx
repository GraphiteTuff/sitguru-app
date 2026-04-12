"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Calendar from "react-calendar";
import { format } from "date-fns";
import { ChevronLeft, Check, AlertCircle, CalendarDays, Clock } from "lucide-react";
import "react-calendar/dist/Calendar.css";

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/90 backdrop-blur-xl shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

export default function NewBookingPage() {
  const searchParams = useSearchParams();
  const guruId = searchParams.get("provider");

  const [guru, setGuru] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(Date.now() + 86400000));
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [noAvailability, setNoAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load guru, their services, and customer pets
  useEffect(() => {
    async function loadData() {
      if (!guruId) {
        setError("No guru selected.");
        setLoading(false);
        return;
      }

      try {
        const { data: guruData } = await supabase
          .from("gurus")
          .select("id, full_name, title, city, state, image_url, services")
          .eq("id", guruId)
          .single();

        if (!guruData) {
          setError("Guru not found.");
          setLoading(false);
          return;
        }

        setGuru(guruData);
        setServices(guruData.services || []); // Use guru's own services

        if (guruData.services && guruData.services.length > 0) {
          setSelectedService(guruData.services[0].name);
        }

        // Load customer's pets
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          const { data: petData } = await supabase
            .from("pets")
            .select("*")
            .eq("owner_id", user.user.id);
          setPets(petData || []);
          if (petData?.length) setSelectedPet(petData[0].id);
        }
      } catch (err) {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [guruId]);

  // Load available times
  useEffect(() => {
    async function loadTimes() {
      if (!selectedDate || !guruId) return;

      const dateStr = format(selectedDate, "yyyy-MM-dd");

      const { data } = await supabase
        .from("guru_availability")
        .select("start_time")
        .eq("guru_id", guruId)
        .eq("available_date", dateStr)
        .eq("is_booked", false)
        .order("start_time");

      const times = data?.map((item: any) => {
        const [hours, minutes] = item.start_time.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes.padStart(2, "0")} ${ampm}`;
      }) || [];

      setAvailableTimes(times);
      setSelectedTime(times[0] || "");
      setNoAvailability(times.length === 0);
    }

    if (selectedDate) loadTimes();
  }, [selectedDate, guruId]);

  const currentService = services.find((s) => s.name === selectedService) || { price: 0, duration: "" };

  const handleBook = async () => {
    if (!selectedTime || !guruId || !selectedPet || !selectedService) return;

    setSubmitting(true);

    const bookingDateTime = `${format(selectedDate, "yyyy-MM-dd")} ${selectedTime}`;

    const { error } = await supabase.from("bookings").insert({
      customer_id: (await supabase.auth.getUser()).data.user?.id,
      sitter_id: guruId,
      pet_id: selectedPet,
      service: selectedService,
      booking_date: bookingDateTime,
      price: currentService.price,
      status: "pending",
      message: message || null,
    });

    if (error) {
      alert("Booking failed. Please try again.");
    } else {
      await supabase
        .from("guru_availability")
        .update({ is_booked: true })
        .eq("guru_id", guruId)
        .eq("available_date", format(selectedDate, "yyyy-MM-dd"))
        .eq("start_time", selectedTime.replace(/ [AP]M$/, ""));

      window.location.href = `/bookings/success?guru=${encodeURIComponent(guru.full_name)}&service=${encodeURIComponent(selectedService)}`;
    }

    setSubmitting(false);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-6">
        <GlassCard className="max-w-md p-10 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-2xl font-bold">Something went wrong</h2>
          <p className="mt-4 text-gray-400">{error}</p>
          <Link href="/search" className="mt-8 block w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold">
            Back to Search
          </Link>
        </GlassCard>
      </div>
    );
  }

  if (loading || !guru) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">Loading booking experience...</div>;
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <Link href={`/guru/${guru.id}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8">
          <ChevronLeft className="h-5 w-5" /> Back to {guru.full_name}
        </Link>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* Left Column - Form */}
          <div className="lg:col-span-7 space-y-10">
            <GlassCard className="p-10">
              <h1 className="text-4xl font-bold tracking-tight">Book with {guru.full_name}</h1>
              <p className="text-gray-400 mt-2">{guru.title} • {guru.city}, {guru.state}</p>

              {/* Dynamic Services from Guru's Profile */}
              <div className="mt-10">
                <h2 className="text-xl font-semibold mb-5">Choose a service</h2>
                {services.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {services.map((service, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedService(service.name)}
                        className={`p-6 rounded-2xl border text-left transition-all ${
                          selectedService === service.name
                            ? "border-emerald-500 bg-emerald-950/50"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                      >
                        <div className="font-medium text-lg">{service.name}</div>
                        <div className="text-2xl font-bold text-emerald-400 mt-3">${service.price}</div>
                        <div className="text-sm text-gray-500 mt-1">{service.duration}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">This guru has not added any services yet.</p>
                )}
              </div>

              {/* Calendar */}
              <div className="mt-12">
                <h2 className="text-xl font-semibold mb-5 flex items-center gap-3">
                  <CalendarDays className="h-6 w-6" /> Select a date
                </h2>
                <div className="bg-[#111] rounded-3xl p-8 border border-gray-800">
                  <Calendar
                    onChange={(date) => setSelectedDate(date as Date)}
                    value={selectedDate}
                    minDate={new Date()}
                    className="custom-calendar mx-auto"
                    tileClassName={({ date, view }) =>
                      view === "month" && format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                        ? "bg-emerald-600 text-white font-bold rounded-full"
                        : ""
                    }
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div className="mt-12">
                <h2 className="text-xl font-semibold mb-5 flex items-center gap-3">
                  <Clock className="h-6 w-6" /> Available times
                </h2>
                {noAvailability ? (
                  <div className="bg-amber-950/50 border border-amber-800 p-6 rounded-2xl flex gap-4">
                    <AlertCircle className="h-6 w-6 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-400">No availability on this date</p>
                      <p className="text-sm text-gray-400 mt-1">Please select another date.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-4 rounded-2xl text-sm font-medium transition-all ${
                          selectedTime === time
                            ? "bg-emerald-600 text-white"
                            : "bg-[#111] border border-gray-700 hover:border-gray-600"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pet Selection */}
              <div className="mt-12">
                <h2 className="text-xl font-semibold mb-5">Select your pet</h2>
                {pets.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {pets.map((pet) => (
                      <button
                        key={pet.id}
                        onClick={() => setSelectedPet(pet.id)}
                        className={`p-6 rounded-2xl border flex items-center gap-4 transition-all ${
                          selectedPet === pet.id
                            ? "border-emerald-500 bg-emerald-950/50"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                      >
                        <div className="text-4xl">{pet.type === "dog" ? "🐶" : "🐱"}</div>
                        <div>
                          <p className="font-medium text-lg">{pet.name}</p>
                          <p className="text-sm text-gray-500">{pet.breed}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#111] border border-gray-800 p-8 rounded-2xl text-center text-gray-400">
                    No pets found. Please add one in your profile first.
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="mt-12">
                <h2 className="text-xl font-semibold mb-4">Message to the Guru (optional)</h2>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Any special instructions about your pet?"
                  className="w-full h-32 bg-[#111] border border-gray-700 rounded-2xl p-6 focus:outline-none focus:border-emerald-600 resize-y min-h-[120px]"
                />
              </div>
            </GlassCard>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-5">
            <GlassCard className="p-8 sticky top-8">
              <div className="flex items-center gap-4 mb-8">
                {guru.image_url ? (
                  <img src={guru.image_url} alt={guru.full_name} className="w-16 h-16 rounded-2xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-emerald-900 flex items-center justify-center text-4xl">🐾</div>
                )}
                <div>
                  <p className="font-semibold text-xl">{guru.full_name}</p>
                  <p className="text-sm text-gray-400">{guru.title}</p>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-gray-800">
                <div className="flex justify-between text-lg">
                  <span>{selectedService || "Select a service"}</span>
                  <span className="font-semibold text-emerald-400">${currentService.price}</span>
                </div>

                <div className="flex justify-between text-2xl font-bold border-t border-gray-800 pt-6">
                  <span>Total</span>
                  <span>${currentService.price}</span>
                </div>
              </div>

              <button
                onClick={handleBook}
                disabled={!selectedTime || !selectedPet || submitting || noAvailability || !selectedService}
                className="mt-10 w-full py-7 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 transition rounded-2xl font-semibold text-lg flex items-center justify-center gap-3"
              >
                {submitting ? "Sending request..." : "Confirm Booking Request"}
                {!submitting && <Check className="h-6 w-6" />}
              </button>

              <p className="text-center text-xs text-gray-500 mt-6">
                No payment required yet • Guru will confirm within 24 hours
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </main>
  );
}