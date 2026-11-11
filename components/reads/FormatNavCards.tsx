import Link from "next/link";
import {
  BookOpen,
  Headphones,
  Mic2,
  Newspaper,
  PawPrint,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { READS_FORMAT_NAV } from "@/lib/reads/constants";

const ICONS: Record<string, typeof BookOpen> = {
  book: BookOpen,
  magazine: Newspaper,
  podcast: Headphones,
  video: Video,
  author: Users,
  team: Sparkles,
  guru: PawPrint,
  pet_parent: PawPrint,
};

const TONES: Record<string, string> = {
  book: "bg-emerald-100 text-emerald-800",
  magazine: "bg-violet-100 text-violet-800",
  podcast: "bg-indigo-100 text-indigo-800",
  video: "bg-sky-100 text-sky-800",
  author: "bg-lime-100 text-lime-800",
  team: "bg-amber-100 text-amber-800",
  guru: "bg-emerald-100 text-emerald-800",
  pet_parent: "bg-rose-100 text-rose-800",
};

export default function FormatNavCards({
  variant = "icons",
}: {
  variant?: "icons" | "cards";
}) {
  if (variant === "cards") {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E86A17]">
          Explore by Format
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-[#163127]">
          Books, magazines, podcasts, and more
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {READS_FORMAT_NAV.slice(0, 4).map((item) => {
            const Icon = ICONS[item.format] || BookOpen;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              >
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${TONES[item.format] || TONES.book}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 text-lg font-black text-[#0D5C3A]">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <nav
      aria-label="Reads formats"
      className="border-y border-emerald-100 bg-white"
    >
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 sm:grid sm:grid-cols-4 sm:gap-3 md:grid-cols-7 lg:px-8">
        {READS_FORMAT_NAV.map((item) => {
          const Icon = ICONS[item.format] || BookOpen;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-[92px] flex-col items-center gap-2 rounded-2xl px-2 py-2 text-center transition hover:bg-[#f7f4ee]"
            >
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${TONES[item.format] || TONES.book}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-xs font-black text-[#163127]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
