import type { ReactNode } from "react";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";

export function CredentialHelpArticle({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <HelpArticleChrome
      eyebrow="Trust & Credentials"
      title={title}
      summary={summary}
      backHref="/help/trust-credentials"
      backLabel="Back to Trust & Credentials"
    >
      <div className="trust-credentials trust-surface space-y-4 rounded-3xl p-5 text-base font-semibold leading-7 text-slate-700">{children}</div>
    </HelpArticleChrome>
  );
}
