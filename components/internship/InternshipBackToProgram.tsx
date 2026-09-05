import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { INTERNSHIP_ADMIN_PATH } from "@/lib/internship/constants";

export default function InternshipBackToProgram({
  className = "",
}: {
  className?: string;
}) {
  return (
    <Link
      href={INTERNSHIP_ADMIN_PATH}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 ${className}`}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Back to Internship Program
    </Link>
  );
}
