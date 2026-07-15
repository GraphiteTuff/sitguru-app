"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  KeyboardEvent,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { AlertTriangle, CheckCircle2, Loader2, Send } from "lucide-react";

type MessageThreadComposerProps = {
  conversationId: string;
  currentUserId: string;
  currentTopic?: string | null;
  roleContext?: string | null;
  source?: string | null;
};

type DeliveryStatus = {
  messageSaved?: boolean;
  recipientFound?: boolean;
  notificationCreated?: boolean;
  emailSent?: boolean;
  smsSent?: boolean;
  warnings?: string[];
};

type SendMessageResponse = {
  ok?: boolean;
  error?: string;
  messageId?: string;
  delivery?: DeliveryStatus;
  recipient?: {
    name?: string;
    role?: string;
    emailAvailable?: boolean;
    phoneAvailable?: boolean;
  };
};

const topicOptions = [
  "Application Question",
  "Profile Help",
  "Background Check",
  "Identity Verification",
  "Stripe / Payout Setup",
  "Booking Question",
  "Customer Issue",
  "Safety Concern",
  "Payment or Refund Question",
  "Technical Issue",
  "Other",
];

function normalizeTopic(value?: string | null) {
  const topic = String(value || "").trim();

  if (!topic) return "Other";

  const matchedTopic = topicOptions.find(
    (option) => option.toLowerCase() === topic.toLowerCase(),
  );

  return matchedTopic || "Other";
}

function normalizeRoleContext(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase();

  if (
    normalized === "ambassador" ||
    normalized === "guru" ||
    normalized === "admin" ||
    normalized === "customer"
  ) {
    return normalized;
  }

  if (
    normalized === "pet_parent" ||
    normalized === "pet-parent" ||
    normalized === "pet_owner" ||
    normalized === "pet-owner"
  ) {
    return "customer";
  }

  if (
    normalized === "provider" ||
    normalized === "sitter" ||
    normalized === "walker"
  ) {
    return "guru";
  }

  return "";
}

