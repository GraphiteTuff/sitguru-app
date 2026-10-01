import Image from "next/image";
import Link from "next/link";

type SitGuruDarkLogoProps = {
  href?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export default function SitGuruDarkLogo({
  href = "/",
  className = "",
  imageClassName = "",
  priority = false,
}: SitGuruDarkLogoProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center shrink-0 ${className}`}
      aria-label="Go to SitGuru home"
    >
      <Image
        src="/images/sitguru-logo-on-dark.png"
        alt="SitGuru"
        width={731}
        height={449}
        priority={priority}
        className={`h-14 w-auto object-contain object-left sm:h-16 ${imageClassName}`}
      />
    </Link>
  );
}