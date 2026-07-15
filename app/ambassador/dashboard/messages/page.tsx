// app/ambassador/dashboard/messages/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchParamValue = string | string[] | undefined;

type PageProps = {
  searchParams?: Promise<Record<string, SearchParamValue>>;
};

const ROLE_CONTEXT = "ambassador";
const AMBASSADOR_MESSAGE_SOURCE = "ambassador_dashboard";

function getFirstParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function cleanParam(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isTruthyParam(value: SearchParamValue) {
  const normalized = cleanParam(getFirstParam(value)).toLowerCase();

  return ["1", "true", "yes", "admin"].includes(normalized);
}

function shouldOpenAdminChat(
  params: Record<string, SearchParamValue>,
) {
  const support = cleanParam(getFirstParam(params.support)).toLowerCase();

  return support === "admin" || isTruthyParam(params.admin);
}

function appendUniqueValues(
  query: URLSearchParams,
  key: string,
  value: SearchParamValue,
) {
  const values = Array.isArray(value) ? value : [value];
  const uniqueValues = new Set(
    values.map((item) => cleanParam(item)).filter(Boolean),
  );

  uniqueValues.forEach((item) => {
    query.append(key, item);
  });
}

function buildMessageQueryString(
  params: Record<string, SearchParamValue>,
  adminChat: boolean,
) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      key === "support" ||
      key === "admin" ||
      key === "role" ||
      key === "as" ||
      key === "contextRole"
    ) {
      return;
    }

    appendUniqueValues(query, key, value);
  });

  query.set("role", ROLE_CONTEXT);
  query.set("source", cleanParam(query.get("source")) || AMBASSADOR_MESSAGE_SOURCE);

  if (adminChat) {
    query.set("support", "admin");
    query.set("admin", "true");
  } else {
    query.delete("support");
    query.delete("admin");
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

export default async function AmbassadorDashboardMessagesPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : {};
  const adminChat = shouldOpenAdminChat(params);
  const queryString = buildMessageQueryString(params, adminChat);

  redirect(
    adminChat
      ? `/messages/admin${queryString}`
      : `/messages${queryString}`,
  );
}