import Image from "next/image";
import {
  AcademyType,
  getAcademyBadgeConfig,
} from "@/lib/university/academyBadges";

type AcademyGraduateBadgeVariant =
  | "chip"
  | "photo-overlay"
  | "photo-strip"
  | "card"
  | "mini";

type AcademyGraduateBadgeProps = {
  academyType: AcademyType;
  variant?: AcademyGraduateBadgeVariant;
  className?: string;
};

export default function AcademyGraduateBadge({
  academyType,
  variant = "chip",
  className = "",
}: AcademyGraduateBadgeProps) {
  const badge = getAcademyBadgeConfig(academyType);

  if (variant === "photo-overlay") {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/92 px-2.5 py-1.5 shadow-[0_8px_18px_rgba(15,23,42,0.14)] backdrop-blur ${className}`}
      >
        <Image
          src={badge.imagePath}
          alt={`${badge.shortLabel} badge`}
          width={30}
          height={30}
          className="h-[30px] w-[30px] shrink-0 object-contain"
          unoptimized
        />

        <span className="max-w-[92px] text-[10px] font-black uppercase leading-[1.05] tracking-[0.08em] text-slate-950">
          {badge.shortLabel}
        </span>
      </div>
    );
  }

  if (variant === "photo-strip") {
    return (
      <div
        className={`inline-flex max-w-[235px] items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-2 shadow-[0_8px_18px_rgba(15,23,42,0.14)] backdrop-blur ${className}`}
      >
        <Image
          src={badge.imagePath}
          alt={`${badge.shortLabel} badge`}
          width={30}
          height={30}
          className="h-[30px] w-[30px] shrink-0 object-contain"
          unoptimized
        />

        <span className="min-w-0">
          <span className="block truncate text-xs font-black leading-4 text-[#07132f]">
            {badge.label}
          </span>
          <span className="block truncate text-[10px] font-bold leading-4 text-slate-600">
            {badge.completedThroughText}
          </span>
        </span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={`rounded-2xl border border-emerald-200 bg-white/95 p-4 text-center shadow-sm ${className}`}
      >
        <Image
          src={badge.imagePath}
          alt={`${badge.shortLabel} badge`}
          width={72}
          height={72}
          className="mx-auto h-[72px] w-[72px] object-contain"
          unoptimized
        />

        <p className="mt-3 text-sm font-black text-emerald-800">
          {badge.label}
        </p>

        <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
          {badge.description}
        </p>
      </div>
    );
  }

  if (variant === "mini") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-800 shadow-sm ${className}`}
      >
        <Image
          src={badge.imagePath}
          alt=""
          width={18}
          height={18}
          className="h-[18px] w-[18px] shrink-0 object-contain"
          unoptimized
        />
        {badge.chipLabel}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-black text-emerald-800 shadow-sm ${className}`}
    >
      <Image
        src={badge.imagePath}
        alt=""
        width={22}
        height={22}
        className="h-[22px] w-[22px] shrink-0 object-contain"
        unoptimized
      />
      {badge.label}
    </span>
  );
}