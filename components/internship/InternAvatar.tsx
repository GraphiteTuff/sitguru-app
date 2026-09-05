import Image from "next/image";
import { fallbackInitials } from "@/lib/sitguru/display";

const SIZE_CLASS = {
  sm: "h-11 w-11 text-xs",
  md: "h-16 w-16 text-sm",
  lg: "h-20 w-20 text-lg sm:h-24 sm:w-24",
} as const;

export default function InternAvatar({
  name,
  email,
  src,
  size = "md",
  className = "",
}: {
  name: string;
  email?: string | null;
  src?: string | null;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  const initials = fallbackInitials(name, email);
  const photo = String(src || "").trim();

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-white font-black text-emerald-800 shadow-sm ring-1 ring-white/40 ${SIZE_CLASS[size]} ${className}`}
      aria-hidden={!photo}
    >
      <span className="absolute inset-0 bg-white" />
      {photo ? (
        <Image
          src={photo}
          alt={`${name || "Intern"} profile photo`}
          fill
          sizes={size === "lg" ? "96px" : size === "md" ? "64px" : "44px"}
          className="sg-face-photo relative z-[1] object-cover object-center"
          unoptimized
        />
      ) : (
        <span className="relative z-[1]">{initials}</span>
      )}
    </span>
  );
}
