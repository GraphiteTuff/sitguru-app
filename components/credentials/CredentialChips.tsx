"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics/track";
import type { PublicCredentialHighlight } from "@/lib/credentials/model";
import { credentialIcon } from "@/components/credentials/credential-icons";

export { credentialIcon };

export function CredentialChips({
  chips,
  extraCount = 0,
  href,
}: {
  chips: Array<Pick<PublicCredentialHighlight, "id" | "chipLabel" | "icon" | "filterKey">>;
  extraCount?: number;
  href: string;
}) {
  if (!chips.length) return null;
  const destination = href.includes("#") ? href : `${href}#trust-credentials`;

  return (
    <div className="trust-credentials mt-3 flex flex-wrap gap-2" aria-label="Verified credentials">
      {chips.map((chip) => (
        <Link
          key={chip.id}
          href={destination}
          onClick={() => {
            void trackEvent({
              eventName: "credential_chip_clicked",
              eventType: "credentials",
              source: "find_care",
              metadata: {
                credential_type: chip.filterKey,
                platform: "web",
                source_surface: "find_care",
              },
            });
          }}
          className="inline-flex min-h-8 items-center gap-1 rounded-full border border-[#0D5C3A]/20 bg-[#F4FBF7] px-3 py-1 text-xs font-bold text-[#0D5C3A] hover:bg-[#E8F6EE]"
        >
          <span aria-hidden="true">{credentialIcon(chip.icon)}</span>
          {chip.chipLabel}
        </Link>
      ))}
      {extraCount > 0 ? (
        <Link
          href={destination}
          className="inline-flex min-h-8 items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600"
        >
          +{extraCount} more
        </Link>
      ) : null}
    </div>
  );
}
