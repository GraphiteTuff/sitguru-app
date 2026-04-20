import Image from "next/image";
import Link from "next/link";

type SiteLogoProps = {
  href?: string;
  priority?: boolean;
  imageClassName?: string;
  wrapperClassName?: string;
};

export default function SiteLogo({
  href = "/",
  priority = false,
  imageClassName = "",
  wrapperClassName = "",
}: SiteLogoProps) {
  const logo = (
    <div
      className={`flex shrink-0 items-center justify-start overflow-hidden ${wrapperClassName}`}
    >
      <Image
        src="/images/sitguru-logo-cropped.png"
        alt="SitGuru logo"
        width={1176}
        height={444}
        priority={priority}
        className={`h-full w-auto max-w-none object-contain ${imageClassName}`}
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