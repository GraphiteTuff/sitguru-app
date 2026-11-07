"use server";

import { redirect } from "next/navigation";
import { isHardcodedSuperUserEmail } from "@/lib/admin/super-users";
import { approveAmbassadorProgramApplication } from "@/lib/ambassador/approve-application";
import { createClient } from "@/lib/supabase/server";

export async function approveAmbassadorApplicationAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isHardcodedSuperUserEmail(user.email)) {
    redirect("/admin/login");
  }

  const applicationId = String(formData.get("application_id") || "").trim();
  const workEmail = String(formData.get("work_email") || "").trim();
  const result = await approveAmbassadorProgramApplication({
    applicationId,
    actorUserId: user.id,
    workEmail,
  });
  if (!result.ok) {
    redirect(`/admin/ambassadors?queue=new&updated=error&message=${encodeURIComponent(result.error)}`);
  }
  redirect("/admin/ambassadors?queue=approved&updated=success");
}
