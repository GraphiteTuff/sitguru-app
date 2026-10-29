import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthFrame, SurveyPanel } from "@/components/manager/GrowthWorkPanels";
import { loadSurveys } from "@/lib/manager-growth/data";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function SurveysPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const desk = await loadSurveys(access.actor.id);
  return (
    <GrowthFrame title="Polls & Surveys" subtitle="One question at a time. You choose when it opens. Answers stay on SitGuru." notice={first(params.ok)}>
      <SurveyPanel surveys={desk.surveys} responses={desk.responses} />
    </GrowthFrame>
  );
}
