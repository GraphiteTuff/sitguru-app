import { NextResponse } from "next/server";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import {
  buildTaxPackage,
  taxPackageToCsv,
} from "@/lib/admin/financials/accounting/tax-package";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) return financeCheck.response;

  const taxYear =
    Number(new URL(request.url).searchParams.get("year")) ||
    new Date().getFullYear();
  const { packageData } = await buildTaxPackage(taxYear);
  const csv = taxPackageToCsv(packageData);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sitguru-tax-package-${taxYear}.csv"`,
    },
  });
}
