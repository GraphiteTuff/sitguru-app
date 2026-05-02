import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(params: SearchParams, key: string) {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function GuruDashboardConversationRedirectPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const recipient = getParam(resolvedSearchParams, "recipient");
  const email = getParam(resolvedSearchParams, "email");
  const booking = getParam(resolvedSearchParams, "booking");

  const params = new URLSearchParams();

  if (recipient) {
    params.set("recipient", recipient);
  }

  if (email) {
    params.set("email", email);
  }

  if (booking) {
    params.set("booking", booking);
  }

  const query = params.toString();

  redirect(query ? `/guru/dashboard/messages?${query}` : "/guru/dashboard/messages");
}