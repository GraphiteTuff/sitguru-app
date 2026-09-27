"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  COMPANION_MIN_TYPING_MS,
  companionTypingDelayMs,
} from "@/lib/chat/companion-typing";

type ChatLikeMessage = {
  id: string;
  role: string;
  content: string;
};

/**
 * Realistic companion reply pacing for web chat UIs:
 * - Local FAQ / benefits answers wait behind a typing indicator
 * - Streamed replies stay on typing dots until a minimum beat elapses
 */
export function useCompanionTypingReply<T extends ChatLikeMessage>({
  setMessages,
  isLoading = false,
  idPrefix = "companion",
}: {
  setMessages: Dispatch<SetStateAction<T[]>>;
  isLoading?: boolean;
  idPrefix?: string;
}) {
  const [localTyping, setLocalTyping] = useState(false);
  const [streamRevealReady, setStreamRevealReady] = useState(true);
  const streamStartedAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      streamStartedAtRef.current = null;
      setStreamRevealReady(true);
      return;
    }

    if (streamStartedAtRef.current == null) {
      streamStartedAtRef.current = Date.now();
      setStreamRevealReady(false);
    }

    const remaining =
      COMPANION_MIN_TYPING_MS - (Date.now() - streamStartedAtRef.current);

    if (remaining <= 0) {
      setStreamRevealReady(true);
      return;
    }

    const timer = setTimeout(() => setStreamRevealReady(true), remaining);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const sendLocalReply = useCallback(
    (userContent: string, assistantContent: string) => {
      if (busyRef.current || isLoading || localTyping) return false;

      busyRef.current = true;
      const stamp = Date.now();
      setMessages((previous) => [
        ...previous,
        {
          id: `${idPrefix}-user-${stamp}`,
          role: "user",
          content: userContent,
        } as T,
      ]);
      setLocalTyping(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setMessages((previous) => [
          ...previous,
          {
            id: `${idPrefix}-assistant-${stamp}`,
            role: "assistant",
            content: assistantContent,
          } as T,
        ]);
        setLocalTyping(false);
        busyRef.current = false;
        timerRef.current = null;
      }, companionTypingDelayMs(assistantContent.length));

      return true;
    },
    [idPrefix, isLoading, localTyping, setMessages],
  );

  return {
    sendLocalReply,
    /** Show the bouncing typing bubble (local delay or live stream). */
    isTyping: localTyping || isLoading,
    /** Hide streamed assistant text until the minimum typing beat finishes. */
    hideStreamingContent: isLoading && !streamRevealReady,
    /** Block send / chips while a local typed reply is in flight. */
    isBusy: localTyping || isLoading,
  };
}
