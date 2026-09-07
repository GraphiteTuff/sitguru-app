import type { Metadata } from "next";
import Link from "next/link";
import InternGuideDownloads from "@/components/internship/InternGuideDownloads";
import { requireInternHelpAccess } from "@/lib/internship/intern-help-access";
import {
  internGuideParts,
  internGuidePortalHtml,
  internGuideSourceHtml,
} from "@/lib/internship/intern-guide-document";
import {
  INTERN_GUIDE_CONFIDENTIALITY,
  INTERNSHIP_HELP_PATH,
} from "@/lib/internship/intern-help";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Print intern student user guide",
  description:
    "Print or save a PDF of the SitGuru Intern Portal student user guide.",
};

export default async function InternGuidePrintPage({
  searchParams,
}: {
  searchParams: Promise<{ autoprint?: string }>;
}) {
  await requireInternHelpAccess();
  const { autoprint } = await searchParams;
  const source = internGuidePortalHtml(await internGuideSourceHtml());
  const { style, body } = internGuideParts(source);

  return (
    <main className="intern-guide-print bg-white">
      <style>{`
        ${style}
        @page {
          size: letter;
          margin: 0.55in 0.5in 0.95in 0.5in;
          @bottom-center {
            content: ${JSON.stringify(INTERN_GUIDE_CONFIDENTIALITY)};
            font-family: "Segoe UI", system-ui, sans-serif;
            font-size: 7.5pt;
            color: #64748b;
          }
        }
        @media print {
          .print-toolbar, #crisp-chatbox { display: none !important; }
          body, .intern-guide-print { background: #fff !important; }
          section { page-break-inside: auto !important; break-inside: auto !important; overflow: visible; }
          figure, .cover { page-break-inside: avoid; break-inside: avoid; overflow: visible; }
          img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            max-height: 8.2in;
            width: auto;
            max-width: 100%;
            object-fit: contain;
          }
          .cover img { max-height: 9in; margin: 0 auto; }
          .two { display: block !important; }
        }
      `}</style>
      <div className="print-toolbar mx-auto flex max-w-[880px] flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href={INTERNSHIP_HELP_PATH} className="text-sm font-black text-emerald-800">
          Back to intern Help
        </Link>
        <InternGuideDownloads printPage autoPrint={autoprint === "1"} />
      </div>
      <div dangerouslySetInnerHTML={{ __html: body }} />
    </main>
  );
}
