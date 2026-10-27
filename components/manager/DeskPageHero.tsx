import Image from "next/image";
import type { ReactNode } from "react";

export default function DeskPageHero({
  icon,
  title,
  subtitle,
  quote,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  quote: string;
}) {
  return (
    <section className="grid items-center gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(260px,0.95fr)]">
      <div className="flex min-w-0 items-start gap-3">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E0F2FE] text-[#0284C7]">
          {icon}
        </span>
        <div className="min-w-0">
          <h1 className="text-3xl font-black tracking-tight text-[#0F2744] sm:text-4xl">{title}</h1>
          <p className="mt-1 max-w-xl text-sm font-medium text-slate-600">{subtitle}</p>
        </div>
      </div>
      <div className="relative min-h-[132px] overflow-hidden rounded-2xl sm:min-h-[148px]">
        <Image
          src="/images/homepage/sitguru-dog-walking-hero.jpg"
          alt=""
          fill
          className="object-cover object-[18%_40%]"
          sizes="(max-width: 1024px) 100vw, 42vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#0F2744]/45 via-[#0F2744]/10 to-transparent" />
        <p className="absolute right-4 top-3 max-w-[230px] whitespace-pre-line text-right font-serif text-[15px] font-semibold italic leading-snug !text-white drop-shadow sm:text-lg">
          {quote}
        </p>
      </div>
    </section>
  );
}
