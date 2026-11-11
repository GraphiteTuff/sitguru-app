import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/access";
import { contractorAttentionCounts } from "@/lib/staff-time/attention-counts";

export const dynamic = "force-dynamic";

/** Authenticated Super Admin / HQ summary for web + Expo. No secrets. */
export async function GET() {
  const gate = await requireAdminApi();
  if (!gate.identity || gate.response) return gate.response!;

  const counts = await contractorAttentionCounts();

  return NextResponse.json({
    ok: true,
    actor: {
      id: gate.identity.id,
      email: gate.identity.email,
      role: gate.identity.role,
      isSuperUser: gate.identity.isSuperUser,
      canAccessFinancials: gate.identity.canAccessFinancials,
    },
    contractor: counts,
    links: {
      overview: "/admin",
      actionCenter: "/admin/action-center",
      contractorHours: "/admin/financials/contractor-hours",
      contractorPayments: "/admin/financials/contractor-payments",
      managers: "/admin/managers",
      managerPortal: "/manager",
      managerMyTime: "/manager/my-time",
      managerPayments: "/manager/payments",
    },
  });
}
