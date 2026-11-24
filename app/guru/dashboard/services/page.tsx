"use client";

import SitGuruPortalLoading from "@/components/sitguru/SitGuruPortalLoading";
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
  return `rounded-[1.8rem] border border-emerald-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] ${extra}`;
}

function categoryTone(category: ServiceCategory) {
  switch (category) {
    case "premium":
      return "border-violet-200 bg-violet-50 text-violet-800";
    case "add-on":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
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
      <SitGuruPortalLoading portal="Guru" message="Loading your services..." />
    );
  }

  if (!guru) {
    return (
      <div className="min-h-screen bg-[#F7FFFB] px-4 py-8 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className={shellCardClasses("p-8")}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">
              Guru Services
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Guru profile not found
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              We could not find a guru profile connected to your account.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/guru/dashboard"
                className="min-h-[52px] rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 transition hover:bg-white/10"
              >
                Back to Dashboard
              </Link>
              <Link
                href="/guru/login"
                className="min-h-[52px] rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black !text-white transition hover:bg-emerald-400"
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
    <div className="min-h-screen bg-[#F7FFFB] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section data-brand-green="true" className="overflow-hidden rounded-[2rem] border border-emerald-800/15 bg-[linear-gradient(125deg,#06462F_0%,#08734A_62%,#0C8756_100%)] p-5 shadow-[0_16px_42px_rgba(8,90,57,0.14)] sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <Link
                href="/guru/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#EAF7EF] transition hover:bg-white/10"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Guru Dashboard
              </Link>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#F7E7B0]">
                <PawPrint className="h-3.5 w-3.5" />
                Guru Services
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight !text-white sm:text-5xl">
                Control what customers can book
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#EAF7EF] sm:text-base">
                Activate services, tune pricing, keep units consistent, and shape the
                public booking options customers see on your guru profile.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-white/30 bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#EAF7EF]">
                  Active services
                </p>
                <p className="mt-2 text-2xl font-black text-white">{activeServices}</p>
              </div>
              <div className="rounded-3xl border border-white/30 bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#EAF7EF]">
                  Featured
                </p>
                <p className="mt-2 text-2xl font-black text-white">{featuredServices}</p>
              </div>
              <div className="rounded-3xl border border-white/30 bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#EAF7EF]">
                  Premium live
                </p>
                <p className="mt-2 text-2xl font-black text-white">{premiumServices}</p>
              </div>
              <div className="rounded-3xl border border-white/30 bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#EAF7EF]">
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
          <div className="rounded-3xl border border-sky-200 bg-sky-100 px-4 py-3 text-sm text-sky-800">
            {pageNotice}
          </div>
        ) : null}

        {saveMessage ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-100 px-4 py-3 text-sm text-emerald-800">
            {saveMessage}
          </div>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className={shellCardClasses("p-6")}>
            <div className="border-b border-emerald-100 pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Service catalog
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 ">
                Manage offerings, pricing, and visibility
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Customers should always see clear pricing units. Core services now
                follow fixed booking labels like per visit, per night, per day, and
                per walk.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => applyPreset("starter")}
                className="min-h-[52px] rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50"
              >
                Starter preset
              </button>
              <button
                type="button"
                onClick={() => applyPreset("flex")}
                className="min-h-[52px] rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50"
              >
                Flexible preset
              </button>
              <button
                type="button"
                onClick={() => applyPreset("premium")}
                className="min-h-[52px] rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50"
              >
                Premium preset
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xl font-black text-slate-950">{service.name}</p>

                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${categoryTone(
                            service.category
                          )}`}
                        >
                          {categoryLabel(service.category)}
                        </span>

                        {service.featured ? (
                          <span className="rounded-full border border-sky-200 bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-800">
                            Featured
                          </span>
                        ) : null}

                        {service.active ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                            Hidden
                          </span>
                        )}
                      </div>

                      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                        {service.description}
                      </p>

                      <div className="mt-5 grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Price
                          </label>
                          <div className="mt-2 flex items-center rounded-2xl border border-emerald-100 bg-white px-4 py-3">
                            <span className="mr-2 text-sm font-semibold text-slate-600">$</span>
                            <input
                              type="number"
                              min="0"
                              inputMode="decimal"
                              value={service.price}
                              onChange={(e) =>
                                updateService(service.id, "price", e.target.value)
                              }
                              className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Duration
                          </label>
                          <div className="mt-2 flex items-center rounded-2xl border border-emerald-100 bg-white px-4 py-3">
                            <Clock3 className="mr-2 h-4 w-4 text-slate-600" />
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={service.duration}
                              onChange={(e) =>
                                updateService(service.id, "duration", e.target.value)
                              }
                              className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none"
                            />
                            <span className="ml-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              min
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Customer unit
                          </label>
                          <div className="mt-2 rounded-2xl border border-emerald-100 bg-white px-4 py-3">
                            <p className="text-sm font-semibold text-slate-950">
                              / {service.unitLabel}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
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
                          className={`min-h-[52px] rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                            service.active
                              ? "border border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-400/15"
                              : "border border-emerald-100 bg-white text-slate-950 hover:bg-emerald-50"
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
                              ? "border border-sky-200 bg-sky-100 text-sky-800 hover:bg-sky-400/15"
                              : "border border-emerald-100 bg-white text-slate-950 hover:bg-emerald-50"
                          }`}
                        >
                          {service.featured ? "Featured service" : "Set as featured"}
                        </button>
                      </div>

                      <div className="mt-5 rounded-2xl border border-emerald-100 bg-white px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Public pricing preview
                            </p>
                            <p className="mt-1 text-lg font-black text-slate-950">
                              {formatMoney(service.price)} / {service.unitLabel}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Duration preview
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-950">
                              {formatDuration(service.duration)}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs leading-6 text-slate-500">
                          {serviceUnitHint(service)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                Save this pricing workspace when you are ready to publish updated
                service visibility and customer-facing prices.
              </p>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0D5C3A] min-h-[56px] px-5 py-3 text-sm font-black !text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
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
              <div className="border-b border-emerald-100 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Pricing controls
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 ">
                  Premium adjustments
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Same-day booking premium
                  </label>
                  <div className="mt-2 flex items-center rounded-2xl border border-emerald-100 bg-white px-4 py-3">
                    <BadgeDollarSign className="mr-2 h-4 w-4 text-emerald-800" />
                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={sameDayPremium}
                      onChange={(e) => setSameDayPremium(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Holiday premium
                  </label>
                  <div className="mt-2 flex items-center rounded-2xl border border-emerald-100 bg-white px-4 py-3">
                    <BadgeDollarSign className="mr-2 h-4 w-4 text-amber-800" />
                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={holidayPremium}
                      onChange={(e) => setHolidayPremium(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Travel fee
                  </label>
                  <div className="mt-2 flex items-center rounded-2xl border border-emerald-100 bg-white px-4 py-3">
                    <BadgeDollarSign className="mr-2 h-4 w-4 text-sky-800" />
                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={travelFee}
                      onChange={(e) => setTravelFee(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className={shellCardClasses("p-6")}>
              <div className="border-b border-emerald-100 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Publishing notes
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 ">
                  Better customer pricing clarity
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex gap-3 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" />
                  <p className="text-sm leading-6 text-slate-600">
                    Keep your active services clear and focused so customers understand what to book immediately.
                  </p>
                </div>

                <div className="flex gap-3 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-800" />
                  <p className="text-sm leading-6 text-slate-600">
                    Fixed unit labels make your public profile feel more trustworthy and easier to compare.
                  </p>
                </div>

                <div className="flex gap-3 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-800" />
                  <p className="text-sm leading-6 text-slate-600">
                    Pair strong service pricing with clean availability and fast replies for better conversion.
                  </p>
                </div>
              </div>
            </section>

            <section className={shellCardClasses("p-6")}>
              <div className="border-b border-emerald-100 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Reputation
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 ">
                  Guru performance snapshot
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-4 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                    <Star className="h-5 w-5 text-violet-800" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Average rating</p>
                    <p className="mt-1 text-xl font-black text-slate-950">
                      {typeof guru.rating_avg === "number" && (guru.review_count ?? 0) > 0 ? guru.rating_avg.toFixed(2) : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-800" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Review count</p>
                    <p className="mt-1 text-xl font-black text-slate-950">
                      {guru.review_count || 0}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                      <Sparkles className="h-5 w-5 text-sky-800" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Featured setup</p>
                      <p className="mt-1 text-xl font-black text-slate-950">{featuredSummary}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                      <ShieldCheck className="h-5 w-5 text-violet-800" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Payout readiness</p>
                      <p className="mt-1 text-xl font-black text-slate-950">
                        {guru.payouts_enabled ? "Ready" : "Needs Stripe setup"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={shellCardClasses("p-6")}>
              <div className="border-b border-emerald-100 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Recommended public labels
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 ">
                  How customers should see pricing
                </h2>
              </div>

              <div className="mt-6 space-y-3">
                {services
                  .filter((service) => service.active)
                  .map((service) => (
                    <div
                      key={`${service.id}-public`}
                      className="flex items-center justify-between rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4"
                    >
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-bold text-slate-950">{service.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDuration(service.duration)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2">
                        <span className="text-sm font-black text-slate-950">
                          {formatMoney(service.price)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
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
