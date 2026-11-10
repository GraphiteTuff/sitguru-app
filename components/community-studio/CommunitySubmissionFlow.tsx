"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, Check, CheckCircle2, ChevronLeft, ChevronRight, FileImage, ImagePlus, LockKeyhole, ShieldCheck, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { communityFileError, uploadCommunityMedia } from "./community-upload";
import type { CommunityItem, CommunityWorkspace } from "@/lib/community-studio/types";

type SubmissionWorkspace = CommunityWorkspace & { bookings?: { id: string; label: string }[] };
type SubmissionItem = CommunityItem & {
  mediaUrl?: string; mediaMime?: string; publicConsent?: boolean; socialConsent?: boolean;
  featuresClientPet?: boolean; bookingId?: string; parentPermissionStatus?: string;
};
export type CommunitySubmissionFlowProps = {
  workspace?: SubmissionWorkspace;
  item?: SubmissionItem;
  authenticated: boolean;
  preview?: boolean;
  onClose?: () => void;
  onComplete?: () => void;
};

const steps = ["Choose media", "Tell the story", "Permissions & submit"];
const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none transition focus:border-[#0D5C3A] focus:ring-2 focus:ring-emerald-100";
const primaryClass = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0D5C3A] px-5 py-3 text-sm font-bold !text-white transition hover:bg-[#104D36] disabled:cursor-not-allowed disabled:opacity-50";
const secondaryClass = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-[#0F2744] transition hover:bg-slate-50 disabled:opacity-50";

export default function CommunitySubmissionFlow({ workspace, item, authenticated, preview = false, onClose, onComplete }: CommunitySubmissionFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState("");
  const [storyOnly, setStoryOnly] = useState(item?.kind === "pack" && !item.imageUrl);
  const [kind, setKind] = useState(item?.kind || "gallery");
  const [petName, setPetName] = useState(item?.petName || "");
  const [title, setTitle] = useState(item?.title || "");
  const [story, setStory] = useState(item?.story || "");
  const [location, setLocation] = useState(item?.location || "");
  const [publicConsent, setPublicConsent] = useState(item?.publicConsent === true);
  const [socialConsent, setSocialConsent] = useState(item?.socialConsent === true);
  const [featuresClientPet, setFeaturesClientPet] = useState(item?.featuresClientPet === true);
  const [bookingId, setBookingId] = useState(item?.bookingId || "");
  const [taskId, setTaskId] = useState(item?.taskId || "");
  const [contentId, setContentId] = useState(item?.contentId || "");
  const [mediaPath, setMediaPath] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState("");
  const [fixtureSuccess, setFixtureSuccess] = useState(false);
  const library = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const canCompose = authenticated || preview;
  const bookings = workspace?.bookings || [];
  const previewUrl = localPreview || item?.mediaUrl || item?.imageUrl || "";
  const mime = file?.type || item?.mediaMime || "image/jpeg";

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => () => controller.current?.abort(), []);

  function chooseFile(next: File | undefined) {
    if (!next) return;
    const problem = communityFileError(next);
    if (problem) { setError(problem); return; }
    setError(""); setFile(next); setMediaPath(""); setStoryOnly(false);
    if (kind === "pack") setKind("gallery");
  }

  function advance() {
    setError("");
    if (step === 0 && !file && !previewUrl && !storyOnly) { setError("Choose a photo or video, or select ‘Share a story instead’. "); return; }
    if (step === 1 && story.trim().length < 20) { setError("Tell us a little more — at least 20 characters for your caption or story."); return; }
    setStep(Math.min(2, step + 1));
  }

  async function save(intent: "draft" | "submit") {
    if (busy) return;
    setError("");
    if (intent === "submit" && !publicConsent) { setError("Please allow SitGuru to display this story publicly before submitting."); return; }
    if (intent === "submit" && featuresClientPet && !bookingId) { setError("Choose the booking for this client’s pet so their Pet Parent can review the request."); return; }
    if (preview) {
      setFixtureSuccess(true);
      setSuccess("Preview complete. No upload, permission request, or submission was sent.");
      return;
    }
    if (!authenticated) { setError("Sign in to submit your story privately."); return; }
    if (workspace?.ready === false) { setError(workspace.error || "Community submissions are not available yet. Your story is still here."); return; }
    setBusy(true); setProgress(0); setProcessing(false);
    const abort = new AbortController();
    controller.current = abort;
    try {
      let path = mediaPath;
      if (file && !path) {
        const uploaded = await uploadCommunityMedia(file, setProgress, () => setProcessing(true), abort.signal);
        path = uploaded.mediaPath;
        setMediaPath(path);
      }
      const form = new FormData();
      const values: Record<string, string> = {
        id: item?.id || "", updatedAt: item?.updatedAt || "", intent,
        kind: storyOnly ? "pack" : kind,
        title: title.trim() || (petName.trim() ? `Meet ${petName.trim()}` : story.trim().slice(0, 100)),
        petName: petName.trim(), story: story.trim(), location: location.trim(),
        publicConsent: publicConsent ? "on" : "", socialConsent: socialConsent ? "on" : "",
        featuresClientPet: featuresClientPet ? "on" : "", bookingId: featuresClientPet ? bookingId : "",
        taskId, contentId, mediaPath: path,
      };
      Object.entries(values).forEach(([key, value]) => form.append(key, value));
      const response = await fetch("/api/community-studio", { method: "POST", body: form, signal: abort.signal });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Your submission could not be saved. Please try again.");
      setSuccess(intent === "draft" ? "Your private draft is saved. You can return to it from Community Studio." : featuresClientPet ? "Your submission is private. We’ve requested permission from the verified Pet Parent for this booking. Ava can publish it only after that approval and the community review." : "Your story is safely submitted for Ava’s review. It stays private until approved and published.");
      router.refresh();
      onComplete?.();
    } catch (problem) {
      if (!(problem instanceof DOMException && problem.name === "AbortError")) setError(problem instanceof Error ? problem.message : "Something interrupted the upload. Please try again.");
    } finally {
      setBusy(false); setProcessing(false); controller.current = null;
    }
  }

  function submit(event: FormEvent) { event.preventDefault(); if (step < 2) advance(); else void save("submit"); }

  if (success) return (
    <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8" role="status" aria-live="polite">
      <CheckCircle2 size={38} className="text-[#0D5C3A]" />
      <h3 className="mt-4 text-2xl font-extrabold text-[#0F2744]">{fixtureSuccess ? "You’re ready to share" : "Thank you for sharing a little joy."}</h3>
      <p className="mt-3 max-w-xl text-sm leading-7 text-emerald-950">{success}</p>
      <button type="button" onClick={() => { setSuccess(""); setFixtureSuccess(false); setStep(0); if (onClose) onClose(); }} className={`${secondaryClass} mt-5`}>{onClose ? "Back to Community Studio" : "Back to your story"}</button>
    </section>
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-[0_12px_40px_rgba(15,39,68,0.05)]" aria-label="Submit a photo, video, or story">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.17em] text-emerald-800">A moment worth sharing</p><h3 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0F2744]">{item ? "Polish your story" : "Submit a photo or video"}</h3></div>
          {onClose && <button type="button" disabled={busy} onClick={onClose} aria-label="Close submission" className="grid size-12 shrink-0 place-items-center rounded-xl border border-slate-200"><X size={20} /></button>}
        </div>
        <ol className="mt-5 grid grid-cols-3 gap-2" aria-label="Submission steps">
          {steps.map((name, index) => <li key={name} aria-current={step === index ? "step" : undefined} className={`flex flex-col gap-2 text-xs font-bold sm:flex-row sm:items-center ${step === index ? "text-[#0D5C3A]" : "text-slate-500"}`}><span className={`grid size-7 shrink-0 place-items-center rounded-full ${step >= index ? "bg-[#0D5C3A] text-white" : "bg-slate-100"}`}>{step > index ? <Check size={14} /> : index + 1}</span>{name}</li>)}
        </ol>
      </div>
      <form onSubmit={submit} className="space-y-5 p-5 sm:p-7">
        {!authenticated && !preview && <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-950">Sign in first to keep your submission private.</p><p className="mt-1 text-sm leading-6 text-emerald-900">Use your existing SitGuru account. You’ll return directly to this invitation.</p><Link href="/login?next=%2Fpack%23submit" className={`${primaryClass} mt-3`}>Sign in to contribute</Link></div>}
        {preview && <p className="rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900">Interactive preview: choose a local file and try the steps. Media and permissions are never uploaded or sent.</p>}
        {workspace?.error && authenticated && <p className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950">{workspace.error}</p>}
        {step === 0 && <div className="space-y-4">
          {previewUrl ? <div className="overflow-hidden rounded-2xl bg-slate-50">{mime.startsWith("video/") ? <video src={previewUrl} controls playsInline preload="metadata" className="max-h-80 w-full bg-slate-950" /> : <img src={previewUrl} alt="Your selected community photo" className="max-h-80 w-full object-contain" />}<p className="px-4 py-3 text-xs font-semibold text-slate-600">{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : "Your current submission media"}</p></div> : <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-[#F6FAF7] px-5 py-8 text-center" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (canCompose) chooseFile(event.dataTransfer.files[0]); }}><UploadCloud size={38} className="mx-auto text-emerald-700" /><p className="mt-4 text-lg font-extrabold text-[#0F2744]">A funny clip. A favorite face.<br />A little everyday magic.</p><p className="mt-2 text-sm leading-6 text-slate-500">JPG, PNG, WebP, MP4, MOV · up to 25 MB</p></div>}
          <input ref={library} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" className="sr-only" tabIndex={-1} onChange={event => chooseFile(event.target.files?.[0])} />
          <input ref={camera} type="file" accept="image/*,video/*" capture="environment" className="sr-only" tabIndex={-1} onChange={event => chooseFile(event.target.files?.[0])} />
          <div className="grid gap-2 sm:grid-cols-2"><button type="button" disabled={!canCompose} onClick={() => library.current?.click()} className={primaryClass}><ImagePlus size={18} />{previewUrl ? "Choose different media" : "Choose from your library"}</button><button type="button" disabled={!canCompose} onClick={() => camera.current?.click()} className={secondaryClass}><Camera size={18} />Take a photo or video</button></div>
          <button type="button" disabled={!canCompose} onClick={() => { setStoryOnly(true); setKind("pack"); setFile(null); setLocalPreview(""); setMediaPath(""); setStep(1); setError(""); }} className="inline-flex min-h-12 items-center gap-2 text-sm font-bold text-emerald-800 disabled:opacity-50"><FileImage size={17} />Share a short story instead</button>
        </div>}
        {step === 1 && <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-[#0F2744]">Pet or Guru name<input name="petName" value={petName} onChange={event => setPetName(event.target.value)} maxLength={100} placeholder="Who should we meet?" className={inputClass} /></label><label className="text-sm font-bold text-[#0F2744]">What are you sharing?<select name="kind" value={storyOnly ? "pack" : kind} onChange={event => setKind(event.target.value as typeof kind)} disabled={storyOnly} className={inputClass}>{storyOnly ? <option value="pack">A pet story</option> : <><option value="gallery">A pet moment</option><option value="guru_spotlight">A Guru introduction</option><option value="pet_of_week">A Pet of the Week nomination</option></>}</select></label></div>
          <label className="block text-sm font-bold text-[#0F2744]">Caption or story<textarea name="story" value={story} onChange={event => setStory(event.target.value)} rows={5} minLength={20} maxLength={5000} placeholder="Tell us what made you smile, or introduce yourself and the care you love to give." className={inputClass} /><span className="mt-2 block text-xs font-medium leading-5 text-slate-500">20–5,000 characters. Please leave out addresses, contact details, license plates, and anyone’s private information.</span></label>
          <details className="rounded-xl border border-slate-200 p-4"><summary className="min-h-8 cursor-pointer text-sm font-bold text-slate-700">Optional details{workspace?.tasks.length || workspace?.content.length ? " & existing work" : ""}</summary><div className="mt-3 space-y-4"><label className="block text-sm font-bold">Story title<input name="title" value={title} onChange={event => setTitle(event.target.value)} maxLength={160} className={inputClass} placeholder="We can use the name or first line of your story" /></label><label className="block text-sm font-bold">City or neighborhood<input name="location" value={location} onChange={event => setLocation(event.target.value)} maxLength={120} className={inputClass} placeholder="A broad location only" /></label>{Boolean(workspace?.tasks.length) && <label className="block text-sm font-bold">Existing assignment<select name="taskId" value={taskId} onChange={event => setTaskId(event.target.value)} className={inputClass}><option value="">No linked assignment</option>{workspace?.tasks.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>}{Boolean(workspace?.content.length) && <label className="block text-sm font-bold">Content Studio draft<select name="contentId" value={contentId} onChange={event => setContentId(event.target.value)} className={inputClass}><option value="">No linked draft</option>{workspace?.content.map(content => <option key={content.id} value={content.id}>{content.title}</option>)}</select></label>}</div></details>
        </div>}
        {step === 2 && <div className="space-y-4">
          <div className="rounded-2xl bg-[#F6F8F5] p-4"><p className="font-extrabold text-[#0F2744]">{title || (petName ? `Meet ${petName}` : "Your moment with the Pack")}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{story}</p></div>
          <label className="flex min-h-16 items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><input name="publicConsent" type="checkbox" checked={publicConsent} onChange={event => setPublicConsent(event.target.checked)} className="mt-1 size-5 shrink-0 accent-emerald-800" /><span><strong className="block">Display on SitGuru — required to submit</strong>I give SitGuru permission to display this story and media publicly after review. I own it or have permission from everyone featured.</span></label>
          <label className="flex min-h-16 items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-700"><input name="socialConsent" type="checkbox" checked={socialConsent} onChange={event => setSocialConsent(event.target.checked)} className="mt-1 size-5 shrink-0 accent-emerald-800" /><span><strong className="block">Share on SitGuru’s social channels — optional</strong>SitGuru may also reuse this story and media on its social media channels. Leaving this unchecked will not affect your community submission.</span></label>
          <label className="flex min-h-12 items-start gap-3 rounded-xl p-2 text-sm leading-6 text-slate-700"><input name="featuresClientPet" type="checkbox" checked={featuresClientPet} onChange={event => setFeaturesClientPet(event.target.checked)} className="mt-1 size-5 shrink-0 accent-emerald-800" /><span>I’m a Guru sharing content that features a client’s pet.</span></label>
          {featuresClientPet && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="flex items-center gap-2 text-sm font-extrabold text-amber-950"><ShieldCheck size={18} />Their Pet Parent makes the decision.</p><p className="mt-2 text-sm leading-6 text-amber-900">Choose the booking for this pet. We’ll request approval from the verified Pet Parent in their own SitGuru account. Your checkbox does not authorize publication.</p><label className="mt-3 block text-sm font-bold text-amber-950">Pet’s booking<select name="bookingId" value={bookingId} onChange={event => setBookingId(event.target.value)} className={inputClass}><option value="">Choose a verified booking</option>{bookings.map(booking => <option key={booking.id} value={booking.id}>{booking.label}</option>)}</select></label>{!bookings.length && <p className="mt-2 text-xs leading-5 text-amber-900">No eligible booking is linked to this account. Contact SitGuru through your existing messages before submitting client content.</p>}</div>}
          <p className="flex gap-2 text-xs leading-6 text-slate-500"><LockKeyhole size={15} className="mt-1 shrink-0" />Your upload stays private through permission checks and Ava’s review. Sensitive media metadata is removed before publication.</p>
        </div>}
        {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-800">{error}</p>}
        {busy && <div role="status" aria-live="polite" className="rounded-xl bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-950">{file && !mediaPath ? processing ? "Checking your media…" : `Uploading your media… ${progress}%` : "Saving your story…"}</p>{file && !processing && <progress value={progress} max={100} aria-label="Media upload progress" className="mt-3 h-2 w-full accent-emerald-800" />}<p className="mt-2 text-xs text-emerald-900">Keep this page open. Your media is still private.</p></div>}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
          {step > 0 ? <button type="button" disabled={busy} onClick={() => { setStep(step - 1); setError(""); }} className={secondaryClass}><ChevronLeft size={16} />Back</button> : <span />}
          <div className="flex flex-col gap-2 sm:flex-row">{step === 2 && authenticated && <button type="button" disabled={busy || workspace?.ready === false} onClick={() => void save("draft")} className={secondaryClass}>Save private draft</button>}<button type="submit" disabled={busy || !canCompose || (step === 2 && workspace?.ready === false && !preview)} className={primaryClass}>{step < 2 ? <>Continue<ChevronRight size={16} /></> : busy ? "Submitting…" : preview ? "Try preview submission" : <><CheckCircle2 size={17} />Submit for review</>}</button></div>
        </div>
      </form>
    </section>
  );
}
