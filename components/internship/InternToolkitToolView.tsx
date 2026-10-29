"use client";

import { useRouter } from "next/navigation";
import InternStudentTools from "@/components/internship/InternStudentTools";
import type { InternHomeToolId, InternPromoteEvent } from "@/lib/internship/intern-tools";
import type { InternshipWorkspaceData } from "@/lib/internship/types";

export default function InternToolkitToolView({
  data,
  events,
  tool,
  preview = false,
}: {
  data: InternshipWorkspaceData;
  events: InternPromoteEvent[];
  tool: InternHomeToolId;
  preview?: boolean;
}) {
  const router = useRouter();
  return (
    <InternStudentTools
      data={data}
      events={events}
      tool={tool}
      preview={preview}
      onBack={() => router.push("/intern/toolkit")}
    />
  );
}
