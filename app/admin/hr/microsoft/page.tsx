import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";
import { readMicrosoftGraphConfig } from "@/lib/microsoft/graph";

export const dynamic = "force-dynamic";

function row(label: string, ready: boolean, detail: string) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-black ${ready ? "text-[#166534]" : "text-amber-800"}`}>{ready ? "Configured" : "Not configured"}</p>
      <p className="mt-1 text-sm font-medium text-slate-600">{detail}</p>
    </article>
  );
}

export default async function MicrosoftHealthPage() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin || (isGrowthOnlyRole(actor.role) && !actor.isSuperUser)) {
    redirect("/admin/login");
  }
  const config = readMicrosoftGraphConfig();
  const channelCount = Object.values(config.channelIds).filter(Boolean).length;

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <Link href="/admin/hr" className="text-sm font-bold text-[#2563EB]">Back to HR</Link>
      <h1 className="text-3xl font-black text-[#0F2744]">Microsoft 365</h1>
      <p className="text-sm font-medium leading-6 text-slate-600">
        SitGuru keeps the internship record. Teams is conversation, Planner is execution, and SharePoint holds the files. Secrets stay on the server.
      </p>
      <section className="grid gap-3 sm:grid-cols-2">
        {row("Graph app", config.configured, "Tenant, client id, and client secret.")}
        {row("Teams", channelCount > 0 || Boolean(config.teamId), "Channels can be linked. Automatic posting is not enabled. Mode: channel links.")}
        {row("Planner", Boolean(config.planId), config.readyBucketId ? "Growth plan and Ready bucket are set." : "Growth plan id is still needed.")}
        {row("SharePoint", Boolean(config.siteId && config.driveId && config.internsRootId), "Marketing site, drive, and Intern Projects root.")}
      </section>
      <article className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium leading-6 text-slate-700">
        <p className="font-black text-[#0F2744]">Permissions</p>
        <p className="mt-2"><span className="font-bold">Planner.</span> Application permission <span className="font-bold">Tasks.ReadWrite.All</span>, with admin consent.</p>
        <p className="mt-2"><span className="font-bold">SharePoint.</span> Prefer <span className="font-bold">Sites.Selected</span> with an explicit grant to SitGuru | Marketing &amp; Community Growth. Use Sites.ReadWrite.All only if that site grant cannot be applied.</p>
        <p className="mt-2"><span className="font-bold">User mapping.</span> Not required for the current path. Intern Microsoft ids are stored in microsoft_user_links. User.Read.All is only needed later if SitGuru starts looking people up in the directory.</p>
        <p className="mt-2"><span className="font-bold">Teams.</span> ChannelMessage.Send is a delegated permission. It is not an application permission, and Teamwork.Migrate.All is not used. Automatic posting is not enabled. Mode: channel links.</p>
        <p className="mt-2">SitGuru routes assignments to the correct Teams channel. Automatic channel posting requires a delegated Microsoft connection or an approved Teams workflow.</p>
      </article>
    </main>
  );
}
