import {
  InternGrowthMockFrame,
  InternMockFrame,
  ManagerGrowthMockFrame,
  ManagerMockFrame,
  MockupLinks,
} from "@/components/dev/PortalMockupFrames";
import { documentationInternWorkspace } from "@/lib/internship/documentation-fixture";
import { summarizeInternshipHours } from "@/lib/internship/hours";
import type { ManagerDeskBundle } from "@/lib/admin/growth/manager-desk-model";

export const dynamic = "force-dynamic";

function mockManagerDesk(): ManagerDeskBundle {
  return {
    firstName: "Ava",
    fullName: "Ava Venezia",
    email: "ava@sitguru.com",
    title: "Social Media & Community Growth Manager",
    cards: [
      {
        id: "ryan",
        name: "Ryan",
        school: "Social Media & Content Intern",
        weekLabel: "Week 8 · 8.5 hrs",
        phase: "Growth execution",
        milestone: "150 hours due Apr 15",
        requiredLabel: "150 hrs",
        expectedLabel: "90 hrs",
        submittedLabel: "92 hrs",
        approvedLabel: "90 hrs",
        remainingLabel: "60 hrs",
        paceLabel: "On Track",
        paceTone: "on_pace",
        awaitingReview: 2,
        questions: 1,
        nextDeadline: "Apr 15",
        lastSubmission: "2h ago",
        statuses: ["on_track"],
        summary: {
          pendingRequirement: false,
          pendingMessage: "",
          weekNumber: 8,
          internshipWeeks: 16,
          weekLabel: "Week 8",
          plannedWeeklyHours: 10,
          loggedThisWeek: 8.5,
          submittedHours: 92,
          approvedHours: 90,
          verifiedHours: 90,
          expectedHours: 90,
          requiredHours: 150,
          remainingHours: 60,
          paceHours: 0,
          paceLabel: "On Track",
          paceTone: "on_pace",
          progressLabel: "90 / 150",
          progressPercent: 60,
        },
      },
      {
        id: "lola",
        name: "Lola",
        school: "Community & Engagement Intern",
        weekLabel: "Week 9 · 12.0 hrs",
        phase: "Community",
        milestone: "150 hours due Apr 8",
        requiredLabel: "150 hrs",
        expectedLabel: "100 hrs",
        submittedLabel: "112 hrs",
        approvedLabel: "112 hrs",
        remainingLabel: "38 hrs",
        paceLabel: "Ahead!",
        paceTone: "ahead",
        awaitingReview: 1,
        questions: 0,
        nextDeadline: "Apr 8",
        lastSubmission: "3h ago",
        statuses: ["ahead"],
        summary: {
          pendingRequirement: false,
          pendingMessage: "",
          weekNumber: 9,
          internshipWeeks: 16,
          weekLabel: "Week 9",
          plannedWeeklyHours: 12,
          loggedThisWeek: 12,
          submittedHours: 112,
          approvedHours: 112,
          verifiedHours: 112,
          expectedHours: 100,
          requiredHours: 150,
          remainingHours: 38,
          paceHours: 12,
          paceLabel: "Ahead!",
          paceTone: "ahead",
          progressLabel: "112 / 150",
          progressPercent: 75,
        },
      },
    ],
    reviews: [
      {
        id: "r1",
        internId: "ryan",
        internName: "Ryan",
        targetType: "weekly",
        title: "Weekly check-in",
        weekLabel: "Week 8",
        submittedAt: "2h ago",
        hours: "8.5",
        reportSection: "",
        statusLabel: "Needs review",
        stage: "submitted_to_ava",
        evidence: "",
        ceo: false,
      },
      {
        id: "r2",
        internId: "lola",
        internName: "Lola",
        targetType: "hours",
        title: "Hours packet",
        weekLabel: "Week 9",
        submittedAt: "4h ago",
        hours: "12",
        reportSection: "",
        statusLabel: "Needs review",
        stage: "submitted_to_ava",
        evidence: "",
        ceo: false,
      },
    ],
    questions: [
      {
        id: "q1",
        internId: "ryan",
        internName: "Ryan",
        question: "Can I post the tracking link in Stories?",
        status: "open",
        urgency: "normal",
        targetType: "",
        targetId: "",
        targetTitle: "",
        answer: "",
        askedByRole: "intern",
        askedAt: "2026-03-25T12:00:00.000Z",
        answeredAt: null,
      },
    ],
    initiatives: [
      { id: "i1", name: "Social Media Campaign", purpose: "", status: "active", market: "", startOn: null, endOn: null, notes: "" },
      { id: "i2", name: "Pet Parent Signups", purpose: "", status: "active", market: "", startOn: null, endOn: null, notes: "" },
      { id: "i3", name: "Community Events", purpose: "", status: "planned", market: "", startOn: null, endOn: null, notes: "" },
      { id: "i4", name: "Referral Growth", purpose: "", status: "needs_review", market: "", startOn: null, endOn: null, notes: "" },
    ],
    messages: [
      { id: "m1", author: "Ryan", avatarUrl: "", preview: "Hey Ava! I just submitted my weekly check-in...", unread: true },
      { id: "m2", author: "Lola", avatarUrl: "", preview: "Community event flyer draft is ready for review.", unread: true },
      { id: "m3", author: "SitGuru Admin", avatarUrl: "", preview: "Payment period reminder for this Friday.", unread: false },
    ],
    extras: {
      myTime: {
        engagement: {
          id: "e1",
          userId: "ava",
          email: "ava@sitguru.com",
          displayName: "Ava Venezia",
          title: "Social Media & Community Growth Manager",
          status: "active",
          expectedWeeklyMinHours: 10,
          expectedWeeklyMaxHours: 20,
          paymentCadence: "biweekly",
          periodAnchorOn: "2026-03-01",
          currency: "USD",
          w9Status: "on_file",
          employmentClassification: "contractor",
          startOn: "2025-11-01",
          endOn: null,
          notes: "",
        },
        currentRateCents: 1675,
        currentRateLabel: "$16.75/hr",
        week: {
          weekStart: "2026-03-23",
          weekEnd: "2026-03-29",
          hours: 12.5,
          expectedMin: 10,
          expectedMax: 20,
          aboveExpected: false,
          rangeLabel: "10–20 hrs expected",
        },
        period: {
          id: "p1",
          engagementId: "e1",
          periodStart: "2026-03-01",
          periodEnd: "2026-03-31",
          status: "draft",
          totalHours: 48,
          amountCents: 8040,
          currency: "USD",
          submittedAt: null,
          approvedAt: null,
          readyAt: null,
          paidAt: null,
          needsCorrectionAt: null,
          correctionNote: "",
          updatedAt: "",
        },
        periodLabel: "Mar 1 – Mar 31",
        estimatedPaymentLabel: "$804.00 est.",
        annualPaidCents: 0,
        annualPaidLabel: "$0.00",
        w9StatusLabel: "On file",
        entries: [],
        payments: [],
      },
      needsAttention: [
        { label: "Intern reviews", href: "/intern/manage?tab=reviews", count: 3 },
        { label: "Intern questions", href: "/intern/manage?tab=more", count: 1 },
        { label: "Growth initiative needs review", href: "/manager/campaigns", count: 1 },
      ],
    },
    myTimeSnap: {
      weekLabel: "12.5 hrs this week",
      periodLabel: "Mar 1 – Mar 31",
      hoursLabel: "48 hrs",
      amountLabel: "$804.00 est.",
      statusLabel: "On track",
      rangeLabel: "10–20 hrs expected",
    },
  };
}

