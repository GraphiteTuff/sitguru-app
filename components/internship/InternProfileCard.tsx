"use client";

import InternAvatar from "@/components/internship/InternAvatar";
import { saveInternProfile } from "@/lib/internship/actions";
import { INTERN_PORTAL_THEMES } from "@/lib/internship/portal";
import type { InternshipIntern } from "@/lib/internship/types";

export default function InternProfileCard({
  intern,
  preview = false,
}: {
  intern: InternshipIntern;
  preview?: boolean;
}) {
  return (
    <section
      id="profile"
      className="scroll-mt-24 overflow-hidden rounded-[1.8rem] border border-emerald-200 bg-white shadow-sm"
    >
      <span className="block h-2.5 w-full bg-[#0D5C3A]" />
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <InternAvatar
            name={intern.preferredName || intern.fullName}
            email={intern.email}
            src={intern.avatarUrl}
            size="lg"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
              Your intern page
            </p>
            <h2 className="mt-1 font-black text-slate-950">
              {intern.preferredName || intern.fullName}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {intern.headline ||
                "Add a short intro, photo, and account details. School branding stays on the Canvas card above."}
            </p>
          </div>
        </div>

        {preview ? (
          <p className="mt-4 rounded-2xl bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-900">
            Preview is view-only. Interns update this page from their own login.
          </p>
        ) : (
          <form
            action={saveInternProfile}
            encType="multipart/form-data"
            className="mt-4 grid gap-3 sm:grid-cols-2"
          >
            <input type="hidden" name="internId" value={intern.id} />
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Preferred name
              </span>
              <input
                name="preferredName"
                defaultValue={intern.preferredName || ""}
                placeholder="What should we call you?"
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Full name on your page
              </span>
              <input
                name="fullName"
                required
                defaultValue={intern.fullName}
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Phone
              </span>
              <input
                name="phone"
                defaultValue={intern.phone}
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Student ID
              </span>
              <input
                name="studentId"
                defaultValue={intern.studentId}
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Student email
              </span>
              <input
                name="studentEmail"
                type="email"
                defaultValue={intern.studentEmail}
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Headline
              </span>
              <input
                name="headline"
                defaultValue={intern.headline || ""}
                placeholder="Penn State intern growing SitGuru in Greater Philadelphia"
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                About
              </span>
              <textarea
                name="bio"
                rows={3}
                defaultValue={intern.bio || ""}
                className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-3 text-sm font-semibold text-slate-950"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                LinkedIn
              </span>
              <input
                name="linkedinUrl"
                defaultValue={intern.linkedinUrl || ""}
                placeholder="https://www.linkedin.com/in/..."
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Page color
              </span>
              <select
                name="portalTheme"
                defaultValue={intern.portalTheme || "emerald"}
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
              >
                {INTERN_PORTAL_THEMES.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Profile photo
              </span>
              <input
                name="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-1 w-full text-sm font-semibold text-slate-700"
              />
            </label>
            <p className="sm:col-span-2 text-xs font-semibold text-slate-500">
              SitGuru login stays {intern.email}. School, program, and hours stay with
              Employer HQ after the university approves the internship.
            </p>
            <button className="min-h-12 rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white sm:col-span-2">
              Save intern page
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
