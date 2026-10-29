import Image from "next/image";
import type { ReactNode } from "react";
import { INTERN_PORTAL_BRAND } from "@/lib/internship/intern-portal-nav";
import { INTERN_BANNER } from "@/lib/portal/desk-ui";
import { deskScriptFont as script } from "@/lib/portal/script-font";

export default function InternHeroBanner({
  title,
  subtitle,
  icon,
  overlay = INTERN_PORTAL_BRAND.impactLine,
  imageSrc = INTERN_BANNER,
  scriptLines,
}: {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  overlay?: string;
  imageSrc?: string;
  scriptLines?: string[];
}) {
  const lines = scriptLines?.length
    ? scriptLines
    : ["Learn. Create.", "Make an impact.", "Happier pets.", "Brighter communities."];
  return (
    <section className="overflow-hidden rounded-2xl border border-sky-100/80 bg-gradient-to-r from-[#EFF6FF] via-white to-[#F0FDF4] shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
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
          <Image src={imageSrc} alt="Golden retriever on a walk" fill className="object-cover object-[center_40%]" sizes="(max-width: 1024px) 100vw, 40vw" />
          <p className={`${script.className} absolute left-3 top-3 max-w-[15rem] rounded-2xl bg-white/92 px-3 py-2 text-[1.45rem] font-bold leading-tight text-[#0F2744] shadow-sm`}>
            {lines.map((line, index) => (
              <span key={line}>
                {index === 2 ? (
                  <span className="underline decoration-[#16A34A] decoration-[3px] underline-offset-2">{line}</span>
                ) : (
                  line
                )}
                {index < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
          <span className="sr-only">{overlay}</span>
        </div>
      </div>
    </section>
  );
}