function createClientMessageId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `sitguru-message-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

function getDeliveryLabel(value?: boolean) {
  return value ? "Sent" : "Not sent";
}

function DeliveryPill({ label, value }: { label: string; value?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
        value
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      {label}: {getDeliveryLabel(value)}
    </span>
  );
}

export default function MessageThreadComposer({
  conversationId,
  currentUserId,
  currentTopic,
  roleContext,
  source,
}: MessageThreadComposerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState(normalizeTopic(currentTopic));
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deliveryStatus, setDeliveryStatus] =
    useState<DeliveryStatus | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sendLockRef = useRef(false);
  const clientMessageIdRef = useRef<string | null>(null);

  const trimmedMessage = useMemo(() => message.trim(), [message]);

  const resolvedRoleContext = useMemo(
    () =>
      normalizeRoleContext(roleContext) ||
      normalizeRoleContext(searchParams.get("role")) ||
      normalizeRoleContext(searchParams.get("as")) ||
      normalizeRoleContext(searchParams.get("contextRole")),
    [roleContext, searchParams],
  );

  const resolvedSource = useMemo(
    () =>
      String(source || searchParams.get("source") || "message_thread").trim() ||
      "message_thread",
    [source, searchParams],
  );

  const isBusy = isSending || isPending;
  const isDisabled =
    isBusy || !trimmedMessage || !conversationId || !currentUserId;

  function clearRequestIdentity() {
    clientMessageIdRef.current = null;
  }

  async function sendMessage() {
    if (
      sendLockRef.current ||
      isBusy ||
      !trimmedMessage ||
      !conversationId ||
      !currentUserId
    ) {
      return;
    }

    sendLockRef.current = true;
    setIsSending(true);
    setError("");
    setSuccessMessage("");
    setDeliveryStatus(null);

    const messageToSend = trimmedMessage;
    const topicToSend = topic;
    const clientMessageId =
      clientMessageIdRef.current || createClientMessageId();

    clientMessageIdRef.current = clientMessageId;

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Idempotency-Key": clientMessageId,
          "X-SitGuru-Role-Context": resolvedRoleContext || "customer",
          "X-SitGuru-Message-Source": resolvedSource,
        },
        body: JSON.stringify({
          conversationId,
          body: messageToSend,
          topic: topicToSend,
          clientMessageId,
          roleContext: resolvedRoleContext || null,
          source: resolvedSource,
        }),
      });

      const data =
        (await response.json().catch(() => null)) as SendMessageResponse | null;

      if (!response.ok || !data?.ok) {
        setError(data?.error || "Unable to send message.");
        setDeliveryStatus(data?.delivery || null);
        return;
      }

      if (data.delivery?.messageSaved === false) {
        setError(
          "SitGuru could not confirm that this message was saved. Please retry.",
        );
        setDeliveryStatus(data.delivery);
        return;
      }

      setMessage("");
      clearRequestIdentity();
      setSuccessMessage("Message saved and sent.");
      setDeliveryStatus(data.delivery || { messageSaved: true });

      window.dispatchEvent(new Event("sitguru:messages-refresh"));

      startTransition(() => {
        router.refresh();
      });
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send message.",
      );
    } finally {
      sendLockRef.current = false;
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleMessageKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key !== "Enter") return;
    if (event.shiftKey) return;
    if (event.repeat) return;
    if (event.nativeEvent.isComposing) return;

    event.preventDefault();
    void sendMessage();
  }

  const deliveryWarnings = deliveryStatus?.warnings || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="message-topic"
          className="mb-3 block text-sm font-black uppercase tracking-[0.18em] text-emerald-600"
        >
          Topic
        </label>

        <select
          id="message-topic"
          name="topic"
          value={topic}
          onChange={(event) => {
            setTopic(event.target.value);
            setError("");
            setSuccessMessage("");
            setDeliveryStatus(null);
            clearRequestIdentity();
          }}
          disabled={isBusy}
          className="w-full rounded-[1.35rem] border border-emerald-100 bg-white px-4 py-4 text-base font-bold text-slate-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {topicOptions.map((option) => (
            <option
              key={option}
              value={option}
              className="bg-white text-slate-950"
            >
              {option}
            </option>
          ))}
        </select>

        <p className="mt-2 text-xs font-semibold text-slate-500">
          Choose the topic that best matches this message so SitGuru can route
          and review it faster.
        </p>
      </div>

      <div>
        <label
          htmlFor="message-body"
          className="mb-3 block text-sm font-black uppercase tracking-[0.18em] text-emerald-600"
        >
          Message
        </label>

        <textarea
          id="message-body"
          name="message"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setError("");
            setSuccessMessage("");
            setDeliveryStatus(null);
            clearRequestIdentity();
          }}
          onKeyDown={handleMessageKeyDown}
          placeholder="Write a clear, friendly message..."
          rows={5}
          disabled={isBusy}
          className="w-full rounded-[1.35rem] border border-emerald-100 bg-white px-5 py-4 text-base font-semibold leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-70"
        />

        <p className="mt-2 text-xs font-semibold text-slate-500">
          Press Enter to send. Press Shift + Enter for a new line.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm font-semibold leading-6 text-slate-600">
          Keep communication clear, friendly, and specific. Include dates,
          booking details, profile issues, or verification questions when
          helpful.
        </p>

        <button
          type="submit"
          disabled={isDisabled}
          aria-busy={isBusy}
          className="inline-flex min-h-12 min-w-[150px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-base font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isBusy ? "Sending..." : "Send message"}
        </button>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {successMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>

            {deliveryStatus ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <DeliveryPill
                  label="Saved"
                  value={deliveryStatus.messageSaved !== false}
                />
                <DeliveryPill
                  label="In-app"
                  value={deliveryStatus.notificationCreated}
                />
                <DeliveryPill
                  label="Email"
                  value={deliveryStatus.emailSent}
                />
                <DeliveryPill
                  label="SMS"
                  value={deliveryStatus.smsSent}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {deliveryWarnings.length ? (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p>The message was saved, but some delivery steps need attention.</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs font-semibold">
                  {deliveryWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : null}
      </div>
    </form>
  );
}