import { INTERN_BRAND_LOGOS } from "@/lib/internship/intern-glossary";

export default function InternHelpBrandLogos() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-black text-slate-950">Official logos for Canva and CapCut</h2>
      <p className="text-sm font-semibold leading-6 text-slate-600">
        Download these SitGuru files only. Do not put a university logo on SitGuru
        work unless SitGuru recorded that the school said yes. On brand green
        <span className="font-black"> #166534</span>, type is white — never dark
        text. If a logo shows a white box on green, use mix-blend-multiply.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {INTERN_BRAND_LOGOS.map((logo) => (
          <li
            key={logo.id}
            className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm"
          >
            <div
              className={
                logo.onGreen
                  ? "public-dark-section flex min-h-28 items-center justify-center bg-[#166534] px-4 py-6"
                  : "flex min-h-28 items-center justify-center bg-slate-50 px-4 py-6"
              }
              {...(logo.onGreen ? { "data-brand-green": "" } : {})}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo.src}
                alt={logo.label}
                className={
                  logo.onGreen
                    ? "max-h-16 w-auto mix-blend-multiply"
                    : "max-h-16 w-auto"
                }
              />
            </div>
            <div className="space-y-2 px-4 py-3">
              <p className="text-sm font-black text-slate-950">{logo.label}</p>
              <p className="text-sm font-semibold leading-6 text-slate-600">{logo.use}</p>
              <a
                href={"download" in logo && logo.download ? logo.download : logo.src}
                download
                className="inline-flex min-h-11 items-center text-sm font-black text-emerald-800 underline"
              >
                Download
              </a>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-sm font-semibold text-slate-600">
        Print vectors:{" "}
        <a className="font-black text-emerald-800 underline" href="/images/brand/intern/sitguru-full-logo-vector.svg" download>
          SVG
        </a>
        {", "}
        <a className="font-black text-emerald-800 underline" href="/images/brand/intern/sitguru-full-logo-vector.pdf" download>
          PDF
        </a>
        {", "}
        <a className="font-black text-emerald-800 underline" href="/images/brand/intern/sitguru-full-logo-vector.eps" download>
          EPS
        </a>
        . Icon:{" "}
        <a className="font-black text-emerald-800 underline" href="/images/brand/intern/sitguru-icon-transparent.svg" download>
          transparent SVG
        </a>
        .
      </p>
    </section>
  );
}