export default async function PortalMockupsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const view = Array.isArray(params.view) ? params.view[0] : params.view || "both";
  const workspace = documentationInternWorkspace();
  const hourSummary = summarizeInternshipHours({
    requiredHours: 150,
    requirementStatus: "set",
    plannedWeeklyHours: 20,
    internshipWeeks: 16,
    startDate: workspace.intern.academicStartDate,
    entries: (workspace.timeLogs || []).map((row) => ({
      workedOn: row.workedOn,
      hours: row.hours,
      status: row.status,
      weekNumber: row.weekNumber,
    })),
    exceptions: workspace.scheduleExceptions,
    weekZeroReady: true,
    internshipStatus: "active",
  });
  hourSummary.approvedHours = 90;
  hourSummary.requiredHours = 150;
  hourSummary.loggedThisWeek = 12;
  hourSummary.remainingHours = 60;
  hourSummary.progressPercent = 60;
  hourSummary.paceLabel = "On track";
  hourSummary.plannedWeeklyHours = 20;

  const manager = mockManagerDesk();
  const internData = {
    ...workspace,
    intern: {
      ...workspace.intern,
      fullName: "Ryan Chen",
      preferredName: "Ryan",
      requiredHours: 150,
    },
  };

  return (
    <div className="min-h-dvh space-y-10 bg-slate-200 p-3 sm:p-6">
      <header className="mx-auto max-w-[1600px] rounded-[1.5rem] bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Portal mockups</h1>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Manager Desk, Intern Portal, and Growth Workspace — same pastel desk color theme.
        </p>
        <MockupLinks />
      </header>

      {(view === "manager" || view === "both") && (
        <section className="mx-auto max-w-[1600px] space-y-4">
          <h2 className="text-lg font-black text-slate-950">Manager Desk · desktop / laptop</h2>
          <div
            data-frame="manager-desktop"
            className="overflow-hidden rounded-[1.5rem] border border-slate-300 bg-white shadow-xl"
          >
            <ManagerMockFrame desk={manager} />
          </div>
          <h2 className="text-lg font-black text-slate-950">Manager Desk · mobile / webapp</h2>
          <div
            data-frame="manager-mobile"
            className="mx-auto max-w-[390px] overflow-hidden rounded-[1.75rem] border border-slate-300 bg-white shadow-xl"
          >
            <ManagerMockFrame desk={manager} mobile />
          </div>
        </section>
      )}

      {(view === "intern" || view === "both") && (
        <section className="mx-auto max-w-[1600px] space-y-4">
          <h2 className="text-lg font-black text-slate-950">Intern Portal · desktop / laptop</h2>
          <div
            data-frame="intern-desktop"
            className="overflow-hidden rounded-[1.5rem] border border-slate-300 bg-white shadow-xl"
          >
            <InternMockFrame data={internData} hourSummary={hourSummary} firstName="Ryan" />
          </div>
          <h2 className="text-lg font-black text-slate-950">Intern Portal · mobile / webapp</h2>
          <div
            data-frame="intern-mobile"
            className="mx-auto max-w-[390px] overflow-hidden rounded-[1.75rem] border border-slate-300 bg-white shadow-xl"
          >
            <InternMockFrame data={internData} hourSummary={hourSummary} firstName="Ryan" mobile />
          </div>
        </section>
      )}

      {(view === "growth-manager" || view === "growth" || view === "both") && (
        <section className="mx-auto max-w-[1600px] space-y-4">
          <h2 className="text-lg font-black text-slate-950">
            Growth Workspace · Manager · desktop
          </h2>
          <div
            data-frame="growth-manager-desktop"
            className="overflow-hidden rounded-[1.5rem] border border-slate-300 bg-white shadow-xl"
          >
            <ManagerGrowthMockFrame desk={manager} />
          </div>
          <h2 className="text-lg font-black text-slate-950">
            Growth Workspace · Manager · mobile
          </h2>
          <div
            data-frame="growth-manager-mobile"
            className="mx-auto max-w-[390px] overflow-hidden rounded-[1.75rem] border border-slate-300 bg-white shadow-xl"
          >
            <ManagerGrowthMockFrame desk={manager} mobile />
          </div>
        </section>
      )}

      {(view === "growth-intern" || view === "growth" || view === "both") && (
        <section className="mx-auto max-w-[1600px] space-y-4">
          <h2 className="text-lg font-black text-slate-950">
            Growth Workspace · Intern · desktop
          </h2>
          <div
            data-frame="growth-intern-desktop"
            className="overflow-hidden rounded-[1.5rem] border border-slate-300 bg-white shadow-xl"
          >
            <InternGrowthMockFrame firstName="Ryan" />
          </div>
          <h2 className="text-lg font-black text-slate-950">
            Growth Workspace · Intern · mobile
          </h2>
          <div
            data-frame="growth-intern-mobile"
            className="mx-auto max-w-[390px] overflow-hidden rounded-[1.75rem] border border-slate-300 bg-white shadow-xl"
          >
            <InternGrowthMockFrame firstName="Ryan" mobile />
          </div>
        </section>
      )}
    </div>
  );
}
