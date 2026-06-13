"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PublicAmbassador = {
  id?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  serviceCity?: string | null;
  serviceState?: string | null;
  photoUrl?: string | null;
  referralCode?: string | null;
  ambassadorType?: string | null;
  bio?: string | null;
};

type AmbassadorResponse = {
  ambassadors?: PublicAmbassador[];
};

const MAX_VISIBLE_AMBASSADORS = 6;

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function getAmbassadorName(ambassador: PublicAmbassador) {
  const fullName = cleanText(ambassador.fullName);

  if (fullName) return fullName;

  const joinedName = [ambassador.firstName, ambassador.lastName]
    .map(cleanText)
    .filter(Boolean)
    .join(" ")
    .trim();

  return joinedName || "SitGuru Ambassador";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "SG";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getLocationLabel(ambassador: PublicAmbassador) {
  const city = cleanText(ambassador.serviceCity) || cleanText(ambassador.city);
  const state = cleanText(ambassador.serviceState) || cleanText(ambassador.state);

  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;

  return "Service area coming soon";
}

function getAmbassadorType(ambassador: PublicAmbassador) {
  return cleanText(ambassador.ambassadorType) || "SitGuru Ambassador";
}

function getReferralHref(referralCode?: string | null) {
  const code = cleanText(referralCode);

  if (!code) return "/ambassadors";

  return `/signup?ref=${encodeURIComponent(code)}`;
}

function AmbassadorPhoto({
  photoUrl,
  name,
}: {
  photoUrl?: string | null;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(cleanText(photoUrl)) && !failed;

  if (showPhoto) {
    return (
      <img
        src={cleanText(photoUrl)}
        alt={name}
        className="h-20 w-20 rounded-3xl object-cover ring-1 ring-emerald-100"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-emerald-100 bg-emerald-50 text-xl font-black text-emerald-800">
      {getInitials(name)}
    </div>
  );
}

export default function AmbassadorSearchBlock() {
  const [ambassadors, setAmbassadors] = useState<PublicAmbassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAmbassadors() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/ambassadors/public", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Ambassador profiles could not be loaded.");
        }

        const data = (await response.json()) as AmbassadorResponse;

        if (cancelled) return;

        setAmbassadors(Array.isArray(data.ambassadors) ? data.ambassadors : []);
      } catch (loadError) {
        console.error("Could not load public Ambassador profiles:", loadError);

        if (!cancelled) {
          setError("Ambassador profiles are coming soon.");
          setAmbassadors([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAmbassadors();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleAmbassadors = useMemo(
    () => ambassadors.slice(0, MAX_VISIBLE_AMBASSADORS),
    [ambassadors],
  );

  if (!loading && !visibleAmbassadors.length && !error) return null;

  return (
    <section className="mx-auto max-w-[1500px] px-5 pb-10 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.32em] text-emerald-700">
              SitGuru Community
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Meet SitGuru Ambassadors
            </h2>

            <p className="mt-3 max-w-4xl text-base leading-7 text-slate-700 sm:text-lg">
              Ambassadors help Pet Parents, Gurus, partners, students, and local
              communities get started with SitGuru.
            </p>

            <p className="mt-2 max-w-4xl text-base leading-7 text-slate-700 sm:text-lg">
              They are separate from bookable Gurus and do not replace the care
              providers above.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <Link
              href="/ambassadors"
              className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
            >
              View Ambassadors
            </Link>

            <Link
              href="/ambassador/signup"
              className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              Become an Ambassador
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-[24px] border border-slate-200 bg-white/80"
              />
            ))}
          </div>
        ) : error && !visibleAmbassadors.length ? (
          <div className="mt-8 rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-800">
            {error}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
            {visibleAmbassadors.map((ambassador) => {
              const name = getAmbassadorName(ambassador);
              const referralCode = cleanText(ambassador.referralCode);

              return (
                <article
                  key={ambassador.id || `${name}-${referralCode}`}
                  className="flex min-h-[300px] flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <AmbassadorPhoto photoUrl={ambassador.photoUrl} name={name} />

                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-2xl font-black leading-tight text-slate-950">
                        {name}
                      </h3>

                      <p className="mt-1 text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                        {getAmbassadorType(ambassador)}
                      </p>

                      <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-600">
                        {getLocationLabel(ambassador)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">
                    {cleanText(ambassador.bio) ||
                      "This SitGuru Ambassador can help local Pet Parents and Gurus learn how to get started."}
                  </p>

                  {referralCode ? (
                    <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                        Referral Code
                      </p>
                      <p className="mt-1 break-words text-base font-black text-slate-950">
                        {referralCode}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-auto flex flex-col gap-3 pt-5">
                    <Link
                      href="/ambassadors"
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-50"
                    >
                      View Ambassador
                    </Link>

                    {referralCode ? (
                      <Link
                        href={getReferralHref(referralCode)}
                        className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
                      >
                        Use Referral Code
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
