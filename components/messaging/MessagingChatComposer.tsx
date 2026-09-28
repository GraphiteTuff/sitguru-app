"use client";

import {
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { SendHorizontal } from "lucide-react";

type MessagingChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  inputId?: string;
  label?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  onInputFocus?: () => void;
  trailing?: ReactNode;
};

/**
 * iMessage-style capsule composer shared by Rogue / Scout / Taco / Delilah.
 */
export default function MessagingChatComposer({
  value,
  onChange,
  onSubmit,
  placeholder = "Message…",
  disabled = false,
  inputId = "sitguru-messaging-composer",
  label = "Message",
  inputRef,
  onInputFocus,
  trailing,
}: MessagingChatComposerProps) {
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const resolvedRef = inputRef ?? localRef;

  function resizeComposer() {
    const el = resolvedRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }

  useEffect(() => {
    resizeComposer();
  }, [value]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (disabled || !value.trim()) return;
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form
      className="homepage-chat-panel__composer"
      onSubmit={onSubmit}
      autoComplete="off"
    >
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <textarea
        id={inputId}
        ref={resolvedRef}
        name="sitguru-chat-message"
        rows={1}
        value={value}
        placeholder={placeholder}
        enterKeyHint="send"
        inputMode="text"
        autoComplete="off"
        autoCorrect="on"
        autoCapitalize="sentences"
        spellCheck
        data-form-type="other"
        data-1p-ignore="true"
        data-lpignore="true"
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value);
          requestAnimationFrame(resizeComposer);
        }}
        onFocus={onInputFocus}
        onKeyDown={handleKeyDown}
      />
      {trailing}
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="homepage-chat-panel__send"
      >
        <SendHorizontal className="h-5 w-5" aria-hidden="true" />
      </button>
    </form>
  );
}
