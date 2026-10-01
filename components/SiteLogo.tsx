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
      className={`flex shrink-0 items-center justify-start ${wrapperClassName}`}
    >
      <Image
        src="/images/sitguru-logo-footer.png"
        alt="SitGuru logo"
        width={799}
        height={517}
        priority={priority}
        className={`h-auto w-full object-contain object-left ${imageClassName}`}
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