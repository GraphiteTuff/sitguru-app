import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BackToPartnersButtonProps = {
  label?: string;
  className?: string;
};

export default function BackToPartnersButton({
  label = "Back to Partners",
  className = "",
}: BackToPartnersButtonProps) {
  return (
    <Link
      href="/admin/partners"
      className={`inline-flex w-fit items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 ${className}`}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Link>
  );
}