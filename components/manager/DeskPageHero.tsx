import Image from "next/image";
import type { ReactNode } from "react";
import { DESK_BANNER, INTERN_BANNER } from "@/lib/portal/desk-ui";
import { deskScriptClass as script } from "@/lib/portal/script-font";

export default function DeskPageHero({
  icon,
  title,
  subtitle,
  quote,
  banner = "manager",
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  quote: string;
  banner?: "manager" | "intern";
}) {
  void quote;
  const intern = banner === "intern";
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
      <div className="relative min-h-[148px] overflow-hidden rounded-2xl sm:min-h-[168px]">
        <Image
          src={intern ? INTERN_BANNER : DESK_BANNER}
          alt={intern ? "Golden retriever on a walk" : "Real support. Real community. Happier pets."}
          fill
          className={intern ? "object-cover object-[center_40%]" : "object-cover object-center"}
          sizes="(max-width: 1024px) 100vw, 42vw"
          priority
        />
        {intern ? (
          <p className={`${script} absolute left-3 top-3 max-w-[16rem] rounded-2xl bg-white/92 px-3 py-2 text-[1.45rem] font-bold leading-tight text-[#0F2744] shadow-sm sm:left-4 sm:text-[1.7rem]`}>
            Learn. Create.
            <br />
            Make an impact.
            <br />
            <span className="underline decoration-[#16A34A] decoration-[3px] underline-offset-2">Happier pets.</span>
            <br />
            Brighter communities.
          </p>
        ) : null}
      </div>
    </section>
  );
}
