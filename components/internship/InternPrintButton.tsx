"use client";

import { Printer } from "lucide-react";

export default function InternPrintButton({
  label = "Print this page",
}: {
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-900 print:hidden"
    >
      <Printer size={16} />
      {label}
    </button>
  );
}
