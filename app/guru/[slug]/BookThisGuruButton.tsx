"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type BookThisGuruButtonProps = {
  label?: string;
  className?: string;
  guruSlug?: string | null;
  href?: string | null;
};

export default function BookThisGuruButton({
  label = "Book this Guru",
  className = "",
  guruSlug = null,
  href = null,
}: BookThisGuruButtonProps) {
  const router = useRouter();
  const [clicked, setClicked] = useState(false);

  function getBookingHref() {
    if (href && href.trim()) return href.trim();

    if (guruSlug && guruSlug.trim()) {
      return `/book/${guruSlug.trim()}`;
    }

    return "";
  }

  function scrollToLegacyBookingPanel() {
    const panel =
      document.getElementById("booking-panel") ||
      document.getElementById("book-guru");

    const bookingTypeField = document.getElementById("booking-type");

    if (!panel) {
      setClicked(false);
      return;
    }

    const headerOffset = 120;
    const panelTop = panel.getBoundingClientRect().top + window.scrollY;

    window.history.replaceState(null, "", "#booking-panel");

    window.scrollTo({
      top: Math.max(panelTop - headerOffset, 0),
      behavior: "smooth",
    });

    panel.classList.add(
      "ring-4",
      "ring-emerald-300",
      "ring-offset-4",
      "ring-offset-white",
      "scale-[1.01]",
    );

    window.setTimeout(() => {
      bookingTypeField?.focus({ preventScroll: true });
    }, 500);

    window.setTimeout(() => {
      panel.classList.remove(
        "ring-4",
        "ring-emerald-300",
        "ring-offset-4",
        "ring-offset-white",
        "scale-[1.01]",
      );

      setClicked(false);
    }, 1800);
  }

  function handleClick() {
    setClicked(true);

    const bookingHref = getBookingHref();

    if (bookingHref) {
      router.push(bookingHref);
      return;
    }

    scrollToLegacyBookingPanel();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={
        className ||
        "inline-flex min-h-[56px] min-w-[172px] items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-base font-black text-white shadow-[0_12px_28px_rgba(5,150,105,0.22)] transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_16px_34px_rgba(5,150,105,0.28)]"
      }
    >
      {clicked ? "Opening booking..." : label}
    </button>
  );
}