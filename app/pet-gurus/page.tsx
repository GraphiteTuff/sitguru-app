import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pet Gurus | Become a Local Pet Care Provider",
  description:
    "Join SitGuru as a local Pet Guru and connect with Pet Parents looking for dog walking, pet sitting, boarding, drop-in visits, training, and more.",
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
    title: "Get found locally",
    description:
      "Create a profile so Pet Parents near you can learn about your services and experience.",
  },
  {
    title: "Offer the care you enjoy",
    description:
      "Provide dog walking, pet sitting, boarding, training, drop-in visits, and more.",
  },
  {
    title: "Grow with SitGuru",
    description:
      "Use SitGuru to build your local pet care presence and connect with families who need help.",
  },
];

export default function PetGurusPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e9fbf8] via-white to-[#f3fbff]">
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-14 text-center sm:px-6 sm:py-20">
        <p className="mb-4 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          For Pet Gurus
        </p>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
          Turn your love for pets into local pet care opportunities.
        </h1>

        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
          Join SitGuru as a Pet Guru and connect with Pet Parents who need dog
          walking, pet sitting, boarding, drop-in visits, training, and everyday
          pet care.
        </p>

        <div className="mt-8 grid w-full max-w-sm gap-3 sm:mt-10 sm:flex sm:max-w-none sm:justify-center">
          <Link
            href="/signup"
            className="rounded-full bg-emerald-600 px-8 py-4 text-center text-base font-bold text-white shadow-lg transition hover:bg-emerald-700"
          >
            Sign Up Free
          </Link>

          <Link
            href="/pet-parents"
            className="rounded-full border border-emerald-200 bg-white px-8 py-4 text-center text-base font-bold text-slate-800 shadow-sm transition hover:border-emerald-400"
          >
            Learn About Pet Parents
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
            Pet Guru services
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Offer pet care services that fit your skills and schedule.
          </h2>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
            Whether you offer daily walks, overnight sitting, boarding, cat
            care, puppy care, senior pet support, or training, SitGuru helps you
            reach local Pet Parents.
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
                Ready to become a Pet Guru?
              </h2>

              <p
                className="mt-5 text-base leading-7 sm:text-lg sm:leading-8"
                style={{ color: "rgba(255, 255, 255, 0.92)" }}
              >
                Create your free SitGuru account and start building your local
                pet care profile.
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