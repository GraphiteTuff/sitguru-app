const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export function normalizeE164Phone(value: unknown) {
  const original = String(value || "").trim();
  if (!original) return "";

  if (original.startsWith("+")) {
    const plusDigits = `+${original.replace(/\D/g, "")}`;
    return E164_PATTERN.test(plusDigits) ? plusDigits : "";
  }

  const digits = original.replace(/\D/g, "");
  if (digits.length === 10) {
    const us = `+1${digits}`;
    return E164_PATTERN.test(us) ? us : "";
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    const us = `+${digits}`;
    return E164_PATTERN.test(us) ? us : "";
  }

  return "";
}

export function formatUsPhoneDisplay(value: unknown) {
  const e164 = normalizeE164Phone(value);
  if (!e164) return "";
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return e164;
}

export function isValidE164Phone(value: unknown) {
  return Boolean(normalizeE164Phone(value));
}
