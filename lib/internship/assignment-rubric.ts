import { SYLLABUS_ASSESSMENT } from "@/lib/internship/university-syllabus";

export const ASSIGNMENT_RUBRIC = SYLLABUS_ASSESSMENT.map((criterion, index) => ({
  ...criterion,
  index,
  defaultMaximum: 25,
}));

export function parseAssignmentRubric(form: FormData) {
  const read = (key: string) => String(form.get(key) ?? "").trim();
  const scores: number[] = [];
  const maximums: number[] = [];
  for (const { index } of ASSIGNMENT_RUBRIC) {
    const points = read(`score-${index}`);
    const maximum = read(`maximum-${index}`);
    if (!/^\d{1,4}$/.test(points) || !/^\d{1,4}$/.test(maximum) ||
      Number(maximum) < 1 || Number(maximum) > 1000 || Number(points) > Number(maximum)) {
      return null;
    }
    scores.push(Number(points));
    maximums.push(Number(maximum));
  }
  const feedback = read("feedback");
  const privateNotes = read("privateNotes");
  if (feedback.length > 4000 || privateNotes.length > 4000) return null;
  return { scores, maximums, feedback, privateNotes };
}
