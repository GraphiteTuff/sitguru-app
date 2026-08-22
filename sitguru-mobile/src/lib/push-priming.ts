type PrimingHandler = () => void;

let handler: PrimingHandler | null = null;

export function setPushPrimingHandler(next: PrimingHandler | null) {
  handler = next;
}

/** Ask after a real milestone — accepted booking or live care — not on first launch. */
export function requestContextualPushPriming() {
  handler?.();
}
