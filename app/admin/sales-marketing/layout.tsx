import type { ReactNode } from "react";
import { requireSalesMarketingAdmin } from "@/lib/admin/sales-marketing/access";

export const dynamic = "force-dynamic";

export default async function SalesMarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const access = await requireSalesMarketingAdmin();
  if (!access.ok) return access.ui;
  return children;
}
