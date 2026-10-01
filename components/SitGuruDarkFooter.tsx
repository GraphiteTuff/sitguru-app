import Link from "next/link";
import SitGuruDarkLogo from "@/components/SitGuruDarkLogo";

type FooterLink = {
  href: string;
  label: string;
};

type SitGuruDarkFooterProps = {
  dashboardHref: string;
  links?: FooterLink[];
};

export default function SitGuruDarkFooter({
  dashboardHref,
  links = [],
}: SitGuruDarkFooterProps) {
  return (
    <footer className="border-t border-white/10 bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <SitGuruDarkLogo
            href={dashboardHref}
            imageClassName="w-[165px] sm:w-[190px]"
          />

          <p className="max-w-md text-sm leading-6 text-slate-400">
            Trusted Pet Care. Simplified.
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}

          <span className="text-slate-500">
            © {new Date().getFullYear()} SitGuru
          </span>
        </div>
      </div>
    </footer>
  );
}