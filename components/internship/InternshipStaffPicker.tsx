"use client";

import { useId, useMemo, useState } from "react";
import { internshipStaffOptionLabel } from "@/lib/internship/staff-eligibility";

export type StaffChoice = {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
};

export default function InternshipStaffPicker({
  name,
  label,
  people,
  emptyMessage,
  defaultId = "",
  preserved,
}: {
  name: string;
  label: string;
  people: StaffChoice[];
  emptyMessage: string;
  defaultId?: string;
  preserved?: StaffChoice | null;
}) {
  const listId = useId();
  const options = useMemo(() => {
    if (preserved && !people.some((person) => person.id === preserved.id)) {
      return [preserved, ...people];
    }
    return people;
  }, [people, preserved]);
  const [selectedId, setSelectedId] = useState(defaultId);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = options.find((person) => person.id === selectedId) || null;
  const visible = options.filter((person) => {
    const haystack = `${person.name} ${person.email} ${person.jobTitle}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  function choose(id: string) {
    setSelectedId(id);
    setQuery("");
    setOpen(false);
  }

  if (!options.length) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-950">
        <p className="font-black">{label}</p>
        <p className="mt-1">{emptyMessage}</p>
        <input type="hidden" name={name} value="" />
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-slate-800" htmlFor={`${listId}-input`}>
        {label}
      </label>
      <input type="hidden" name={name} value={selectedId} />
      <input
        id={`${listId}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={open ? query : selected ? internshipStaffOptionLabel(selected) : ""}
        placeholder="Search name, title, or email"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) => Math.min(index + 1, Math.max(visible.length - 1, 0)));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          } else if (event.key === "Enter" && open) {
            event.preventDefault();
            const choice = visible[activeIndex];
            if (choice) choose(choice.id);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#166534]"
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-emerald-100 bg-white p-1 shadow-lg"
        >
          <li>
            <button
              type="button"
              className="min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold text-slate-600 hover:bg-emerald-50"
              onClick={() => choose("")}
            >
              Unassigned
            </button>
          </li>
          {visible.map((person, index) => (
            <li key={person.id} role="option" aria-selected={person.id === selectedId}>
              <button
                type="button"
                className={`min-h-11 w-full rounded-xl px-3 py-2 text-left focus:outline focus:outline-2 focus:outline-[#166534] ${index === activeIndex ? "bg-emerald-50" : "hover:bg-emerald-50"}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(person.id)}
              >
                <span className="block text-sm font-black text-slate-950">{person.name}</span>
                <span className="block text-xs font-semibold text-slate-600">
                  {person.jobTitle || "Title not set"} · {person.email}
                </span>
              </button>
            </li>
          ))}
          {!visible.length ? <li className="px-3 py-3 text-sm font-semibold text-slate-500">No matching staff.</li> : null}
        </ul>
      ) : null}
    </div>
  );
}
