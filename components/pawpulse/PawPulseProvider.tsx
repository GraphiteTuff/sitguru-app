"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { PawPrint } from "lucide-react";
import {
  PAWPULSE_HANDOFF_KEY,
  PAWPULSE_SHOW_DELAY_MS,
  PAWPULSE_SUCCESS_MS,
  parsePawPulseHandoff,
  reducePawPulses,
  type PawPulseItem,
} from "@/lib/pawpulse/state";

type PawPulseApi = {
  begin: (message: string, id?: string) => string;
  succeed: (id: string, message: string) => void;
  fail: (id: string, message: string) => void;
  dismiss: (id: string) => void;
};

const PawPulseContext = createContext<PawPulseApi | null>(null);

function PawMark({ phase }: { phase: PawPulseItem["phase"] }) {
  const spinning = phase === "pending" || phase === "loading";
  return (
    <span
      className={`relative grid h-9 w-9 shrink-0 place-items-center ${spinning ? "motion-reduce:animate-none" : ""}`}
      aria-hidden
    >
      <span
        className={`absolute inset-0 rounded-full border-2 border-[#D1FAE5] border-t-[#0D5C3A] ${
          spinning ? "animate-spin motion-reduce:animate-none" : ""
        }`}
      />
      {phase === "error" ? (
        <span className="text-sm font-black text-rose-700">!</span>
      ) : phase === "success" ? (
        <span className="text-sm font-black text-[#0D5C3A]">✓</span>
      ) : (
        <PawPrint className="h-4 w-4 text-[#0D5C3A]" />
      )}
    </span>
  );
}

export function PawPulseProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [items, setItems] = useState<PawPulseItem[]>([]);
  const [dock, setDock] = useState(false);
  const timers = useRef<Map<string, number>>(new Map());

  const clearTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setItems((current) => reducePawPulses(current, { type: "dismiss", id }));
    },
    [clearTimer],
  );

  const succeed = useCallback(
    (id: string, message: string) => {
      clearTimer(id);
      setItems((current) => reducePawPulses(current, { type: "succeed", id, message }));
      const timer = window.setTimeout(() => dismiss(id), PAWPULSE_SUCCESS_MS);
      timers.current.set(id, timer);
    },
    [clearTimer, dismiss],
  );

  const fail = useCallback(
    (id: string, message: string) => {
      clearTimer(id);
      setItems((current) => reducePawPulses(current, { type: "fail", id, message }));
    },
    [clearTimer],
  );

  const begin = useCallback(
    (message: string, id = `paw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`) => {
      clearTimer(id);
      setItems((current) => reducePawPulses(current, { type: "begin", id, message }));
      const timer = window.setTimeout(() => {
        setItems((current) => reducePawPulses(current, { type: "promote", id }));
      }, PAWPULSE_SHOW_DELAY_MS);
      timers.current.set(id, timer);
      return id;
    },
    [clearTimer],
  );

  useEffect(() => {
    const stored = parsePawPulseHandoff(window.sessionStorage.getItem(PAWPULSE_HANDOFF_KEY));
    if (!stored) return;
    window.sessionStorage.removeItem(PAWPULSE_HANDOFF_KEY);
    const id = `handoff-${pathname}`;
    if (stored.tone === "error") fail(id, stored.message);
    else succeed(id, stored.message);
  }, [fail, pathname, succeed]);

  useEffect(() => {
    const sync = () => setDock(Boolean(document.querySelector("[data-customer-bottom-nav]")));
    sync();
    const timer = window.setTimeout(sync, 300);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const active = timers.current;
    return () => {
      for (const timer of active.values()) window.clearTimeout(timer);
      active.clear();
    };
  }, []);

  const api = useMemo<PawPulseApi>(() => ({ begin, succeed, fail, dismiss }), [begin, succeed, fail, dismiss]);

  return (
    <PawPulseContext.Provider value={api}>
      {children}
      <div
        className={`pointer-events-none fixed right-3 z-[140] flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2 ${
          dock
            ? "bottom-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] md:bottom-6"
            : "bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] md:bottom-6"
        }`}
        aria-live="polite"
        aria-relevant="additions text"
      >
        {items
          .filter((item) => item.phase !== "pending")
          .map((item) => (
            <div
              key={item.id}
              role={item.phase === "error" ? "alert" : "status"}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-[0_12px_40px_rgba(15,39,68,0.16)]"
            >
              <PawMark phase={item.phase} />
              <p className="min-w-0 flex-1 pt-1 text-sm font-bold text-slate-800">{item.message}</p>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-xs font-black text-slate-500 hover:bg-slate-100"
                onClick={() => dismiss(item.id)}
              >
                {item.phase === "error" ? "Dismiss" : "Close"}
              </button>
            </div>
          ))}
      </div>
    </PawPulseContext.Provider>
  );
}

export function usePawPulse() {
  const api = useContext(PawPulseContext);
  if (!api) {
    return {
      begin: () => "",
      succeed: () => undefined,
      fail: () => undefined,
      dismiss: () => undefined,
    } satisfies PawPulseApi;
  }
  return api;
}
