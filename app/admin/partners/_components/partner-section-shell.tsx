import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";
import BackToPartnersButton from "./back-to-partners-button";

type PartnerSectionShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children?: React.ReactNode;
  primaryActionHref?: string;
  primaryActionLabel?: string;
};

export default function PartnerSectionShell({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
  primaryActionHref,
  primaryActionLabel,
}: PartnerSectionShellProps) {
  return (
    <main className="min-h-screen bg-[#F7FAF3] text-[#17382B]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <BackToPartnersButton />

              <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <Icon className="h-7 w-7" />
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                {eyebrow}
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-[#17382B] sm:text-5xl lg:text-6xl">
                {title}
              </h1>

              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                {description}
              </p>
            </div>

            {primaryActionHref && primaryActionLabel ? (
              <div className="flex flex-col gap-3 sm:flex-row xl:pt-10">
                <Link
                  href={primaryActionHref}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#007A3D] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#006B35]"
                >
                  {primaryActionLabel}
                  <ArrowRight className="ml-2 h-4 w-4 !text-white" />
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        {children}
      </div>
    </main>
  );
}