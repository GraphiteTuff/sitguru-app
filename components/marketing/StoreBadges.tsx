/**
 * Official-style store badges (visual only — apps not live yet).
 */

export function AppStoreBadge({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 40"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Download on the App Store — coming soon"
    >
      <rect width="120" height="40" rx="5.5" fill="#000" />
      <g fill="#fff" transform="translate(10.5 7.2)">
        <path d="M11.3 5.3c.55-.66.92-1.57.82-2.48-.8.03-1.76.53-2.33 1.2-.51.59-.96 1.54-.84 2.45.89.07 1.8-.45 2.35-1.17z" />
        <path d="M14.3 7.95c-1.53-.09-2.83.86-3.55.86-.74 0-1.86-.82-3.07-.8-1.58.02-3.04.92-3.85 2.34-1.65 2.85-.42 7.07 1.17 9.39.78 1.13 1.7 2.4 2.92 2.35 1.16-.05 1.61-.75 3.02-.75 1.4 0 1.8.75 3.04.73 1.26-.02 2.05-1.14 2.82-2.28.89-1.3 1.25-2.56 1.27-2.62-.03-.01-2.43-.93-2.46-3.7-.02-2.31 1.89-3.4 1.97-3.46-1.08-1.59-2.76-1.76-3.28-1.86z" />
      </g>
      <text
        x="34"
        y="15"
        fill="#fff"
        fontFamily="system-ui, -apple-system, Helvetica, Arial, sans-serif"
        fontSize="7.2"
      >
        Download on the
      </text>
      <text
        x="34"
        y="28.5"
        fill="#fff"
        fontFamily="system-ui, -apple-system, Helvetica, Arial, sans-serif"
        fontSize="13.5"
        fontWeight="600"
      >
        App Store
      </text>
    </svg>
  );
}

export function GooglePlayBadge({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 135 40"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Get it on Google Play — coming soon"
    >
      <rect width="135" height="40" rx="5.5" fill="#000" stroke="#A6A6A6" strokeWidth="0.6" />
      <g transform="translate(9.5 8)">
        <path fill="#00F076" d="M1.2.4 13.6 12.3 1.2 24.1Z" />
        <path fill="#FFD400" d="M13.6 12.3 18.5 8.4 6.4 1.6Z" />
        <path fill="#FF3A44" d="M13.6 12.3 6.4 22.8 18.5 16.1Z" />
        <path fill="#00A0FF" d="M1.2.4 6.4 1.6 1.2 24.1 6.4 22.8Z" />
      </g>
      <text
        x="34"
        y="15"
        fill="#fff"
        fontFamily="system-ui, Roboto, Helvetica, Arial, sans-serif"
        fontSize="7"
        letterSpacing="0.06em"
      >
        GET IT ON
      </text>
      <text
        x="34"
        y="28.5"
        fill="#fff"
        fontFamily="system-ui, Roboto, Helvetica, Arial, sans-serif"
        fontSize="13"
        fontWeight="600"
      >
        Google Play
      </text>
    </svg>
  );
}
