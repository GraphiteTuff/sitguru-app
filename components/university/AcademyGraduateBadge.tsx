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
      <Image
        src={badge.imagePath}
        alt={`${badge.shortLabel} badge`}
        width={124}
        height={124}
        className={`h-[124px] w-[124px] shrink-0 object-contain drop-shadow-[0_14px_22px_rgba(0,0,0,0.32)] ${className}`}
        unoptimized
      />
    );
  }

  if (variant === "photo-strip") {
    return (
      <div
        className={`inline-flex max-w-[360px] items-center gap-3 rounded-2xl border border-white/20 bg-slate-950/78 px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.28)] backdrop-blur-md ${className}`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xl text-white shadow-sm">
          🎓
        </span>

        <span className="min-w-0">
          <span className="block text-[13px] font-black leading-4 text-white">
            {badge.label}
          </span>
          <span className="mt-0.5 block text-[11px] font-black leading-4 text-emerald-50">
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