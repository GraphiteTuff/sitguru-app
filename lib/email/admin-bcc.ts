export const SITGURU_ADMIN_BCC = [
  "jason@sitguru.com",
  "nette@sitguru.com",
] as const;

function extractEmail(value: string) {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] || value).trim().toLowerCase();
}

export function mergeAdminBcc(
  to?: string | string[] | null,
  extra?: string | string[] | null,
) {
  const recipients = new Set(
    (Array.isArray(to) ? to : to ? [to] : [])
      .map(extractEmail)
      .filter(Boolean),
  );
  const extras = (Array.isArray(extra) ? extra : extra ? [extra] : [])
    .map(extractEmail)
    .filter(Boolean);

  const bcc = new Set<string>([...SITGURU_ADMIN_BCC, ...extras]);

  for (const recipient of recipients) {
    bcc.delete(recipient);
  }

  return [...bcc];
}
