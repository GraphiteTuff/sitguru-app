export default function Brand({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span className={`inline-flex items-start font-bold ${className}`}>
      SitGuru
      <sup className="ml-0.5 text-[10px] font-semibold opacity-70">™</sup>
    </span>
  );
}