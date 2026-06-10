type GuruRecognitionBadgeProps = {
  label?: string;
  sublabel?: string;
  stars?: number;
  size?: "sm" | "md" | "lg";
  showStars?: boolean;
  className?: string;
  imageSrc?: string;
};

export default function GuruRecognitionBadge({
  label = "Certified SitGuru Guru",
  sublabel = "Guru Academy Graduate",
  stars = 5,
  size = "md",
  showStars = false,
  className = "",
  imageSrc = "/images/badges/sitguru-certified-guru-badge.png",
}: GuruRecognitionBadgeProps) {
  const sizeClasses = {
    sm: {
      wrapper: "gap-2 rounded-xl px-3 py-2",
      crest: "h-10 w-10",
      label: "text-sm",
      star: "text-xs",
      sublabel: "text-[10px]",
    },
    md: {
      wrapper: "gap-3 rounded-[1.1rem] px-4 py-3",
      crest: "h-14 w-14",
      label: "text-base",
      star: "text-sm",
      sublabel: "text-xs",
    },
    lg: {
      wrapper: "gap-4 rounded-[1.35rem] px-5 py-4",
      crest: "h-20 w-20",
      label: "text-xl",
      star: "text-base",
      sublabel: "text-sm",
    },
  };

  const selected = sizeClasses[size];

  return (
    <div
      className={`inline-flex items-center border border-emerald-200 bg-white/95 shadow-[0_10px_24px_rgba(15,23,42,0.10)] ${selected.wrapper} ${className}`}
    >
      <div className={`${selected.crest} shrink-0 overflow-hidden rounded-xl bg-white`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={`${label} badge`}
          className="h-full w-full object-contain"
        />
      </div>

      <div className="flex flex-col items-start text-left">
        <span className={`${selected.label} font-black !text-slate-900`}>
          {label}
        </span>

        <span
          className={`${selected.sublabel} mt-0.5 font-bold uppercase tracking-[0.12em] !text-emerald-700`}
        >
          {sublabel}
        </span>

        {showStars ? (
          <div
            className="mt-1 flex items-center gap-1"
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
  className = "h-10 w-10",
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
