"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  Bone,
  Camera,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Heart,
  ImageIcon,
  Loader2,
  PawPrint,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Pet = {
  id: string;
  name: string;
  breed: string | null;
  age: string | null;
  photo_url: string | null;
  notes: string | null;
};

type PetForm = {
  name: string;
  breed: string;
  age: string;
  photo_url: string;
  notes: string;
};

type UploadResult = {
  bucket: string;
  path: string;
  publicUrl: string;
};

const emptyPetForm: PetForm = {
  name: "",
  breed: "",
  age: "",
  photo_url: "",
  notes: "",
};

const PHOTO_BUCKETS = ["pet-photos", "profile-photos", "avatars"];

const routes = {
  dashboard: "/customer/dashboard",
  findGuru: "/search",
  customerLogin: "/customer/login",
  customerProfile: "/customer/profile",
};

function stringifyError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function getFileExtension(file: File) {
  const nameExtension = file.name.split(".").pop()?.toLowerCase();

  if (nameExtension) return nameExtension === "jpeg" ? "jpg" : nameExtension;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return "jpg";
}

function isValidPhoto(file: File) {
  return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
    file.type,
  );
}

async function uploadPetPhoto(file: File, userId: string) {
  const extension = getFileExtension(file);
  const path = `${userId}/pet-passport-${Date.now()}.${extension}`;
  let lastError = "Could not upload pet photo.";

  for (const bucket of PHOTO_BUCKETS) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);

      return {
        bucket,
        path,
        publicUrl: data.publicUrl,
      } satisfies UploadResult;
    }

    lastError = error.message || lastError;
  }

  throw new Error(lastError);
}

