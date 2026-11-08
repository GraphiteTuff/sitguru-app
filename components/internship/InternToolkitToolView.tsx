"use client";

import { useRouter } from "next/navigation";
import InternStudentTools from "@/components/internship/InternStudentTools";
import type { InternBrandCard } from "@/components/internship/InternBrandLibrary";
import type { InternHomeToolId, InternPromoteEvent } from "@/lib/internship/intern-tools";
import type { InternshipWorkspaceData } from "@/lib/internship/types";

export default function InternToolkitToolView({
  data,
  events,
  tool,
  preview = false,
  brandLibrary,
}: {
  data: InternshipWorkspaceData;
  events: InternPromoteEvent[];
  tool: InternHomeToolId;
  preview?: boolean;
  brandLibrary?: {
    assets: InternBrandCard[];
    total: number;
    page: number;
    pages: number;
    loadError: string;
    query: string;
    category: string;
  };
}) {
  const router = useRouter();
  return (
    <InternStudentTools
      data={data}
      events={events}
      tool={tool}
      preview={preview}
      brandLibrary={brandLibrary}
      onBack={() => router.push("/intern/toolkit")}
    />
  );
}
