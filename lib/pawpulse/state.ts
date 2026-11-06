export const PAWPULSE_SHOW_DELAY_MS = 250;
export const PAWPULSE_SUCCESS_MS = 4000;
export const PAWPULSE_HANDOFF_KEY = "sitguru-pawpulse-handoff";

export type PawPulsePhase = "pending" | "loading" | "success" | "error";

export type PawPulseItem = {
  id: string;
  phase: PawPulsePhase;
  message: string;
};

export type PawPulseEvent =
  | { type: "begin"; id: string; message: string }
  | { type: "promote"; id: string }
  | { type: "succeed"; id: string; message: string }
  | { type: "fail"; id: string; message: string }
  | { type: "dismiss"; id: string };

export function reducePawPulses(state: PawPulseItem[], event: PawPulseEvent): PawPulseItem[] {
  if (event.type === "begin") {
    const existing = state.find((item) => item.id === event.id);
    if (existing && (existing.phase === "pending" || existing.phase === "loading")) return state;
    return [...state.filter((item) => item.id !== event.id), { id: event.id, phase: "pending", message: event.message }];
  }
  if (event.type === "promote") {
    return state.map((item) =>
      item.id === event.id && item.phase === "pending" ? { ...item, phase: "loading" } : item,
    );
  }
  if (event.type === "succeed" || event.type === "fail") {
    const phase = event.type === "succeed" ? "success" : "error";
    if (!state.some((item) => item.id === event.id)) {
      return [...state, { id: event.id, phase, message: event.message }];
    }
    return state.map((item) => (item.id === event.id ? { ...item, phase, message: event.message } : item));
  }
  return state.filter((item) => item.id !== event.id);
}

export function visiblePawPulse(item: PawPulseItem, elapsedMs: number) {
  if (item.phase === "pending") return elapsedMs >= PAWPULSE_SHOW_DELAY_MS;
  return true;
}

export function pawToastPlacement(hasMobileDock: boolean) {
  return hasMobileDock ? "above-dock" : "corner";
}

export type PawPulseHandoff = { message: string; tone: "success" | "error" };

export function parsePawPulseHandoff(raw: string | null): PawPulseHandoff | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PawPulseHandoff>;
    if (!parsed.message || (parsed.tone !== "success" && parsed.tone !== "error")) return null;
    return { message: String(parsed.message).slice(0, 240), tone: parsed.tone };
  } catch {
    return null;
  }
}
