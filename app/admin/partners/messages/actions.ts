"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function parseRecipient(value: string) {
  const [type, id] = value.split(":");

  if (!type || !id) {
    return {
      type: "",
      id: "",
    };
  }

  return {
    type,
    id,
  };
}

export async function sendPartnerMessage(formData: FormData) {
  const recipientValue = cleanText(formData.get("recipient"));
  const subject = cleanText(formData.get("subject"));
  const body = cleanText(formData.get("body"));

  if (!recipientValue) {
    throw new Error("Please choose a message recipient.");
  }

  if (!body) {
    throw new Error("Please enter a message body.");
  }

  const recipient = parseRecipient(recipientValue);

  if (recipient.type !== "partner" && recipient.type !== "ambassador") {
    throw new Error("Invalid recipient type.");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in as Admin to send partner messages.");
  }

  let recipientUserId: string | null = null;
  let partnerId: string | null = null;
  let ambassadorId: string | null = null;
  let recipientName = "Partner Network Recipient";

  if (recipient.type === "partner") {
    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("id, owner_user_id, business_name")
      .eq("id", recipient.id)
      .single();

    if (partnerError || !partner) {
      throw new Error(partnerError?.message || "Could not find partner.");
    }

    partnerId = partner.id;
    recipientUserId = partner.owner_user_id || null;
    recipientName = partner.business_name || recipientName;
  }

  if (recipient.type === "ambassador") {
    const { data: ambassador, error: ambassadorError } = await supabase
      .from("ambassadors")
      .select("id, user_id, display_name")
      .eq("id", recipient.id)
      .single();

    if (ambassadorError || !ambassador) {
      throw new Error(ambassadorError?.message || "Could not find ambassador.");
    }

    ambassadorId = ambassador.id;
    recipientUserId = ambassador.user_id || null;
    recipientName = ambassador.display_name || recipientName;
  }

  const messageSubject = subject || "Message from SitGuru";

  const { data: message, error } = await supabase
    .from("partner_messages")
    .insert({
      sender_user_id: user.id,
      recipient_user_id: recipientUserId,
      partner_id: partnerId,
      ambassador_id: ambassadorId,
      subject: messageSubject,
      body,
    })
    .select("id")
    .single();

  if (error || !message) {
    console.error("Send partner message error:", error);
    throw new Error(error?.message || "Could not send partner message.");
  }

  const { error: notificationError } = await supabase
    .from("partner_message_notifications")
    .insert({
      partner_message_id: message.id,
      recipient_user_id: recipientUserId,
      notification_type: "partner_message",
      title: messageSubject,
      body: `New Partner Network message for ${recipientName}.`,
      is_read: false,
    });

  if (notificationError) {
    console.error("Partner message notification error:", notificationError);
  }

  revalidatePath("/admin/partners/messages");
  revalidatePath("/admin/partners");
  revalidatePath("/admin");

  redirect("/admin/partners/messages");
}
