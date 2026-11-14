"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PawPrint } from "lucide-react";
import {
  classifyTapFeedback,
  tapFeedbackLifetime,
  tapPawPosition,
  type TapFeedbackIntent,
} from "@/lib/pawpulse/tap-feedback";

type VisiblePaw = {
  id: number;
  left: number;
  top: number;
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
    const show = (element: Element, intent: TapFeedbackIntent, x?: number, y?: number) => {
      const rect = element.getBoundingClientRect();
      // Keyboard activation has no pointer coordinates; anchor the paw near
      // the activated control instead.
      const pointX = x !== undefined && x > 0 ? x : rect.left + Math.min(rect.width / 2, 60);
      const pointY = y !== undefined && y > 0 ? y : rect.top + rect.height / 2;
      const position = tapPawPosition(pointX, pointY, window.innerWidth, window.innerHeight);
      if (timer.current !== null) window.clearTimeout(timer.current);
      id.current += 1;
      setPaw({ id: id.current, ...position, intent });
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
      // Let the real browser/React click execute. This only paints a tiny
      // pointer-events-none paw beside the selected control.
      show(target, intent, event.detail > 0 ? event.clientX : undefined, event.detail > 0 ? event.clientY : undefined);
    };

    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.matches('[data-sitguru-no-click-feedback], [data-action-feedback="off"]')) return;
      const submitter = event.submitter instanceof Element ? event.submitter : form;
      if (submitter.matches(":disabled")) return;
      // Also covers Enter-to-submit and React server actions with no button
      // click. Native validation failures do not dispatch the submit event.
      show(submitter, "submit");
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
    <span
      key={paw.id}
      data-sitguru-tap-paw=""
      data-feedback-intent={paw.intent}
      aria-hidden="true"
      className="pointer-events-none fixed z-[250] grid h-7 w-7 place-items-center rounded-full border border-emerald-100 bg-white/95 text-[#0D5C3A] shadow-[0_3px_12px_rgba(15,39,68,0.16)]"
      style={{ left: paw.left, top: paw.top }}
    >
      <PawPrint className="h-[17px] w-[17px] animate-spin motion-reduce:animate-none" strokeWidth={2.3} />
    </span>
  ) : null;
}
