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
      className="fixed bottom-5 right-4 z-[90] h-[72px] w-[72px] transition hover:-translate-y-0.5 focus:outline-none sm:bottom-6 sm:right-6"
    >
      <span className="relative block h-full w-full drop-shadow-[0_16px_30px_rgba(15,23,42,0.28)]">
        <svg
          viewBox="0 0 120 120"
          role="img"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full text-green-800 transition hover:text-green-900"
        >
          <path
            fill="currentColor"
            d="M60 53.5c18.7 0 36.5 15.4 36.5 35.4 0 13.8-10.7 22.1-23 17.2-4.7-1.9-8.7-4.2-13.5-4.2s-8.8 2.3-13.5 4.2c-12.3 4.9-23-3.4-23-17.2 0-20 17.8-35.4 36.5-35.4Z"
          />
          <path
            fill="currentColor"
            d="M32.7 47.5c-8.4 1.4-16.3-5.9-17.8-16.3S19.1 11 27.4 9.6s16.3 5.9 17.8 16.3-4.2 20.2-12.5 21.6Z"
          />
          <path
            fill="currentColor"
            d="M87.3 47.5c8.4 1.4 16.3-5.9 17.8-16.3S100.9 11 92.6 9.6 76.3 15.5 74.8 25.9s4.2 20.2 12.5 21.6Z"
          />
          <path
            fill="currentColor"
            d="M58.6 43.1c-9.3-.6-16.2-9.9-15.4-20.8S52.1 3 61.4 3.6s16.2 9.9 15.4 20.8-8.9 19.3-18.2 18.7Z"
          />
          <path
            fill="currentColor"
            d="M60 49.5c-8.3 0-15-8.2-15-18.4S51.7 12.7 60 12.7s15 8.2 15 18.4-6.7 18.4-15 18.4Z"
            opacity="0.18"
          />
        </svg>

        <span className="absolute left-1/2 top-[62%] flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/18 text-white ring-1 ring-white/25 backdrop-blur-sm">
          <ArrowUp className="h-6 w-6 stroke-[3]" />
        </span>
      </span>
    </button>
  );
}