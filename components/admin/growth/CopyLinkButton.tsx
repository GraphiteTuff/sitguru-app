"use client";

import { useState } from "react";

export default function CopyLinkButton({
  value,
  label = "Copy link",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-900"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
