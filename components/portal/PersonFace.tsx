import { deskInitials } from "@/lib/portal/desk-ui";

const SIZE = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-11 w-11 text-sm",
} as const;

export default function PersonFace({
  name,
  src,
  size = "sm",
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZE;
}) {
  const photo = String(src || "").trim();
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white font-black text-[#1D4ED8] ring-1 ring-slate-200 ${SIZE[size]}`}
    >
      <span className="absolute inset-0 bg-white" />
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="relative z-[1] h-full w-full object-cover object-center" />
      ) : (
        <span className="relative z-[1]">{deskInitials(name)}</span>
      )}
    </span>
  );
}

export function InternName({
  name,
  src,
  size = "xs",
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <PersonFace name={name} src={src} size={size} />
      <span className="truncate">{name}</span>
    </span>
  );
}
