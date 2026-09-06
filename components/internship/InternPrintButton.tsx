"use client";

import { Printer } from "lucide-react";
import { internGhostBtnClass } from "@/lib/internship/intern-ui";

export default function InternPrintButton({
  label = "Print this page",
}: {
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`${internGhostBtnClass} print:hidden`}
    >
      <Printer size={16} />
      {label}
    </button>
  );
}
