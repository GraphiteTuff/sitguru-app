import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pet Gurus | Join SitGuru as a Local Pet Care Provider",
  description:
    "Become a Pet Guru on SitGuru and connect with local Pet Parents looking for dog walking, pet sitting, boarding, training, and more.",
};

export default function PetGurusPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e9fbf8] via-white to-[#f3fbff]">
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-20 text-center">
        <p className="mb-4 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          For Pet Gurus
        </p>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
          Turn your love for pets into local pet care opportunities.
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
          SitGuru helps Pet Gurus connect with Pet Parents who need trusted help
          with dog walking, pet sitting, boarding, drop-in visits, training, and
          everyday care.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-full bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-lg transition hover:bg-emerald-700"
          >
            Sign Up Free
          </Link>

          <Link
            href="/become-a-guru"
            className="rounded-full border border-emerald-200 bg-white px-8 py-4 text-base font-bold text-slate-800 shadow-sm transition hover:border-emerald-400"
          >
            Become a Guru
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-xl font-bold text-slate-950">
            Build Your Profile
          </h2>
          <p className="mt-3 text-slate-700">
            Create a profile that helps local Pet Parents understand your care
            services, experience, and availability.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-xl font-bold text-slate-950">
            Offer Pet Services
          </h2>
          <p className="mt-3 text-slate-700">
            Support families with dog walking, sitting, boarding, drop-in
            visits, training, and other trusted pet care.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-xl font-bold text-slate-950">
            Grow Locally
          </h2>
          <p className="mt-3 text-slate-700">
            SitGuru is designed to help local Pet Gurus get discovered by Pet
            Parents in their community.
          </p>
        </div>
      </section>
    </main>
  );
}