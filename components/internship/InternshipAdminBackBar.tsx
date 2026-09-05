"use client";

import { usePathname } from "next/navigation";
import InternshipBackToProgram from "@/components/internship/InternshipBackToProgram";
import { INTERNSHIP_ADMIN_PATH } from "@/lib/internship/constants";

export default function InternshipAdminBackBar() {
  const pathname = usePathname();
  if (!pathname || pathname === INTERNSHIP_ADMIN_PATH) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-2 pt-3 sm:px-6">
      <InternshipBackToProgram />
    </div>
  );
}
