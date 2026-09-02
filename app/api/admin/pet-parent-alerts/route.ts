import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { getPetParentSummary } from "@/lib/admin/customers/pet-parents";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  }

  const summary = await getPetParentSummary();
  return NextResponse.json({
    new24h: summary.new24h,
    new7d: summary.new7d,
    total: summary.total,
    newest: summary.newest.slice(0, 5).map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
    })),
  });
}
