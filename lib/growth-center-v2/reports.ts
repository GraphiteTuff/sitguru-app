import type { GrowthCenterSnapshot } from "./types";
import { formatRangeLabel } from "./date-range";
import { getMetricDefinition } from "./metrics";

function csvEscape(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

/** CSV export — same metric definitions as live dashboards. Read-only. */
export function snapshotToCsv(snapshot: GrowthCenterSnapshot) {
  const lines: string[] = [];
  lines.push("section,key,value,prior,availability,source,note");
  lines.push(
    [
      "meta",
      "range",
      formatRangeLabel(snapshot.filters),
      "",
      "available",
      "growth_center_v2",
      snapshot.freshnessLabel,
    ]
      .map(csvEscape)
      .join(","),
  );

  for (const kpi of snapshot.kpis) {
    const def = getMetricDefinition(kpi.definitionId);
    lines.push(
      [
        "kpi",
        kpi.id,
        kpi.value ?? "",
        kpi.prior ?? "",
        kpi.availability,
        kpi.source,
        kpi.note || def?.description || "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  for (const campaign of snapshot.campaigns) {
    lines.push(
      [
        "campaign",
        campaign.slug,
        campaign.visits,
        campaign.signups,
        campaign.conversionRate == null ? "unavailable" : "available",
        "growth_campaign_events",
        `${campaign.name} · ${campaign.channel}`,
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  for (const insight of snapshot.insights) {
    lines.push(
      [
        "insight",
        insight.id,
        insight.title,
        insight.severity,
        insight.confidence,
        insight.sources.join("|"),
        insight.nextAction,
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  return `${lines.join("\n")}\n`;
}

export function weeklyReportMarkdown(snapshot: GrowthCenterSnapshot) {
  const range = formatRangeLabel(snapshot.filters);
  const lines = [
    `# SitGuru Weekly Growth Report`,
    ``,
    `Range: ${range}`,
    `Captured: ${snapshot.capturedAt}`,
    ``,
    `## KPIs`,
  ];
  for (const kpi of snapshot.kpis) {
    const value =
      kpi.availability === "unavailable" || kpi.value == null
        ? "unavailable"
        : kpi.unit === "percent"
          ? `${kpi.value}%`
          : String(kpi.value);
    lines.push(`- **${kpi.label}**: ${value} (source: ${kpi.source})`);
  }
  lines.push(``, `## Insights`);
  for (const insight of snapshot.insights) {
    lines.push(
      `- **${insight.title}** — ${insight.observation} → ${insight.nextAction}`,
    );
  }
  lines.push(``, `## Coverage`);
  for (const note of snapshot.coverageNotes) lines.push(`- ${note}`);
  lines.push(``);
  return lines.join("\n");
}
