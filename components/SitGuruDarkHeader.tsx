import Link from "next/link";
import SitGuruDarkLogo from "@/components/SitGuruDarkLogo";

type HeaderLink = {
  href: string;
  label: string;
};

type SitGuruDarkHeaderProps = {
  dashboardHref: string;
  links?: HeaderLink[];
  rightSlot?: React.ReactNode;
};

export default function SitGuruDarkHeader({
  dashboardHref,
  links = [],
  rightSlot,
}: SitGuruDarkHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 px-4 py-4 text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <SitGuruDarkLogo href={dashboardHref} priority />

        <div className="flex items-center gap-3">
          {links.length > 0 ? (
            <nav className="hidden items-center gap-2 md:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-300/50 hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}

          {rightSlot}
        </div>
      </div>
    </header>
  );
}