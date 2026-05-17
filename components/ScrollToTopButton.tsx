"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > 420);
    }

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      title="Back to top"
      className="fixed bottom-5 right-4 z-[90] flex h-16 w-16 items-center justify-center rounded-[45%_55%_50%_50%/55%_55%_45%_45%] bg-green-800 text-white shadow-[0_16px_36px_rgba(15,23,42,0.24)] ring-1 ring-emerald-200/80 transition hover:-translate-y-0.5 hover:bg-green-900 focus:outline-none focus:ring-4 focus:ring-emerald-200 sm:bottom-6 sm:right-6"
    >
      <span className="absolute -top-2 left-2.5 h-5 w-5 rounded-full bg-green-800 ring-1 ring-emerald-200/80 transition group-hover:bg-green-900" />
      <span className="absolute -top-3 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-green-800 ring-1 ring-emerald-200/80" />
      <span className="absolute -top-2 right-2.5 h-5 w-5 rounded-full bg-green-800 ring-1 ring-emerald-200/80" />
      <span className="absolute -right-1 top-3 h-4 w-4 rounded-full bg-green-800 ring-1 ring-emerald-200/80" />
      <span className="absolute -left-1 top-3 h-4 w-4 rounded-full bg-green-800 ring-1 ring-emerald-200/80" />

      <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur">
        <ArrowUp className="h-6 w-6" />
      </span>
    </button>
  );
}