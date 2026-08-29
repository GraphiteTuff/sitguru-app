"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CommunityGeographySuggestHit } from "@/lib/community/geographies";

type Props = {
  value: string;
  stateValue?: string;
  placeholder?: string;
  className?: string;
  onChange: (county: string) => void;
  onSelect?: (hit: CommunityGeographySuggestHit) => void;
  onCommit?: (county: string) => void;
};

export default function CommunityCountySuggestInput({
  value,
  stateValue,
  placeholder = "Montgomery County",
  className,
  onChange,
  onSelect,
  onCommit,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<CommunityGeographySuggestHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q, limit: "8" });
        if (stateValue?.trim().length === 2) {
          params.set("state", stateValue.trim().toUpperCase());
        }
        const response = await fetch(`/api/search/suggest?${params}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok || !payload.ok) {
          setResults([]);
          return;
        }
        setResults(
          Array.isArray(payload.results)
            ? (payload.results as CommunityGeographySuggestHit[])
            : [],
        );
        setOpen(true);
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value, stateValue]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <input
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        onBlur={() => {
          onCommit?.(value);
        }}
        placeholder={placeholder}
        className={
          className ||
          "min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:text-sm"
        }
        autoComplete="off"
      />
      {loading && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          …
        </span>
      )}
      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {results.map((hit) => (
            <li key={`${hit.kind}-${hit.id}`}>
              <button
                type="button"
                role="option"
                className="flex w-full flex-col items-start px-4 py-2.5 text-left transition hover:bg-emerald-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(hit.county_name);
                  onSelect?.(hit);
                  setOpen(false);
                }}
              >
                <span className="text-sm font-semibold text-slate-900">
                  {hit.county_name}, {hit.state}
                </span>
                {hit.kind !== "county" && hit.label !== hit.county_name && (
                  <span className="text-xs text-slate-500">{hit.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
