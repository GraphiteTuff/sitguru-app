"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  deactivateGrowthHire,
  grantGrowthHireAccess,
} from "@/lib/admin/growth/hire";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

export async function hireGrowthManager(formData: FormData) {
  const actor = await getAdminIdentity();
  if (!actor?.canManageUsers) {
    redirect("/admin/hr/growth-hire?error=Only%20Super%20Admins%20can%20hire%20this%20role.");
  }

  const result = await grantGrowthHireAccess({
    actor,
    email: field(formData, "email"),
    name: field(formData, "name"),
    notes: field(formData, "notes"),
    location: field(formData, "location"),
    startDate: field(formData, "startDate"),
    invite: field(formData, "invite") === "on",
  });

  revalidatePath("/admin/hr");
  revalidatePath("/admin/hr/growth-hire");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/growth");

  if (!result.ok) {
    redirect(`/admin/hr/growth-hire?error=${encodeURIComponent(result.error)}`);
  }

  const message = result.invited
    ? `Invited ${result.email} and opened the Growth Portal for them.`
    : `Granted Growth Portal access to ${result.email}.`;
  redirect(`/admin/hr/growth-hire?ok=${encodeURIComponent(message)}`);
}

export async function removeGrowthManager(formData: FormData) {
  const actor = await getAdminIdentity();
  if (!actor?.canManageUsers) {
    redirect("/admin/hr/growth-hire?error=Not%20allowed.");
  }

  const result = await deactivateGrowthHire(field(formData, "email"), actor);
  revalidatePath("/admin/hr");
  revalidatePath("/admin/hr/growth-hire");
  revalidatePath("/admin/settings");

  if (!result.ok) {
    redirect(`/admin/hr/growth-hire?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/admin/hr/growth-hire?ok=Growth%20Portal%20access%20removed.");
}
