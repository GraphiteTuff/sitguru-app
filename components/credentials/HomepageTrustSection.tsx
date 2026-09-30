"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics/track";

const ITEMS = [
  {
    icon: "🐾",
    title: "First Aid & CPR",
    body: "Professional pet emergency training",
  },
  {
    icon: "🛡",
    title: "Insured",
    body: "Verified pet-care liability coverage",
  },
  {
    icon: "🔐",
    title: "Bonded",
    body: "Verified bonding documentation",
  },
  {
    icon: "🎓",
    title: "Professional Credentials",
    body: "Recognized memberships and certifications",
  },
];

type Metric = { key: string; label: string; count: number };

export default function HomepageTrustSection() {
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/public/credentials?metrics=1")
      .then((response) => response.json())
      .then((payload: { enabled?: boolean; metrics?: Metric[] }) => {
        if (!cancelled && payload.enabled && payload.metrics?.length) {
          setMetrics(payload.metrics);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="trust-credentials trust-surface bg-[#F7FBF8] py-14 sm:py-16" aria-labelledby="homepage-trust-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0D5C3A]">
          Trust & Credentials
        </p>
        <h2
          id="homepage-trust-heading"
          className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl"
        >
          More ways to feel good about your Guru
        </h2>
        <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-600">
          Every Guru brings something different to the pack. Some choose to add professional training, insurance, bonding, memberships, and certifications to their SitGuru profiles.
        </p>
        <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
          Look for <span className="font-black text-[#0D5C3A]">Verified by SitGuru</span> credentials when they&apos;re available.
        </p>

        {metrics.length ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.key} className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-3xl font-black text-[#0D5C3A]">{metric.count}</p>
                <p className="mt-1 text-sm font-bold text-slate-700">{metric.label}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item) => (
            <article key={item.title} className="rounded-3xl border border-emerald-100 bg-white p-5">
              <p className="text-2xl" aria-hidden="true">{item.icon}</p>
              <h3 className="mt-3 text-lg font-black text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>

        <Link
          href="/search"
          onClick={() => {
            void trackEvent({
              eventName: "homepage_credentials_cta_clicked",
              eventType: "credentials",
              role: "customer",
              source: "homepage",
              metadata: { source_surface: "homepage" },
            });
          }}
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#0D5C3A] px-6 py-3 text-sm font-black !text-white"
        >
          Find Your Guru
        </Link>
      </div>
    </section>
  );
}
