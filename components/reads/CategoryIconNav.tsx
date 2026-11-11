"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Headphones,
  Heart,
  Newspaper,
  PawPrint,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import {
  READS_CATEGORY_NAV,
  type ReadsCategoryKey,
} from "@/lib/reads/category-config";

const ICONS: Record<ReadsCategoryKey, typeof BookOpen> = {
  books: BookOpen,
  magazines: Newspaper,
  podcasts: Headphones,
  videos: Video,
  authors: Users,
  "team-picks": Sparkles,
  "guru-picks": PawPrint,
  "pet-parent-picks": Heart,
};

export default function CategoryIconNav() {
  const pathname = usePathname() || "/reads";

  return (
    <nav
      aria-label="Reads & Listen categories"
      className="border-b border-emerald-100 bg-white/90 backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-3 sm:gap-2 sm:px-6 lg:px-8">
        {READS_CATEGORY_NAV.map((item) => {
          const Icon = ICONS[item.key];
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[4.75rem] flex-col items-center gap-1 rounded-2xl px-2 py-2 text-center transition sm:min-w-[5.5rem] ${
                active
                  ? "bg-[#0D5C3A]/08 text-[#0D5C3A]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#163127]"
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  active
                    ? "bg-[#0D5C3A] text-white"
                    : "bg-[#EEF6F1] text-[#0D5C3A]"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-[0.08em] sm:text-[11px] ${
                  active ? "text-[#E86A17] underline decoration-2 underline-offset-4" : ""
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
