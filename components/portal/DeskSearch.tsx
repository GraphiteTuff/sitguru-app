"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { DESK_UI } from "@/lib/portal/desk-ui";
import { searchDesk } from "@/lib/portal/desk-search-index";

export default function DeskSearch({
  audience,
  placeholder,
}: {
  audience: "manager" | "intern";
  placeholder: string;
}) {
  const router = useRouter();
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = searchDesk(audience, query);
  const show = open && query.trim().length > 0;

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div ref={box} className="relative hidden min-w-0 w-full flex-1 lg:block">
      <label className="relative block min-w-0">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          placeholder={placeholder}
          aria-label={placeholder}
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
              setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
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
                <span className="text-sm font-bold text-[#0F2744]">{hit.title}</span>
                <span className="text-xs font-medium text-slate-500">{hit.detail}</span>
              </button>
            </li>
          )) : (
            <li className="px-3 py-3 text-sm font-medium text-slate-500">No matching pages.</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
