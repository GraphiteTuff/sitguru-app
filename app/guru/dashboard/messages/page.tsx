import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchParamValue = string | string[] | undefined;

type PageProps = {
  searchParams?: Promise<Record<string, SearchParamValue>>;
};

function firstParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function GuruDashboardMessagesPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : {};
  const recipient = firstParam(params.recipient || params.recipientId).trim();
  const booking = firstParam(params.booking || params.bookingId).trim();
  const admin =
    firstParam(params.support).toLowerCase() === "admin" ||
    ["1", "true", "yes"].includes(firstParam(params.admin).toLowerCase());

  const query = new URLSearchParams();
  query.set("role", "guru");
  query.set("returnTo", "/guru/dashboard");

  if (admin) {
    query.set("support", "admin");
    query.set("admin", "true");
    redirect(`/messages/admin?${query.toString()}`);
  }

  if (recipient) {
    query.set("recipientId", recipient);
    if (booking) query.set("bookingId", booking);
    redirect(`/messages/new?${query.toString()}`);
  }

  if (booking) query.set("bookingId", booking);
  redirect(`/messages?${query.toString()}`);
}
