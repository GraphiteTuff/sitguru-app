"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { DESK_UI } from "@/lib/portal/desk-ui";

export type AdminDeskSearchEntry = {
  label: string;
  href: string;
  section: string;
};

/**
 * Admin HQ uses the exact Manager Desk search surface and interaction pattern,
 * with its own module-scoped destinations. This is a navigation shortcut,
 * never a privileged data search or a replacement for route authorization.
 */
export default function AdminDeskSearch({
  entries,
  placeholder = "Search HQ pages, people, bookings, finance, or growth...",
}: {
  entries: AdminDeskSearchEntry[];
  placeholder?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const unique = new Set<string>();
    return entries.filter((item) => {
      if (unique.has(item.href)) return false;
      unique.add(item.href);
      return (item.label + " " + item.section + " " + item.href)
        .toLowerCase().includes(needle);
    }).slice(0, 8);
  }, [entries, query]);
  const show = open && query.trim().length > 0;

  useEffect(() => {
    function outsideClick(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outsideClick);
    return () => document.removeEventListener("mousedown", outsideClick);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div ref={root} className="relative hidden min-w-0 w-full flex-1 lg:block">
      <label className="relative block min-w-0">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          value={query}
          placeholder={placeholder}
          aria-label="Search Admin HQ navigation"
          aria-expanded={show}
          aria-controls={listId}
          aria-autocomplete="list"
          className={`${DESK_UI.search} w-full`}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((value) => Math.min(value + 1, Math.max(results.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((value) => Math.max(value - 1, 0));
            } else if (event.key === "Enter" && results[active]) {
              event.preventDefault();
              go(results[active].href);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </label>
      {show ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_16px_40px_rgba(15,39,68,0.12)]"
        >
          {results.length ? results.map((hit, index) => (
            <li key={hit.href} role="option" aria-selected={index === active}>
              <button
                type="button"
                className={`flex w-full flex-col rounded-xl px-3 py-2 text-left ${index === active ? "bg-[#EFF6FF]" : "hover:bg-slate-50"}`}
                onMouseEnter={() => setActive(index)}
                onClick={() => go(hit.href)}
              >
                <span className="text-sm font-bold text-[#0F2744]">{hit.label}</span>
                <span className="text-xs font-medium text-slate-500">{hit.section}</span>
              </button>
            </li>
          )) : (
            <li className="px-3 py-3 text-sm font-medium text-slate-500">No matching Admin HQ pages.</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
