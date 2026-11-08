"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { internshipActorKind } from "@/lib/internship/manager-access";
import { reviewFaqDraft } from "@/lib/messaging/chat-archive";

function canApprove(admin: { role?: string | null; isSuperUser?: boolean } | null) {
  if (!admin) return false;
  if (admin.isSuperUser) return true;
  return internshipActorKind({ role: admin.role, isSuperUser: admin.isSuperUser }) === "supervisor";
}

export async function reviewChatFaq(formData: FormData) {
  const admin = await getAdminIdentity();
  const reviewerId = admin?.id || "";
  if (!canApprove(admin) || !reviewerId) {
    redirect("/manager/faqs?error=Only%20SitGuru%20Admin%20can%20approve%20chat%20FAQs.");
  }
  const id = String(formData.get("id") || "").trim();
  const action = String(formData.get("action") || "") === "reject" ? "reject" : "approve";
  const reviewed = await reviewFaqDraft({ id, action, reviewerId });
  revalidatePath("/manager/faqs");
  revalidatePath("/help");
  if (!reviewed.ok) {
    redirect(`/manager/faqs?error=${encodeURIComponent(reviewed.error)}`);
  }
  redirect(
    action === "approve"
      ? `/manager/faqs?ok=${encodeURIComponent("FAQ approved. It is now a Help Center article.")}`
      : "/manager/faqs?ok=FAQ%20kept%20out%20of%20Help.",
  );
}
