"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Camera, Pencil, Upload, X } from "lucide-react";
import InternAvatar from "@/components/internship/InternAvatar";
import { saveInternProfile } from "@/lib/internship/actions";
import { internGhostBtnClass, internPressClass, internPrimaryBtnClass } from "@/lib/internship/intern-ui";
import { INTERN_PORTAL_THEMES } from "@/lib/internship/portal";
import type { InternshipIntern } from "@/lib/internship/types";

function SaveInternPageButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${internPrimaryBtnClass} disabled:opacity-60 sm:col-span-2`}
    >
      {pending ? "Saving…" : "Save your page"}
    </button>
  );
}

function InternPhotoPicker({ currentUrl }: { currentUrl?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(String(currentUrl || "").trim());

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function applyFile(file: File | undefined) {
    if (!file || !inputRef.current) {
      setFileName("");
      return;
    }
    if (inputRef.current.files?.[0] !== file) {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      inputRef.current.files = transfer.files;
    }
    setFileName(file.name);
    const next = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return next;
    });
  }

  return (
    <div className="sm:col-span-2">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
        Profile photo
      </p>
      <div className="mt-2 flex items-center gap-4">
        <span className="relative h-20 w-20 overflow-hidden rounded-2xl border border-emerald-100 bg-white">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover object-center" />
          ) : (
            <span className="flex h-full items-center justify-center text-xs font-black text-emerald-800">
              Photo
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
            className="sr-only"
            onChange={(event) => applyFile(event.currentTarget.files?.[0])}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => applyFile(event.currentTarget.files?.[0])}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={`${internPrimaryBtnClass} min-h-11 px-4 text-xs`}
            >
              <Upload size={14} />
              Choose photo
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className={`${internGhostBtnClass} min-h-11 px-4 text-xs`}
            >
              <Camera size={14} />
              Take photo
            </button>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            {fileName
              ? `${fileName} is ready. Tap Save your page to apply it.`
              : "JPG, PNG, or a phone photo. Tap Save your page after you pick a file."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InternProfileCard({
  intern,
  preview = false,
  open = false,
  onClose,
}: {
  intern: InternshipIntern;
  preview?: boolean;
  open?: boolean;
  onClose?: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close intern page"
        className="absolute inset-0 bg-slate-950/50"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="intern-page-title"
        className="relative z-[1] max-h-[min(92vh,920px)] w-full max-w-2xl overflow-y-auto rounded-t-[1.8rem] border border-emerald-200 bg-white shadow-2xl sm:rounded-[1.8rem]"
      >
        <span className="block h-2.5 w-full bg-[#166534]" />
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <InternAvatar
              name={intern.preferredName || intern.fullName}
              email={intern.email}
              src={intern.avatarUrl}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
                Your intern page
              </p>
              <h2 id="intern-page-title" className="mt-1 font-black text-slate-950">
                {intern.preferredName || intern.fullName}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {intern.headline ||
                  "Add a short intro and photo so SitGuru knows how to reach you."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 ${internPressClass}`}
              aria-label="Close"
            >
              <X size={18} />
            </button>
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
              <InternPhotoPicker currentUrl={intern.avatarUrl} />
              <p className="sm:col-span-2 text-xs font-semibold text-slate-500">
                School, program, and hours stay on your academic card. SitGuru reviews
                your work from this intern portal.
              </p>
              <SaveInternPageButton />
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

export function InternPageTrigger({
  onOpen,
  className = "",
}: {
  onOpen: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${internGhostBtnClass} rounded-full px-4 ${className}`}
    >
      <Pencil size={14} />
      Edit your page
    </button>
  );
}
