"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export default function SecureProfileSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#08482E] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {pending ? "Saving securely..." : "Save my personal profile"}
    </button>
  );
}
