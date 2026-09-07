"use client";

import HelpSearchBar from "@/components/help/HelpSearchBar";
import { INTERN_HELP_ARTICLES } from "@/lib/internship/intern-help";

export default function InternHelpSearchBar({
  variant = "hero",
  autoFocus = false,
}: {
  variant?: "hero" | "header";
  autoFocus?: boolean;
}) {
  return (
    <HelpSearchBar
      variant={variant}
      autoFocus={autoFocus}
      placeholder={
        variant === "header"
          ? "Search intern help…"
          : "Search intern articles, tags, and topics…"
      }
      articles={INTERN_HELP_ARTICLES}
    />
  );
}
