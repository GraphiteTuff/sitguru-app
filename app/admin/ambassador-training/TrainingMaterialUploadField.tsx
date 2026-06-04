"use client";

import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Trash2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AcademyType = "pet_parent" | "guru" | "ambassador";

type UploadStatus = "idle" | "uploading" | "uploaded" | "error" | "removed";

const universityStorageBucket = "sitguru-university";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string, fallback = "training-material") {
  const slug = asString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || fallback;
}

function getAcademyStorageFolder(academyType: AcademyType) {
  if (academyType === "pet_parent") return "pet-parent";
  if (academyType === "guru") return "guru";

  return "ambassador";
}

function getFileExtension(fileName: string) {
  const cleanName = asString(fileName).toLowerCase();
  const extension = cleanName.includes(".")
    ? cleanName.slice(cleanName.lastIndexOf("."))
    : "";

  return extension.replace(/[^a-z0-9.]/g, "") || "";
}

function buildTrainingMaterialStoragePath({
  academyType,
  stepNumber,
  stepTitle,
  materialTitle,
  fileName,
}: {
  academyType: AcademyType;
  stepNumber: number;
  stepTitle: string;
  materialTitle: string;
  fileName: string;
}) {
  const folder = getAcademyStorageFolder(academyType);
  const safeStepNumber = String(stepNumber || 1).padStart(2, "0");
  const safeStepTitle = slugify(stepTitle, "academy-step");
  const safeMaterialTitle = slugify(materialTitle, "material");
  const safeOriginalName = slugify(fileName.replace(/\.[^/.]+$/, ""), "upload");
  const extension = getFileExtension(fileName);
  const timestamp = Date.now();

  return `${folder}/${safeStepNumber}-${safeStepTitle}/${timestamp}-${safeMaterialTitle}-${safeOriginalName}${extension}`;
}

function getMaterialTitleFromForm(input: HTMLInputElement | null) {
  const form = input?.closest("form");
  const titleInput = form?.querySelector<HTMLInputElement>('input[name="title"]');
  return titleInput?.value?.trim() || "training-material";
}

export default function TrainingMaterialUploadField({
  academyType,
  stepNumber,
  stepTitle,
  initialBucket = universityStorageBucket,
  initialPath = "",
  isEdit = false,
}: {
  academyType: AcademyType;
  stepNumber: number;
  stepTitle: string;
  initialBucket?: string | null;
  initialPath?: string | null;
  isEdit?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [storageBucket, setStorageBucket] = useState(
    asString(initialBucket) || universityStorageBucket,
  );
  const [storagePath, setStoragePath] = useState(asString(initialPath));
  const [status, setStatus] = useState<UploadStatus>(initialPath ? "uploaded" : "idle");
  const [message, setMessage] = useState(
    initialPath ? "A storage file is currently attached." : "",
  );
  const [removeStorageFile, setRemoveStorageFile] = useState(false);

  const attachedFileLabel = useMemo(() => {
    if (!storagePath) return "No uploaded file attached yet.";

    const parts = storagePath.split("/");
    return parts[parts.length - 1] || storagePath;
  }, [storagePath]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setStatus("uploading");
    setMessage("Uploading directly to Supabase Storage...");
    setRemoveStorageFile(false);

    const bucket = storageBucket || universityStorageBucket;
    const materialTitle = getMaterialTitleFromForm(inputRef.current);
    const nextStoragePath = buildTrainingMaterialStoragePath({
      academyType,
      stepNumber,
      stepTitle,
      materialTitle,
      fileName: file.name,
    });

    const supabase = createClient();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(nextStoragePath, file, {
        cacheControl: "3600",
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      setStatus("error");
      setMessage(
        `Upload failed: ${error.message}. Confirm the bucket exists and storage upload policies allow authenticated admins to upload.`,
      );
      return;
    }

    setStorageBucket(bucket);
    setStoragePath(nextStoragePath);
    setStatus("uploaded");
    setMessage("Uploaded. Now click Save/Add Material to attach it to this step.");
  }

  function markRemoveAttachedFile() {
    setStoragePath("");
    setRemoveStorageFile(true);
    setStatus("removed");
    setMessage(
      "Marked for removal. Click Save Material to detach it and delete the old storage file.",
    );

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-3">
      <input type="hidden" name="storage_bucket" value={storageBucket} />
      <input type="hidden" name="storage_path" value={storagePath} />
      <input
        type="hidden"
        name="remove_storage_file"
        value={removeStorageFile ? "on" : ""}
      />

      <label className="grid gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          {isEdit ? "Replace / Attach Uploaded File" : "Attach Uploaded File"}
        </span>

        <div className="rounded-2xl border border-dashed border-green-200 bg-white p-4">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
              <UploadCloud size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-green-950">
                Upload the file from your computer
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                The file uploads directly to Supabase Storage first. After it says
                uploaded, click Save/Add Material to save the material record.
              </p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.webp,.mp4,.mov,.m4v,.webm"
            onChange={handleFileChange}
            className="block w-full cursor-pointer rounded-2xl border border-[#dfe9e2] bg-white text-sm font-bold text-slate-900 file:mr-4 file:border-0 file:bg-green-800 file:px-4 file:py-3 file:text-sm file:font-black file:text-white hover:file:bg-green-900"
          />

          <div
            className={[
              "mt-3 rounded-2xl border p-3 text-xs font-bold leading-5",
              status === "uploaded"
                ? "border-green-100 bg-green-50 text-green-900"
                : status === "uploading"
                  ? "border-blue-100 bg-blue-50 text-blue-900"
                  : status === "error"
                    ? "border-red-100 bg-red-50 text-red-800"
                    : status === "removed"
                      ? "border-amber-100 bg-amber-50 text-amber-900"
                      : "border-slate-100 bg-slate-50 text-slate-600",
            ].join(" ")}
          >
            <div className="flex items-start gap-2">
              {status === "uploaded" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : status === "error" ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : null}
              <div className="min-w-0">
                <p className="font-black">
                  {status === "uploading"
                    ? "Uploading..."
                    : status === "uploaded"
                      ? "Uploaded"
                      : status === "removed"
                        ? "File marked for removal"
                        : status === "error"
                          ? "Upload failed"
                          : "Ready for upload"}
                </p>
                <p className="mt-1 break-words">
                  {message || "Choose a file to upload it directly to Supabase Storage."}
                </p>
                <p className="mt-2 break-words">
                  <span className="font-black">Attached file:</span>{" "}
                  {attachedFileLabel}
                </p>
              </div>
            </div>
          </div>

          {storagePath ? (
            <button
              type="button"
              onClick={markRemoveAttachedFile}
              className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-800 transition hover:bg-red-100"
            >
              <Trash2 size={14} />
              Remove attached file
            </button>
          ) : null}
        </div>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Storage Bucket
          </span>
          <input
            value={storageBucket}
            onChange={(event) => setStorageBucket(event.target.value)}
            placeholder="sitguru-university"
            className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Storage Path
          </span>
          <input
            value={storagePath}
            onChange={(event) => {
              setStoragePath(event.target.value);
              setRemoveStorageFile(false);
            }}
            placeholder="Auto-filled after file upload"
            className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
          />
        </label>
      </div>
    </div>
  );
}
