"use client";

import Link from "next/link";
import type { ReactNode } from "react";
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
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Edit3,
  Heart,
  ImageIcon,
  Loader2,
  PawPrint,
  Plus,
  Shield,
  ShieldCheck,
  Trash2,
  Upload,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import { getPetBreedOptions } from "@/lib/pets/breeds";
import { supabase } from "@/lib/supabase";

type Pet = {
  id: string;
  name: string;
  pet_type: string | null;
  size_category: string | null;
  breed: string | null;
  age: string | null;
  photo_url: string | null;
  notes: string | null;
};

type PetForm = {
  name: string;
  pet_type: string;
  size_category: string;
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

type SetupStatus = {
  basicInfoComplete: boolean;
  serviceLocationComplete: boolean;
  careNotesComplete: boolean;
  emergencyContactComplete: boolean;
  notificationsComplete: boolean;
};

type SetupStepStatus = "complete" | "required" | "recommended" | "optional";

const emptyPetForm: PetForm = {
  name: "",
  pet_type: "",
  size_category: "",
  breed: "",
  age: "",
  photo_url: "",
  notes: "",
};

const PHOTO_BUCKETS = ["pet-photos", "profile-photos", "avatars"];

const routes = {
  setupHub: "/customer/dashboard/profile",
  basicInfo: "/customer/dashboard/profile/basic-info",
  serviceLocation: "/customer/dashboard/profile/service-location",
  pets: "/customer/pets",
  careNotes: "/customer/dashboard/profile/care-notes",
  emergencyContact: "/customer/dashboard/profile/emergency-contact",
  notifications: "/customer/dashboard/profile/notifications",
  savedGurus: "/customer/dashboard/profile/saved-gurus",
  findGuru: "/find-care",
  customerLogin: "/login",
};

const sizeOptions = [
  {
    value: "teacup",
    shortLabel: "XS",
    title: "Teacup",
    weightRange: "Up to 5 lbs",
  },
  {
    value: "small",
    shortLabel: "S",
    title: "Small",
    weightRange: "6 to 15 lbs",
  },
  {
    value: "medium",
    shortLabel: "M",
    title: "Medium",
    weightRange: "16 to 40 lbs",
  },
  {
    value: "large",
    shortLabel: "L",
    title: "Large",
    weightRange: "41 to 80 lbs",
  },
  {
    value: "extra_large",
    shortLabel: "XL",
    title: "Extra Large",
    weightRange: "81+ lbs",
  },
] as const;

const petTypeOptions = [
  {
    value: "dog",
    title: "Dog",
    subtitle: "Puppy, adult, or senior dog",
    icon: "🐶",
  },
  {
    value: "cat",
    title: "Cat",
    subtitle: "Kitten, adult, or senior cat",
    icon: "🐱",
  },
] as const;

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
    Boolean(pet.pet_type?.trim()),
    Boolean(pet.size_category?.trim()),
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

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getMissingItems(pet: Pet) {
  const items = [
    { label: "Pet Type", complete: Boolean(pet.pet_type?.trim()) },
    { label: "Size", complete: Boolean(pet.size_category?.trim()) },
    { label: "Breed", complete: Boolean(pet.breed?.trim()) },
    { label: "Age", complete: Boolean(pet.age?.trim()) },
    { label: "Photo", complete: Boolean(pet.photo_url?.trim()) },
    { label: "Care Notes", complete: Boolean(pet.notes?.trim()) },
  ];

  return items.filter((item) => !item.complete).map((item) => item.label);
}

function petToForm(pet: Pet): PetForm {
  return {
    name: pet.name || "",
    pet_type: pet.pet_type || "",
    size_category: pet.size_category || "",
    breed: pet.breed || "",
    age: pet.age || "",
    photo_url: pet.photo_url || "",
    notes: pet.notes || "",
  };
}

function formatPetType(value: string | null | undefined) {
  if (!value) return "Type not added";
  if (value === "dog") return "Dog";
  if (value === "cat") return "Cat";
  return value;
}

function formatSizeCategory(value: string | null | undefined) {
  if (!value) return "Size not added";

  const match = sizeOptions.find((option) => option.value === value);

  if (!match) return value.replace(/_/g, " ");

  return `${match.title} (${match.shortLabel})`;
}

function getStepBadgeClassName(status: SetupStepStatus) {
  if (status === "complete") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "required") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "recommended") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function BreedInput({
  id,
  label,
  petType,
  value,
  onChange,
  placeholder = "Select or type a breed",
}: {
  id: string;
  label: string;
  petType: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const options = useMemo(() => getPetBreedOptions(petType), [petType]);
  const hasBreedOptions = options.length > 0;
  const dataListId = `${id}-options`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-extrabold text-slate-950"
      >
        {label}
      </label>

      <input
        id={id}
        list={hasBreedOptions ? dataListId : undefined}
        placeholder={
          hasBreedOptions
            ? placeholder
            : "Choose Dog or Cat first, then start typing breed"
        }
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
      />

      {hasBreedOptions ? (
        <datalist id={dataListId}>
          {options.map((breed) => (
            <option key={breed} value={breed} />
          ))}
        </datalist>
      ) : null}

      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
        {hasBreedOptions
          ? "Start typing to autofill from SitGuru’s dog/cat breed list. You can still type a custom breed or mix."
          : "Select Dog or Cat first to activate breed autofill."}
      </p>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  done,
}: {
  icon: ReactNode;
  label: string;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_5px_18px_rgba(15,23,42,0.03)]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        {icon}
      </div>

      <span className="flex-1 text-sm font-bold text-slate-700">{label}</span>

      <div className="h-2.5 w-20 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${
            done ? "bg-emerald-500" : "bg-slate-300"
          }`}
          style={{ width: done ? "100%" : "38%" }}
        />
      </div>
    </div>
  );
}

function PetAvatar({
  name,
  photoUrl,
  size = "h-16 w-16",
}: {
  name: string;
  photoUrl?: string | null;
  size?: string;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={`${size} rounded-full object-cover ring-4 ring-white shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${size} flex items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700 shadow-sm ring-4 ring-white`}
    >
      <PawPrint className="h-7 w-7" />
    </div>
  );
}

function EmptyPetIllustration() {
  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
      <div className="absolute -left-4 top-10 text-2xl text-emerald-400">♡</div>
      <div className="absolute -right-3 bottom-10 text-2xl text-emerald-400">
        ♡
      </div>

      <div className="relative flex items-end gap-1">
        <div className="flex h-24 w-20 items-center justify-center rounded-[2rem] bg-amber-100 text-5xl shadow-sm">
          🐶
        </div>
        <div className="mb-1 flex h-20 w-16 items-center justify-center rounded-[1.7rem] bg-slate-100 text-4xl shadow-sm">
          🐱
        </div>
      </div>
    </div>
  );
}

function SetupNavigation({
  setupStatus,
  petPassportsComplete,
}: {
  setupStatus: SetupStatus;
  petPassportsComplete: boolean;
}) {
  const steps = [
    {
      number: 1,
      label: "Basic Info",
      href: routes.basicInfo,
      status: setupStatus.basicInfoComplete ? "complete" : "required",
    },
    {
      number: 2,
      label: "Service Location",
      href: routes.serviceLocation,
      status: setupStatus.serviceLocationComplete ? "complete" : "required",
    },
    {
      number: 3,
      label: "Pet Passports",
      href: routes.pets,
      status: petPassportsComplete ? "complete" : "required",
    },
    {
      number: 4,
      label: "Care Notes",
      href: routes.careNotes,
      status: setupStatus.careNotesComplete ? "complete" : "recommended",
    },
    {
      number: 5,
      label: "Emergency",
      href: routes.emergencyContact,
      status: setupStatus.emergencyContactComplete
        ? "complete"
        : "recommended",
    },
    {
      number: 6,
      label: "Notifications",
      href: routes.notifications,
      status: setupStatus.notificationsComplete ? "complete" : "recommended",
    },
    {
      number: 7,
      label: "Saved Gurus",
      href: routes.savedGurus,
      status: "optional",
    },
  ] satisfies Array<{
    number: number;
    label: string;
    href: string;
    status: SetupStepStatus;
  }>;

  return (
    <div className="grid gap-2 md:grid-cols-7">
      {steps.map((step) => {
        const active = step.number === 3;

        return (
          <Link
            key={step.number}
            href={step.href}
            className={`rounded-2xl border px-3 py-3 text-center transition hover:-translate-y-0.5 ${
              active
                ? "border-emerald-300 bg-emerald-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
            }`}
          >
            <span
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black ${getStepBadgeClassName(
                step.status,
              )}`}
            >
              {step.status === "complete" ? "✓" : step.number}
            </span>
            <span className="mt-2 block text-xs font-black text-slate-800">
              {step.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function PetTypeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-extrabold text-slate-950">
        Pet type
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        {petTypeOptions.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-[1.4rem] border p-4 text-left transition ${
                selected
                  ? "border-emerald-300 bg-emerald-50 shadow-[0_10px_30px_rgba(16,185,129,0.12)]"
                  : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${
                    selected ? "bg-emerald-100" : "bg-slate-100"
                  }`}
                >
                  {option.icon}
                </div>

                <div className="min-w-0">
                  <p className="text-base font-black text-slate-950">
                    {option.title}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    {option.subtitle}
                  </p>
                </div>
              </div>

              {selected ? (
                <div className="mt-3 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                  Selected
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SizeSelector({
  value,
  onChange,
  petType,
}: {
  value: string;
  onChange: (value: string) => void;
  petType: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-extrabold text-slate-950">
          Size
        </label>
        <p className="text-xs font-bold text-slate-500">
          {petType === "dog"
            ? "Dog size selector"
            : petType === "cat"
              ? "Cat size selector"
              : "Select dog or cat first"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sizeOptions.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-[1.45rem] border p-4 text-left transition ${
                selected
                  ? "border-emerald-300 bg-emerald-50 shadow-[0_10px_30px_rgba(16,185,129,0.12)]"
                  : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${
                      selected ? "bg-emerald-100" : "bg-slate-100"
                    }`}
                  >
                    {petType === "cat" ? "🐱" : petType === "dog" ? "🐶" : "🐾"}
                  </div>

                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-emerald-700">
                      {option.shortLabel}
                    </p>
                    <p className="text-base font-black text-slate-950">
                      {option.title}
                    </p>
                  </div>
                </div>

                {selected ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-800">
                    Green
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-600">
                Weight range: {option.weightRange}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
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

  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    basicInfoComplete: false,
    serviceLocationComplete: false,
    careNotesComplete: false,
    emergencyContactComplete: false,
    notificationsComplete: false,
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadSetupStatus = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "full_name, first_name, phone, service_address, service_city, service_state, service_zip, care_preferences, emergency_contact, email_notifications, push_notifications, text_notifications",
      )
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      setSetupStatus({
        basicInfoComplete: false,
        serviceLocationComplete: false,
        careNotesComplete: false,
        emergencyContactComplete: false,
        notificationsComplete: false,
      });
      return;
    }

    setSetupStatus({
      basicInfoComplete: Boolean(
        (data.full_name || data.first_name) && data.phone,
      ),
      serviceLocationComplete: Boolean(
        data.service_address &&
          data.service_city &&
          data.service_state &&
          data.service_zip,
      ),
      careNotesComplete: Boolean(data.care_preferences),
      emergencyContactComplete: Boolean(data.emergency_contact),
      notificationsComplete: Boolean(
        data.email_notifications ||
          data.push_notifications ||
          data.text_notifications,
      ),
    });
  }, []);

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
      .select(
        "id, name, pet_type, size_category, breed, age, photo_url, notes",
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(`Could not load pets: ${error.message}`);
      setPets([]);
      setLoading(false);
      return;
    }

    const loadedPets = (data || []) as Pet[];
    setPets(loadedPets);

    setSelectedPet((current) => {
      if (!loadedPets.length) return null;
      if (!current) return loadedPets[0];

      return loadedPets.find((pet) => pet.id === current.id) || loadedPets[0];
    });

    await loadSetupStatus(user.id);
    setLoading(false);
  }, [loadSetupStatus]);

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

  async function submitNewPet(nextRoute?: string) {
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
    const cleanPetType = form.pet_type.trim();
    const cleanSizeCategory = form.size_category.trim();
    const cleanBreed = form.breed.trim();
    const cleanAge = form.age.trim();
    const cleanPhotoUrl = form.photo_url.trim();
    const cleanNotes = form.notes.trim();

    if (!cleanName) {
      setErrorMessage("Pet name is required.");
      setSaving(false);
      return;
    }

    if (!cleanPetType) {
      setErrorMessage("Please choose Dog or Cat.");
      setSaving(false);
      return;
    }

    if (!cleanSizeCategory) {
      setErrorMessage("Please choose a size from Teacup to Extra Large.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("pets").insert({
      owner_id: userId,
      name: cleanName,
      pet_type: cleanPetType || null,
      size_category: cleanSizeCategory || null,
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

    if (nextRoute) {
      window.location.assign(nextRoute);
    }
  }

  async function addPet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitNewPet();
  }

  function startEditing(pet: Pet) {
    setEditingPetId(pet.id);
    setEditForm(petToForm(pet));
    setSelectedPet(pet);
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
    const cleanPetType = editForm.pet_type.trim();
    const cleanSizeCategory = editForm.size_category.trim();
    const cleanBreed = editForm.breed.trim();
    const cleanAge = editForm.age.trim();
    const cleanPhotoUrl = editForm.photo_url.trim();
    const cleanNotes = editForm.notes.trim();

    if (!cleanName) {
      setErrorMessage("Pet name is required.");
      setSaving(false);
      return;
    }

    if (!cleanPetType) {
      setErrorMessage("Please choose Dog or Cat.");
      setSaving(false);
      return;
    }

    if (!cleanSizeCategory) {
      setErrorMessage("Please choose a size from Teacup to Extra Large.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("pets")
      .update({
        name: cleanName,
        pet_type: cleanPetType || null,
        size_category: cleanSizeCategory || null,
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

    if (!confirmed || saving) return;

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

  const previewPet = useMemo(() => {
    if (selectedPet) return selectedPet;

    if (
      form.name ||
      form.pet_type ||
      form.size_category ||
      form.breed ||
      form.age ||
      form.photo_url ||
      form.notes
    ) {
      return {
        id: "preview",
        name: form.name || "Scout",
        pet_type: form.pet_type || "dog",
        size_category: form.size_category || "medium",
        breed: form.breed || "Golden Retriever",
        age: form.age || "4 years",
        photo_url: form.photo_url || null,
        notes: form.notes || "",
      } satisfies Pet;
    }

    return null;
  }, [form, selectedPet]);

  const petPassportsComplete = pets.length > 0;
  const statusLabel = petPassportsComplete ? "Complete" : "Required";
  const statusTone = petPassportsComplete
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-red-200 bg-red-50 text-red-700";

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-[calc(100vh-92px)] items-center justify-center bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_35%,#eef8f3_100%)] px-4">
          <div className="rounded-[2rem] border border-emerald-100 bg-white px-8 py-7 text-center shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-3 text-base font-extrabold text-slate-800">
              Loading your Pet Passports...
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-[calc(100vh-92px)] bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_35%,#eef8f3_100%)] px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Link
              href={routes.setupHub}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              ← Back to Setup Hub
            </Link>

            <div
              className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${statusTone}`}
            >
              Step 3 · {statusLabel}
            </div>
          </div>

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

          <section className="overflow-hidden rounded-[2.35rem] border border-emerald-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="grid gap-8 bg-[radial-gradient(circle_at_14%_28%,rgba(255,255,255,0.22),transparent_18%),radial-gradient(circle_at_92%_30%,rgba(255,255,255,0.20),transparent_18%),linear-gradient(120deg,#18d2a8_0%,#6fdacb_48%,#b9e5ff_100%)] px-7 py-9 md:px-12 md:py-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800 shadow-sm ring-1 ring-white/80">
                  <PawPrint className="h-4 w-4" />
                  Pet Parent Setup · Step 3 of 7
                </div>

                <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.05em] text-slate-950 md:text-6xl lg:text-7xl">
                  Pet Passports
                  <br />
                  that help Gurus
                  <br />
                  care better
                </h1>

                <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-slate-800 md:text-lg">
                  Create reusable Pet Passports that help Gurus understand your
                  pet&apos;s routine, type, size, needs, personality, and care
                  notes before a booking begins.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-5 py-3 text-sm font-extrabold text-slate-900 shadow-sm ring-1 ring-white/80">
                    <Heart className="h-4 w-4 text-emerald-600" />
                    {petCountLabel}
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-5 py-3 text-sm font-extrabold text-slate-900 shadow-sm ring-1 ring-white/80">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    {pets.length
                      ? `${averageCompletion}% average ready`
                      : "Required before booking"}
                  </div>
                </div>
              </div>

              <div className="rounded-[2.1rem] border border-white/75 bg-white/88 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-800">
                    <PawPrint className="h-8 w-8" />
                  </div>

                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
                      Pet Profiles
                    </p>
                    <h2 className="mt-1 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
                      Add type,
                      <br />
                      size, and care
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {[
                    {
                      icon: <Upload className="h-5 w-5" />,
                      text: "Upload a pet photo from your computer or phone",
                    },
                    {
                      icon: <PawPrint className="h-5 w-5" />,
                      text: "Select dog or cat plus size from Teacup to Extra Large",
                    },
                    {
                      icon: <UtensilsCrossed className="h-5 w-5" />,
                      text: "Autofill dog and cat breeds for cleaner Pet Passport data",
                    },
                    {
                      icon: <Shield className="h-5 w-5" />,
                      text: "Easy for Gurus to review before care",
                    },
                  ].map((item) => (
                    <div
                      key={item.text}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_5px_20px_rgba(15,23,42,0.03)]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                        {item.icon}
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6 lg:p-8">
              <SetupNavigation
                setupStatus={setupStatus}
                petPassportsComplete={petPassportsComplete}
              />

              {!!errorMessage && (
                <div className="mt-6 flex items-start gap-3 rounded-[1.35rem] border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  {errorMessage}
                </div>
              )}

              {!!successMessage && (
                <div className="mt-6 flex items-start gap-3 rounded-[1.35rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  {successMessage}
                </div>
              )}

              <section className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.38fr]">
                <form
                  onSubmit={addPet}
                  className="rounded-[2.1rem] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] md:p-6"
                >
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                          3
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-950">
                          Create a Pet Passport
                        </h2>
                      </div>

                      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                        Upload a photo and add key details to help Gurus
                        understand your pet.
                      </p>
                    </div>

                    <div className="hidden items-center gap-2 md:flex">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                            step === 1 || step === 2
                              ? "bg-emerald-600 text-white"
                              : step === 3
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {step === 1 || step === 2 ? "✓" : step}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.6rem] border border-emerald-100 bg-[#f4fbf8] p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-sm">
                          {form.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={form.photo_url}
                              alt="New pet preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="relative flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-10 w-10 text-emerald-600" />
                              <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                                <Plus className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <p className="text-base font-black text-slate-950">
                            Pet photo
                          </p>
                          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                            Upload a JPG, PNG, or WEBP image.
                            <br />
                            This appears on the Pet Passport card.
                          </p>

                          <button
                            type="button"
                            onClick={() => addPhotoInputRef.current?.click()}
                            disabled={uploadingAddPhoto}
                            className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-70"
                          >
                            {uploadingAddPhoto ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            {uploadingAddPhoto
                              ? "Uploading..."
                              : "Upload Pet Photo"}
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
                      <div className="relative">
                        <input
                          id="pet_name"
                          required
                          placeholder="Ex. Scout"
                          value={form.name}
                          onChange={(event) =>
                            setForm({ ...form, name: event.target.value })
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 pr-12 text-sm font-semibold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                        <PawPrint className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <PetTypeSelector
                      value={form.pet_type}
                      onChange={(value) =>
                        setForm({
                          ...form,
                          pet_type: value,
                          breed: "",
                        })
                      }
                    />

                    <SizeSelector
                      value={form.size_category}
                      petType={form.pet_type}
                      onChange={(value) =>
                        setForm({
                          ...form,
                          size_category: value,
                        })
                      }
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <BreedInput
                        id="pet_breed"
                        label="Breed"
                        petType={form.pet_type}
                        value={form.breed}
                        onChange={(value) => setForm({ ...form, breed: value })}
                        placeholder={
                          form.pet_type === "cat"
                            ? "Ex. Maine Coon"
                            : "Ex. Golden Retriever"
                        }
                      />

                      <div>
                        <label
                          htmlFor="pet_age"
                          className="mb-2 block text-sm font-extrabold text-slate-950"
                        >
                          Age
                        </label>
                        <div className="relative">
                          <input
                            id="pet_age"
                            placeholder="Ex. 4 years"
                            value={form.age}
                            onChange={(event) =>
                              setForm({ ...form, age: event.target.value })
                            }
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 pr-12 text-sm font-semibold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                          />
                          <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>
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

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {saving ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <PawPrint className="h-5 w-5" />
                        )}
                        {saving ? "Adding Pet Passport..." : "Add Pet Passport"}
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void submitNewPet(routes.careNotes)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-base font-black text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {saving ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5" />
                        )}
                        {saving ? "Saving..." : "Save & Continue"}
                      </button>
                    </div>

                    <div className="flex flex-wrap justify-between gap-3 border-t border-emerald-50 pt-5">
                      <Link
                        href={routes.serviceLocation}
                        className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                      >
                        ← Previous: Service Location
                      </Link>

                      <Link
                        href={routes.careNotes}
                        className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                      >
                        Next: Care Notes →
                      </Link>
                    </div>
                  </div>
                </form>

                <section className="rounded-[2.1rem] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] md:p-6">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                        <PawPrint className="h-7 w-7" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-600">
                          My Pets
                        </p>
                        <h2 className="text-4xl font-black tracking-tight text-slate-950">
                          Pet Passports
                        </h2>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                          These profiles support bookings, messages, and future
                          care requests.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
                      {petCountLabel}
                    </div>
                  </div>

                  {pets.length === 0 ? (
                    <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
                      <div className="rounded-[1.85rem] border border-slate-200 bg-slate-50 p-8 text-center">
                        <EmptyPetIllustration />

                        <h3 className="mt-6 text-4xl font-black tracking-tight text-slate-950">
                          No Pet Passports yet
                        </h3>

                        <p className="mx-auto mt-3 max-w-md text-base font-semibold leading-7 text-slate-600">
                          Add your first pet so Gurus can understand their care
                          needs before booking.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            document
                              .getElementById("pet_name")
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              })
                          }
                          className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-6 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                        >
                          <Plus className="h-4 w-4" />
                          Create your first Pet Passport
                        </button>
                      </div>

                      <div className="rounded-[1.85rem] border border-emerald-100 bg-[#f4fbf8] p-4">
                        <p className="text-base font-black text-slate-950">
                          Pet Passport Preview
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          Here&apos;s what your saved pet card will look like.
                        </p>

                        <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-center gap-4">
                            <PetAvatar name="Scout" photoUrl={null} />
                            <div>
                              <p className="text-3xl font-black text-slate-950">
                                Scout
                              </p>
                              <p className="text-sm font-semibold text-slate-600">
                                Dog • Medium (M) • Golden Retriever • 4 years
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 space-y-3">
                            <DetailRow
                              icon={<PawPrint className="h-4 w-4" />}
                              label="Type & Size"
                              done={false}
                            />
                            <DetailRow
                              icon={<UtensilsCrossed className="h-4 w-4" />}
                              label="Feeding & Medications"
                              done={false}
                            />
                            <DetailRow
                              icon={<Heart className="h-4 w-4" />}
                              label="Allergies & Health"
                              done={false}
                            />
                            <DetailRow
                              icon={<ClipboardList className="h-4 w-4" />}
                              label="Routine & Behavior"
                              done={false}
                            />
                            <DetailRow
                              icon={<Edit3 className="h-4 w-4" />}
                              label="Care Notes"
                              done={false}
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-black text-emerald-800">
                          <ShieldCheck className="h-5 w-5 shrink-0" />
                          Gurus see what they need, when they need it.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
                      <div className="space-y-4">
                        {pets.map((pet) => {
                          const isEditing = editingPetId === pet.id;
                          const percent = getPetCompletion(pet);
                          const label = getCompletionLabel(percent);
                          const tone = getCompletionTone(percent);

                          return (
                            <div
                              key={pet.id}
                              className="overflow-hidden rounded-[1.55rem] border border-slate-200 bg-slate-50"
                            >
                              {isEditing ? (
                                <div className="p-5">
                                  <div className="mb-4 flex items-center justify-between gap-3">
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

                                  <div className="space-y-4">
                                    <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-4">
                                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] border border-emerald-100 bg-slate-50">
                                          {editForm.photo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={editForm.photo_url}
                                              alt="Edit pet preview"
                                              className="h-full w-full object-cover"
                                            />
                                          ) : (
                                            <ImageIcon className="h-8 w-8 text-emerald-600" />
                                          )}
                                        </div>

                                        <div className="flex-1">
                                          <p className="text-sm font-black text-slate-950">
                                            Pet photo
                                          </p>
                                          <p className="mt-1 text-sm font-semibold text-slate-600">
                                            Upload a replacement photo, then save
                                            the passport.
                                          </p>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              editPhotoInputRef.current?.click()
                                            }
                                            disabled={uploadingEditPhoto}
                                            className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-70"
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

                                    <PetTypeSelector
                                      value={editForm.pet_type}
                                      onChange={(value) =>
                                        setEditForm({
                                          ...editForm,
                                          pet_type: value,
                                          breed: "",
                                        })
                                      }
                                    />

                                    <SizeSelector
                                      value={editForm.size_category}
                                      petType={editForm.pet_type}
                                      onChange={(value) =>
                                        setEditForm({
                                          ...editForm,
                                          size_category: value,
                                        })
                                      }
                                    />

                                    <div className="grid gap-4 sm:grid-cols-2">
                                      <BreedInput
                                        id={`edit_pet_breed_${pet.id}`}
                                        label="Breed"
                                        petType={editForm.pet_type}
                                        value={editForm.breed}
                                        onChange={(value) =>
                                          setEditForm({
                                            ...editForm,
                                            breed: value,
                                          })
                                        }
                                        placeholder="Breed"
                                      />

                                      <div>
                                        <label
                                          htmlFor={`edit_pet_age_${pet.id}`}
                                          className="mb-2 block text-sm font-extrabold text-slate-950"
                                        >
                                          Age
                                        </label>
                                        <input
                                          id={`edit_pet_age_${pet.id}`}
                                          value={editForm.age}
                                          onChange={(event) =>
                                            setEditForm({
                                              ...editForm,
                                              age: event.target.value,
                                            })
                                          }
                                          placeholder="Age"
                                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                        />
                                      </div>
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
                                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-70"
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
                                <div className="grid gap-0 md:grid-cols-[170px_1fr]">
                                  <div className="flex min-h-[190px] items-center justify-center bg-[#eef9f3] p-4">
                                    <PetAvatar
                                      name={pet.name}
                                      photoUrl={pet.photo_url}
                                      size="h-28 w-28"
                                    />
                                  </div>

                                  <div className="p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div>
                                        <h3 className="text-2xl font-black text-slate-950">
                                          {pet.name}
                                        </h3>
                                        <p className="mt-1 text-sm font-semibold text-slate-600">
                                          {formatPetType(pet.pet_type)} •{" "}
                                          {formatSizeCategory(pet.size_category)}{" "}
                                          • {pet.breed || "Breed not added"} •{" "}
                                          {pet.age || "Age not added"}
                                        </p>
                                      </div>

                                      <div className="flex flex-wrap gap-2">
                                        <span
                                          className={`rounded-full border px-3 py-1 text-xs font-black ${tone}`}
                                        >
                                          {label}
                                        </span>
                                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-slate-200">
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

                                    <p className="mt-4 line-clamp-3 text-sm font-semibold leading-7 text-slate-700">
                                      {pet.notes ||
                                        "No care notes added yet. Add feeding, medication, allergies, behavior, and routine details."}
                                    </p>

                                    <div className="mt-5 flex flex-wrap gap-3">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedPet(pet)}
                                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700"
                                      >
                                        <ClipboardList className="h-4 w-4" />
                                        View Passport
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => startEditing(pet)}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-900 transition hover:bg-slate-50"
                                      >
                                        <Edit3 className="h-4 w-4" />
                                        Edit
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => deletePet(pet)}
                                        className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2.5 text-xs font-black text-red-600 transition hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                      </button>
                                    </div>

                                    {getMissingItems(pet).length > 0 ? (
                                      <div className="mt-4 flex flex-wrap gap-2">
                                        {getMissingItems(pet).map((item) => (
                                          <span
                                            key={item}
                                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600"
                                          >
                                            {item}
                                          </span>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="rounded-[1.85rem] border border-emerald-100 bg-[#f4fbf8] p-4">
                        <p className="text-base font-black text-slate-950">
                          Pet Passport Preview
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          Here&apos;s what your saved pet card will look like.
                        </p>

                        <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                          {previewPet ? (
                            <>
                              <div className="flex items-center gap-4">
                                <PetAvatar
                                  name={previewPet.name}
                                  photoUrl={previewPet.photo_url}
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-3xl font-black text-slate-950">
                                    {previewPet.name}
                                  </p>
                                  <p className="text-sm font-semibold text-slate-600">
                                    {formatPetType(previewPet.pet_type)} •{" "}
                                    {formatSizeCategory(
                                      previewPet.size_category,
                                    )}{" "}
                                    • {previewPet.breed || "Breed not added"} •{" "}
                                    {previewPet.age || "Age not added"}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-5 space-y-3">
                                <DetailRow
                                  icon={<PawPrint className="h-4 w-4" />}
                                  label="Type & Size"
                                  done={Boolean(
                                    previewPet.pet_type?.trim() &&
                                      previewPet.size_category?.trim(),
                                  )}
                                />
                                <DetailRow
                                  icon={<UtensilsCrossed className="h-4 w-4" />}
                                  label="Feeding & Medications"
                                  done={Boolean(previewPet.notes?.trim())}
                                />
                                <DetailRow
                                  icon={<Heart className="h-4 w-4" />}
                                  label="Allergies & Health"
                                  done={Boolean(previewPet.notes?.trim())}
                                />
                                <DetailRow
                                  icon={<ClipboardList className="h-4 w-4" />}
                                  label="Routine & Behavior"
                                  done={Boolean(previewPet.notes?.trim())}
                                />
                                <DetailRow
                                  icon={<Edit3 className="h-4 w-4" />}
                                  label="Care Notes"
                                  done={Boolean(previewPet.notes?.trim())}
                                />
                              </div>
                            </>
                          ) : (
                            <div className="py-6 text-center">
                              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                <PawPrint className="h-8 w-8" />
                              </div>
                              <p className="mt-4 text-sm font-semibold text-slate-600">
                                Start adding a pet to preview the passport.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center gap-3 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-black text-emerald-800">
                          <ShieldCheck className="h-5 w-5 shrink-0" />
                          Gurus see what they need, when they need it.
                        </div>

                        {selectedPet ? (
                          <div className="mt-4 rounded-[1.2rem] border border-slate-200 bg-white p-4">
                            <p className="text-sm font-black text-slate-950">
                              Selected Passport
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-600">
                              {selectedPet.name} •{" "}
                              {getPetCompletion(selectedPet)}% complete
                            </p>

                            <div className="mt-4 flex gap-2">
                              <button
                                type="button"
                                onClick={() => startEditing(selectedPet)}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-900 transition hover:bg-slate-50"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => deletePet(selectedPet)}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-xs font-black text-red-600 transition hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </section>
              </section>

              <section className="mt-6 rounded-[2.1rem] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)] md:p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[1.55rem] bg-[#f4fbf8] p-5">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-emerald-700">
                      Why it helps
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">
                      Gurus can prepare faster
                    </h3>
                    <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                      Type, size, breed, feeding, medication, behavior, and
                      routine details help your Guru show up ready.
                    </p>
                  </div>

                  <div className="rounded-[1.55rem] bg-[#f8fafc] p-5">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-emerald-700">
                      Keep it current
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">
                      Update when needs change
                    </h3>
                    <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                      If routines, medications, or care needs change, edit the
                      passport anytime.
                    </p>
                  </div>

                  <div className="rounded-[1.55rem] bg-[#f4fbf8] p-5">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-emerald-700">
                      Next step
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">
                      Ready for care notes?
                    </h3>
                    <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                      After your Pet Passport is ready, add shared care notes to
                      help Gurus better understand your home and routine.
                    </p>
                    <Link
                      href={routes.careNotes}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                    >
                      Next: Care Notes
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}