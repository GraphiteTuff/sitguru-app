import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params?: Promise<{ conversationId?: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function GuruDashboardConversationPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = params ? await params : {};
  const conversationId = String(resolvedParams.conversationId || "").trim();
  const queryParams = searchParams ? await searchParams : {};
  const query = new URLSearchParams();
  query.set("role", "guru");
  query.set("returnTo", "/guru/dashboard");

  const recipient = firstParam(queryParams.recipient || queryParams.recipientId);
  if (recipient) query.set("recipientId", recipient);

  if (conversationId) {
    redirect(`/messages/${encodeURIComponent(conversationId)}?${query.toString()}`);
  }

  redirect(`/messages?${query.toString()}`);
}
