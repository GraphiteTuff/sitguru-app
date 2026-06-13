"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PublicAmbassador = {
  id: string;
  fullName: string;
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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "SG";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatLocation(ambassador: PublicAmbassador) {
  const city = ambassador.city || ambassador.serviceCity || "";
  const state = ambassador.state || ambassador.serviceState || "";

  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;

  return "Service area coming soon";
}

function getAmbassadorTypeLabel(value?: string | null) {
  const normalized = String(value || "").trim();

  if (!normalized) return "SitGuru Ambassador";

  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AmbassadorSearchBlock() {
  const [ambassadors, setAmbassadors] = useState<PublicAmbassador[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAmbassadors() {
      setIsLoading(true);

      try {
        const response = await fetch("/api/ambassadors/public", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load public Ambassadors.");
        }

        const payload = (await response.json()) as {
          ambassadors?: PublicAmbassador[];
        };

        if (!isMounted) return;

        setAmbassadors(Array.isArray(payload.ambassadors) ? payload.ambassadors : []);
      } catch (error) {
        console.warn("Could not load Ambassador block:", error);

        if (isMounted) {
          setAmbassadors([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAmbassadors();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleAmbassadors = useMemo(
    () => ambassadors.slice(0, 4),
    [ambassadors],
  );

  if (!isLoading && visibleAmbassadors.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="rounded-[28px] border border-emerald-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fcfd_45%,#ecfdf5_100%)] p-5 shadow-sm sm:p-6 lg:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
                SitGuru community
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Meet SitGuru Ambassadors
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
                Ambassadors help Pet Parents, Gurus, partners, students, and
                local communities get started with SitGuru. They are separate
                from bookable Gurus and do not replace the care providers above.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/ambassadors"
                className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
              >
                View Ambassadors
              </Link>

              <Link
                href="/ambassadors"
                className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
              >
                Become an Ambassador
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`ambassador-skeleton-${index}`}
                    className="min-h-[210px] animate-pulse rounded-[24px] border border-slate-200 bg-white/80 p-4"
                  >
                    <div className="h-14 w-14 rounded-2xl bg-slate-100" />
                    <div className="mt-4 h-5 w-2/3 rounded-full bg-slate-100" />
                    <div className="mt-3 h-4 w-1/2 rounded-full bg-slate-100" />
                    <div className="mt-5 h-16 rounded-2xl bg-slate-100" />
                  </div>
                ))
              : visibleAmbassadors.map((ambassador) => {
                  const name = ambassador.fullName || "SitGuru Ambassador";
                  const photoUrl = ambassador.photoUrl || "";
                  const referralCode = String(ambassador.referralCode || "")
                    .trim()
                    .toUpperCase();

                  return (
                    <div
                      key={ambassador.id}
                      className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg font-black text-emerald-800">
                              {getInitials(name)}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-black text-slate-950">
                            {name}
                          </h3>

                          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                            {getAmbassadorTypeLabel(ambassador.ambassadorType)}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-600">
                            {formatLocation(ambassador)}
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-600">
                        {ambassador.bio ||
                          "This SitGuru Ambassador can help local Pet Parents and Gurus learn how to get started."}
                      </p>

                      {referralCode ? (
                        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
                            Referral code
                          </p>
                          <p className="mt-1 text-sm font-black text-emerald-950">
                            {referralCode}
                          </p>
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-col gap-2">
                        <Link
                          href="/ambassadors"
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-800 transition hover:bg-slate-50"
                        >
                          View Ambassador
                        </Link>

                        {referralCode ? (
                          <Link
                            href={`/signup?ref=${encodeURIComponent(referralCode)}`}
                            className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800"
                          >
                            Use Referral Code
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
    </section>
  );
}
