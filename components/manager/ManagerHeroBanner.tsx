import Image from "next/image";
import type { ReactNode } from "react";

export default function ManagerHeroBanner({
  title,
  subtitle,
  icon,
  overlay = "People grow. Pets bring us together.",
  imageSrc = "/images/homepage/sitguru-dog-walking-hero.jpg",
}: {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  overlay?: string;
  imageSrc?: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-sky-100/80 bg-gradient-to-r from-[#EFF6FF] via-white to-[#F0FDFA] shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-start gap-3">
            {icon ? (
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#DBEAFE] text-[#2563EB]">
                {icon}
              </span>
            ) : null}
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#0F2744] sm:text-4xl">
                {title}
              </h1>
              <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
        <div className="relative min-h-[120px] overflow-hidden lg:min-h-full">
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 40vw"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/25 via-black/10 to-transparent" />
          <p className="absolute bottom-3 right-3 max-w-[220px] text-right text-sm font-semibold italic !text-white drop-shadow">
            {overlay}
          </p>
        </div>
      </div>
    </section>
  );
}
