"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PawPrint } from "lucide-react";
import {
  classifyTapFeedback,
  tapFeedbackLifetime,
  type TapFeedbackIntent,
} from "@/lib/pawpulse/tap-feedback";

type VisiblePaw = {
  id: number;
  intent: TapFeedbackIntent;
};

/**
 * A single listener covers Admin HQ, Manager, Intern, Guru, Pet Parent,
 * Ambassador, public pages, and responsive mobile web views.
 *
 * Never prevents events, changes a button's disabled state, or marks an
 * operation successful. Existing PawPulse notices own real async outcomes.
 */
export default function GlobalTapPawFeedback() {
  const pathname = usePathname();
  const [paw, setPaw] = useState<VisiblePaw | null>(null);
  const id = useRef(0);
  const timer = useRef<number | null>(null);

  const clearPaw = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setPaw(null);
  }, []);

  useEffect(() => {
    clearPaw();
  }, [pathname, clearPaw]);

  useEffect(() => {
    const show = (intent: TapFeedbackIntent) => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      id.current += 1;
      setPaw({ id: id.current, intent });
      timer.current = window.setTimeout(() => {
        timer.current = null;
        setPaw(null);
      }, tapFeedbackLifetime(intent));
    };

    const onClick = (event: MouseEvent) => {
      const source = event.target;
      if (!(source instanceof Element)) return;

      const target = source.closest(
        'button, a[href], input[type="submit"], input[type="image"], input[type="button"], input[type="reset"], input[type="checkbox"], input[type="radio"], select, summary, [role="button"], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"], [role="menuitem"], [role="option"]',
      );
      if (!target) return;
      const disabled = target.matches(":disabled") ||
        Boolean(target.closest('[inert], [aria-disabled="true"], fieldset[disabled]'));
      const type = target instanceof HTMLButtonElement ? target.type
        : target instanceof HTMLInputElement ? target.type : target.getAttribute("type");
      const intent = classifyTapFeedback({
        tagName: target.tagName,
        role: target.getAttribute("role"),
        type,
        href: target.getAttribute("href"),
        target: target.getAttribute("target"),
        disabled,
        ariaDisabled: target.getAttribute("aria-disabled"),
        skip: Boolean(target.closest('[data-sitguru-no-click-feedback], [data-action-feedback="off"]')),
      });
      if (!intent) return;
      // Keep the normal click behavior; the centered loader never traps taps.
      show(intent);
    };

    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.matches('[data-sitguru-no-click-feedback], [data-action-feedback="off"]')) return;
      const submitter = event.submitter instanceof Element ? event.submitter : form;
      if (submitter.matches(":disabled")) return;
      // Also covers Enter-to-submit and React server actions with no button
      // click. Native validation failures do not dispatch the submit event.
      show("submit");
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
    };
  }, []);

  return paw ? (
    <div
      key={paw.id}
      data-sitguru-tap-paw=""
      data-feedback-intent={paw.intent}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[250] grid place-items-center"
    >
      <div className="absolute inset-0 bg-[#0F2744]/10" />
      <div className="relative grid h-24 w-24 place-items-center rounded-full border border-[#D1FAE5] bg-white/95 text-[#0D5C3A] shadow-[0_18px_50px_rgba(15,39,68,0.25)] sm:h-28 sm:w-28 lg:h-36 lg:w-36">
        <span className="absolute inset-2 animate-spin rounded-full border-[7px] border-[#D1FAE5] border-t-[#059669] motion-reduce:animate-none sm:inset-2.5 sm:border-[8px] lg:inset-3 lg:border-[9px]" />
        <PawPrint className="relative h-11 w-11 sm:h-12 sm:w-12 lg:h-16 lg:w-16" strokeWidth={2.3} />
      </div>
    </div>
  ) : null;
}
