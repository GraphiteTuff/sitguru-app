import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pet Parents | Find Trusted Pet Care Near You",
  description:
    "SitGuru helps Pet Parents find trusted local Pet Gurus for dog walking, pet sitting, boarding, drop-in visits, training, and more.",
};

export default function PetParentsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e9fbf8] via-white to-[#f3fbff]">
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-20 text-center">
        <p className="mb-4 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          For Pet Parents
        </p>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
          Find trusted local pet care with SitGuru.
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
          SitGuru helps Pet Parents connect with reliable local Pet Gurus for
          dog walking, pet sitting, boarding, drop-in visits, training, and
          everyday pet care support.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-full bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-lg transition hover:bg-emerald-700"
          >
            Sign Up Free
          </Link>

          <Link
            href="/find-care"
            className="rounded-full border border-emerald-200 bg-white px-8 py-4 text-base font-bold text-slate-800 shadow-sm transition hover:border-emerald-400"
          >
            Find Care
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-xl font-bold text-slate-950">
            Local Pet Gurus
          </h2>
          <p className="mt-3 text-slate-700">
            Discover trusted pet care providers in your area who can help with
            daily walks, visits, sitting, boarding, and more.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-xl font-bold text-slate-950">
            Care Made Simple
          </h2>
          <p className="mt-3 text-slate-700">
            SitGuru is built to make finding and managing pet care easier for
            busy Pet Parents.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-xl font-bold text-slate-950">
            Support for Every Pet
          </h2>
          <p className="mt-3 text-slate-700">
            Whether you need help with dogs, cats, or other pets, SitGuru helps
            you start with trusted local care options.
          </p>
        </div>
      </section>
    </main>
  );
}