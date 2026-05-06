"use client";

import Link from "next/link";
import { useState } from "react";

type PackageFormat = "csv" | "excel" | "word" | "pdf";

type DownloadLink = {
  label: string;
  description: string;
  href: string;
  format: PackageFormat;
  included: boolean;
  source: string;
};

type ExportPackageActionsProps = {
  exportId: string;
  packageType: string;
  format: string;
  startDate: string | null;
  endDate: string | null;
};

function normalizeFormat(value: string): PackageFormat {
  const normalized = value.toLowerCase();

  if (normalized === "xlsx" || normalized === "xls") return "excel";
  if (normalized === "doc" || normalized === "docx") return "word";
  if (normalized === "html" || normalized === "print") return "pdf";
  if (normalized === "csv") return "csv";
  if (normalized === "word") return "word";
  if (normalized === "pdf") return "pdf";

  return "excel";
}

export default function ExportPackageActions({
  exportId,
  packageType,
  format,
  startDate,
  endDate,
}: ExportPackageActionsProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    "Prepare this record as a linked CPA package and store the package metadata.",
  );
  const [tone, setTone] = useState<"green" | "amber" | "rose">("green");
  const [downloadLinks, setDownloadLinks] = useState<DownloadLink[]>([]);

  async function preparePackage() {
    setLoading(true);
    setTone("amber");
    setMessage("Preparing CPA package links and updating export metadata...");

    try {
      const response = await fetch("/api/admin/financials/export-packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          exportId,
          packageType,
          format: normalizeFormat(format),
          startDate,
          endDate,
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        message?: string;
        downloadLinks?: DownloadLink[];
      };

      if (!response.ok || !json.ok) {
        setTone("rose");
        setMessage(json.message || "Unable to prepare CPA package.");
        return;
      }

      setDownloadLinks(Array.isArray(json.downloadLinks) ? json.downloadLinks : []);
      setTone("green");
      setMessage(
        json.message ||
          "CPA package prepared. Statement links are ready for download.",
      );
    } catch (error) {
      setTone("rose");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to prepare CPA package.",
      );
    } finally {
      setLoading(false);
    }
  }

  const toneClass = {
    green: "border-emerald-100 bg-emerald-50 text-emerald-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    rose: "border-rose-100 bg-rose-50 text-rose-800",
  }[tone];

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
        CPA Package
      </p>

      <h2 className="mt-2 text-2xl font-black text-slate-950">
        Prepare Package
      </h2>

      <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
        This creates the package metadata, refreshes the linked export list, and
        audit-logs that the CPA package was prepared. ZIP storage comes next.
      </p>

      <div className={`mt-5 rounded-[1.25rem] border p-4 text-sm font-bold leading-6 ${toneClass}`}>
        {message}
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={() => {
          void preparePackage();
        }}
        className="mt-5 w-full rounded-[1.25rem] bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Preparing..." : "Prepare CPA Package"}
      </button>

      {downloadLinks.length > 0 ? (
        <div className="mt-5 space-y-3">
          {downloadLinks.map((link) => (
            <Link
              key={`${link.label}-${link.href}`}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noreferrer" : undefined}
              className="block rounded-[1.25rem] border border-emerald-100 bg-[#fbfefd] p-4 text-sm font-black text-emerald-900 transition hover:border-emerald-300 hover:bg-white"
            >
              {link.href.startsWith("/api/") ? "Download " : "Open "}
              {link.label} →
              <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">
                {link.description}
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
