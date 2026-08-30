"use client";

import { useFormStatus } from "react-dom";
import { GitMerge, Loader2 } from "lucide-react";
import { mergeDuplicateGuruAction } from "@/app/admin/gurus/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-800 transition hover:bg-rose-100 disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          Merging…
        </>
      ) : (
        <>
          <GitMerge size={15} />
          {label}
        </>
      )}
    </button>
  );
}

type MergeDuplicateGuruButtonProps = {
  canonicalUserId: string;
  duplicateUserId: string;
  displayName: string;
  label?: string;
};

export default function MergeDuplicateGuruButton({
  canonicalUserId,
  duplicateUserId,
  displayName,
  label,
}: MergeDuplicateGuruButtonProps) {
  if (!canonicalUserId || !duplicateUserId || canonicalUserId === duplicateUserId) {
    return null;
  }

  return (
    <form action={mergeDuplicateGuruAction}>
      <input type="hidden" name="canonicalUserId" value={canonicalUserId} />
      <input type="hidden" name="duplicateUserId" value={duplicateUserId} />
      <input type="hidden" name="displayName" value={displayName} />
      <SubmitButton label={label || `Merge into ${displayName}`} />
    </form>
  );
}
