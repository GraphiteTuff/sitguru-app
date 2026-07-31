import type { SVGProps } from "react";

export type PawContrast = "auto" | "dark" | "light" | "inherit";

export type PawIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  /** When true, fill pads instead of outline stroke (map pins / dense badges) */
  solid?: boolean;
  /**
   * Contrast switch for brand surfaces:
   * - `dark`  → solid white (#FFFFFF) on SitGuru green / dark chrome
   * - `light` → solid black (#000000) on white / light gray canvases
   * - `auto`  → infer from className / data-surface (default)
   * - `inherit` → use CSS `currentColor`
   */
  contrast?: PawContrast;
  /** Explicit surface hint when className alone is ambiguous */
  surface?: "dark" | "light";
};

const PAW_PATH =
  "M 124,260 C 124,210 280,210 280,260 C 280,314 316,316 294,360 C 278,390 240,366 202,366 C 164,366 126,390 110,360 C 88,316 124,314 124,260 Z";

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const BRAND_GREEN = "#0D5C3A";

const DARK_SURFACE_HINT =
  /(?:^|\s)(?:dark(?:\/|:|\s|$)|text-white|text-\[#fff|bg-\[#0[dD]5[cC]3[aA]\]|bg-emerald-(?:[789]|1[0-9])|from-emerald-(?:[789]|1[0-9])|homepage-chat-(?:launcher|panel__header|panel__avatar|tip)|sg-(?:guru|parent)-|data-surface-dark)/i;

const LIGHT_SURFACE_HINT =
  /(?:^|\s)(?:bg-white|bg-slate-(?:50|100)|bg-gray-(?:50|100)|bg-emerald-(?:50|100)|text-slate-|text-black|data-surface-light|homepage-chat-(?:chip|bubble|messages))/i;

/**
 * Resolve ink color for the canonical paw mark.
 */
export function resolvePawInk(params: {
  contrast?: PawContrast;
  surface?: "dark" | "light";
  className?: string | undefined;
}): string | "currentColor" {
  const contrast = params.contrast ?? "auto";
  if (contrast === "dark") return WHITE;
  if (contrast === "light") return BLACK;
  if (contrast === "inherit") return "currentColor";

  if (params.surface === "dark") return WHITE;
  if (params.surface === "light") return BLACK;

  const cls = String(params.className || "");
  if (DARK_SURFACE_HINT.test(cls)) return WHITE;
  if (LIGHT_SURFACE_HINT.test(cls)) return BLACK;

  // Safe default for light page canvases
  return BLACK;
}

/**
 * Canonical SitGuru paw mark — exclusive design token for brand paw visuals.
 * Path geometry: balanced 4-toe outline + metacarpal pad.
 */
export function PawIcon({
  size = 24,
  className,
  solid = false,
  contrast = "auto",
  surface,
  style,
  ...props
}: PawIconProps) {
  const ink = resolvePawInk({ contrast, surface, className });
  const strokeProps = solid
    ? { fill: ink, stroke: "none" as const }
    : {
        fill: "none" as const,
        stroke: ink,
        strokeWidth: 28,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
      };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      className={className}
      aria-hidden={props["aria-label"] ? undefined : true}
      style={style}
      {...strokeProps}
      {...props}
    >
      <ellipse cx="78" cy="216" rx="34" ry="50" transform="rotate(-15 78 216)" />
      <ellipse cx="160" cy="115" rx="36" ry="58" transform="rotate(-5 160 115)" />
      <ellipse cx="244" cy="115" rx="36" ry="58" transform="rotate(5 244 115)" />
      <ellipse cx="326" cy="216" rx="34" ry="50" transform="rotate(15 326 216)" />
      <path d={PAW_PATH} />
    </svg>
  );
}

/** Inline SVG markup for Leaflet / HTML string markers (no React tree). */
export function pawIconSvgMarkup(params?: {
  size?: number;
  color?: string;
  solid?: boolean;
  contrast?: Exclude<PawContrast, "auto" | "inherit">;
}) {
  const size = params?.size ?? 22;
  const solid = params?.solid ?? true;
  const color =
    params?.color ??
    (params?.contrast === "dark"
      ? WHITE
      : params?.contrast === "light"
        ? BLACK
        : BRAND_GREEN);
  const strokeAttrs = solid
    ? `fill="${color}" stroke="none"`
    : `fill="none" stroke="${color}" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 400 400" ${strokeAttrs} aria-hidden="true">
  <ellipse cx="78" cy="216" rx="34" ry="50" transform="rotate(-15 78 216)" />
  <ellipse cx="160" cy="115" rx="36" ry="58" transform="rotate(-5 160 115)" />
  <ellipse cx="244" cy="115" rx="36" ry="58" transform="rotate(5 244 115)" />
  <ellipse cx="326" cy="216" rx="34" ry="50" transform="rotate(15 326 216)" />
  <path d="${PAW_PATH}" />
</svg>`;
}

export default PawIcon;
