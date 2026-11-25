# Outlook for SitGuru internship portals

The Outlook area is linked from the Mail and Calendar pages in both the Intern Portal and Manager Portal. Each verified user connects one Microsoft account. The portal reads the 25 most recent Inbox headers, with links to open messages in Outlook, and the selected month from calendars Microsoft Graph exposes to that account, including eligible shared calendars. SitGuru does not copy messages, attachments, or Outlook events into its database.

Both portals show the SitGuru schedule alongside Outlook calendars. Each role has a separate private, renewable iCalendar subscription link. In Outlook Calendar, select **Add calendar → Subscribe from web**, then enter the link. Other calendar apps can subscribe using the same URL. Outlook determines its refresh schedule. The feed can be revoked in SitGuru, and access is checked against the current SitGuru role every time the feed is fetched. Revocation stops future refreshes. Outlook may keep its existing cached copy until the user removes the subscription. Treat the URL like a password and only add it to calendars you control. Existing SitGuru deadlines and assignments remain authoritative. Generated manager calendar reminders are omitted from the subscription until there is a real scheduled record.

## Deploy and enable

1. Apply the additive migration `20261125165248_internship_outlook_connections.sql` to the intended Supabase project. Verify the browser roles lack access to the two new tables.
2. In [Microsoft Entra app registrations](https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade), register a confidential web application or select the authorized Outlook application. Choose the tenant and supported account types. Add this exact Web redirect URI for production.

   `https://www.sitguru.com/api/internship/outlook/callback`

3. Grant delegated Microsoft Graph permissions `Mail.ReadBasic` and `Calendars.Read.Shared`, and allow offline access. Tenant administrators may have to approve consent. Keep registration secrets in the provider dashboard and Vercel secret configuration.
4. Add the following variables to the intended [Vercel environment](https://vercel.com/jason-graffs-projects/sitguru_main/settings/environment-variables). Keep environment-specific keys separate.

   - `MICROSOFT_OUTLOOK_TENANT_ID`
   - `MICROSOFT_OUTLOOK_CLIENT_ID`
   - `MICROSOFT_OUTLOOK_CLIENT_SECRET`
   - `MICROSOFT_OUTLOOK_REDIRECT_URI`
   - `MICROSOFT_OUTLOOK_ENCRYPTION_KEY`, a base64-encoded random 32-byte key. Changing it requires reconnecting Outlook accounts and replacing subscription URLs.
   - `SITGURU_OUTLOOK_ENABLED=true` after acceptance checks pass. The feature can be disabled without changing any existing internship workflow.

5. With authorized test accounts, verify both portal connections, account isolation, wrong OAuth state rejection, consent denial, reconnect and disconnect, primary and shared calendar listings, and correct times around month boundaries. Test the subscription by changing an authorized fixture assignment's due date in SitGuru and confirming the same Outlook item moves after a refresh. Revoke the feed and verify the old URL returns 404. The repository's isolated Preview intentionally rejects third-party credentials. Use an authorized test environment that is configured for the Microsoft tenant and callback.
