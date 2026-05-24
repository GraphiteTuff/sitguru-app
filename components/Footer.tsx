import Link from "next/link";
import SiteLogo from "@/components/SiteLogo";

const serviceLinks = [
  { label: "Pet Sitting", href: "/search?service=Pet%20Sitting" },
  { label: "Dog Walking", href: "/search?service=Dog%20Walking" },
  { label: "Drop-Ins", href: "/search?service=Drop-In%20Visits" },
  { label: "Boarding", href: "/search?service=Boarding" },
  { label: "Training", href: "/search?service=Training%20Support" },
];

const findCareLinks = [
  { label: "Find a Guru", href: "/search", featured: true },
  { label: "Dog Walking", href: "/search?service=Dog%20Walking" },
  { label: "Pet Sitting", href: "/search?service=Pet%20Sitting" },
  { label: "Drop-In Visits", href: "/search?service=Drop-In%20Visits" },
  { label: "Boarding", href: "/search?service=Boarding" },
  { label: "Dog Training", href: "/search?service=Training%20Support" },
];

const petParentLinks = [
  { label: "Sign Up Free", href: "/signup", featured: true },
  { label: "Pet Parent Login", href: "/customer/login" },
  { label: "Find Care", href: "/search" },
  { label: "My Pets", href: "/my-pets" },
  { label: "PetPerks", href: "/petperks", featured: true },
  { label: "Help Center", href: "/help" },
];

const guruLinks = [
  { label: "Become a Guru", href: "/become-a-guru", featured: true },
  { label: "Guru Login", href: "/guru/login" },
  { label: "Guru Success Center", href: "/guru/success-center" },
  { label: "Guru Referrals & Rewards", href: "/guru/dashboard/referrals" },
  { label: "Programs", href: "/programs", featured: true },
  { label: "Ambassadors", href: "/ambassadors" },
];

const programLinks = [
  { label: "Programs Overview", href: "/programs", featured: true },
  { label: "Student Hire", href: "/programs#student-hire" },
  { label: "Community Hire", href: "/programs#community-hire" },
  { label: "Military Hire", href: "/programs#military-hire" },
  { label: "Ambassador Program", href: "/ambassadors", featured: true },
  { label: "Partner Network", href: "/partners" },
];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Careers", href: "/careers" },
  { label: "Help", href: "/help", featured: true },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Admin", href: "/admin/login" },
];

type FooterLink = {
  label: string;
  href: string;
  featured?: boolean;
};

type FooterColumnProps = {
  title: string;
  links: FooterLink[];
};

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm shadow-slate-900/[0.03] lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>

      <div className="mt-4 flex flex-col gap-3 text-sm font-semibold text-slate-600">
        {links.map((link) => (
          <Link
            key={`${title}-${link.href}-${link.label}`}
            href={link.href}
            className={`group inline-flex items-center justify-between gap-2 rounded-2xl px-0 py-1 transition hover:text-emerald-700 sm:justify-start ${
              link.featured ? "font-black text-emerald-700" : ""
            }`}
          >
            <span>{link.label}</span>
            {link.featured ? (
              <span className="hidden h-1.5 w-1.5 rounded-full bg-emerald-500 transition group-hover:scale-125 sm:inline-flex" />
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-emerald-100 bg-gradient-to-br from-white via-[#fbfdf9] to-emerald-50/70">
      <div className="page-container py-10 sm:py-12 lg:py-14">
        <div className="rounded-[32px] border border-emerald-100 bg-white/90 p-5 shadow-xl shadow-emerald-900/[0.05] sm:p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="max-w-xl">
              <SiteLogo
                wrapperClassName="w-[190px] sm:w-[210px] lg:w-[230px]"
                imageClassName="h-80 w-auto"
              />

              <p className="mt-4 max-w-lg text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                Trusted pet care made simple. SitGuru helps Pet Parents find
                local care and gives Pet Gurus, Ambassadors, students,
                community members, and military-connected families a better way
                to connect and grow locally.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/signup"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
                >
                  Sign Up Free
                </Link>

                <Link
                  href="/become-a-guru"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
                >
                  Become a Guru
                </Link>
              </div>

              <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm leading-6 text-slate-600">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-black text-slate-900">SitGuru Support</p>
                    <p className="mt-1 font-semibold">
                      Need help? Visit the Help Center or contact SitGuru for
                      support.
                    </p>
                  </div>

                  <Link
                    href="/help"
                    className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
                  >
                    Help Center
                  </Link>
                </div>

                <div className="mt-4 flex flex-col gap-2 font-bold text-emerald-800 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                  <a href="tel:18554748738" className="hover:text-emerald-900">
                    (855) 474-8738
                  </a>

                  <a
                    href="mailto:support@sitguru.com"
                    className="break-words hover:text-emerald-900"
                  >
                    support@sitguru.com
                  </a>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                {serviceLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    {link.label}
                  </Link>
                ))}

                <Link
                  href="/petperks"
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 font-black text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  PetPerks
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <FooterColumn title="Find Care" links={findCareLinks} />
              <FooterColumn title="Pet Parents" links={petParentLinks} />
              <FooterColumn title="Gurus" links={guruLinks} />
              <FooterColumn title="Programs" links={programLinks} />
              <FooterColumn title="Company" links={companyLinks} />

              <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-700 p-5 text-white shadow-lg shadow-emerald-900/10">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-50">
                  Grow with SitGuru
                </p>

                <p className="mt-3 text-lg font-black leading-7 text-white">
                  Students, community helpers, military-connected families, and
                  local pet lovers can help SitGuru grow.
                </p>

                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href="/programs"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
                  >
                    View Programs
                  </Link>

                  <Link
                    href="/ambassadors"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
                  >
                    Join Ambassadors
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-[28px] border border-emerald-100 bg-white/80 px-5 py-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              © {new Date().getFullYear()} SitGuru™. All rights reserved.
            </p>
            <p className="mt-1 text-xs italic text-slate-400">
              Trusted Pet Care. Simplified.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-slate-500 sm:justify-end">
            <Link href="/privacy" className="hover:text-emerald-700">
              Privacy
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/terms" className="hover:text-emerald-700">
              Terms
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/contact" className="hover:text-emerald-700">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
