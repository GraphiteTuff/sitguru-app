import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentAssignedIntern } from "@/lib/admin/growth/workplace";
import { internDocumentationModeEnabled } from "@/lib/internship/documentation-mode";
import { INTERNSHIP_HELP_PATH } from "@/lib/internship/intern-growth";

export async function requireInternHelpAccess() {
  if (internDocumentationModeEnabled()) return { ok: true as const };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/intern/login?next=${INTERNSHIP_HELP_PATH}`);

  const intern = await currentAssignedIntern();
  if (!intern) {
    redirect(
      "/intern/login?error=This account is not assigned to the SitGuru Internship Program.",
    );
  }

  return { ok: true as const, intern };
}
