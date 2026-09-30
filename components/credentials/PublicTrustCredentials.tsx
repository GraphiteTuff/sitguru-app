import { selectSearchChips } from "@/lib/credentials/model";
import { listPublicCredentialsForGurus } from "@/lib/credentials/server";
import { credentialIcon } from "@/components/credentials/credential-icons";
import VerifiedMeaning from "@/components/credentials/VerifiedMeaning";

export default async function PublicTrustCredentials({
  guruId,
  ownerUserId,
}: {
  guruId?: string | null;
  ownerUserId?: string | null;
}) {
  const keys = [guruId, ownerUserId].filter((value): value is string => Boolean(value));
  if (!keys.length) return null;

  let result: Awaited<ReturnType<typeof listPublicCredentialsForGurus>>;
  try {
    result = await listPublicCredentialsForGurus(keys);
  } catch {
    return null;
  }
  if (!result.enabled) return null;

  const highlights = result.highlights.filter(
    (item) => keys.includes(item.guruId) || keys.includes(item.ownerUserId),
  );
  if (!highlights.length) return null;

  const ordered = selectSearchChips(highlights, highlights.length).chips.length
    ? highlights
    : highlights;

  return (
    <section
      id="trust-credentials"
      className="mt-6 rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,0.06)]"
      aria-labelledby="trust-credentials-heading"
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0D5C3A]">
        Trust & Credentials
      </p>
      <h2
        id="trust-credentials-heading"
        className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950"
      >
        Professional highlights
      </h2>
      <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
        These are optional credentials this Guru chose to share. SitGuru reviewed the ones marked verified.
      </p>
      <div className="mt-5 grid gap-3">
        {ordered.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-[#F7FBF8] p-4">
            <h3 className="text-lg font-black text-slate-950">
              <span aria-hidden="true">{credentialIcon(item.icon)} </span>
              {item.badgeLabel}
            </h3>
            {item.providerName ? (
              <p className="mt-1 text-sm font-semibold text-slate-700">{item.providerName}</p>
            ) : null}
            <p className="mt-1 text-sm font-semibold text-slate-600">{item.summary}</p>
            <p className="mt-2 text-sm font-black text-[#0D5C3A]">✓ Verified by SitGuru</p>
            {item.validThrough ? (
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Valid through {item.validThrough}
              </p>
            ) : null}
          </article>
        ))}
      </div>
      <VerifiedMeaning />
    </section>
  );
}
