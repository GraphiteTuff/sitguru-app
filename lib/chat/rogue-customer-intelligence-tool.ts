/**
 * Rogue tool: fetch Customer Intelligence metrics + drill-down digests.
 * SERVER ONLY — do not import from client components.
 */

import { tool } from "ai";
import { z } from "zod";
import { getCustomerIntelligenceReportDigest } from "@/lib/admin/customer-intelligence/report";

type CustomerIntelligenceToolParams = {
  metric?: string;
};

async function runFetchCustomerIntelligence(
  params: CustomerIntelligenceToolParams,
): Promise<string> {
  const result = await getCustomerIntelligenceReportDigest({
    metric: params.metric || null,
  });
  return result.digest;
}

export const fetchCustomerIntelligenceTool = tool({
  description:
    "Fetch SitGuru Customer Intelligence metrics for Pet Parents: totals, lifetime value, repeat rate, active last 30 days, excluded/archive rows, social signups/customers/bookings/revenue/clicks, and optional drill-downs. Use when an admin asks about Pet Parent registry stats, customer intelligence cards, social attribution, LTV, repeat customers, or wants Rogue to report those numbers.",
  parameters: z.object({
    metric: z
      .string()
      .optional()
      .describe(
        "Optional drill-down metric id: pet_parents | lifetime_value | repeat_rate | active_30d | rows_excluded | social_signups | social_customers | social_bookings | social_revenue | social_clicks",
      ),
  }),
  execute: async (params: CustomerIntelligenceToolParams) =>
    runFetchCustomerIntelligence(params),
});
