"use client";

export function CopyTextButton({ text, label }: { text: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard?.writeText(text)}
      className="inline-flex min-h-10 items-center rounded-full border border-slate-200 px-3 text-xs font-black text-slate-700"
    >
      {label}
    </button>
  );
}
