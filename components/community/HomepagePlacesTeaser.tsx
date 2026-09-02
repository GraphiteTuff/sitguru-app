import Link from "next/link";
import { PawPrint } from "lucide-react";

const LANES = [
  { href: "/events?view=places&lane=eat", label: "Eat & Drink" },
  { href: "/events?view=places&lane=stay", label: "Stay" },
  { href: "/events?view=places&lane=play&category=dog_park", label: "Dog Parks" },
  { href: "/events?view=places&lane=services", label: "Pet Services" },
] as const;

export default function HomepagePlacesTeaser() {
  return (
    <section className="mx-auto max-w-[1500px] px-5 pb-10 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              <PawPrint className="h-4 w-4" />
              Bring the pack
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Go where tails are truly welcome.
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-600 sm:text-base">
              Patio brunches, cozy stays, sunny dog parks, and trusted pet care
              — all on the same Community map as local events. SitGuru shows
              the spots that love your pet back.
            </p>
          </div>
          <Link
            href="/events?view=places"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-700 px-6 text-sm font-semibold text-white"
          >
            Explore pet-friendly places
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {LANES.map((lane) => (
            <Link
              key={lane.href}
              href={lane.href}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              {lane.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
