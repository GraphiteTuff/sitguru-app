"use client";

import { ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SitGuruBackButtonProps = {
  label?: string;
  fallbackHref?: string;
  fallbackLabel?: string;
  showFallback?: boolean;
  className?: string;
};

export default function SitGuruBackButton({
  label = "Back",
  fallbackHref = "/admin",
  fallbackLabel = "Admin Home",
  showFallback = true,
  className = "",
}: SitGuruBackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <div className={`mb-5 flex flex-wrap items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-2.5 text-sm font-black text-green-900 shadow-sm transition hover:border-green-700 hover:bg-green-50"
      >
        <ArrowLeft size={17} />
        {label}
      </button>

      {showFallback ? (
        <Link
          href={fallbackHref}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-green-900"
        >
          <Home size={16} />
          {fallbackLabel}
        </Link>
      ) : null}
    </div>
  );
}