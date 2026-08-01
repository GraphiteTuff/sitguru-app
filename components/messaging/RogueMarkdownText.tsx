/**
 * Lightweight, safe Markdown for Rogue chat bubbles.
 * Supports **bold** and short line breaks — no HTML injection.
 * Strips any leftover [[guru_card:...]] tokens as a safety net.
 */

import type { ReactNode } from "react";
import { extractGuruCardsFromText } from "@/lib/gurus/guru-chat-snapshot";

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let part = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={`${keyPrefix}-t-${part++}`}>
          {text.slice(lastIndex, match.index)}
        </span>,
      );
    }
    nodes.push(
      <strong key={`${keyPrefix}-b-${part++}`} className="font-semibold">
        {match[1]}
      </strong>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <span key={`${keyPrefix}-t-${part++}`}>{text.slice(lastIndex)}</span>,
    );
  }

  return nodes.length > 0 ? nodes : [text];
}

/**
 * Render Rogue copy with bold + paragraph/line-break structure for mobile chat.
 */
export function RogueMarkdownText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  // Safety net: never paint raw guru_card tokens even if upstream missed them.
  const normalized = extractGuruCardsFromText(text)
    .text.replace(/\r\n/g, "\n")
    .trim();

  if (!normalized) return null;

  // Split on blank lines into short thought blocks; keep single \n as soft breaks.
  const blocks = normalized.split(/\n{2,}/);

  return (
    <div className={`rogue-md space-y-2 ${className}`.trim()}>
      {blocks.map((block, blockIdx) => {
        const lines = block.split("\n");
        return (
          <p key={`block-${blockIdx}`} className="m-0 leading-snug">
            {lines.map((line, lineIdx) => (
              <span key={`line-${blockIdx}-${lineIdx}`}>
                {lineIdx > 0 ? <br /> : null}
                {renderInlineMarkdown(line, `${blockIdx}-${lineIdx}`)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
