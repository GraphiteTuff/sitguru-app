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
        src="/images/sitguru-logo-dark.png"
        alt="SitGuru"
        width={300}
        height={112}
        priority={priority}
        className={`h-auto w-[170px] sm:w-[210px] lg:w-[240px] ${imageClassName}`}
      />
    </Link>
  );
}