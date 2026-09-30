const ICONS: Record<string, string> = {
  paw: "🐾",
  shield: "🛡",
  lock: "🔐",
  star: "⭐",
  cap: "🎓",
  plus: "➕",
};

export function credentialIcon(icon?: string | null) {
  return ICONS[icon || ""] || "🐾";
}
