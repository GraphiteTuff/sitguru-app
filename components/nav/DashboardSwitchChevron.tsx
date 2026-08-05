/**
 * Rotational chevron for Switch Dashboard / role-switch triggers.
 */

type DashboardSwitchChevronProps = {
  isOpen?: boolean;
  className?: string;
};

/** Heroicons-style chevron-down path: M19.5 8.25l-7.5 7.5-7.5-7.5 */
export default function DashboardSwitchChevron({
  isOpen = false,
  className = "",
}: DashboardSwitchChevronProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 transform-gpu will-change-transform transition-transform duration-200 ease-out ${
        isOpen ? "rotate-180" : "rotate-0"
      } ${className}`}
    >
      <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
