import Link from "next/link";
import { READS_FORMAT_NAV } from "@/lib/reads/constants";

export default function FormatNavCards() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
          Explore formats
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-[#163127]">
          Find what you want to read, listen, or watch
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {READS_FORMAT_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
          >
            <p className="text-lg font-black text-[#0D5C3A]">{item.label}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
