"use client";

export default function InternshipRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-black text-slate-950">Internship Program hit a rendering error</h1>
      <p className="mt-2 text-sm font-semibold text-slate-600">
        {error.message || "The page stopped while loading program records."}
        {error.digest ? ` (${error.digest})` : ""}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white"
      >
        Try again
      </button>
    </div>
  );
}
