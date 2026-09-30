import { VERIFIED_BY_SITGURU_COPY } from "@/lib/credentials/model";

export default function VerifiedMeaning() {
  return (
    <details className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
      <summary className="cursor-pointer font-bold text-[#0D5C3A]">
        What does “Verified by SitGuru” mean?
      </summary>
      <p className="mt-2 leading-6">{VERIFIED_BY_SITGURU_COPY}</p>
      <a href="/help/trust-credentials/verified-by-sitguru" className="mt-2 inline-flex font-bold text-[#0D5C3A] underline">
        Read the Help Center note
      </a>
    </details>
  );
}
