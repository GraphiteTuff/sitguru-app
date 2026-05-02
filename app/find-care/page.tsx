import Link from "next/link";
import Image from "next/image";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  MapPin,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

export const dynamic = "force-dynamic";

type GuruRow = {
  id: string | number;
  user_id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  city?: string | null;
  state?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  rating_avg?: number | null;
  review_count?: number | null;
  hourly_rate?: number | null;
  rate?: number | null;
};

type CalendarSettingRow = {
  guru_slug: string;
  active: boolean;
};

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function guruDisplayName(guru: GuruRow) {
  return guru.display_name || guru.full_name || guru.name || "SitGuru Care Guru";
}

function guruPhoto(guru: GuruRow) {
  return (
    guru.profile_photo_url ||
    guru.photo_url ||
    guru.avatar_url ||
    guru.image_url ||
    ""
  );
}

function guruLocation(guru: GuruRow) {
  return [guru.city, guru.state].filter(Boolean).join(", ");
}

function guruRate(guru: GuruRow) {
  const rate = guru.hourly_rate || guru.rate;
  return rate ? `$${rate}/hr` : "View rates";
}

function guruRating(guru: GuruRow) {
  return guru.rating_avg ? guru.rating_avg.toFixed(1) : "5.0";
}

export default async function FindCarePage() {
  const { data: gurusData, error: gurusError } = await supabaseAdmin
    .from("gurus")
    .select(
      "id,user_id,slug,display_name,full_name,name,city,state,profile_photo_url,photo_url,avatar_url,image_url,rating_avg,review_count,hourly_rate,rate",
    )
    .order("display_name", { ascending: true });

  const { data: calendarSettingsData } = await supabaseAdmin
    .from("guru_calendar_settings")
    .select("guru_slug,active")
    .eq("active", true);

  const activeCalendarSlugs = new Set(
    ((calendarSettingsData || []) as CalendarSettingRow[])
      .filter((row) => row.guru_slug)
      .map((row) => row.guru_slug),
  );

  const gurus = ((gurusData || []) as GuruRow[]).filter((guru) => guru.slug);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffc_42%,#ecfdf5_100%)] text-slate-950">
      <section className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/images/sitguru-logo-cropped.png"
              alt="SitGuru"
              width={150}
              height={64}
              className="h-auto w-[150px]"
              priority
            />
          </Link>

          <nav className="flex flex-wrap items-center gap-3 text-sm font-black text-slate-950">
            <Link href="/" className="rounded-full px-4 py-2 hover:bg-emerald-50">
              Home
            </Link>
            <Link
              href="/find-care"
              className="rounded-full bg-emerald-50 px-4 py-2 text-emerald-800"
            >
              Find Care
            </Link>
            <Link
              href="/customer/login"
              className="rounded-full border border-emerald-200 bg-white px-5 py-2.5 shadow-sm hover:bg-emerald-50"
            >
              Customer Login
            </Link>
            <Link
              href="/guru/login"
              className="rounded-full border border-emerald-200 bg-white px-5 py-2.5 shadow-sm hover:bg-emerald-50"
            >
              Guru Login
            </Link>
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2.5rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_36%),linear-gradient(135deg,#ffffff_0%,#ecfdf5_48%,#dffcf5_100%)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
                <PawPrint className="h-4 w-4" />
                Find Care
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-6xl">
                Find trusted pet care from local SitGuru Gurus.
              </h1>

              <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-slate-700 md:text-lg">
                Choose a Guru first, then book with the modern availability-aware
                calendar. Service-specific blackout dates are shown before checkout.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
                  <CalendarDays className="h-6 w-6 text-emerald-700" />
                  <p className="mt-3 text-sm font-black text-slate-950">
                    Availability aware
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                    See bookable dates before sending a request.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
                  <ShieldCheck className="h-6 w-6 text-emerald-700" />
                  <p className="mt-3 text-sm font-black text-slate-950">
                    Secure booking
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                    Review details before checkout.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
                  <Sparkles className="h-6 w-6 text-emerald-700" />
                  <p className="mt-3 text-sm font-black text-slate-950">
                    Service specific
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                    Blackout dates update by service.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                  <Search className="h-7 w-7 text-emerald-700" />
                </div>

                <div>
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-emerald-800">
                    How to book
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    Pick a Guru, then choose service and date.
                  </h2>
                  <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">
                    The booking flow starts here so customers always select a Guru
                    before booking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                Available Gurus
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Choose who you want to book
              </h2>
            </div>

            <div className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-black text-emerald-800 shadow-sm">
              {gurus.length} Guru{gurus.length === 1 ? "" : "s"} found
            </div>
          </div>

          {gurusError ? (
            <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-5">
              <p className="text-sm font-black text-rose-800">
                Could not load Gurus.
              </p>
              <p className="mt-1 text-sm font-semibold text-rose-700">
                {gurusError.message}
              </p>
            </div>
          ) : null}

          {!gurusError && gurus.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
              <PawPrint className="mx-auto h-10 w-10 text-emerald-700" />
              <h3 className="mt-4 text-2xl font-black text-slate-950">
                No Gurus are visible yet
              </h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
                No Guru profiles with slugs were found yet. Once Gurus are
                created, they will appear here for customers to book.
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {gurus.map((guru) => {
              const name = guruDisplayName(guru);
              const photo = guruPhoto(guru);
              const location = guruLocation(guru);
              const slug = guru.slug || "";
              const canBook = activeCalendarSlugs.has(slug);

              return (
                <article
                  key={`${guru.id}-${slug}`}
                  className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className="h-24 bg-[linear-gradient(135deg,#10b981,#bae6fd)]" />

                  <div className="-mt-12 p-5">
                    <div className="flex items-end justify-between gap-4">
                      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-emerald-50 shadow-lg">
                        {photo ? (
                          <img
                            src={photo}
                            alt={`${name} profile`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-black text-emerald-800">
                            {initialsFromName(name)}
                          </span>
                        )}
                      </div>

                      <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800">
                        {canBook ? "Bookable" : "Profile only"}
                      </div>
                    </div>

                    <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
                      {name}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-4 w-4 fill-emerald-600 text-emerald-600" />
                        {guruRating(guru)}
                        {guru.review_count ? ` (${guru.review_count})` : ""}
                      </span>

                      {location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-emerald-700" />
                          {location}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                          Rate
                        </p>
                        <p className="mt-1 text-xl font-black text-slate-950">
                          {guruRate(guru)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                          Status
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-sm font-black text-slate-950">
                          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                          Trusted
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={`/guru/${slug}`}
                        className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-50"
                      >
                        View Profile
                      </Link>

                      {canBook ? (
                        <Link
                          href={`/book/${slug}`}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                        >
                          Book Guru
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : (
                        <Link
                          href={`/guru/${slug}`}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-200 px-4 py-3 text-sm font-black text-slate-600"
                        >
                          View First
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
