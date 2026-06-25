type GuruRecognitionBadgeProps = {
  label?: string;
  sublabel?: string;
  stars?: number;
  size?: "sm" | "md" | "lg";
  showStars?: boolean;
  className?: string;
  imageSrc?: string;
  compactOnMobile?: boolean;
};

export default function GuruRecognitionBadge({
  label = "Certified SitGuru Guru",
  sublabel = "Guru Academy Graduate",
  stars = 5,
  size = "md",
  showStars = false,
  className = "",
  imageSrc = "/images/badges/sitguru-certified-guru-badge.png",
  compactOnMobile = true,
}: GuruRecognitionBadgeProps) {
  const sizeClasses = {
    sm: {
      wrapper: "gap-2 rounded-xl px-3 py-2",
      crest: "h-8 w-8 sm:h-10 sm:w-10",
      label: "text-xs sm:text-sm",
      star: "text-[10px] sm:text-xs",
      sublabel: "text-[9px] sm:text-[10px]",
    },
    md: {
      wrapper: "gap-2 rounded-xl px-3 py-2 sm:gap-3 sm:rounded-[1.1rem] sm:px-4 sm:py-3",
      crest: "h-9 w-9 sm:h-14 sm:w-14",
      label: "text-xs sm:text-base",
      star: "text-[10px] sm:text-sm",
      sublabel: "text-[9px] sm:text-xs",
    },
    lg: {
      wrapper: "gap-2 rounded-xl px-3 py-2 sm:gap-4 sm:rounded-[1.35rem] sm:px-5 sm:py-4",
      crest: "h-10 w-10 sm:h-20 sm:w-20",
      label: "text-sm sm:text-xl",
      star: "text-xs sm:text-base",
      sublabel: "text-[10px] sm:text-sm",
    },
  };

  const selected = sizeClasses[size];

  return (
    <div
      className={`inline-flex max-w-full items-center border border-emerald-200 bg-white/95 shadow-[0_10px_24px_rgba(15,23,42,0.10)] ${selected.wrapper} ${className}`}
    >
      <div className={`${selected.crest} shrink-0 overflow-hidden rounded-xl bg-white`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={`${label} badge`}
          className="h-full w-full object-contain"
        />
      </div>

      <div className="flex min-w-0 flex-col items-start text-left">
        <span
          className={`${selected.label} max-w-[180px] truncate font-black leading-tight !text-slate-900 sm:max-w-none`}
        >
          {label}
        </span>

        {compactOnMobile ? (
          <span
            className={`${selected.sublabel} mt-0.5 hidden font-bold uppercase tracking-[0.12em] !text-emerald-700 sm:block`}
          >
            {sublabel}
          </span>
        ) : (
          <span
            className={`${selected.sublabel} mt-0.5 font-bold uppercase tracking-[0.12em] !text-emerald-700`}
          >
            {sublabel}
          </span>
        )}

        {showStars ? (
          <div
            className="mt-1 hidden items-center gap-1 sm:flex"
            aria-label={`${stars} out of 5 recognition stars`}
          >
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                key={index}
                className={`${selected.star} ${
                  index < stars ? "text-amber-400" : "text-slate-300"
                }`}
                aria-hidden="true"
              >
                ★
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function GuruCrestIcon({
  className = "h-8 w-8 sm:h-10 sm:w-10",
  imageSrc = "/images/badges/sitguru-certified-guru-badge.png",
}: {
  className?: string;
  imageSrc?: string;
}) {
  return (
    <div className={`${className} shrink-0 overflow-hidden rounded-xl bg-white`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt="Certified SitGuru Guru badge"
        className="h-full w-full object-contain"
      />
    </div>
  );
}