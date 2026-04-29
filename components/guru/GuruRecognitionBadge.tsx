type GuruRecognitionBadgeProps = {
  label?: string;
  stars?: number;
  size?: "sm" | "md" | "lg";
  showStars?: boolean;
  className?: string;
};

export default function GuruRecognitionBadge({
  label = "Trusted Guru",
  stars = 3,
  size = "md",
  showStars = true,
  className = "",
}: GuruRecognitionBadgeProps) {
  const sizeClasses = {
    sm: {
      wrapper: "gap-2 rounded-xl px-3 py-2",
      crest: "h-9 w-8",
      label: "text-sm",
      star: "text-xs",
    },
    md: {
      wrapper: "gap-3 rounded-[1.1rem] px-4 py-3",
      crest: "h-12 w-10",
      label: "text-base",
      star: "text-sm",
    },
    lg: {
      wrapper: "gap-4 rounded-[1.35rem] px-5 py-4",
      crest: "h-16 w-14",
      label: "text-xl",
      star: "text-base",
    },
  };

  const selected = sizeClasses[size];

  return (
    <div
      className={`inline-flex items-center border border-white/80 bg-white/90 shadow-[0_10px_24px_rgba(15,23,42,0.10)] ${selected.wrapper} ${className}`}
    >
      <GuruCrestIcon className={selected.crest} />

      <div className="flex flex-col items-start">
        <span className={`${selected.label} font-black !text-slate-900`}>
          {label}
        </span>

        {showStars ? (
          <div className="mt-1 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                key={index}
                className={`${selected.star} ${
                  index < stars ? "text-amber-400" : "text-slate-300"
                }`}
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
  className = "h-10 w-8",
}: {
  className?: string;
}) {
  return (
    <div className={`${className} shrink-0`}>
      <svg
        viewBox="0 0 64 76"
        className="h-full w-full drop-shadow-[0_8px_14px_rgba(15,23,42,0.18)]"
        aria-hidden="true"
      >
        <path
          d="M32 3 55 10.5v20.7c0 18-10.3 32.8-23 41.3C19.3 64 9 49.2 9 31.2V10.5L32 3Z"
          fill="#0f172a"
        />
        <path
          d="M32 7.8 50.8 14v17.8c0 15.4-8.7 28.2-18.8 35.8-10.1-7.6-18.8-20.4-18.8-35.8V14L32 7.8Z"
          fill="#0f766e"
        />
        <path
          d="M32 9.8 48.6 15.3v16.1c0 13.7-7.8 25.1-16.6 31.9-8.8-6.8-16.6-18.2-16.6-31.9V15.3L32 9.8Z"
          fill="#2dd4bf"
        />
        <path
          d="M32 9.8 48.6 15.3v5.5c-3.9 2.2-10.9 3.7-17.9 2.6-6.2-.9-11.4-3.5-15.3-8.1V15.3L32 9.8Z"
          fill="#ffffff"
          opacity="0.28"
        />
        <path
          d="M32 7.8 50.8 14v17.8c0 15.4-8.7 28.2-18.8 35.8-10.1-7.6-18.8-20.4-18.8-35.8V14L32 7.8Z"
          fill="none"
          stroke="#ecfeff"
          strokeWidth="1.5"
          opacity="0.8"
        />
        <g fill="#ecfeff">
          <ellipse
            cx="23"
            cy="26"
            rx="3.7"
            ry="5.1"
            transform="rotate(-18 23 26)"
          />
          <ellipse
            cx="31"
            cy="22.8"
            rx="3.8"
            ry="5.4"
            transform="rotate(-6 31 22.8)"
          />
          <ellipse
            cx="40.5"
            cy="26"
            rx="3.7"
            ry="5.1"
            transform="rotate(18 40.5 26)"
          />
          <ellipse
            cx="46.6"
            cy="32.8"
            rx="3.1"
            ry="4.4"
            transform="rotate(28 46.6 32.8)"
          />
          <path d="M32 45.7c-6.6 0-11.5-4.6-11.5-10 0-5 4.3-8.2 7.7-9.1 2.8-.7 6-.7 7.7 0 3.4.9 7.6 4.1 7.6 9.1 0 5.4-4.8 10-11.5 10Z" />
        </g>
        <path
          d="M32 9.8 48.6 15.3v16.1c0 13.7-7.8 25.1-16.6 31.9"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.1"
          opacity="0.25"
        />
      </svg>
    </div>
  );
}