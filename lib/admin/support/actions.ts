"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendSupportNotification } from "@/lib/admin/support/email";
import {
  extractMoneyAmount,
  getFinancialActionLabel,
  getStatusDetailLabel,
  isRefundAction,
  isUuid,
  makeDisputeNumber,
  makeIntakeNumber,
  mapCaseTypeToDisputeType,
  moneyExact,
  shouldSendEmail,
  toNumber,
} from "@/lib/admin/support/utils";

function isMissingColumnError(error: unknown) {
  const message = String(
    (error as { message?: string })?.message || error || ""
  ).toLowerCase();

  return (
    message.includes("assigned_to") ||
    message.includes("user_type") ||
    message.includes("reply_thread") ||
    message.includes("schema cache") ||
    message.includes("could not find")
  );
}

async function insertSupportCase(payload: Record<string, unknown>) {
  const first = await supabaseAdmin.from("support_intake_cases").insert(payload);

  if (!first.error) return first;

  if (!isMissingColumnError(first.error)) return first;

  const fallback = { ...payload };
  delete fallback.assigned_to;
  delete fallback.user_type;
  delete fallback.reply_thread;

  return supabaseAdmin.from("support_intake_cases").insert(fallback);
}

async function updateSupportCase(
  caseId: string,
  payload: Record<string, unknown>
) {
  const first = await supabaseAdmin
    .from("support_intake_cases")
    .update(payload)
    .eq("id", caseId);

  if (!first.error) return first;

  if (!isMissingColumnError(first.error)) return first;

  const fallback = { ...payload };
  delete fallback.assigned_to;
  delete fallback.user_type;
  delete fallback.reply_thread;

  return supabaseAdmin
    .from("support_intake_cases")
    .update(fallback)
    .eq("id", caseId);
}

