"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  BadgeDollarSign,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  PawPrint,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

type GuruRow = {
  id: number;
  user_id?: string | null;
  display_name?: string | null;
  rating_avg?: number | null;
  review_count?: number | null;
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean | null;
  charges_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
  avatar_url?: string | null;
};

type ServiceCategory = "core" | "premium" | "add-on";

type ServiceItem = {
  id: string;
  key: string;
  name: string;
  description: string;
  active: boolean;
  price: string;
  duration: string;
  category: ServiceCategory;
  featured: boolean;
  unitLabel: string;
  fixedUnit: boolean;
};

const starterServices: ServiceItem[] = [
  {
    id: "svc_drop_in",
    key: "drop_in_visit",
    name: "Drop-In Visit",
    description:
      "Quick in-home visits for feeding, check-ins, litter care, bathroom breaks, and companionship.",
    active: true,
    price: "30",
    duration: "30",
    category: "core",
    featured: true,
    unitLabel: "visit",
    fixedUnit: true,
  },
  {
    id: "svc_house_sitting",
    key: "house_sitting",
    name: "House Sitting",
    description:
      "Overnight care in the customer's home with routine continuity, comfort, and supervision.",
    active: true,
    price: "95",
    duration: "720",
    category: "premium",
    featured: true,
    unitLabel: "night",
    fixedUnit: true,
  },
  {
    id: "svc_daycare",
    key: "doggy_day_care",
    name: "In-Home Dog Day Care",
    description:
      "Extended daytime care with companionship, supervision, play, and structured routine support.",
    active: false,
    price: "70",
    duration: "480",
    category: "premium",
    featured: false,
    unitLabel: "day",
    fixedUnit: true,
  },
  {
    id: "svc_dog_walk",
    key: "dog_walking",
    name: "Dog Walking",
    description:
      "Neighborhood walks, exercise, bathroom breaks, leash support, and dependable routine care.",
    active: true,
    price: "25",
    duration: "30",
    category: "core",
    featured: true,
    unitLabel: "walk",
    fixedUnit: true,
  },
  {
    id: "svc_medication",
    key: "medication_support",
    name: "Medication Support",
    description:
      "Add-on medication reminders and basic administration support when appropriate.",
    active: true,
    price: "15",
    duration: "15",
    category: "add-on",
    featured: false,
    unitLabel: "add-on",
    fixedUnit: true,
  },
];

function shellCardClasses(extra = "") {
  return `rounded-[28px] border border-white/10 bg-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm ${extra}`;
}

function categoryTone(category: ServiceCategory) {
  switch (category) {
    case "premium":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";
    case "add-on":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    default:
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }
}

function categoryLabel(category: ServiceCategory) {
  switch (category) {
    case "premium":
      return "Premium";
    case "add-on":
      return "Add-On";
    default:
      return "Core";
  }
}

function formatMoney(value: string) {
  const amount = Number(value || 0);
  return `$${amount.toLocaleString()}`;
}

function formatDuration(minutes: string) {
  const value = Number(minutes || 0);

  if (!value) return "Not set";

  if (value >= 60) {
    const hours = value / 60;

    if (Number.isInteger(hours)) {
      return `${hours} hr${hours === 1 ? "" : "s"}`;
    }

    return `${hours.toFixed(1)} hrs`;
  }

  return `${value} min`;
}

function serviceUnitHint(service: ServiceItem) {
  switch (service.key) {
    case "drop_in_visit":
      return "Customers see this as priced per visit.";
    case "house_sitting":
      return "Customers see this as priced per night.";
    case "doggy_day_care":
      return "Customers see this as priced per day.";
    case "dog_walking":
      return "Customers see this as priced per walk.";
    default:
      return "Customers see this as an add-on or custom support item.";
  }
}

