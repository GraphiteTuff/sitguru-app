import Link from "next/link";
import SiteLogo from "@/components/SiteLogo";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="page-container py-12">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <SiteLogo
              wrapperClassName="w-[190px] sm:w-[210px] lg:w-[230px]"
              imageClassName="h-80 w-auto"
            />

            <p className="mt-4 text-sm leading-6 text-slate-500">
              Trusted pet care for modern pet owners and gurus. Book services,
              connect with verified professionals, and manage everything in one place.
            </p>

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

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Find Care
              </p>
              <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-slate-600">
                <Link href="/search" className="hover:text-emerald-600">
                  Find Gurus
                </Link>
                <Link href="/become-a-guru" className="hover:text-emerald-600">
                  Become a Guru
                </Link>
                <Link href="/help" className="hover:text-emerald-600">
                  Help Center
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Pet Owners
              </p>
              <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-slate-600">
                <Link href="/login" className="hover:text-emerald-600">
                  Customer Login
                </Link>
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

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Gurus
              </p>
              <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-slate-600">
                <Link href="/guru/login" className="hover:text-emerald-600">
                  Guru Login
                </Link>
                <Link href="/guru/dashboard" className="hover:text-emerald-600">
                  Guru Dashboard
                </Link>
                <Link href="/guru/dashboard/services" className="hover:text-emerald-600">
                  Services
                </Link>
                <Link href="/guru/dashboard/availability" className="hover:text-emerald-600">
                  Availability
                </Link>
                <Link href="/guru/dashboard/earnings" className="hover:text-emerald-600">
                  Earnings
                </Link>
              </div>
            </div>

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
                <Link
                  href="/admin/login"
                  className="font-semibold text-slate-700 hover:text-emerald-600"
                >
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} SitGuru™. All rights reserved.
          </p>
          <p className="text-xs italic text-slate-400">
            Trusted Pet Care. Simplified.
          </p>
        </div>
      </div>
    </footer>
  );
}