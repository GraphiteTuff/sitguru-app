"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { saveDeskPreferences, saveDeskProfile } from "@/lib/portal/desk-settings-actions";
import { sitguruTeamsHref } from "@/lib/admin/growth/teams-access";
import { supabase } from "@/lib/supabase";
import { DESK_UI } from "@/lib/portal/desk-ui";

const TABS = ["Account", "Notifications", "Preferences", "Privacy & Security", "Integrations", "Appearance", "Data & Export"] as const;

export type DeskSettingsPrefs = {
  mentions: boolean;
  assignments: boolean;
  checkins: boolean;
  events: boolean;
  marketing: boolean;
  product: boolean;
  landing: string;
  timezone: string;
  emailFrequency: string;
  dateFormat: string;
  appearance: string;
  profileVisibility: string;
  activityVisibility: string;
  analyticsInReports: boolean;
  mfaRequested: boolean;
};

export default function DeskSettings({
  audience,
  fullName,
  email,
  role,
  university,
  bio,
  avatarUrl,
  teamsConnected,
  prefs,
  notice,
}: {
  audience: "manager" | "intern";
  fullName: string;
  email: string;
  role: string;
  university: string;
  bio: string;
  avatarUrl: string;
  teamsConnected: boolean;
  prefs: DeskSettingsPrefs;
  notice?: string | null;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Account");
  const [passwordNote, setPasswordNote] = useState("");
  const back = audience === "manager" ? "/manager/settings" : "/intern/settings";
  const home = audience === "manager" ? "/manager" : "/intern";

  async function changePassword(formData: FormData) {
    const password = String(formData.get("password") || "");
    if (password.length < 8) {
      setPasswordNote("Use at least 8 characters.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    setPasswordNote(error ? error.message : "Password updated.");
  }

  function download() {
    const blob = new Blob(
      [JSON.stringify({ fullName, email, role, university, bio, prefs }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sitguru-desk-settings.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 pb-28 lg:pb-8">
      <DeskPageHero
        icon={<Settings size={22} />}
        title="Settings"
        subtitle="Manage your account, preferences, notifications, and more."
        quote={"Learn. Create.\nMake an impact.\nHappier pets.\nBrighter communities."}
      />
      {notice ? <p className="rounded-2xl bg-[#ECFDF5] px-4 py-3 text-sm font-bold text-[#047857]">{notice}</p> : null}
      <div className="flex gap-2 overflow-x-auto pb-1 text-sm font-bold">
        {TABS.map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`whitespace-nowrap rounded-full px-3 py-2 ${tab === item ? "bg-[#2563EB] !text-white" : "bg-white text-slate-600"}`}>
            {item}
          </button>
        ))}
      </div>

      {tab === "Account" ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
          <form action={saveDeskProfile} className={`${DESK_UI.card} p-4`}>
            <input type="hidden" name="returnTo" value={back} />
            <h2 className="text-lg font-black text-[#0F2744]">Profile Information</h2>
            <div className="mt-4 flex gap-4">
              <span className="relative inline-flex h-16 w-16 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                <span className="absolute inset-0 bg-white" />
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="relative z-[1] h-full w-full object-cover object-center" />
                ) : <span className="relative z-[1] m-auto font-black text-[#1D4ED8]">{fullName.slice(0, 1)}</span>}
              </span>
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-500">Full Name<input name="fullName" defaultValue={fullName} className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-[#0F2744]" /></label>
                <label className="text-xs font-bold text-slate-500">Email<input value={email} readOnly className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm" /></label>
                <label className="text-xs font-bold text-slate-500">Role<input value={role} readOnly className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm" /></label>
                <label className="text-xs font-bold text-slate-500">University<input value={university || "Not on file"} readOnly className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm" /></label>
                <label className="text-xs font-bold text-slate-500 sm:col-span-2">Bio<textarea name="bio" defaultValue={bio} maxLength={300} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
              </div>
            </div>
            <button className="mt-4 rounded-full bg-[#2563EB] px-4 py-2 text-sm font-bold !text-white">Save Profile</button>
          </form>
          <form action={changePassword} className={`${DESK_UI.card} p-4`}>
            <h2 className="text-lg font-black text-[#0F2744]">Account Access</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">{email}</p>
            <label className="mt-3 block text-xs font-bold text-slate-500">New password<input name="password" type="password" minLength={8} className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
            <button className="mt-3 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold">Change password</button>
            {passwordNote ? <p className="mt-2 text-xs font-semibold text-slate-600">{passwordNote}</p> : null}
            <Link href="/forgot-password" className="mt-3 block text-sm font-bold text-[#2563EB]">Email me a reset link</Link>
            <Link href={home} className="mt-2 block text-sm font-bold text-[#2563EB]">Back to {audience === "manager" ? "Manager's Desk" : "Intern Portal"}</Link>
          </form>
        </section>
      ) : null}

      {tab !== "Account" ? (
        <form action={saveDeskPreferences} className={`${DESK_UI.card} grid gap-4 p-4 lg:grid-cols-2`}>
          <input type="hidden" name="returnTo" value={back} />
          {tab !== "Preferences" ? (
            <>
              <input type="hidden" name="landing" value={prefs.landing || home} />
              <input type="hidden" name="timezone" value={prefs.timezone} />
              <input type="hidden" name="emailFrequency" value={prefs.emailFrequency} />
              <input type="hidden" name="dateFormat" value={prefs.dateFormat} />
            </>
          ) : null}
          {tab !== "Appearance" ? <input type="hidden" name="appearance" value={prefs.appearance} /> : null}
          {tab !== "Privacy & Security" ? (
            <>
              <input type="hidden" name="profileVisibility" value={prefs.profileVisibility} />
              <input type="hidden" name="activityVisibility" value={prefs.activityVisibility} />
              {prefs.analyticsInReports ? <input type="hidden" name="analyticsInReports" value="on" /> : null}
              {prefs.mfaRequested ? <input type="hidden" name="mfaRequested" value="on" /> : null}
            </>
          ) : null}
          {tab !== "Notifications" ? (
            <>
              {prefs.mentions ? <input type="hidden" name="mentions" value="on" /> : null}
              {prefs.assignments ? <input type="hidden" name="assignments" value="on" /> : null}
              {prefs.checkins ? <input type="hidden" name="checkins" value="on" /> : null}
              {prefs.events ? <input type="hidden" name="events" value="on" /> : null}
              {prefs.marketing ? <input type="hidden" name="marketing" value="on" /> : null}
              {prefs.product ? <input type="hidden" name="product" value="on" /> : null}
            </>
          ) : null}
          {tab === "Notifications" ? (
            <fieldset className="space-y-2">
              <legend className="text-lg font-black text-[#0F2744]">Notification Preferences</legend>
              {[
                ["mentions", "Mentions & Messages", prefs.mentions],
                ["assignments", "Assignment Updates", prefs.assignments],
                ["checkins", "Check-in Reminders", prefs.checkins],
                ["events", "Event Notifications", prefs.events],
                ["marketing", "Marketing Updates", prefs.marketing],
                ["product", "Product Updates", prefs.product],
              ].map(([name, label, on]) => (
                <label key={String(name)} className="flex items-center justify-between rounded-xl bg-[#F8FAFC] px-3 py-2 text-sm font-semibold">
                  {label}
                  <input type="checkbox" name={String(name)} defaultChecked={Boolean(on)} />
                </label>
              ))}
            </fieldset>
          ) : null}
          {tab === "Preferences" ? (
            <fieldset className="grid gap-3">
              <legend className="text-lg font-black text-[#0F2744]">Preferences</legend>
              <label className="text-xs font-bold text-slate-500">Default landing page
                <select name="landing" defaultValue={prefs.landing || home} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm">
                  <option value={home}>{audience === "manager" ? "Manager's Desk" : "Intern Portal"}</option>
                  <option value={audience === "manager" ? "/manager/my-time" : "/intern/work"}>Work</option>
                  <option value={audience === "manager" ? "/manager/messages" : "/intern/messages"}>Messages</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-500">Time zone
                <select name="timezone" defaultValue={prefs.timezone} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm">
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-500">Email frequency
                <select name="emailFrequency" defaultValue={prefs.emailFrequency} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly Summary</option>
                  <option value="off">Off</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-500">Date format
                <select name="dateFormat" defaultValue={prefs.dateFormat} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm">
                  <option value="MDY">MM/DD/YYYY</option>
                  <option value="DMY">DD/MM/YYYY</option>
                </select>
              </label>
            </fieldset>
          ) : null}
          {tab === "Appearance" ? (
            <fieldset>
              <legend className="text-lg font-black text-[#0F2744]">Appearance</legend>
              <div className="mt-3 flex gap-2">
                {["light", "dark", "system"].map((value) => (
                  <label key={value} className="rounded-2xl border px-4 py-3 text-sm font-bold capitalize">
                    <input type="radio" name="appearance" value={value} defaultChecked={prefs.appearance === value} className="mr-2" />
                    {value}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          {tab === "Privacy & Security" ? (
            <fieldset className="grid gap-3">
              <legend className="text-lg font-black text-[#0F2744]">Privacy & Data</legend>
              <label className="text-xs font-bold text-slate-500">Profile visibility
                <select name="profileVisibility" defaultValue={prefs.profileVisibility} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm">
                  <option value="team">SitGuru Team Only</option>
                  <option value="private">Only me</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-500">Activity visibility
                <select name="activityVisibility" defaultValue={prefs.activityVisibility} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm">
                  <option value="team">SitGuru Team Only</option>
                  <option value="private">Only me</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="analyticsInReports" defaultChecked={prefs.analyticsInReports} /> Include my activity in reports</label>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="mfaRequested" defaultChecked={prefs.mfaRequested} /> Request two-factor authentication</label>
            </fieldset>
          ) : null}
          {tab === "Integrations" ? (
            <div>
              <h2 className="text-lg font-black text-[#0F2744]">Integrations</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                <li><a href={sitguruTeamsHref()} className="block rounded-2xl bg-[#F8FAFC] px-3 py-3 text-sm font-bold">{teamsConnected ? "Microsoft Teams · Connected" : "Microsoft Teams · Connect"}</a></li>
                <li><a href="https://www.canva.com" className="block rounded-2xl bg-[#F8FAFC] px-3 py-3 text-sm font-bold">Canva · Connect</a></li>
                <li><a href="https://www.capcut.com" className="block rounded-2xl bg-[#F8FAFC] px-3 py-3 text-sm font-bold">CapCut · Connect</a></li>
                <li><a href="https://drive.google.com" className="block rounded-2xl bg-[#F8FAFC] px-3 py-3 text-sm font-bold">Google Drive · Connect</a></li>
                <li><a href="https://www.instagram.com/SitGuruOfficial" className="block rounded-2xl bg-[#F8FAFC] px-3 py-3 text-sm font-bold">Instagram · SitGuruOfficial</a></li>
                <li><a href="https://www.tiktok.com/@SitGuruOfficial" className="block rounded-2xl bg-[#F8FAFC] px-3 py-3 text-sm font-bold">TikTok · SitGuruOfficial</a></li>
              </ul>
            </div>
          ) : null}
          {tab === "Data & Export" ? (
            <div>
              <h2 className="text-lg font-black text-[#0F2744]">Data & Export</h2>
              <button type="button" onClick={download} className="mt-3 rounded-full bg-[#2563EB] px-4 py-2 text-sm font-bold !text-white">Download My Data</button>
              <Link href="/account/advanced" className="mt-4 block rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">Delete my account options →</Link>
            </div>
          ) : null}
          {tab !== "Integrations" && tab !== "Data & Export" ? (
            <div><button className="rounded-full bg-[#0D5C3A] px-4 py-2 text-sm font-bold !text-white">Save {tab}</button></div>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
