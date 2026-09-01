"use client";

import { Trash2 } from "lucide-react";

type DeletePartnerButtonProps = {
  partnerId: string;
  businessName: string;
  deleteAction: (formData: FormData) => void | Promise<void>;
};

export default function DeletePartnerButton({
  partnerId,
  businessName,
  deleteAction,
}: DeletePartnerButtonProps) {
  return (
    <form
      action={deleteAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Delete ${businessName}?\n\nThis permanently removes the partner, referral code, and linked partner messages or events. This cannot be undone.`,
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="partnerId" value={partnerId} />
      <button
        type="submit"
        className="inline-flex rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-black text-red-800 transition hover:border-red-400 hover:bg-red-50"
      >
        <Trash2 className="mr-2 h-3.5 w-3.5" />
        Delete
      </button>
    </form>
  );
}