export async function addSupportIntakeCase(formData: FormData) {
  const intakeNumber = makeIntakeNumber();
  const senderName = String(formData.get("senderName") || "").trim();
  const senderEmail = String(formData.get("senderEmail") || "").trim();
  const senderPhone = String(formData.get("senderPhone") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const messageBody = String(formData.get("messageBody") || "").trim();
  const relatedBookingId = String(
    formData.get("relatedBookingId") || ""
  ).trim();
  const caseType = String(formData.get("caseType") || "general_support").trim();
  const userType = String(formData.get("userType") || "parent").trim();
  const priority = String(formData.get("priority") || "normal").trim();
  const assignedTo = String(formData.get("assignedTo") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const financialAction = String(
    formData.get("financialAction") || "none"
  ).trim();
  const financialAmount = Math.max(0, toNumber(formData.get("financialAmount")));
  const financialNote = String(formData.get("financialNote") || "").trim();
  const refundRequested =
    caseType === "refund_request" || isRefundAction(financialAction);
  const refundAmount = isRefundAction(financialAction) ? financialAmount : 0;
  const financialImpact = financialAmount;

  if (!senderEmail && !subject && !messageBody) {
    return;
  }

  await insertSupportCase({
    intake_number: intakeNumber,
    source: "support_email",
    support_email: "support@sitguru.com",
    sender_name: senderName,
    sender_email: senderEmail,
    sender_phone: senderPhone,
    subject,
    message_body: messageBody,
    related_booking_id: isUuid(relatedBookingId) ? relatedBookingId : null,
    case_type: caseType,
    user_type: userType,
    priority,
    status: "new",
    assigned_to: assignedTo || null,
    notes,
    financial_action: financialAction,
    financial_amount: financialAmount,
    financial_note: financialNote,
    refund_requested: refundRequested,
    refund_amount: refundAmount,
    financial_impact: financialImpact,
    updated_at: new Date().toISOString(),
  });

  let emailStatus = "not_requested";

  if (shouldSendEmail(formData) && senderEmail) {
    const emailResult = await sendSupportNotification({
      to: senderEmail,
      senderName,
      intakeNumber,
      subject,
      status: "new",
      notificationType: "created",
      message:
        "We received your message and created a SitGuru support case. Our team will review it and follow up as soon as possible.",
    });

    emailStatus = emailResult.ok ? "sent" : "failed";
  }

  revalidatePath("/admin/support");

  redirect(
    `/admin/support?updated=1&action=created&emailStatus=${emailStatus}&case=${encodeURIComponent(
      intakeNumber
    )}`
  );
}

export async function updateSupportCaseStatus(formData: FormData) {
  const caseId = String(formData.get("caseId") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const assignedTo = String(formData.get("assignedTo") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const replyBody = String(formData.get("replyBody") || "").trim();

  const senderName = String(formData.get("senderName") || "").trim();
  const senderEmail = String(formData.get("senderEmail") || "").trim();
  const intakeNumber = String(formData.get("intakeNumber") || "").trim();
  const subject = String(formData.get("subject") || "").trim();

  if (!caseId || !status) {
    return;
  }

  const payload: Record<string, unknown> = {
    status,
    assigned_to: assignedTo || null,
    updated_at: new Date().toISOString(),
  };

  if (notes) {
    payload.notes = notes;
  }

  await updateSupportCase(caseId, payload);

  let emailStatus = "not_requested";
  const emailMessage =
    replyBody ||
    notes ||
    `Your SitGuru support case status has been updated to ${getStatusDetailLabel(
      status
    )}.`;

  if (shouldSendEmail(formData) && senderEmail) {
    const emailResult = await sendSupportNotification({
      to: senderEmail,
      senderName,
      intakeNumber,
      subject,
      status,
      notificationType: status === "closed" ? "closed" : "updated",
      message: emailMessage,
    });

    emailStatus = emailResult.ok ? "sent" : "failed";
  }

  revalidatePath("/admin/support");

  redirect(
    `/admin/support?updated=1&action=updated&emailStatus=${emailStatus}&case=${encodeURIComponent(
      intakeNumber || caseId
    )}`
  );
}

export async function assignSupportCase(formData: FormData) {
  const caseId = String(formData.get("caseId") || "").trim();
  const assignedTo = String(formData.get("assignedTo") || "").trim();
  const intakeNumber = String(formData.get("intakeNumber") || "").trim();

  if (!caseId) {
    return;
  }

  await updateSupportCase(caseId, {
    assigned_to: assignedTo || null,
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/admin/support");

  redirect(
    `/admin/support?updated=1&action=assigned&emailStatus=not_requested&case=${encodeURIComponent(
      intakeNumber || caseId
    )}`
  );
}

export async function convertSupportCaseToDispute(formData: FormData) {
  const caseId = String(formData.get("caseId") || "").trim();
  const intakeNumber = String(formData.get("intakeNumber") || "").trim();
  const senderName = String(formData.get("senderName") || "").trim();
  const senderEmail = String(formData.get("senderEmail") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const messageBody = String(formData.get("messageBody") || "").trim();
  const relatedBookingId = String(
    formData.get("relatedBookingId") || ""
  ).trim();
  const caseType = String(formData.get("caseType") || "general_support").trim();
  const priority = String(formData.get("priority") || "normal").trim();
  const financialAction = String(
    formData.get("financialAction") || "none"
  ).trim();
  const financialAmountFromCase = Math.max(
    0,
    toNumber(formData.get("financialAmount"))
  );
  const financialNote = String(formData.get("financialNote") || "").trim();
  const detectedRefundAmount = Math.max(
    extractMoneyAmount(subject),
    extractMoneyAmount(messageBody)
  );
  const finalFinancialAction =
    financialAction !== "none"
      ? financialAction
      : caseType === "refund_request" || detectedRefundAmount > 0
        ? "customer_credit"
        : "none";
  const finalFinancialAmount = Math.max(
    financialAmountFromCase,
    detectedRefundAmount
  );
  const finalRefundRequested =
    caseType === "refund_request" || isRefundAction(finalFinancialAction);
  const finalRefundAmount = isRefundAction(finalFinancialAction)
    ? finalFinancialAmount
    : 0;
  const finalFinancialImpact = finalFinancialAmount;
  const disputeNumber = makeDisputeNumber();

  if (!caseId) {
    return;
  }

  const issueSummary = [
    subject,
    messageBody ? `Message: ${messageBody}` : "",
    finalFinancialAmount > 0
      ? `Financial action: ${getFinancialActionLabel(finalFinancialAction)} (${moneyExact(finalFinancialAmount)})`
      : "",
    financialNote ? `Financial note: ${financialNote}` : "",
    senderEmail ? `Sender email: ${senderEmail}` : "",
    intakeNumber ? `Support intake: ${intakeNumber}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const { data: dispute, error } = await supabaseAdmin
    .from("dispute_cases")
    .insert({
      dispute_number: disputeNumber,
      booking_id: isUuid(relatedBookingId) ? relatedBookingId : null,
      customer_name: senderName || senderEmail || "Support Sender",
      guru_name: "",
      issue_type: mapCaseTypeToDisputeType(caseType),
      issue_summary: issueSummary || "Converted from support intake.",
      status: "open",
      priority,
      refund_requested: finalRefundRequested,
      refund_amount: finalRefundAmount,
      financial_impact: finalFinancialImpact,
      financial_action: finalFinancialAction,
      financial_amount: finalFinancialAmount,
      financial_note: financialNote,
      accounting_posted: false,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (!error && dispute?.id) {
    await updateSupportCase(caseId, {
      status: "converted",
      convert_to_dispute: true,
      linked_dispute_id: dispute.id,
      updated_at: new Date().toISOString(),
    });

    let emailStatus = "not_requested";

    if (shouldSendEmail(formData) && senderEmail) {
      const emailResult = await sendSupportNotification({
        to: senderEmail,
        senderName,
        intakeNumber,
        subject,
        status: "converted",
        notificationType: "converted",
        disputeNumber,
        message:
          "Your support case has been escalated to a dispute review. SitGuru will review the booking, payment, and service details before taking final action.",
      });

      emailStatus = emailResult.ok ? "sent" : "failed";
    }

    revalidatePath("/admin/support");
    revalidatePath("/admin/disputes");

    redirect(
      `/admin/support?updated=1&action=converted&emailStatus=${emailStatus}&case=${encodeURIComponent(
        intakeNumber || caseId
      )}`
    );
  }

  revalidatePath("/admin/support");
  revalidatePath("/admin/disputes");

  redirect(
    `/admin/support?updated=1&action=convert_failed&emailStatus=not_requested&case=${encodeURIComponent(
      intakeNumber || caseId
    )}`
  );
}
