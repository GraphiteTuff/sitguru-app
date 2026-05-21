import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pet Parents | Find Trusted Local Pet Care Near You",
  description:
    "Find trusted local pet care with SitGuru. Connect with Pet Gurus for dog walking, pet sitting, boarding, drop-in visits, training, and more.",
};

const services = [
  "Dog walking",
  "Pet sitting",
  "Drop-in visits",
  "Overnight care",
  "Dog boarding",
  "Cat sitting",
  "Pet training",
  "Puppy care",
  "Senior pet care",
];

const benefits = [
  {
    title: "Find care near you",
    description:
      "Connect with local Pet Gurus for walks, visits, sitting, boarding, and everyday pet care.",
  },
  {
    title: "Simple for busy schedules",
    description:
      "Use SitGuru when you need help during workdays, weekends, travel, or last-minute plans.",
  },
  {
    title: "For dogs, cats, and more",
    description:
      "Find support for puppies, senior pets, cats, dogs, and multi-pet households.",
  },
];

export default function PetParentsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e9fbf8] via-white to-[#f3fbff]">
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-14 text-center sm:px-6 sm:py-20">
        <p className="mb-4 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          For Pet Parents
        </p>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
          Find trusted local pet care with SitGuru.
        </h1>

        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
          Book local Pet Gurus for dog walking, pet sitting, boarding, drop-in
          visits, training, overnight care, and everyday pet care support.
        </p>

        <div className="mt-8 grid w-full max-w-sm gap-3 sm:mt-10 sm:flex sm:max-w-none sm:justify-center">
          <Link
            href="/signup"
            className="rounded-full bg-emerald-600 px-8 py-4 text-center text-base font-bold text-white shadow-lg transition hover:bg-emerald-700"
          >
            Sign Up Free
          </Link>

          <Link
            href="/pet-gurus"
            className="rounded-full border border-emerald-200 bg-white px-8 py-4 text-center text-base font-bold text-slate-800 shadow-sm transition hover:border-emerald-400"
          >
            Learn About Pet Gurus
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 pb-10 sm:px-6 md:grid-cols-3">
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8"
          >
            <h2 className="text-xl font-bold text-slate-950">
              {benefit.title}
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              {benefit.description}
            </p>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-12 sm:px-6 sm:pb-20">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">
            Pet care services
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Care for everyday life, travel, and busy days.
          </h2>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
            SitGuru makes it easier to find local pet care when you need a walk,
            a visit, overnight help, or support while you are away.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service}
                className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-base font-semibold text-slate-800"
              >
                {service}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-6 sm:pb-20">
        <div className="rounded-[2rem] bg-slate-950 p-6 shadow-xl sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">
                Get started
              </p>

              <h2
                className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
                style={{ color: "#ffffff" }}
              >
                Ready to find pet care?
              </h2>

              <p
                className="mt-5 text-base leading-7 sm:text-lg sm:leading-8"
                style={{ color: "rgba(255, 255, 255, 0.92)" }}
              >
                Create your free SitGuru account and start connecting with local
                Pet Gurus.
              </p>
            </div>

            <div className="grid gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-emerald-500 px-8 py-4 text-center text-base font-bold text-white shadow-lg transition hover:bg-emerald-400"
              >
                Sign Up Free
              </Link>

              <Link
                href="/"
                className="rounded-full border border-white/20 bg-white/10 px-8 py-4 text-center text-base font-bold text-white transition hover:bg-white/20"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}