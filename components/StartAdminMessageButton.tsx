"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type StartAdminMessageButtonProps = {
  label?: string;
  topic?: string;
  message?: string;
  className?: string;
};

export default function StartAdminMessageButton({
  label = "Message Admin",
  topic = "Account Support",
  message = "",
  className = "",
}: StartAdminMessageButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (isPending) return;

    setIsPending(true);
    setError("");

    try {
      const response = await fetch("/api/messages/start-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          topic,
          message,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            href?: string;
            error?: string;
          }
        | null;

      if (!response.ok || !data?.ok || !data.href) {
        setError(data?.error || "Unable to open Admin Support.");
        setIsPending(false);
        return;
      }

      router.push(data.href);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to open Admin Support."
      );
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={
          className ||
          "inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {isPending ? "Opening..." : label}
      </button>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}