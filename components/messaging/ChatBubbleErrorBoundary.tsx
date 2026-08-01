"use client";

/**
 * Layout safety net for Rogue chat bubbles.
 * Catches render/parse crashes (truncated tokens, bad card payloads, etc.)
 * and shows a tiny fallback instead of raw snippets or a dead chat tray.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Optional raw message — used only to detect token-like content in logs. */
  contentHint?: string;
  onReset?: () => void;
};

type State = {
  hasError: boolean;
};

function ChatBubbleFallbackCard({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      className="rounded-2xl border border-[#0D5C3A]/20 bg-[#F7FBF8] px-3 py-2.5 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <p className="m-0 text-xs font-semibold text-[#0D5C3A]">
        Rogue lost the trail for a sec
      </p>
      <p className="m-0 mt-1 text-[11px] leading-snug text-slate-600">
        That reply got cut off — no crash, just a tiny glitch. Try again or ask
        another question.
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center justify-center rounded-full border border-[#0D5C3A]/30 bg-white px-3 py-1 text-[11px] font-semibold text-[#0D5C3A]"
        >
          Show safe reply
        </button>
      ) : null}
    </div>
  );
}

export class ChatBubbleErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const hint = String(this.props.contentHint || "").slice(0, 80);
    console.warn("[chat-bubble] render failed:", error.message, {
      componentStack: info.componentStack?.slice(0, 240),
      hint: hint.includes("guru_card") ? "[guru_card token present]" : hint,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return <ChatBubbleFallbackCard onRetry={this.handleReset} />;
    }
    return this.props.children;
  }
}

/** Wrap a single assistant bubble body with the safety net. */
export function SafeAssistantBubble({
  children,
  contentHint,
}: {
  children: ReactNode;
  contentHint?: string;
}) {
  return (
    <ChatBubbleErrorBoundary contentHint={contentHint}>
      {children}
    </ChatBubbleErrorBoundary>
  );
}
