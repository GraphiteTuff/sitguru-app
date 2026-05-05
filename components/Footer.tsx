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
              Trusted pet care for modern Pet Parents and Gurus. Book services,
              connect with trusted professionals, and manage everything in one
              place.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <Link
                href="/search?service=Pet%20Sitting"
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Pet Sitting
              </Link>

              <Link
                href="/search?service=Dog%20Walking"
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Dog Walking
              </Link>

              <Link
                href="/search"
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Pet Care
              </Link>

              <Link
                href="/partners"
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
              >
                Partner Network
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Find Care
              </p>

              <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-slate-600">
                <Link href="/search" className="hover:text-emerald-600">
                  Find a Guru
                </Link>

                <Link
                  href="/search?service=Pet%20Sitting"
                  className="hover:text-emerald-600"
                >
                  Pet Sitting
                </Link>

                <Link
                  href="/search?service=Dog%20Walking"
                  className="hover:text-emerald-600"
                >
                  Dog Walking
                </Link>

                <Link href="/search" className="hover:text-emerald-600">
                  Pet Care
                </Link>

                <Link href="/help" className="hover:text-emerald-600">
                  Help Center
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Pet Parents
              </p>

              <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-slate-600">
                <Link href="/customer/login" className="hover:text-emerald-600">
                  Customer Login
                </Link>

                <Link
                  href="/customer/dashboard"
                  className="hover:text-emerald-600"
                >
                  Dashboard
                </Link>

                <Link href="/search" className="hover:text-emerald-600">
                  Find a Guru
                </Link>

                <Link
                  href="/customer/dashboard/bookings"
                  className="hover:text-emerald-600"
                >
                  Bookings
                </Link>

                <Link
                  href="/customer/dashboard/messages"
                  className="hover:text-emerald-600"
                >
                  Messages
                </Link>

                <Link
                  href="/customer/dashboard/pets"
                  className="hover:text-emerald-600"
                >
                  My Pets
                </Link>

                <Link
                  href="/customer/dashboard/profile"
                  className="hover:text-emerald-600"
                >
                  My Profile
                </Link>

                <Link
                  href="/customer/dashboard/pawperks"
                  className="hover:text-emerald-600"
                >
                  PawPerks
                </Link>

                <Link
                  href="/customer/dashboard/bookings"
                  className="hover:text-emerald-600"
                >
                  My Care
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Gurus
              </p>

              <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-slate-600">
                <Link
                  href="/become-a-guru"
                  className="font-semibold text-emerald-700 hover:text-emerald-600"
                >
                  Become a Guru
                </Link>

                <Link
                  href="/programs"
                  className="font-semibold text-emerald-700 hover:text-emerald-600"
                >
                  Hiring Programs
                </Link>

                <Link
                  href="/ambassadors"
                  className="font-semibold text-emerald-700 hover:text-emerald-600"
                >
                  Ambassador Program
                </Link>

                <Link href="/guru/login" className="hover:text-emerald-600">
                  Guru Login
                </Link>

                <Link href="/guru/dashboard" className="hover:text-emerald-600">
                  Dashboard
                </Link>

                <Link
                  href="/guru/dashboard/bookings"
                  className="hover:text-emerald-600"
                >
                  Bookings
                </Link>

                <Link
                  href="/guru/dashboard/referrals"
                  className="hover:text-emerald-600"
                >
                  Referrals
                </Link>

                <Link
                  href="/guru/dashboard/messages"
                  className="hover:text-emerald-600"
                >
                  Messages
                </Link>

                <Link
                  href="/guru/dashboard/profile"
                  className="hover:text-emerald-600"
                >
                  My Profile
                </Link>

                <Link
                  href="/guru/dashboard/availability"
                  className="hover:text-emerald-600"
                >
                  Availability
                </Link>

                <Link
                  href="/guru/dashboard/earnings"
                  className="hover:text-emerald-600"
                >
                  Earnings
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Partners
              </p>

              <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-slate-600">
                <Link
                  href="/partners"
                  className="font-semibold text-emerald-700 hover:text-emerald-600"
                >
                  Partner Network
                </Link>

                <Link
                  href="/partners"
                  className="font-semibold text-emerald-700 hover:text-emerald-600"
                >
                  Become a Partner
                </Link>

                <Link
                  href="/affiliate-program"
                  className="font-semibold text-emerald-700 hover:text-emerald-600"
                >
                  Affiliate Program
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

                <Link href="/contact" className="hover:text-emerald-600">
                  Contact
                </Link>

                <Link href="/careers" className="hover:text-emerald-600">
                  Careers
                </Link>

                <Link href="/press" className="hover:text-emerald-600">
                  Press
                </Link>

                <Link href="/investors" className="hover:text-emerald-600">
                  Investors
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