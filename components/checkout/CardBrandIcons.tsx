"use client";

/**
 * Brand mini-icons for detected card networks inside the card track.
 */

type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export function normalizeCardBrand(brand: string | undefined | null): CardBrand {
  const value = String(brand || "").toLowerCase();
  if (value === "visa") return "visa";
  if (value === "mastercard") return "mastercard";
  if (value === "amex" || value === "american express") return "amex";
  if (value === "discover") return "discover";
  return "unknown";
}

export default function CardBrandIcons({
  activeBrand,
}: {
  activeBrand: CardBrand;
}) {
  const dim = (brand: CardBrand) =>
    activeBrand === "unknown" || activeBrand === brand
      ? "opacity-100"
      : "opacity-25";

  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      <span
        className={[
          "inline-flex h-5 items-center rounded bg-[#1a1f71] px-1 text-[9px] font-black tracking-tight text-white transition",
          dim("visa"),
        ].join(" ")}
      >
        VISA
      </span>
      <span
        className={[
          "inline-flex h-5 w-7 items-center justify-center rounded bg-slate-100 transition",
          dim("mastercard"),
        ].join(" ")}
      >
        <span className="relative h-3.5 w-5">
          <span className="absolute left-0 top-0 h-3.5 w-3.5 rounded-full bg-[#eb001b]" />
          <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full bg-[#f79e1b] mix-blend-multiply" />
        </span>
      </span>
      <span
        className={[
          "inline-flex h-5 items-center rounded bg-[#2e77bc] px-1 text-[8px] font-black text-white transition",
          dim("amex"),
        ].join(" ")}
      >
        AMEX
      </span>
    </div>
  );
}
