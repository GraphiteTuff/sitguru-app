"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function getSupportText(petName?: string, bookingId?: string) {
  const pieces: string[] = [];

  if (petName) {
    pieces.push(`for ${petName}`);
  }

  if (bookingId) {
    pieces.push(`related to booking #${bookingId}`);
  }

  if (pieces.length === 0) {
    return "We are preparing your conversation now.";
  }

  return `We are preparing your conversation ${pieces.join(" ")}.`;
}

export default function StartConversationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const guruSlug = useMemo(
    () =>
      searchParams.get("guru") ||
      searchParams.get("guru_slug") ||
      searchParams.get("guruSlug") ||
      "",
    [searchParams]
  );

  const bookingId = useMemo(
    () => searchParams.get("booking_id") || searchParams.get("bookingId") || "",
    [searchParams]
  );

  const petId = useMemo(
    () => searchParams.get("pet") || searchParams.get("petId") || "",
    [searchParams]
  );

  const petName = useMemo(
    () => searchParams.get("petName") || searchParams.get("pet_name") || "",
    [searchParams]
  );

  const initialMessage = useMemo(
    () => searchParams.get("message") || "",
    [searchParams]
  );

  const [statusText, setStatusText] = useState("Preparing your conversation...");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function startConversation() {
      if (!guruSlug) {
        router.replace("/messages");
        return;
      }

      try {
        setStatusText(
          petName
            ? `Opening a conversation about ${petName}...`
            : "Opening your conversation..."
        );

        const response = await fetch("/api/messages/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            guruSlug,
            bookingId: bookingId || null,
            petId: petId || null,
            petName: petName || null,
            initialMessage: initialMessage || "",
          }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/customer/login");
            return;
          }

          throw new Error(payload?.error || "Unable to start conversation.");
        }

        if (!cancelled && payload?.conversationId) {
          setStatusText("Taking you to your conversation...");
          router.replace(`/messages/${payload.conversationId}`);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to open conversation.");
          setStatusText("We could not open this conversation.");
        }
      }
    }

    startConversation();

    return () => {
      cancelled = true;
    };
  }, [bookingId, guruSlug, initialMessage, petId, petName, router]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#ecfdf5_100%)] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-sky-200 px-8 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-3xl shadow-sm">
              💬
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Opening messages
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-900/75 sm:text-base">
              {getSupportText(petName || undefined, bookingId || undefined)}
            </p>
          </div>

          <div className="px-8 py-8">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Conversation setup
              </p>

              <div className="mt-4 space-y-3">
                {petName ? (
                  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-sm text-slate-500">Pet</p>
                    <p className="mt-1 text-base font-bold text-slate-950">{petName}</p>
                  </div>
                ) : null}

                {bookingId ? (
                  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-sm text-slate-500">Booking</p>
                    <p className="mt-1 text-base font-bold text-slate-950">
                      #{bookingId}
                    </p>
                  </div>
                ) : null}

                <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                  <p className="text-sm text-slate-500">Next step</p>
                  <p className="mt-1 text-base font-bold text-slate-950">{statusText}</p>
                </div>
              </div>

              {error ? (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                  <p className="text-sm font-semibold text-red-700">
                    We could not open this conversation.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-red-700">{error}</p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href="/messages"
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Open inbox
                    </Link>

                    <Link
                      href="/customer/dashboard"
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                    >
                      Back to dashboard
                    </Link>

                    <Link
                      href="/search"
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                    >
                      Find a Guru
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-8 flex flex-col items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    Please wait while we set up the conversation.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-emerald-50 p-5 ring-1 ring-emerald-100">
              <p className="text-sm font-bold text-slate-900">Best experience tip</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Messages work best when they stay centered on your pet, your care
                details, and the booking context. That helps your Guru respond faster
                and more clearly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}