export default function GuruServicesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [guru, setGuru] = useState<GuruRow | null>(null);
  const [services, setServices] = useState<ServiceItem[]>(starterServices);

  const [sameDayPremium, setSameDayPremium] = useState("10");
  const [holidayPremium, setHolidayPremium] = useState("20");
  const [travelFee, setTravelFee] = useState("0");

  const [pageNotice, setPageNotice] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/guru/login");
          return;
        }

        const { data: guruData, error: guruError } = await supabase
          .from("gurus")
          .select(
            "id, user_id, display_name, rating_avg, review_count, stripe_account_id, stripe_onboarding_complete, charges_enabled, payouts_enabled, avatar_url"
          )
          .eq("user_id", user.id)
          .single();

        if (guruError || !guruData) {
          if (mounted) {
            setGuru(null);
            setLoading(false);
          }
          return;
        }

        if (!mounted) return;

        setGuru(guruData as GuruRow);
        setPageNotice(
          "This services workspace is live now and can be connected to a database table later without changing the layout."
        );
        setLoading(false);
      } catch (error) {
        console.error("Guru services load error:", error);
        if (mounted) {
          setGuru(null);
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  function updateService<K extends keyof ServiceItem>(
    id: string,
    field: K,
    value: ServiceItem[K]
  ) {
    setServices((current) =>
      current.map((service) =>
        service.id === id ? { ...service, [field]: value } : service
      )
    );
  }

  function applyPreset(preset: "starter" | "premium" | "flex") {
    setSaveMessage("");

    if (preset === "starter") {
      setServices((current) =>
        current.map((service) => {
          if (service.key === "dog_walking") {
            return {
              ...service,
              active: true,
              price: "25",
              duration: "30",
              featured: true,
            };
          }

          if (service.key === "drop_in_visit") {
            return {
              ...service,
              active: true,
              price: "30",
              duration: "30",
              featured: true,
            };
          }

          if (service.key === "house_sitting") {
            return {
              ...service,
              active: false,
              featured: false,
            };
          }

          if (service.key === "doggy_day_care") {
            return {
              ...service,
              active: false,
              featured: false,
            };
          }

          return service;
        })
      );
    }

    if (preset === "premium") {
      setServices((current) =>
        current.map((service) => {
          if (service.key === "dog_walking") {
            return {
              ...service,
              active: true,
              price: "35",
              duration: "60",
              featured: true,
            };
          }

          if (service.key === "drop_in_visit") {
            return {
              ...service,
              active: true,
              price: "40",
              duration: "45",
              featured: true,
            };
          }

          if (service.key === "house_sitting") {
            return {
              ...service,
              active: true,
              price: "125",
              duration: "720",
              featured: true,
            };
          }

          if (service.key === "doggy_day_care") {
            return {
              ...service,
              active: true,
              price: "85",
              duration: "480",
              featured: true,
            };
          }

          if (service.key === "medication_support") {
            return {
              ...service,
              active: true,
              price: "20",
              duration: "15",
              featured: false,
            };
          }

          return service;
        })
      );
    }

    if (preset === "flex") {
      setServices((current) =>
        current.map((service) => {
          if (service.key === "dog_walking") {
            return {
              ...service,
              active: true,
              price: "28",
              duration: "30",
              featured: true,
            };
          }

          if (service.key === "drop_in_visit") {
            return {
              ...service,
              active: true,
              price: "34",
              duration: "30",
              featured: true,
            };
          }

          if (service.key === "house_sitting") {
            return {
              ...service,
              active: true,
              price: "105",
              duration: "720",
              featured: true,
            };
          }

          if (service.key === "doggy_day_care") {
            return {
              ...service,
              active: true,
              price: "72",
              duration: "480",
              featured: false,
            };
          }

          if (service.key === "medication_support") {
            return {
              ...service,
              active: true,
              price: "15",
              duration: "15",
              featured: false,
            };
          }

          return service;
        })
      );
    }

    setPageNotice("Preset applied. Save when you are ready.");
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSaveMessage(
        "Services saved in the UI flow. Next step is connecting this page to a Supabase services table."
      );
      setSaving(false);
    } catch (error) {
      console.error("Services save error:", error);
      setSaveMessage("Something went wrong while saving.");
      setSaving(false);
    }
  }

  const activeServices = services.filter((service) => service.active).length;
  const featuredServices = services.filter((service) => service.featured).length;
  const premiumServices = services.filter(
    (service) => service.category === "premium" && service.active
  ).length;

  const averagePrice = useMemo(() => {
    const active = services.filter((service) => service.active);
    if (active.length === 0) return 0;

    const total = active.reduce((sum, service) => sum + Number(service.price || 0), 0);
    return total / active.length;
  }, [services]);

  const featuredSummary = useMemo(() => {
    const featured = services.filter((service) => service.featured && service.active);
    if (featured.length === 0) return "No featured services selected yet.";

    return `${featured.length} featured service${
      featured.length === 1 ? "" : "s"
    } currently highlighted for customers.`;
  }, [services]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className={shellCardClasses("p-8 text-center")}>
            <p className="text-lg font-semibold text-white">Loading services...</p>
            <p className="mt-2 text-sm text-slate-300">
              Pulling your guru profile and service management workspace.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!guru) {
    return (
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <div className={shellCardClasses("p-8")}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
              Guru Services
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
              Guru profile not found
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              We could not find a guru profile connected to your account.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/guru/dashboard"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Back to Dashboard
              </Link>
              <Link
                href="/guru/login"
                className="rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Back to Guru Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_26%),radial-gradient(circle_at_right,_rgba(14,165,233,0.10),_transparent_24%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-sky-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <Link
                href="/guru/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300 transition hover:bg-white/10"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Guru Dashboard
              </Link>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                <PawPrint className="h-3.5 w-3.5" />
                Guru Services
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.08)] sm:text-5xl">
                Control what customers can book
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
                Activate services, tune pricing, keep units consistent, and shape the
                public booking options customers see on your guru profile.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Active services
                </p>
                <p className="mt-2 text-2xl font-black text-white">{activeServices}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Featured
                </p>
                <p className="mt-2 text-2xl font-black text-white">{featuredServices}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Premium live
                </p>
                <p className="mt-2 text-2xl font-black text-white">{premiumServices}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Avg. price
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  ${averagePrice.toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {pageNotice ? (
          <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-300">
            {pageNotice}
          </div>
        ) : null}

        {saveMessage ? (
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
            {saveMessage}
          </div>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className={shellCardClasses("p-6")}>
            <div className="border-b border-white/10 pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Service catalog
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.08)]">
                Manage offerings, pricing, and visibility
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Customers should always see clear pricing units. Core services now
                follow fixed booking labels like per visit, per night, per day, and
                per walk.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => applyPreset("starter")}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Starter preset
              </button>
              <button
                type="button"
                onClick={() => applyPreset("flex")}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Flexible preset
              </button>
              <button
                type="button"
                onClick={() => applyPreset("premium")}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Premium preset
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-3xl border border-white/10 bg-slate-950/60 p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xl font-black text-white">{service.name}</p>

                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${categoryTone(
                            service.category
                          )}`}
                        >
                          {categoryLabel(service.category)}
                        </span>

                        {service.featured ? (
                          <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300">
                            Featured
                          </span>
                        ) : null}

                        {service.active ? (
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                            Hidden
                          </span>
                        )}
                      </div>

                      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                        {service.description}
                      </p>

                      <div className="mt-5 grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Price
                          </label>
                          <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <span className="mr-2 text-sm font-semibold text-slate-300">$</span>
                            <input
                              type="number"
                              min="0"
                              inputMode="decimal"
                              value={service.price}
                              onChange={(e) =>
                                updateService(service.id, "price", e.target.value)
                              }
                              className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Duration
                          </label>
                          <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <Clock3 className="mr-2 h-4 w-4 text-slate-300" />
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={service.duration}
                              onChange={(e) =>
                                updateService(service.id, "duration", e.target.value)
                              }
                              className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                            />
                            <span className="ml-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                              min
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Customer unit
                          </label>
                          <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <p className="text-sm font-semibold text-white">
                              / {service.unitLabel}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Fixed for this service type
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            updateService(service.id, "active", !service.active)
                          }
                          className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                            service.active
                              ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15"
                              : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                          }`}
                        >
                          {service.active ? "Active on profile" : "Hidden from profile"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateService(service.id, "featured", !service.featured)
                          }
                          className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                            service.featured
                              ? "border border-sky-400/20 bg-sky-400/10 text-sky-300 hover:bg-sky-400/15"
                              : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                          }`}
                        >
                          {service.featured ? "Featured service" : "Set as featured"}
                        </button>
                      </div>

                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Public pricing preview
                            </p>
                            <p className="mt-1 text-lg font-black text-white">
                              {formatMoney(service.price)} / {service.unitLabel}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Duration preview
                            </p>
                            <p className="mt-1 text-sm font-semibold text-white">
                              {formatDuration(service.duration)}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs leading-6 text-slate-400">
                          {serviceUnitHint(service)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-300">
                Save this pricing workspace when you are ready to publish updated
                service visibility and customer-facing prices.
              </p>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save services
                  </>
                )}
              </button>
            </div>
          </section>

          <div className="space-y-8">
            <section className={shellCardClasses("p-6")}>
              <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Pricing controls
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.08)]">
                  Premium adjustments
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Same-day booking premium
                  </label>
                  <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <BadgeDollarSign className="mr-2 h-4 w-4 text-emerald-300" />
                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={sameDayPremium}
                      onChange={(e) => setSameDayPremium(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Holiday premium
                  </label>
                  <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <BadgeDollarSign className="mr-2 h-4 w-4 text-amber-300" />
                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={holidayPremium}
                      onChange={(e) => setHolidayPremium(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Travel fee
                  </label>
                  <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <BadgeDollarSign className="mr-2 h-4 w-4 text-sky-300" />
                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={travelFee}
                      onChange={(e) => setTravelFee(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className={shellCardClasses("p-6")}>
              <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Publishing notes
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.08)]">
                  Better customer pricing clarity
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <p className="text-sm leading-6 text-slate-300">
                    Keep your active services clear and focused so customers understand what to book immediately.
                  </p>
                </div>

                <div className="flex gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
                  <p className="text-sm leading-6 text-slate-300">
                    Fixed unit labels make your public profile feel more trustworthy and easier to compare.
                  </p>
                </div>

                <div className="flex gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
                  <p className="text-sm leading-6 text-slate-300">
                    Pair strong service pricing with clean availability and fast replies for better conversion.
                  </p>
                </div>
              </div>
            </section>

            <section className={shellCardClasses("p-6")}>
              <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Reputation
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.08)]">
                  Guru performance snapshot
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <Star className="h-5 w-5 text-violet-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300">Average rating</p>
                    <p className="mt-1 text-xl font-black text-white">
                      {guru.rating_avg ? guru.rating_avg.toFixed(2) : "0.00"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300">Review count</p>
                    <p className="mt-1 text-xl font-black text-white">
                      {guru.review_count || 0}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <Sparkles className="h-5 w-5 text-sky-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">Featured setup</p>
                      <p className="mt-1 text-xl font-black text-white">{featuredSummary}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <ShieldCheck className="h-5 w-5 text-violet-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">Payout readiness</p>
                      <p className="mt-1 text-xl font-black text-white">
                        {guru.payouts_enabled ? "Ready" : "Needs Stripe setup"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={shellCardClasses("p-6")}>
              <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Recommended public labels
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.08)]">
                  How customers should see pricing
                </h2>
              </div>

              <div className="mt-6 space-y-3">
                {services
                  .filter((service) => service.active)
                  .map((service) => (
                    <div
                      key={`${service.id}-public`}
                      className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/60 p-4"
                    >
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-bold text-white">{service.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDuration(service.duration)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                        <span className="text-sm font-black text-white">
                          {formatMoney(service.price)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                          / {service.unitLabel}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
