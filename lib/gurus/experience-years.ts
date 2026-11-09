/**
 * Guru years of pet care experience.
 *
 * `gurus.experience_years` is an integer NOT NULL column (database default 0).
 * A blank answer must be rejected. Zero is a real beginner answer and must be
 * stored as 0 — never coerced to null with a truthiness check.
 */

export const EXPERIENCE_YEARS_LABEL = "Years of pet care experience";

export const EXPERIENCE_YEARS_HELP =
  "Count the years you have cared for pets, including your own and pets you have helped. Enter 0 if you are just getting started. Zero is a real answer and is not the same as leaving this blank.";

export const EXPERIENCE_YEARS_REQUIRED_MESSAGE =
  "Enter your years of pet care experience before continuing. Use 0 if you are just getting started.";

export const EXPERIENCE_YEARS_INTEGER_MESSAGE =
  "Enter a whole number of years, with no decimals. Use 0 if you are just getting started.";

export const EXPERIENCE_YEARS_RANGE_MESSAGE =
  "Enter a whole number from 0 to 80.";

export const GURU_PROFILE_SAVE_FAILED_MESSAGE =
  "We couldn't save this step. Check the fields on this page and try again.";

export const MAX_EXPERIENCE_YEARS = 80;

export type ExperienceYearsParse =
  | { ok: true; years: number }
  | { ok: false; message: string };

export type ExperienceYearsWrite = {
  experience_years: number;
  years_experience: number;
};

const INTEGER_TEXT = /^\d+$/;

function rangeError(years: number): ExperienceYearsParse | null {
  if (!Number.isSafeInteger(years) || years < 0 || years > MAX_EXPERIENCE_YEARS) {
    return { ok: false, message: EXPERIENCE_YEARS_RANGE_MESSAGE };
  }
  return null;
}

export function parseExperienceYearsInput(raw: unknown): ExperienceYearsParse {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw)) {
      return { ok: false, message: EXPERIENCE_YEARS_INTEGER_MESSAGE };
    }
    return rangeError(raw) ?? { ok: true, years: raw };
  }

  if (raw === null || raw === undefined) {
    return { ok: false, message: EXPERIENCE_YEARS_REQUIRED_MESSAGE };
  }

  const text = String(raw).trim();
  if (!text) {
    return { ok: false, message: EXPERIENCE_YEARS_REQUIRED_MESSAGE };
  }
  if (!INTEGER_TEXT.test(text)) {
    return { ok: false, message: EXPERIENCE_YEARS_INTEGER_MESSAGE };
  }

  const years = Number(text);
  return rangeError(years) ?? { ok: true, years };
}

function storedExperienceYears(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseExperienceYearsInput(value);
  return parsed.ok ? parsed.years : null;
}

/**
 * Resume a saved Guru row. `experience_years` wins, including 0.
 * A null legacy `years_experience` must not wipe that 0 back to a blank field.
 */
export function resumeExperienceYearsInput(
  saved?: {
    experience_years?: unknown;
    years_experience?: unknown;
  } | null,
): string {
  if (!saved) return "";
  const primary = storedExperienceYears(saved.experience_years);
  if (primary !== null) return String(primary);
  const secondary = storedExperienceYears(saved.years_experience);
  if (secondary !== null) return String(secondary);
  return "";
}

export function experienceYearsWrite(raw: unknown): ExperienceYearsWrite {
  const parsed = parseExperienceYearsInput(raw);
  if (!parsed.ok) {
    throw new Error(parsed.message);
  }
  return {
    experience_years: parsed.years,
    years_experience: parsed.years,
  };
}

export function friendlyGuruProfileSaveError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : error &&
            typeof error === "object" &&
            "message" in error &&
            typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : "";

  const text = raw.trim();
  if (!text) return GURU_PROFILE_SAVE_FAILED_MESSAGE;

  if (
    /experience_years/i.test(text) &&
    /not-null|null value/i.test(text)
  ) {
    return EXPERIENCE_YEARS_REQUIRED_MESSAGE;
  }

  if (
    /violates|postgres|syntax error|relation ["']|column ["']|duplicate key|sqlstate|\b22\d{3}\b|\b23\d{3}\b/i.test(
      text,
    )
  ) {
    return GURU_PROFILE_SAVE_FAILED_MESSAGE;
  }

  if (text.length > 240) return GURU_PROFILE_SAVE_FAILED_MESSAGE;
  return text;
}

export type GuruProfileSaveNav =
  | { kind: "failed" }
  | { kind: "stay" }
  | { kind: "redirect"; href: string };

/**
 * Step 3 saves stay on the page so the Guru can keep editing.
 * Use intent "dashboard" for an explicit return to the Guru dashboard.
 */
export function nextGuruProfileDestination(input: {
  saved: boolean;
  activeStep: "1" | "2" | "3";
  intent: "continue" | "dashboard" | "save";
}): GuruProfileSaveNav {
  if (!input.saved) return { kind: "failed" };
  if (input.intent === "save" || (input.activeStep === "3" && input.intent !== "dashboard")) {
    return { kind: "stay" };
  }
  if (input.intent === "dashboard") {
    return { kind: "redirect", href: "/guru/dashboard" };
  }
  const next = input.activeStep === "1" ? "2" : "3";
  return {
    kind: "redirect",
    href: `/guru/dashboard/profile?step=${next}`,
  };
}

/** Ignore a second submit while the first one is still in flight. */
export function beginSingleSubmission(lock: { current: boolean }): boolean {
  if (lock.current) return false;
  lock.current = true;
  return true;
}

export function endSingleSubmission(lock: { current: boolean }) {
  lock.current = false;
}
