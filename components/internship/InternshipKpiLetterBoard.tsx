import { GraduationCap } from "lucide-react";
import { ThemeStatCard } from "@/components/sitguru/ThemeStatCard";
import {
  EMPLOYER_GRADE_DISCLAIMER,
  KPI_LETTER_RUBRIC,
  employerLetterTone,
  rubricTrend,
  workspaceKpiStanding,
} from "@/lib/internship/grading";
import type { InternshipWorkspaceData } from "@/lib/internship/types";

export default function InternshipKpiLetterBoard({
  data,
}: {
  data: InternshipWorkspaceData;
}) {
  const standing = workspaceKpiStanding(data);

  return (
    <section className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ThemeStatCard
          label="KPI letter vs target"
          value={standing.letter}
          helper={standing.summary}
          tone={standing.tone}
          icon={<GraduationCap size={18} />}
          trend={standing.trend}
          trendTitle="vs SMART target"
        />
        {standing.goals.slice(0, 2).map((goal) => (
          <ThemeStatCard
            key={goal.goalId}
            label={goal.primary ? "Primary SMART KPI" : "Supporting KPI"}
            value={goal.letter}
            helper={`${goal.title}. ${goal.current ?? "—"} vs target ${goal.target ?? "—"}`}
            tone={employerLetterTone(goal.letter)}
            trend={goal.trend}
            trendTitle="vs SMART target"
          />
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {KPI_LETTER_RUBRIC.map((row) => (
          <ThemeStatCard
            key={row.letter}
            label={`Letter ${row.letter}`}
            value={row.letter}
            helper={row.meaning}
            tone={row.tone}
              trend={rubricTrend(row.letter)}
              trendTitle="vs 100% of target"
            className="min-h-[9.5rem]"
          />
        ))}
      </div>
      <p className="text-xs font-semibold leading-5 text-slate-500">
        {EMPLOYER_GRADE_DISCLAIMER} Green up-arrows mean output is at or above the
        agreed target. Red down-arrows mean the verified KPI is short.
      </p>
    </section>
  );
}
