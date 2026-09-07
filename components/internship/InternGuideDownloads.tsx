"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Download, Printer } from "lucide-react";
import {
  INTERN_GUIDE_PRINT_PATH,
  INTERN_GUIDE_WORD_HREF,
} from "@/lib/internship/intern-help";
import { internGhostBtnClass, internPrimaryBtnClass } from "@/lib/internship/intern-ui";

export default function InternGuideDownloads({
  printPage = false,
  autoPrint = false,
}: {
  printPage?: boolean;
  autoPrint?: boolean;
}) {
  useEffect(() => {
    if (!autoPrint) return;
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      {printPage ? (
        <button
          type="button"
          onClick={() => window.print()}
          className={`${internPrimaryBtnClass} min-h-11 px-4 text-xs`}
        >
          <Printer size={16} />
          Print PDF
        </button>
      ) : (
        <Link
          href={`${INTERN_GUIDE_PRINT_PATH}?autoprint=1`}
          className={`${internPrimaryBtnClass} min-h-11 px-4 text-xs`}
        >
          <Printer size={16} />
          Print PDF
        </Link>
      )}
      <a
        href={INTERN_GUIDE_WORD_HREF}
        className={`${internGhostBtnClass} min-h-11 px-4 text-xs`}
      >
        <Download size={16} />
        Download Word
      </a>
    </div>
  );
}
