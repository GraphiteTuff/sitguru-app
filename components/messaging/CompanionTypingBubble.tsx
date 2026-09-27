"use client";

type CompanionTypingBubbleProps = {
  className?: string;
  label?: string;
};

/** Shared bouncing-dot typing indicator for AI Companion chats. */
export function CompanionTypingBubble({
  className = "",
  label = "Companion is typing",
}: CompanionTypingBubbleProps) {
  return (
    <div
      className={`homepage-chat-bubble homepage-chat-bubble--ai homepage-chat-typing ${className}`.trim()}
      aria-live="polite"
      aria-label={label}
      role="status"
    >
      <span />
      <span />
      <span />
    </div>
  );
}
