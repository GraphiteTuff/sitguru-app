import Image from "next/image";
import Link from "next/link";

type SiteLogoProps = {
  href?: string;
  priority?: boolean;
  imageClassName?: string;
  wrapperClassName?: string;
  variant?: "default" | "halloween";
};

const logos = {
  default: {
    src: "/images/sitguru-logo-cropped.png",
    width: 1003,
    height: 357,
  },
  halloween: {
    src: "/images/sitguru-halloween-logo-footer.png",
    width: 933,
    height: 309,
  },
} as const;

export default function SiteLogo({
  href = "/",
  priority = false,
  imageClassName = "",
  wrapperClassName = "",
  variant = "default",
}: SiteLogoProps) {
  const logoFile = logos[variant];
  const logo = (
    <div
      className={`flex shrink-0 items-center justify-start ${
        variant === "halloween" ? "" : "overflow-hidden"
      } ${wrapperClassName}`}
    >
      <Image
        src={logoFile.src}
        alt="SitGuru logo"
        width={logoFile.width}
        height={logoFile.height}
        priority={priority}
        className={
          variant === "halloween"
            ? `h-auto w-full object-contain object-left ${imageClassName}`
            : `h-full w-auto max-w-none object-contain ${imageClassName}`
        }
      />
    </div>
  );

  if (!href) return logo;

  return (
    <Link
      href={href}
      aria-label="SitGuru home"
      className="inline-flex shrink-0 items-center"
    >
      {logo}
    </Link>
  );
}