function getPetCompletion(pet: Pet) {
  const checks = [
    Boolean(pet.name?.trim()),
    Boolean(pet.breed?.trim()),
    Boolean(pet.age?.trim()),
    Boolean(pet.photo_url?.trim()),
    Boolean(pet.notes?.trim()),
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

function getCompletionLabel(percent: number) {
  if (percent >= 90) return "Passport Complete";
  if (percent >= 65) return "Almost Ready";
  return "Needs Info";
}

function getCompletionTone(percent: number) {
  if (percent >= 90) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (percent >= 65) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-rose-200 bg-rose-50 text-rose-800";
}

function getMissingItems(pet: Pet) {
  const items = [
    { label: "Breed", complete: Boolean(pet.breed?.trim()) },
    { label: "Age", complete: Boolean(pet.age?.trim()) },
    { label: "Photo", complete: Boolean(pet.photo_url?.trim()) },
    { label: "Care notes", complete: Boolean(pet.notes?.trim()) },
  ];

  return items.filter((item) => !item.complete).map((item) => item.label);
}

function petToForm(pet: Pet): PetForm {
  return {
    name: pet.name || "",
    breed: pet.breed || "",
    age: pet.age || "",
    photo_url: pet.photo_url || "",
    notes: pet.notes || "",
  };
}

export default function CustomerPetsPage() {
  const addPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const editPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploadingAddPhoto, setUploadingAddPhoto] = useState(false);
  const [uploadingEditPhoto, setUploadingEditPhoto] = useState(false);

  const [form, setForm] = useState<PetForm>(emptyPetForm);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PetForm>(emptyPetForm);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadPets = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      window.location.assign(routes.customerLogin);
      return;
    }

    const { data, error } = await supabase
      .from("pets")
      .select("id, name, breed, age, photo_url, notes")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(`Could not load pets: ${error.message}`);
      setPets([]);
      setLoading(false);
      return;
    }

    setPets(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPets();
  }, [loadPets]);

  async function getCurrentUserId() {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      window.location.assign(routes.customerLogin);
      return null;
    }

    return user.id;
  }

  async function handleAddPhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadingAddPhoto(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const userId = await getCurrentUserId();

      if (!userId) return;

      if (!isValidPhoto(file)) {
        setErrorMessage("Please upload a JPG, PNG, or WEBP pet photo.");
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        setErrorMessage("Pet photos must be 8MB or smaller.");
        return;
      }

      const uploaded = await uploadPetPhoto(file, userId);

      setForm((current) => ({
        ...current,
        photo_url: uploaded.publicUrl,
      }));

      setSuccessMessage("Pet photo uploaded. Add the Pet Passport to save it.");
    } catch (error) {
      setErrorMessage(`Could not upload pet photo: ${stringifyError(error)}`);
    } finally {
      setUploadingAddPhoto(false);

      if (addPhotoInputRef.current) {
        addPhotoInputRef.current.value = "";
      }
    }
  }

  async function handleEditPhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadingEditPhoto(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const userId = await getCurrentUserId();

      if (!userId) return;

      if (!isValidPhoto(file)) {
        setErrorMessage("Please upload a JPG, PNG, or WEBP pet photo.");
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        setErrorMessage("Pet photos must be 8MB or smaller.");
        return;
      }

      const uploaded = await uploadPetPhoto(file, userId);

      setEditForm((current) => ({
        ...current,
        photo_url: uploaded.publicUrl,
      }));

      setSuccessMessage("Pet photo uploaded. Save the passport to keep it.");
    } catch (error) {
      setErrorMessage(`Could not upload pet photo: ${stringifyError(error)}`);
    } finally {
      setUploadingEditPhoto(false);

      if (editPhotoInputRef.current) {
        editPhotoInputRef.current.value = "";
      }
    }
  }

  async function addPet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const userId = await getCurrentUserId();

    if (!userId) {
      setSaving(false);
      return;
    }

    const cleanName = form.name.trim();
    const cleanBreed = form.breed.trim();
    const cleanAge = form.age.trim();
    const cleanPhotoUrl = form.photo_url.trim();
    const cleanNotes = form.notes.trim();

    if (!cleanName) {
      setErrorMessage("Pet name is required.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("pets").insert({
      owner_id: userId,
      name: cleanName,
      breed: cleanBreed || null,
      age: cleanAge || null,
      photo_url: cleanPhotoUrl || null,
      notes: cleanNotes || null,
    });

    if (error) {
      setErrorMessage(`Could not add pet: ${error.message}`);
      setSaving(false);
      return;
    }

    setForm(emptyPetForm);
    setSuccessMessage(`${cleanName} was added to your Pet Passports.`);

    await loadPets();

    setSaving(false);
  }

  function startEditing(pet: Pet) {
    setSelectedPet(null);
    setEditingPetId(pet.id);
    setEditForm(petToForm(pet));
    setErrorMessage("");
    setSuccessMessage("");
  }

  function cancelEditing() {
    setEditingPetId(null);
    setEditForm(emptyPetForm);
  }

  async function savePetUpdate(petId: string) {
    if (saving) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const userId = await getCurrentUserId();

    if (!userId) {
      setSaving(false);
      return;
    }

    const cleanName = editForm.name.trim();
    const cleanBreed = editForm.breed.trim();
    const cleanAge = editForm.age.trim();
    const cleanPhotoUrl = editForm.photo_url.trim();
    const cleanNotes = editForm.notes.trim();

    if (!cleanName) {
      setErrorMessage("Pet name is required.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("pets")
      .update({
        name: cleanName,
        breed: cleanBreed || null,
        age: cleanAge || null,
        photo_url: cleanPhotoUrl || null,
        notes: cleanNotes || null,
      })
      .eq("id", petId)
      .eq("owner_id", userId);

    if (error) {
      setErrorMessage(`Could not update pet: ${error.message}`);
      setSaving(false);
      return;
    }

    setEditingPetId(null);
    setEditForm(emptyPetForm);
    setSuccessMessage(`${cleanName}'s Pet Passport was updated.`);

    await loadPets();

    setSaving(false);
  }

  async function deletePet(pet: Pet) {
    const confirmed = window.confirm(
      `Delete ${pet.name}'s Pet Passport? This cannot be undone.`,
    );

    if (!confirmed) return;

    if (saving) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const userId = await getCurrentUserId();

    if (!userId) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("pets")
      .delete()
      .eq("id", pet.id)
      .eq("owner_id", userId);

    if (error) {
      setErrorMessage(`Could not delete pet: ${error.message}`);
      setSaving(false);
      return;
    }

    if (selectedPet?.id === pet.id) setSelectedPet(null);

    setSuccessMessage(`${pet.name}'s Pet Passport was deleted.`);

    await loadPets();

    setSaving(false);
  }

  const petCountLabel = useMemo(() => {
    if (pets.length === 0) return "No pets yet";
    if (pets.length === 1) return "1 pet profile";
    return `${pets.length} pet profiles`;
  }, [pets.length]);

  const averageCompletion = useMemo(() => {
    if (!pets.length) return 0;

    const total = pets.reduce((sum, pet) => sum + getPetCompletion(pet), 0);
    return Math.round(total / pets.length);
  }, [pets]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#ecfdf5_100%)] px-4">
        <div className="rounded-[2rem] border border-emerald-100 bg-white px-8 py-6 text-center shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-600" />
          <p className="mt-3 text-base font-extrabold text-slate-800">
            Loading your Pet Passports...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#ecfdf5_100%)] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <input
          ref={addPhotoInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleAddPhotoUpload}
        />

        <input
          ref={editPhotoInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleEditPhotoUpload}
        />

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={routes.dashboard}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-900 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customer Dashboard
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={routes.findGuru}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Find a Guru
            </Link>

            <Link
              href={routes.customerProfile}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              My Profile
            </Link>
          </div>
        </div>

        <section className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#00d69f_0%,#66e3c7_48%,#b8e5ff_100%)] px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800 shadow-sm ring-1 ring-white/70">
                <PawPrint className="h-4 w-4" />
                SitGuru Pet Passport
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.045em] text-slate-950 md:text-6xl">
                Your pets deserve care Gurus can understand
              </h1>

              <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-slate-700 md:text-lg">
                Create reusable Pet Passports that help Gurus understand your
                pet&apos;s routine, needs, personality, and care notes before a
                booking begins.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-5 py-3 text-sm font-extrabold text-slate-900 shadow-sm ring-1 ring-white/80">
                  <Heart className="h-4 w-4 text-emerald-600" />
                  {petCountLabel}
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-5 py-3 text-sm font-extrabold text-slate-900 shadow-sm ring-1 ring-white/80">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {pets.length
                    ? `${averageCompletion}% average ready`
                    : "Ready to start"}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-3xl">
                  🐾
                </div>

                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
                    Pet Profiles
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    Keep details ready
                  </h2>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
                  Upload a pet photo from your computer or phone
                </div>

                <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
                  Feeding, medication, allergies, behavior, and routine notes
                </div>

                <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
                  Easy for Gurus to review before care
                </div>
              </div>
            </div>
          </div>
        </section>

        {!!errorMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            {errorMessage}
          </div>
        )}

        {!!successMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            {successMessage}
          </div>
        )}

        {selectedPet ? (
          <section className="mt-6 rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Pet Passport Detail
                </p>
                <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                  {selectedPet.name}
                </h2>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  {selectedPet.breed || "Breed not set"} •{" "}
                  {selectedPet.age || "Age not set"}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => startEditing(selectedPet)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-900 shadow-sm transition hover:bg-slate-50"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Passport
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPet(null)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-emerald-50">
                {selectedPet.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedPet.photo_url}
                    alt={selectedPet.name}
                    className="h-[320px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[320px] flex-col items-center justify-center gap-3 text-emerald-700">
                    <Camera className="h-10 w-10" />
                    <span className="text-xs font-black uppercase tracking-[0.18em]">
                      No photo
                    </span>
                  </div>
                )}
              </div>

              <div className="grid gap-4">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                        Passport Status
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-slate-950">
                        {getPetCompletion(selectedPet)}% Complete
                      </h3>
                    </div>

                    <span
                      className={`rounded-full border px-4 py-2 text-xs font-black ${getCompletionTone(
                        getPetCompletion(selectedPet),
                      )}`}
                    >
                      {getCompletionLabel(getPetCompletion(selectedPet))}
                    </span>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${getPetCompletion(selectedPet)}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                      Breed
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {selectedPet.breed || "Not added"}
                    </p>
                  </div>

                  <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                      Age
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {selectedPet.age || "Not added"}
                    </p>
                  </div>

                  <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                      Guru Ready
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {selectedPet.notes ? "Care notes added" : "Needs notes"}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Care Notes
                  </p>
                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
                    {selectedPet.notes ||
                      "No care notes yet. Add feeding, medications, allergies, personality, routine, behavior, or anything your Guru should know."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <form
            onSubmit={addPet}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Add Pet
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  Create a Pet Passport
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Upload a photo, then add the basics Gurus need to understand
                  your pet.
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <Plus className="h-6 w-6" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white shadow-sm ring-1 ring-emerald-100">
                    {form.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.photo_url}
                        alt="New pet preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-9 w-9 text-emerald-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-950">
                      Pet photo
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                      Upload a JPG, PNG, or WEBP image. This appears on the Pet
                      Passport card.
                    </p>

                    <button
                      type="button"
                      onClick={() => addPhotoInputRef.current?.click()}
                      disabled={uploadingAddPhoto}
                      className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {uploadingAddPhoto ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploadingAddPhoto ? "Uploading..." : "Upload Pet Photo"}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="pet_name"
                  className="mb-2 block text-sm font-extrabold text-slate-950"
                >
                  Pet name
                </label>
                <input
                  id="pet_name"
                  required
                  placeholder="Ex. Scout"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="pet_breed"
                    className="mb-2 block text-sm font-extrabold text-slate-950"
                  >
                    Breed
                  </label>
                  <input
                    id="pet_breed"
                    placeholder="Golden Retriever"
                    value={form.breed}
                    onChange={(event) =>
                      setForm({ ...form, breed: event.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pet_age"
                    className="mb-2 block text-sm font-extrabold text-slate-950"
                  >
                    Age
                  </label>
                  <input
                    id="pet_age"
                    placeholder="4 years"
                    value={form.age}
                    onChange={(event) =>
                      setForm({ ...form, age: event.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="pet_notes"
                  className="mb-2 block text-sm font-extrabold text-slate-950"
                >
                  Care notes for your Guru
                </label>
                <textarea
                  id="pet_notes"
                  placeholder="Feeding, medications, allergies, personality, routine, behavior, potty breaks, walk routine, or anything your Guru should know."
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  rows={7}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bone className="h-4 w-4" />
                )}
                {saving ? "Adding Pet Passport..." : "Add Pet Passport"}
              </button>
            </div>
          </form>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  My Pets
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  Pet Passports
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  These profiles support bookings, messages, and future care
                  requests.
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 ring-1 ring-emerald-100">
                {petCountLabel}
              </div>
            </div>

            {pets.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm ring-1 ring-slate-200">
                  🐶
                </div>

                <h3 className="mt-5 text-2xl font-black text-slate-950">
                  No Pet Passports yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-600">
                  Add your first pet so Gurus can understand their care needs
                  before booking.
                </p>
              </div>
            ) : (
              <div className="grid gap-5">
                {pets.map((pet) => {
                  const percent = getPetCompletion(pet);
                  const tone = getCompletionTone(percent);
                  const label = getCompletionLabel(percent);
                  const isEditing = editingPetId === pet.id;

                  return (
                    <div
                      key={pet.id}
                      className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 shadow-sm"
                    >
                      {isEditing ? (
                        <div className="p-5">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                                Edit Passport
                              </p>
                              <h3 className="mt-1 text-2xl font-black text-slate-950">
                                {pet.name}
                              </h3>
                            </div>

                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-800 transition hover:bg-slate-100"
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </button>
                          </div>

                          <div className="grid gap-4">
                            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-4">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white shadow-sm ring-1 ring-emerald-100">
                                  {editForm.photo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={editForm.photo_url}
                                      alt="Edit pet preview"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <ImageIcon className="h-9 w-9 text-emerald-600" />
                                  )}
                                </div>

                                <div className="flex-1">
                                  <p className="text-sm font-black text-slate-950">
                                    Pet photo
                                  </p>
                                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                                    Upload a replacement photo, then save the
                                    passport.
                                  </p>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      editPhotoInputRef.current?.click()
                                    }
                                    disabled={uploadingEditPhoto}
                                    className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
                                  >
                                    {uploadingEditPhoto ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Upload className="h-4 w-4" />
                                    )}
                                    {uploadingEditPhoto
                                      ? "Uploading..."
                                      : "Upload Pet Photo"}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <input
                              value={editForm.name}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  name: event.target.value,
                                })
                              }
                              placeholder="Pet name"
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                              <input
                                value={editForm.breed}
                                onChange={(event) =>
                                  setEditForm({
                                    ...editForm,
                                    breed: event.target.value,
                                  })
                                }
                                placeholder="Breed"
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                              />

                              <input
                                value={editForm.age}
                                onChange={(event) =>
                                  setEditForm({
                                    ...editForm,
                                    age: event.target.value,
                                  })
                                }
                                placeholder="Age"
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                              />
                            </div>

                            <textarea
                              value={editForm.notes}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  notes: event.target.value,
                                })
                              }
                              placeholder="Care notes"
                              rows={5}
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />

                            <button
                              type="button"
                              onClick={() => savePetUpdate(pet.id)}
                              disabled={saving}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              Save Passport
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-0 lg:grid-cols-[210px_1fr]">
                          <div className="relative flex min-h-[210px] items-center justify-center bg-emerald-50">
                            {pet.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={pet.photo_url}
                                alt={pet.name}
                                className="h-full min-h-[210px] w-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-emerald-700">
                                <Camera className="h-8 w-8" />
                                <span className="text-xs font-black uppercase tracking-[0.14em]">
                                  No photo
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h3 className="text-2xl font-black text-slate-950">
                                  {pet.name}
                                </h3>

                                <p className="mt-1 text-sm font-bold text-slate-500">
                                  {pet.breed || "Unknown breed"} •{" "}
                                  {pet.age || "Age not set"}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-black ${tone}`}
                                >
                                  {label}
                                </span>

                                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                                  {percent}%
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>

                            <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold leading-6 text-slate-700 ring-1 ring-slate-200">
                              {pet.notes ||
                                "No care notes added yet. Add feeding, medication, allergy, behavior, and routine details."}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPet(pet);
                                  setEditingPetId(null);
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700"
                              >
                                <ClipboardList className="h-4 w-4" />
                                View Passport
                              </button>

                              <button
                                type="button"
                                onClick={() => startEditing(pet)}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-900 transition hover:bg-slate-50"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => deletePet(pet)}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2.5 text-xs font-black text-red-600 transition hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>

                            {getMissingItems(pet).length > 0 ? (
                              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">
                                  Finish these next
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {getMissingItems(pet).map((item) => (
                                    <span
                                      key={item}
                                      className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-800 ring-1 ring-amber-200"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-800">
                                <Sparkles className="h-4 w-4" />
                                This Pet Passport is ready for booking.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}