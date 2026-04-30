"use client";

import { useState } from "react";

type BookThisGuruButtonProps = {
  label?: string;
  className?: string;
};

export default function BookThisGuruButton({
  label = "Book this Guru",
  className = "",
}: BookThisGuruButtonProps) {
  const [clicked, setClicked] = useState(false);

  function handleClick() {
    const panel =
      document.getElementById("booking-panel") ||
      document.getElementById("book-guru");

    const bookingTypeField = document.getElementById("booking-type");

    if (!panel) return;

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

    setClicked(true);

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

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-controls="booking-panel"
      className={
        className ||
        "inline-flex min-h-[56px] min-w-[172px] items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-base font-black text-white shadow-[0_12px_28px_rgba(5,150,105,0.22)] transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_16px_34px_rgba(5,150,105,0.28)]"
      }
    >
      {clicked ? "Opening form..." : label}
    </button>
  );
}