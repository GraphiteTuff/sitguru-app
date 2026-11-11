import Link from "next/link";

export default function ServiceCtas({
  source = "reads",
}: {
  source?: string;
}) {
  const qs = `?utm_source=sitguru&utm_medium=reads&utm_campaign=${encodeURIComponent(source)}`;
  return (
    <section className="mt-10 rounded-[1.75rem] border border-emerald-100 bg-[#0D5C3A] p-6 text-white public-dark-section sm:p-8" data-brand-green>
      <h2 className="text-2xl font-black !text-white">Ready for trusted local care?</h2>
      <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-emerald-50">
        Learning is better with support. Find a Local Guru, become a Guru, or explore
        SitGuru guides related to what you just discovered.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/search${qs}`}
          className="rounded-full bg-white px-4 py-2.5 text-sm font-black text-[#0D5C3A]"
        >
          Find a Local Guru
        </Link>
        <Link
          href={`/become-a-guru${qs}`}
          className="rounded-full border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold !text-white"
        >
          Become a Guru
        </Link>
        <Link
          href="/help"
          className="rounded-full border border-white/30 px-4 py-2.5 text-sm font-bold !text-white"
        >
          Explore Related Pet Guides
        </Link>
      </div>
    </section>
  );
}
