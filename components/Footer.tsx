import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="page-container py-12">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">

          {/* 🔥 BRAND */}
          <div className="max-w-md">

            {/* Premium Logo + Slogan */}
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-black tracking-tight text-slate-900">
                <span className="text-emerald-600">Sit</span>Guru
              </span>
              <span className="mt-1 text-[11px] italic text-slate-500">
                Trusted Pet Care. Simplified.
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              Trusted pet care for modern pet owners and gurus. Book services,
              connect with verified professionals, and manage everything in one place.
            </p>

            {/* Tags */}
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-500">
                Pet Sitting
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-500">
                Dog Walking
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-500">
                Pet Care
              </span>
            </div>
          </div>

          {/* LINKS */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">

            {/* FIND CARE */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Find Care
              </p>
              <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-slate-600">
                <Link href="/search" className="hover:text-emerald-600">
                  Find Gurus
                </Link>
                <Link href="/become-a-sitter" className="hover:text-emerald-600">
                  Become a Guru
                </Link>
                <Link href="/help" className="hover:text-emerald-600">
                  Help Center
                </Link>
              </div>
            </div>

            {/* PET OWNERS */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Pet Owners
              </p>
              <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-slate-600">
                <Link href="/dashboard" className="hover:text-emerald-600">
                  Dashboard
                </Link>
                <Link href="/pets" className="hover:text-emerald-600">
                  My Pets
                </Link>
                <Link href="/bookings" className="hover:text-emerald-600">
                  Bookings
                </Link>
                <Link href="/dashboard/messages" className="hover:text-emerald-600">
                  Messages
                </Link>
              </div>
            </div>

            {/* GURUS */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Gurus
              </p>
              <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-slate-600">
                <Link href="/guru/dashboard" className="hover:text-emerald-600">
                  Dashboard
                </Link>
                <Link href="/guru/services" className="hover:text-emerald-600">
                  Services
                </Link>
                <Link href="/guru/availability" className="hover:text-emerald-600">
                  Availability
                </Link>
                <Link href="/guru/earnings" className="hover:text-emerald-600">
                  Earnings
                </Link>
              </div>
            </div>

            {/* COMPANY */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Company
              </p>
              <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-slate-600">
                <Link href="/about" className="hover:text-emerald-600">
                  About
                </Link>
                <Link href="/privacy" className="hover:text-emerald-600">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-emerald-600">
                  Terms
                </Link>
                <Link href="/admin/login" className="hover:text-emerald-600">
                  Admin
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} SitGuru.com. All rights reserved.
          </p>
          <p className="text-xs italic text-slate-400">
            Trusted Pet Care. Simplified.
          </p>
        </div>
      </div>
    </footer>
  );
}