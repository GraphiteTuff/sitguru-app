import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import DeskCalendar from "@/components/portal/DeskCalendar";
import { buildManagerSchedule } from "@/lib/internship/manager-dashboard";

export const dynamic = "force-dynamic";

export default async function InternCalendarPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  return (
    <DeskCalendar
      audience="intern"
      events={buildManagerSchedule({ tasks: [], reviews: [], names: new Map(), today })}
    />
  );
}
