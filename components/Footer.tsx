import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="page-container py-8 sm:py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xl font-black tracking-tight text-slate-900">
              <span className="text-emerald-600">Paw</span>
              <span>Necto</span>
            </div>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Trusted pet care, built for modern owners, sitters, and walkers.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600">
            <Link href="/search" className="hover:text-emerald-700">Find Care</Link>
            <Link href="/become-a-sitter" className="hover:text-emerald-700">Become a Sitter</Link>
            <Link href="/bookings" className="hover:text-emerald-700">Bookings</Link>
            <Link href="/dashboard" className="hover:text-emerald-700">Dashboard</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}