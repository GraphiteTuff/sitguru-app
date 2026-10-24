export type ReportContribution = {
  id: string;
  sourceType: string;
  sourceId: string;
  internId: string;
  weekNumber: number | null;
  sectionId: string;
  body: string;
  status: string;
  approved: boolean;
  reviewerId?: string | null;
  approvedAt?: string | null;
  attachments?: string[];
};

export function officialReportContributions(items: ReportContribution[]) {
  return items.filter(
    (item) =>
      item.approved &&
      (item.status === "ava_approved" ||
        item.status === "ceo_approved" ||
        item.status === "approved_complete" ||
        item.status === "official"),
  );
}

export function draftReportContributions(items: ReportContribution[]) {
  return items.filter((item) => !officialReportContributions([item]).length);
}

export function nextReportRevision(input: {
  previous: ReportContribution | null;
  nextBody: string;
  reason: string;
  reviewerId?: string | null;
  status: string;
  approved: boolean;
}) {
  const version = input.previous ? 2 : 1;
  return {
    preservesPrevious: Boolean(input.previous),
    previousId: input.previous?.id || null,
    reason: input.previous ? input.reason.trim() : "",
    reviewerId: input.reviewerId || null,
    status: input.status,
    approved: input.approved,
    body: input.nextBody,
    version,
  };
}
