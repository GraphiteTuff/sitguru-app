"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  BadgeDollarSign,
  BellRing,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  MessageSquare,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Star,
  UserCircle2,
  Wallet,
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

type ActivityType =
  | "booking"
  | "message"
  | "payment"
  | "profile"
  | "review"
  | "system";

type ActivityPriority = "high" | "medium" | "normal";

type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  createdAt: string;
  priority: ActivityPriority;
  actionLabel?: string;
  actionHref?: string;
  meta?: string;
};



function shellCardClasses(extra = "") {
  return `rounded-[1.8rem] border border-emerald-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] ${extra}`;
}

function formatTimeLabel(value?: string) {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function typeIcon(type: ActivityType) {
  switch (type) {
    case "booking":
      return CalendarDays;
    case "message":
      return MessageSquare;
    case "payment":
      return Wallet;
    case "profile":
      return UserCircle2;
    case "review":
      return Star;
    default:
      return BellRing;
  }
}

function typeTone(type: ActivityType) {
  switch (type) {
    case "booking":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "message":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "payment":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "profile":
      return "border-violet-200 bg-violet-50 text-violet-800";
    case "review":
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function priorityTone(priority: ActivityPriority) {
  switch (priority) {
    case "high":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
}

function typeLabel(type: ActivityType) {
  switch (type) {
    case "booking":
      return "Booking";
    case "message":
      return "Message";
    case "payment":
      return "Payment";
    case "profile":
      return "Profile";
    case "review":
      return "Review";
    default:
      return "System";
  }
}

function priorityLabel(priority: ActivityPriority) {
  switch (priority) {
    case "high":
      return "Needs action";
    case "medium":
      return "Monitor";
    default:
      return "Normal";
  }
}

export default function GuruActivityPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [guru, setGuru] = useState<GuruRow | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [pageNotice, setPageNotice] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | ActivityType
  >("all");

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

        const typedGuru = guruData as GuruRow;
        setGuru(typedGuru);

        const dynamicActivity: ActivityItem[] = [];

        dynamicActivity.push({
          id: "dyn_profile",
          type: "profile",
          title: typedGuru.avatar_url
            ? "Profile photo is live"
            : "Profile photo still missing",
          description: typedGuru.avatar_url
            ? "Your public profile photo is set and helps customers recognize you."
            : "Add a profile photo to strengthen trust and improve customer confidence.",
          createdAt: new Date().toISOString(),
          priority: typedGuru.avatar_url ? "normal" : "medium",
          actionLabel: "Open Profile",
          actionHref: "/guru/dashboard/profile",
          meta: "Profile status",
        });

        dynamicActivity.push({
          id: "dyn_payments",
          type: "payment",
          title:
            typedGuru.charges_enabled && typedGuru.payouts_enabled
              ? "Payments fully enabled"
              : typedGuru.stripe_account_id
              ? "Stripe setup in progress"
              : "Stripe not connected yet",
          description:
            typedGuru.charges_enabled && typedGuru.payouts_enabled
              ? "Your payout setup looks healthy and ready for marketplace transactions."
              : typedGuru.stripe_account_id
              ? "Finish the remaining payout onboarding steps so payments and transfers run smoothly."
              : "Connect Stripe so customers can pay and you can receive payouts.",
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          priority:
            typedGuru.charges_enabled && typedGuru.payouts_enabled
              ? "normal"
              : "high",
          actionLabel: "Manage Profile",
          actionHref: "/guru/dashboard/profile",
          meta: "Payouts",
        });

        dynamicActivity.push({
          id: "dyn_reviews",
          type: "review",
          title:
            (typedGuru.review_count || 0) > 0
              ? "Customer proof is growing"
              : "First reviews still ahead",
          description:
            (typedGuru.review_count || 0) > 0
              ? `You currently have ${typedGuru.review_count || 0} review${
                  (typedGuru.review_count || 0) === 1 ? "" : "s"
                } and a visible rating signal for customers.`
              : "Completed bookings and great communication will help you build your first ratings.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
          priority: (typedGuru.review_count || 0) > 0 ? "normal" : "medium",
          actionLabel: "View Dashboard",
          actionHref: "/guru/dashboard",
          meta: "Reputation",
        });

        setActivity(dynamicActivity);
        setPageNotice(
          "Showing available Guru profile, payment and review-readiness signals. Visit Bookings and Messages for current care activity."
        );
        setLoading(false);
      } catch (error) {
        console.error("Guru activity load error:", error);
        if (mounted) {
          setPageNotice(
            "Activity data is temporarily unavailable. Check Bookings or Messages for current details."
          );
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  const filteredActivity = useMemo(() => {
    if (selectedFilter === "all") return activity;
    return activity.filter((item) => item.type === selectedFilter);
  }, [activity, selectedFilter]);

  const highPriorityCount = activity.filter(
    (item) => item.priority === "high"
  ).length;

  const paymentItems = activity.filter((item) => item.type === "payment").length;
  const messageItems = activity.filter((item) => item.type === "message").length;
  const bookingItems = activity.filter((item) => item.type === "booking").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FFFB] px-4 py-8 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className={shellCardClasses("p-8 text-center")}>
            <p className="text-lg font-semibold text-slate-950">Loading activity feed...</p>
            <p className="mt-2 text-sm text-slate-600">
              Pulling your guru alerts, bookings, trust, and payment signals.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!guru) {
    return (
      <div className="min-h-screen bg-[#F7FFFB] px-4 py-8 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className={shellCardClasses("p-8")}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">
              Guru Activity
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
                className="rounded-2xl border border-emerald-100 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white/10"
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

  const filters: Array<{ label: string; value: "all" | ActivityType }> = [
    { label: "All Activity", value: "all" },
    { label: "Bookings", value: "booking" },
    { label: "Messages", value: "message" },
    { label: "Payments", value: "payment" },
    { label: "Profile", value: "profile" },
    { label: "Reviews", value: "review" },
    { label: "System", value: "system" },
  ];

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
                Guru Activity Feed
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight !text-white sm:text-5xl">
                Live operational activity
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#EAF7EF] sm:text-base">
                Track what changed across bookings, messages, payments, trust,
                profile quality, and growth in one clean guru dashboard.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-white/30 bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#EAF7EF]">
                  Total events
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {activity.length}
                </p>
              </div>
              <div className="rounded-3xl border border-white/30 bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#EAF7EF]">
                  Needs action
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {highPriorityCount}
                </p>
              </div>
              <div className="rounded-3xl border border-white/30 bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#EAF7EF]">
                  Messages
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {messageItems}
                </p>
              </div>
              <div className="rounded-3xl border border-white/30 bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#EAF7EF]">
                  Booking signals
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {bookingItems}
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

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className={shellCardClasses("p-6")}>
            <div className="border-b border-emerald-100 pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Filters
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 ">
                Activity stream
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Filter the feed by operational category so you can focus faster.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {filters.map((filter) => {
                const selected = selectedFilter === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setSelectedFilter(filter.value)}
                    className={`min-h-[52px] rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                      selected
                        ? "bg-[#0D5C3A] !text-white"
                        : "border border-emerald-100 bg-white text-slate-950 hover:bg-emerald-50"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-4">
              {filteredActivity.map((item) => {
                const Icon = typeIcon(item.type);

                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-emerald-100 bg-emerald-50/65 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div
                          className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${typeTone(
                            item.type
                          )}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${typeTone(
                                item.type
                              )}`}
                            >
                              {typeLabel(item.type)}
                            </span>
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${priorityTone(
                                item.priority
                              )}`}
                            >
                              {priorityLabel(item.priority)}
                            </span>
                            {item.meta ? (
                              <span className="inline-flex rounded-full border border-emerald-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                {item.meta}
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-3 text-lg font-bold text-slate-950">
                            {item.title}
                          </p>
                          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                            {item.description}
                          </p>

                          <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatTimeLabel(item.createdAt)}
                          </div>
                        </div>
                      </div>

                      {item.actionHref ? (
                        <Link
                          href={item.actionHref}
                          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-50"
                        >
                          {item.actionLabel || "Open"}
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {filteredActivity.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-emerald-100 bg-emerald-50/65 p-8 text-center">
                  <BellRing className="mx-auto h-10 w-10 text-slate-600" />
                  <p className="mt-4 text-lg font-bold text-slate-950">
                    No matching activity
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Try switching filters to see more operational events.
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <div className="space-y-8">
            <section className={shellCardClasses("p-6")}>
              <div className="border-b border-emerald-100 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Quick summary
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 ">
                  Operational pulse
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/65 p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                      <BellRing className="h-5 w-5 text-rose-800" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">
                        Priority items
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-950">
                        {highPriorityCount}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        High-priority items usually deserve the fastest response.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/65 p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                      <CreditCard className="h-5 w-5 text-amber-800" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">
                        Payment readiness
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-950">
                        {guru.payouts_enabled ? "Ready" : "Attention"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {guru.payouts_enabled
                          ? "Stripe payouts appear healthy."
                          : "Stripe onboarding still needs completion."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/65 p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-800" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">
                        Trust signal
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-950">
                        {guru.avatar_url ? "Visible" : "Needs work"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {guru.avatar_url
                          ? "Your profile already has a photo signal."
                          : "Add a profile photo to improve customer trust."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/65 p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                      <BadgeDollarSign className="h-5 w-5 text-sky-800" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">
                        Revenue workflow
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-950">
                        {paymentItems}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Payment-related events are visible here for faster follow-up.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={shellCardClasses("p-6")}>
              <div className="border-b border-emerald-100 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Quick actions
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 ">
                  Jump where needed
                </h2>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  href="/guru/dashboard/messages"
                  className="flex items-center justify-between rounded-3xl border border-emerald-100 bg-emerald-50/65 p-4 transition hover:border-white/20 hover:bg-emerald-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                      <MessageSquare className="h-5 w-5 text-sky-800" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-950">Messages</p>
                      <p className="text-sm text-slate-600">
                        Respond to customers and admin updates
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </Link>

                <Link
                  href="/guru/dashboard/bookings"
                  className="flex items-center justify-between rounded-3xl border border-emerald-100 bg-emerald-50/65 p-4 transition hover:border-white/20 hover:bg-emerald-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                      <CalendarCheck2 className="h-5 w-5 text-emerald-800" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-950">Bookings</p>
                      <p className="text-sm text-slate-600">
                        Review requests and upcoming care sessions
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </Link>

                <Link
                  href="/guru/dashboard/profile"
                  className="flex items-center justify-between rounded-3xl border border-emerald-100 bg-emerald-50/65 p-4 transition hover:border-white/20 hover:bg-emerald-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                      <UserCircle2 className="h-5 w-5 text-violet-800" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-950">Profile</p>
                      <p className="text-sm text-slate-600">
                        Update your photo, public identity, and trust signals
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </Link>

                <Link
                  href="/guru/dashboard"
                  className="flex items-center justify-between rounded-3xl border border-emerald-100 bg-emerald-50/65 p-4 transition hover:border-white/20 hover:bg-emerald-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                      <Sparkles className="h-5 w-5 text-fuchsia-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-950">Dashboard</p>
                      <p className="text-sm text-slate-600">
                        Return to your full guru control center
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </Link>
              </div>
            </section>

            <section className={shellCardClasses("p-6")}>
              <div className="border-b border-emerald-100 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Growth hints
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 ">
                  Best next moves
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex gap-3 rounded-3xl border border-emerald-100 bg-emerald-50/65 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" />
                  <p className="text-sm leading-6 text-slate-600">
                    Fast response times usually improve booking conversion and repeat use.
                  </p>
                </div>

                <div className="flex gap-3 rounded-3xl border border-emerald-100 bg-emerald-50/65 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-800" />
                  <p className="text-sm leading-6 text-slate-600">
                    A strong profile photo and clean public presence help customers trust faster.
                  </p>
                </div>

                <div className="flex gap-3 rounded-3xl border border-emerald-100 bg-emerald-50/65 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-800" />
                  <p className="text-sm leading-6 text-slate-600">
                    Keep Stripe and availability current so payment and booking friction stay low.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
