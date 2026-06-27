"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileText,
  GraduationCap,
  Handshake,
  Medal,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Trophy,
  UploadCloud,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics/track";

const openSans = {
  className: "font-sans",
};

type ProgramKey =
  | "veterans-hire"
  | "student-hire"
  | "ambassador-program"
  | "skillbridge-interest";

type ProgramSelection = ProgramKey | "";

type ZipLookupResult = {
  city: string;
  state: string;
  stateAbbreviation: string;
};

type ZipLookupStatus = "idle" | "loading" | "found" | "not-found" | "error";

type SchoolSearchResult = {
  id: string;
  name: string;
  city: string;
  state: string;
  website: string | null;
  label: string;
};

type ProgramOption = {
  key: ProgramKey;
  title: string;
  shortTitle: string;
  eyebrow: string;
  icon: ReactNode;
  description: string;
  earningMessage: string;
  idealFor: string[];
  growthPath: string[];
};

type ApplicationFormState = {
  program: ProgramSelection;
  fullName: string;
  email: string;
  phone: string;
  zipCode: string;
  city: string;
  state: string;
  availability: string;
  servicesInterested: string[];
  experience: string;
  militaryConnectedBackground: string;
  schoolName: string;
  studentStatus: string;
  graduationYearOrAvailability: string;
  studentBackground: string;
  referralSource: string;
  resumeLink: string;
  backgroundCheckConsent: boolean;
  notes: string;
};

type ApplicationConfirmation = {
  id: string;
  program: string;
  status: string;
  createdAt: string;
};

const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ADDITIONAL_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ADDITIONAL_DOCUMENTS = 6;

const allowedResumeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const allowedAdditionalDocumentTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

const zipCodeFallbackMap: Record<
  string,
  { city: string; state: string; stateAbbreviation: string }
> = {
  "08030": {
    city: "Camden",
    state: "New Jersey",
    stateAbbreviation: "NJ",
  },
  "18018": {
    city: "Bethlehem",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
  "18101": {
    city: "Allentown",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
  "18951": {
    city: "Quakertown",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
  "19103": {
    city: "Philadelphia",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
};

const programOptions: ProgramOption[] = [
  {
    key: "student-hire",
    title: "Student Hire Program",
    shortTitle: "Student Hire",
    eyebrow: "Extra cash for students",
    icon: <GraduationCap size={28} />,
    description:
      "For students, recent grads, high school seniors 18+, trade school students, gap-year students, and summer workers who want a fun, flexible way to earn extra cash without being stuck in a boring shift.",
    earningMessage:
      "Broke between classes? Earn extra cash after class, between classes, on weekends, during school breaks, or all summer helping local pet families.",
    idealFor: [
      "Students who want extra cash",
      "High school seniors 18+",
      "College students",
      "Trade school and certificate program students",
      "Recent grads",
      "Students looking for summer money, break money, or after-class money",
      "Pet lovers who want flexible earning around school",
    ],
    growthPath: [
      "Apply through Student Hire",
      "Tell us your school schedule, summer availability, and goals",
      "Pick the pet care services you’re interested in",
      "Upload a resume, profile link, or supporting docs if you have them",
      "Complete onboarding and SitGuru trust and safety steps when eligible",
      "Earn, build experience, tell friends, and grow toward full Guru status",
    ],
  },
  {
    key: "veterans-hire",
    title: "Veterans Hire Program",
    shortTitle: "Veterans Hire",
    eyebrow: "Military-connected pathway",
    icon: <Medal size={28} />,
    description:
      "For veterans, eligible service members, National Guard, reservists, military spouses, qualified dependents over 18, and approved SkillBridge applicants who want flexible pet care opportunities and a path to grow with SitGuru.",
    earningMessage:
      "Bring your reliability, accountability, service mindset, communication, adaptability, and care for others into flexible pet care opportunities with SitGuru.",
    idealFor: [
      "Veterans",
      "Eligible service members",
      "National Guard and reserve members",
      "Military spouses",
      "Qualified dependents over 18",
      "Approved SkillBridge applicants",
      "Military-connected applicants ready to work, learn, and grow",
    ],
    growthPath: [
      "Apply through the Veterans Hire Program",
      "Share transferable experience you would like SitGuru to consider",
      "Upload a resume and optional supporting documents",
      "Complete onboarding and training guidance",
      "Complete SitGuru trust and safety review steps when required",
      "Work toward full Guru status with greater commissions and future benefits",
    ],
  },
  {
    key: "ambassador-program",
    title: "Ambassador Program",
    shortTitle: "Ambassador Program",
    eyebrow: "Together, we grow together",
    icon: <Handshake size={28} />,
    description:
      "For Vet Techs, Veterinarians, Trainers, pet-care professionals, and trusted community supporters who want to refer Gurus and Pet Parents while helping SitGuru grow.",
    earningMessage:
      "Help SitGuru grow by referring trusted Gurus and Pet Parents. Ambassadors can support the pet community, earn referral rewards, and help build local trust around SitGuru.",
    idealFor: [
      "Vet Techs",
      "Veterinarians",
      "Dog trainers",
      "Pet-care professionals",
      "Groomers and pet service providers",
      "Community supporters",
      "Trusted local voices who know great pet caregivers",
      "People who want to help refer Gurus and Pet Parents",
    ],
    growthPath: [
      "Apply through the Ambassador Program",
      "Tell us your pet-care background, network, or community connection",
      "Refer qualified Gurus and Pet Parents to SitGuru",
      "Help grow trust and awareness in your local pet community",
      "Earn referral rewards when eligible program terms are met",
      "Top Ambassadors may be recognized publicly with consent as SitGuru grows",
    ],
  },
  {
    key: "skillbridge-interest",
    title: "SkillBridge Interest / Veterans Pathway",
    shortTitle: "SkillBridge Interest",
    eyebrow: "Exploring future SkillBridge pathway",
    icon: <ShieldCheck size={28} />,
    description:
      "For active-duty transitioning service members and approved SkillBridge applicants interested in future SitGuru training pathways around pet care operations, trust and safety, customer experience, local services, and post-transition opportunities.",
    earningMessage:
      "Join the interest list for a future SkillBridge-style training pathway SitGuru is exploring for transitioning service members and approved military-connected applicants.",
    idealFor: [
      "Active-duty transitioning service members",
      "Approved SkillBridge applicants",
      "Service members exploring civilian pet care operations",
      "Applicants interested in customer trust and safety",
      "Applicants interested in local services and operations",
      "People planning post-transition flexible opportunities",
    ],
    growthPath: [
      "Join the SkillBridge Interest / Veterans Pathway list",
      "Share your transition timeline and transferable experience",
      "Upload optional supporting documents if you choose",
      "Receive updates if SitGuru launches or partners on a SkillBridge pathway",
      "Explore future onboarding, training, and post-transition opportunities",
    ],
  },
];

const availabilityOptions = [
  "Weekdays",
  "Weekends",
  "Mornings",
  "Afternoons",
  "Evenings",
  "Overnights",
  "Summer availability",
  "School breaks",
  "After class",
  "Between classes",
  "Flexible schedule",
  "Transition timeline pending",
];

const studentStatusOptions = [
  "Current student",
  "Recent graduate",
  "Summer work",
  "Trade school student",
  "Certificate program student",
  "Gap year",
  "High school senior 18+",
  "Other",
];

const serviceOptions = [
  "Dog walking",
  "Pet sitting",
  "Drop-in visits",
  "Boarding",
  "Doggy day care",
  "House sitting",
  "Training support",
  "Medication help",
  "Pet care operations",
  "Customer support",
  "Local market support",
  "Custom pet care",
  "Guru referrals",
  "Pet Parent referrals",
  "Community outreach",
];

const initialFormState: ApplicationFormState = {
  program: "",
  fullName: "",
  email: "",
  phone: "",
  zipCode: "",
  city: "",
  state: "",
  availability: "",
  servicesInterested: [],
  experience: "",
  militaryConnectedBackground: "",
  schoolName: "",
  studentStatus: "",
  graduationYearOrAvailability: "",
  studentBackground: "",
  referralSource: "",
  resumeLink: "",
  backgroundCheckConsent: false,
  notes: "",
};

function isProgramKey(value: string | null): value is ProgramKey {
  return (
    value === "veterans-hire" ||
    value === "student-hire" ||
    value === "ambassador-program" ||
    value === "skillbridge-interest"
  );
}

function getProgramByKey(key: ProgramKey) {
  return programOptions.find((program) => program.key === key) || null;
}

function getProgramLabel(program: string) {
  if (isProgramKey(program)) {
    return getProgramByKey(program)?.title || "SitGuru Program";
  }

  return "SitGuru Program";
}

function normalizeZipCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;

  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function lookupZipCode(zipCode: string): Promise<ZipLookupResult | null> {
  const normalizedZip = normalizeZipCode(zipCode);

  if (normalizedZip.length !== 5) return null;

  const fallback = zipCodeFallbackMap[normalizedZip];

  if (fallback) return fallback;

  const response = await fetch(`https://api.zippopotam.us/us/${normalizedZip}`);

  if (!response.ok) return null;

  const payload = await response.json();
  const place = payload?.places?.[0];

  if (!place) return null;

  return {
    city: String(place["place name"] || "").trim(),
    state: String(place.state || "").trim(),
    stateAbbreviation: String(place["state abbreviation"] || "").trim(),
  };
}

function ProgramApplyContent() {
  const searchParams = useSearchParams();
  const programParam = searchParams.get("program");
  const confirmationRef = useRef<HTMLDivElement | null>(null);
  const schoolSearchContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedProgramFromUrl = isProgramKey(programParam)
    ? programParam
    : "";

  const [formState, setFormState] = useState<ApplicationFormState>({
    ...initialFormState,
    program: selectedProgramFromUrl,
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [additionalDocuments, setAdditionalDocuments] = useState<File[]>([]);
  const [resumeError, setResumeError] = useState("");
  const [additionalDocumentError, setAdditionalDocumentError] = useState("");
  const [zipLookupStatus, setZipLookupStatus] =
    useState<ZipLookupStatus>("idle");
  const [zipLookupMessage, setZipLookupMessage] = useState("");
  const [schoolSearchResults, setSchoolSearchResults] = useState<
    SchoolSearchResult[]
  >([]);
  const [isSchoolSearchLoading, setIsSchoolSearchLoading] = useState(false);
  const [schoolSearchMessage, setSchoolSearchMessage] = useState("");
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const [selectedSchoolResultId, setSelectedSchoolResultId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [applicationConfirmation, setApplicationConfirmation] =
    useState<ApplicationConfirmation | null>(null);

  const selectedProgram = useMemo(() => {
    if (!formState.program) return null;
    return getProgramByKey(formState.program);
  }, [formState.program]);

  const isVeteransProgram = formState.program === "veterans-hire";
  const isStudentProgram = formState.program === "student-hire";
  const isAmbassadorProgram = formState.program === "ambassador-program";
  const isSkillBridgeProgram = formState.program === "skillbridge-interest";
  const shouldShowMilitaryBackground =
    isVeteransProgram || isSkillBridgeProgram;

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      program: selectedProgramFromUrl,
    }));
  }, [selectedProgramFromUrl]);

  useEffect(() => {
    trackEvent({
      eventName: "program_application_page_viewed",
      eventType: "traffic",
      role: "guru",
      source: "programs_apply",
      metadata: {
        selected_program: selectedProgramFromUrl || "not_selected",
        pathname: typeof window !== "undefined" ? window.location.pathname : "",
        search: typeof window !== "undefined" ? window.location.search : "",
      },
    });
  }, [selectedProgramFromUrl]);

  useEffect(() => {
    const normalizedZip = normalizeZipCode(formState.zipCode);

    if (!normalizedZip) {
      setZipLookupStatus("idle");
      setZipLookupMessage("");
      return;
    }

    if (normalizedZip.length < 5) {
      setZipLookupStatus("idle");
      setZipLookupMessage("Enter a 5-digit ZIP code to autofill city and state.");
      return;
    }

    let isMounted = true;

    async function runLookup() {
      setZipLookupStatus("loading");
      setZipLookupMessage("Looking up ZIP code...");

      try {
        const result = await lookupZipCode(normalizedZip);

        if (!isMounted) return;

        if (!result?.city || !result?.state) {
          setZipLookupStatus("not-found");
          setZipLookupMessage(
            "We could not autofill that ZIP code. You can still enter city and state manually.",
          );
          return;
        }

        setFormState((prev) => ({
          ...prev,
          zipCode: normalizedZip,
          city: result.city,
          state: result.state,
        }));

        setZipLookupStatus("found");
        setZipLookupMessage(
          `Autofilled ${result.city}, ${
            result.stateAbbreviation || result.state
          }.`,
        );

        trackEvent({
          eventName: "program_application_zip_autofilled",
          eventType: "lead",
          role: "guru",
          source: "programs_apply",
          metadata: {
            selected_program: formState.program || "not_selected",
            zip_code: normalizedZip,
            city: result.city,
            state: result.state,
          },
        });
      } catch (error) {
        if (!isMounted) return;

        console.error("Program ZIP lookup failed:", error);
        setZipLookupStatus("error");
        setZipLookupMessage(
          "ZIP autofill is unavailable right now. You can still enter city and state manually.",
        );
      }
    }

    const timeout = window.setTimeout(runLookup, 350);

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [formState.zipCode, formState.program]);

  useEffect(() => {
    if (!isStudentProgram) {
      setSchoolSearchResults([]);
      setIsSchoolSearchLoading(false);
      setSchoolSearchMessage("");
      setIsSchoolDropdownOpen(false);
      setSelectedSchoolResultId("");
      return;
    }

    const schoolQuery = formState.schoolName.trim();

    if (schoolQuery.length < 2) {
      setSchoolSearchResults([]);
      setIsSchoolSearchLoading(false);
      setSchoolSearchMessage("");
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function searchSchools() {
      setIsSchoolSearchLoading(true);
      setSchoolSearchMessage("");

      try {
        const response = await fetch(
          `/api/schools/search?q=${encodeURIComponent(schoolQuery)}`,
          {
            method: "GET",
            signal: controller.signal,
          },
        );

        const payload = await response.json().catch(() => null);

        if (!isMounted) return;

        if (!response.ok || !payload?.success) {
          setSchoolSearchResults([]);
          setSchoolSearchMessage(
            payload?.error ||
              "School search is unavailable right now. You can still type your school manually.",
          );
          setIsSchoolDropdownOpen(true);
          return;
        }

        const schools = Array.isArray(payload.schools)
          ? (payload.schools as SchoolSearchResult[])
          : [];

        setSchoolSearchResults(schools);
        setSchoolSearchMessage(
          schools.length === 0
            ? "No school matches found yet. You can keep typing or enter it manually."
            : "",
        );
        setIsSchoolDropdownOpen(true);

        trackEvent({
          eventName: "program_application_school_search_results_loaded",
          eventType: "lead",
          role: "guru",
          source: "programs_apply",
          metadata: {
            selected_program: formState.program || "not_selected",
            query_length: schoolQuery.length,
            result_count: schools.length,
            source: payload?.source || "unknown",
          },
        });
      } catch (error) {
        if (!isMounted || controller.signal.aborted) return;

        console.error("School search failed:", error);
        setSchoolSearchResults([]);
        setSchoolSearchMessage(
          "School search is unavailable right now. You can still type your school manually.",
        );
        setIsSchoolDropdownOpen(true);
      } finally {
        if (isMounted) {
          setIsSchoolSearchLoading(false);
        }
      }
    }

    const timeout = window.setTimeout(searchSchools, 350);

    return () => {
      isMounted = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [formState.schoolName, formState.program, isStudentProgram]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        schoolSearchContainerRef.current &&
        !schoolSearchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSchoolDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!applicationConfirmation) return;

    window.setTimeout(() => {
      confirmationRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }, [applicationConfirmation]);

  function updateField<K extends keyof ApplicationFormState>(
    key: K,
    value: ApplicationFormState[K],
  ) {
    setFormState((prev) => ({
      ...prev,
      [key]:
        key === "zipCode"
          ? normalizeZipCode(String(value))
          : key === "phone"
            ? formatPhoneNumber(String(value))
            : value,
    }));
  }

  function selectProgram(program: ProgramKey) {
    setFormState((prev) => ({
      ...prev,
      program,
    }));

    setApplicationConfirmation(null);
    setErrorMessage("");
    setSuccessMessage("");

    trackEvent({
      eventName: "program_application_program_selected",
      eventType: "lead",
      role: "guru",
      source: "programs_apply",
      metadata: {
        selected_program: program,
        program_title: getProgramByKey(program)?.title || program,
      },
    });
  }

  function selectSchoolResult(school: SchoolSearchResult) {
    updateField("schoolName", school.name);
    setSelectedSchoolResultId(school.id);
    setIsSchoolDropdownOpen(false);
    setSchoolSearchMessage("");

    trackEvent({
      eventName: "program_application_school_selected",
      eventType: "lead",
      role: "guru",
      source: "programs_apply",
      metadata: {
        selected_program: formState.program || "not_selected",
        school_id: school.id,
        school_name: school.name,
        school_city: school.city,
        school_state: school.state,
      },
    });
  }

  function toggleServiceInterest(service: string) {
    setFormState((prev) => {
      const alreadySelected = prev.servicesInterested.includes(service);
      const nextServices = alreadySelected
        ? prev.servicesInterested.filter((item) => item !== service)
        : [...prev.servicesInterested, service];

      return {
        ...prev,
        servicesInterested: nextServices,
      };
    });

    trackEvent({
      eventName: "program_application_service_toggled",
      eventType: "lead",
      role: "guru",
      source: "programs_apply",
      metadata: {
        selected_program: formState.program || "not_selected",
        service,
        was_selected: formState.servicesInterested.includes(service),
      },
    });
  }

  function handleResumeChange(file: File | null) {
    setResumeError("");

    if (!file) {
      setResumeFile(null);
      return;
    }

    if (!allowedResumeTypes.includes(file.type)) {
      setResumeFile(null);
      setResumeError("Please upload a PDF, DOC, or DOCX resume.");
      return;
    }

    if (file.size > MAX_RESUME_SIZE_BYTES) {
      setResumeFile(null);
      setResumeError("Resume file size must be 10MB or smaller.");
      return;
    }

    setResumeFile(file);

    trackEvent({
      eventName: "program_application_resume_selected",
      eventType: "lead",
      role: "guru",
      source: "programs_apply",
      metadata: {
        selected_program: formState.program || "not_selected",
        file_type: file.type,
        file_size_bytes: file.size,
      },
    });
  }

  function handleAdditionalDocumentsChange(files: FileList | null) {
    setAdditionalDocumentError("");

    if (!files || files.length === 0) return;

    const incomingFiles = Array.from(files);
    const nextFiles = [...additionalDocuments];

    for (const file of incomingFiles) {
      if (nextFiles.length >= MAX_ADDITIONAL_DOCUMENTS) {
        setAdditionalDocumentError(
          `You can upload up to ${MAX_ADDITIONAL_DOCUMENTS} additional documents.`,
        );
        break;
      }

      if (!allowedAdditionalDocumentTypes.includes(file.type)) {
        setAdditionalDocumentError(
          "Additional documents must be PDF, DOC, DOCX, JPG, or PNG files.",
        );
        continue;
      }

      if (file.size > MAX_ADDITIONAL_DOCUMENT_SIZE_BYTES) {
        setAdditionalDocumentError(
          "Each additional document must be 10MB or smaller.",
        );
        continue;
      }

      const duplicate = nextFiles.some(
        (existing) =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified,
      );

      if (!duplicate) {
        nextFiles.push(file);
      }
    }

    setAdditionalDocuments(nextFiles);

    trackEvent({
      eventName: "program_application_additional_documents_selected",
      eventType: "lead",
      role: "guru",
      source: "programs_apply",
      metadata: {
        selected_program: formState.program || "not_selected",
        total_documents: nextFiles.length,
      },
    });
  }

  function removeAdditionalDocument(index: number) {
    setAdditionalDocuments((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
    setAdditionalDocumentError("");
  }

  function resetForAnotherApplication() {
    setApplicationConfirmation(null);
    setSuccessMessage("");
    setErrorMessage("");
    setResumeFile(null);
    setAdditionalDocuments([]);
    setResumeError("");
    setAdditionalDocumentError("");
    setZipLookupStatus("idle");
    setZipLookupMessage("");
    setSchoolSearchResults([]);
    setIsSchoolSearchLoading(false);
    setSchoolSearchMessage("");
    setIsSchoolDropdownOpen(false);
    setSelectedSchoolResultId("");

    setFormState({
      ...initialFormState,
      program: selectedProgramFromUrl,
    });

    window.setTimeout(() => {
      document.getElementById("program-application-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");
    setApplicationConfirmation(null);

    trackEvent({
      eventName: "program_application_started",
      eventType: "lead",
      role: "guru",
      source: "programs_apply",
      metadata: {
        selected_program: formState.program || "not_selected",
        has_phone: Boolean(formState.phone.trim()),
        has_zip_code: Boolean(formState.zipCode.trim()),
        has_referral_source: Boolean(formState.referralSource.trim()),
        has_resume_file: Boolean(resumeFile),
        has_resume_link: Boolean(formState.resumeLink.trim()),
        has_school_name: Boolean(formState.schoolName.trim()),
        selected_school_result_id: selectedSchoolResultId || "",
        has_student_status: Boolean(formState.studentStatus.trim()),
        has_student_background: Boolean(formState.studentBackground.trim()),
        additional_document_count: additionalDocuments.length,
        selected_service_count: formState.servicesInterested.length,
        selected_services: formState.servicesInterested,
        trust_and_safety_acknowledged: formState.backgroundCheckConsent,
      },
    });

    try {
      if (!formState.program) {
        throw new Error("Please choose the SitGuru program you want to apply for.");
      }

      if (formState.servicesInterested.length === 0) {
        throw new Error("Please select at least one area of interest.");
      }

      if (!formState.backgroundCheckConsent) {
        throw new Error(
          isAmbassadorProgram
            ? "Please confirm that you understand SitGuru may review Ambassador applicants before approval and referral reward eligibility."
            : isSkillBridgeProgram
              ? "Please confirm that you understand future onboarding or approved opportunities may require SitGuru trust and safety review steps."
              : "Please confirm that you understand SitGuru trust and safety review steps are part of the approval process.",
        );
      }

      if (resumeError) throw new Error(resumeError);
      if (additionalDocumentError) throw new Error(additionalDocumentError);

      const applicationData = new FormData();

      Object.entries(formState).forEach(([key, value]) => {
        if (key === "servicesInterested" && Array.isArray(value)) {
          applicationData.append("servicesInterested", value.join(", "));
          applicationData.append(
            "servicesInterestedJson",
            JSON.stringify(value),
          );
          return;
        }

        applicationData.append(key, String(value));
      });

      if (selectedSchoolResultId) {
        applicationData.append("selectedSchoolResultId", selectedSchoolResultId);
      }

      if (resumeFile) {
        applicationData.append("resume", resumeFile);
      }

      additionalDocuments.forEach((file) => {
        applicationData.append("additionalDocuments", file);
      });

      const response = await fetch("/api/program-applications", {
        method: "POST",
        body: applicationData,
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            "We could not submit your application right now. Please try again.",
        );
      }

      const application = payload?.application;

      const confirmation: ApplicationConfirmation = {
        id: application?.id || "received",
        program: getProgramLabel(application?.program || formState.program),
        status: application?.status || "new",
        createdAt: application?.created_at || new Date().toISOString(),
      };

      trackEvent({
        eventName: "program_application_completed",
        eventType: "lead",
        role: "guru",
        source: "programs_apply",
        metadata: {
          application_id: confirmation.id,
          selected_program: formState.program,
          has_phone: Boolean(formState.phone.trim()),
          has_zip_code: Boolean(formState.zipCode.trim()),
          has_referral_source: Boolean(formState.referralSource.trim()),
          has_resume_file: Boolean(resumeFile),
          has_resume_link: Boolean(formState.resumeLink.trim()),
          has_school_name: Boolean(formState.schoolName.trim()),
          selected_school_result_id: selectedSchoolResultId || "",
          has_student_status: Boolean(formState.studentStatus.trim()),
          has_student_background: Boolean(formState.studentBackground.trim()),
          additional_document_count: additionalDocuments.length,
          selected_service_count: formState.servicesInterested.length,
          selected_services: formState.servicesInterested,
          trust_and_safety_acknowledged: formState.backgroundCheckConsent,
        },
      });

      setApplicationConfirmation(confirmation);
      setSuccessMessage(
        "Your SitGuru program application was submitted successfully.",
      );

      setResumeFile(null);
      setAdditionalDocuments([]);
      setResumeError("");
      setAdditionalDocumentError("");
      setZipLookupStatus("idle");
      setZipLookupMessage("");
      setSchoolSearchResults([]);
      setIsSchoolSearchLoading(false);
      setSchoolSearchMessage("");
      setIsSchoolDropdownOpen(false);
      setSelectedSchoolResultId("");

      setFormState({
        ...initialFormState,
        program: selectedProgramFromUrl,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting your application.";

      trackEvent({
        eventName: "program_application_failed",
        eventType: "lead",
        role: "guru",
        source: "programs_apply",
        metadata: {
          selected_program: formState.program || "not_selected",
          error: message,
        },
      });

      setErrorMessage(message);

      window.setTimeout(() => {
        document.getElementById("program-application-error")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className={`${openSans.className} min-h-screen bg-[#f9faf5] text-slate-950`}
      style={{ fontWeight: 300 }}
    >
      <section className="relative overflow-hidden border-b border-green-100 bg-gradient-to-br from-white via-[#f9faf5] to-emerald-50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-emerald-200/45 blur-3xl" />
          <div className="absolute right-[-80px] top-24 h-80 w-80 rounded-full bg-slate-300/35 blur-3xl" />
          <div className="absolute bottom-[-100px] left-1/3 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <Link
                href="/programs"
                className="inline-flex items-center rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
              >
                ← Back to programs
              </Link>

              <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-green-800">
                <WalletCards size={15} />
                {isStudentProgram
                  ? "Extra cash around school"
                  : isAmbassadorProgram
                    ? "Together, we grow together"
                    : isSkillBridgeProgram
                      ? "SkillBridge interest"
                      : "Flexible pet care opportunities"}
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-tight text-green-950 sm:text-5xl lg:text-6xl">
                {selectedProgram
                  ? isStudentProgram
                    ? "Broke between classes? Earn extra cash with SitGuru."
                    : isAmbassadorProgram
                      ? "Help SitGuru grow in the pet community."
                      : isSkillBridgeProgram
                        ? "Join the SkillBridge Interest / Veterans Pathway."
                        : `Apply for the ${selectedProgram.title}.`
                  : "Choose your SitGuru program."}
              </h1>

              <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-slate-600 sm:text-lg">
                {selectedProgram
                  ? isStudentProgram
                    ? "Walk dogs, do drop-ins, pet sit, or help local pet parents when your schedule allows. Great for after class, between classes, weekends, school breaks, and summer money."
                    : isAmbassadorProgram
                      ? "Ambassadors help refer Gurus and Pet Parents, support local pet-care awareness, and grow with SitGuru through community trust, referral rewards, and recognition opportunities."
                      : isSkillBridgeProgram
                        ? "SitGuru is exploring a future SkillBridge-style training pathway. Join the interest list to share your background, transition goals, and areas of interest."
                        : `You are applying for the ${selectedProgram.title}. Qualified applicants complete onboarding, SitGuru trust and safety review steps when required, and may grow into full Guru status with greater commissions and future benefits over time.`
                  : "Select Student Hire, Veterans Hire, Ambassador Program, or SkillBridge Interest / Veterans Pathway before submitting. This keeps your application routed correctly."}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  isStudentProgram
                    ? "Easy extra cash"
                    : isAmbassadorProgram
                      ? "Refer Gurus"
                      : "Resume upload",
                  isStudentProgram
                    ? "Summer + breaks"
                    : isAmbassadorProgram
                      ? "Refer Pet Parents"
                      : "Additional documents",
                  isStudentProgram
                    ? "Tell your friends"
                    : isAmbassadorProgram
                      ? "Community growth"
                      : "Exact program routing",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-green-100 bg-white/90 px-4 py-3 text-sm font-black text-green-950 shadow-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>

              {isStudentProgram ? (
                <div className="mt-7 rounded-[30px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-green-50 p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-amber-400 text-amber-950 shadow-lg shadow-amber-900/10">
                      <Sparkles size={30} />
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                        Student-friendly earning
                      </p>

                      <h2 className="mt-2 text-2xl font-black text-green-950">
                        Extra cash. Pets. Flexible schedule. Summer-ready.
                      </h2>

                      <p className="mt-3 text-sm font-bold leading-7 text-slate-700 sm:text-base">
                        No boring shift vibes. Tell us when you’re free, pick
                        what you’re interested in, and start your pathway toward
                        earning with SitGuru after approval, onboarding, and
                        eligible bookings.
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {[
                          "Earn after class",
                          "Make money between classes",
                          "Great summer side hustle",
                          "Perfect for school breaks",
                          "Work with pets",
                          "Build your resume",
                        ].map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-2 rounded-2xl border border-green-100 bg-white px-4 py-3 text-sm font-black text-green-950"
                          >
                            <CheckCircle2 size={16} className="text-green-700" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {isAmbassadorProgram ? (
                <div className="mt-7 rounded-[30px] border border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-green-800 text-white shadow-lg shadow-emerald-900/15">
                      <Handshake size={30} />
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                        Ambassador Program
                      </p>

                      <h2 className="mt-2 text-2xl font-black text-green-950">
                        Refer. Support. Grow with SitGuru.
                      </h2>

                      <p className="mt-3 text-sm font-bold leading-7 text-slate-700 sm:text-base">
                        SitGuru Ambassadors help connect trusted Gurus and Pet
                        Parents to the platform. This is a community growth
                        pathway for pet-care professionals and trusted local
                        supporters who want to help SitGuru grow.
                      </p>

                      <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-6 text-amber-900">
                        Ambassador approval, referral rewards, public
                        recognition, and performance highlights depend on
                        SitGuru program terms, eligible referrals, consent, and
                        platform needs.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-7 rounded-[30px] border border-[#e3ece5] bg-white/95 p-5 shadow-sm sm:p-6">
                {selectedProgram ? (
                  <>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-green-800 text-white shadow-lg shadow-emerald-900/15">
                        {selectedProgram.icon}
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                          {selectedProgram.eyebrow}
                        </p>

                        <h2 className="mt-2 text-2xl font-black text-green-950">
                          {selectedProgram.shortTitle}
                        </h2>

                        <p className="mt-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-black leading-6 text-green-950">
                          {selectedProgram.earningMessage}
                        </p>

                        <p className="mt-3 text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                          {selectedProgram.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.14em] text-green-800">
                          This program may be for
                        </h3>

                        <div className="mt-4 space-y-2">
                          {selectedProgram.idealFor.map((item) => (
                            <div
                              key={item}
                              className="flex items-start gap-2 text-sm font-bold leading-6 text-slate-600"
                            >
                              <CheckCircle2
                                className="mt-1 shrink-0 text-green-700"
                                size={15}
                              />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.14em] text-green-800">
                          How this can grow
                        </h3>

                        <div className="mt-4 space-y-2">
                          {selectedProgram.growthPath.map((item) => (
                            <div
                              key={item}
                              className="flex items-start gap-2 text-sm font-bold leading-6 text-slate-600"
                            >
                              <BadgeCheck
                                className="mt-1 shrink-0 text-green-700"
                                size={15}
                              />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                      Program required
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-green-950">
                      Select the program that matches your path.
                    </h2>

                    <p className="mt-3 text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                      Program-specific buttons route to their matching
                      application. Generic buttons bring applicants here to
                      choose first.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {programOptions.map((program) => (
                        <button
                          key={program.key}
                          type="button"
                          onClick={() => selectProgram(program.key)}
                          className="rounded-2xl border border-green-100 bg-green-50 p-4 text-left transition hover:border-green-300 hover:bg-green-100"
                        >
                          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-800 text-white">
                            {program.icon}
                          </div>
                          <p className="text-sm font-black text-green-950">
                            {program.title}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-600">
                            Choose this program →
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-6 text-amber-900">
                  Approved Gurus provide services as independent contractors.
                  Applying or joining an interest list does not guarantee
                  approval, bookings, earnings, commissions, benefits, placement,
                  employment, referral rewards, SkillBridge participation, or
                  full Guru status.
                </p>
              </div>

              {isStudentProgram ? (
                <div className="mt-7 rounded-[30px] border border-green-100 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-green-50 text-green-800">
                      <Users size={26} />
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                        Spread the word
                      </p>

                      <h2 className="mt-2 text-2xl font-black text-green-950">
                        Tell your friends. Earn together.
                      </h2>

                      <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                        Know someone who loves pets and wants extra cash? Share
                        Student Hire with classmates, teammates, roommates,
                        friends, clubs, and campus groups. SitGuru is building a
                        student-friendly pet care community where reliable
                        students can earn, learn, and grow.
                      </p>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <a
                          href="sms:?&body=Check out SitGuru Student Hire — earn extra cash walking dogs, doing drop-ins, pet sitting, or helping local pet parents after class, on breaks, weekends, or over summer: https://sitguru.com/programs/apply?program=student-hire"
                          className="inline-flex items-center justify-center rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
                        >
                          Text a Friend
                        </a>

                        <a
                          href="mailto:?subject=SitGuru Student Hire&body=Check out SitGuru Student Hire — earn extra cash walking dogs, doing drop-ins, pet sitting, or helping local pet parents after class, on breaks, weekends, or over summer: https://sitguru.com/programs/apply?program=student-hire"
                          className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
                        >
                          Email a Friend
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-[34px] border border-[#e3ece5] bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-6 lg:p-8">
              <div
                ref={confirmationRef}
                className="scroll-mt-28"
                aria-live="polite"
              >
                {applicationConfirmation ? (
                  <div className="mb-6 rounded-[30px] border border-green-300 bg-green-50 p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-green-800 text-white shadow-lg shadow-emerald-900/15">
                        <CheckCircle2 size={28} />
                      </div>

                      <div className="flex-1">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-green-800">
                          Application submitted
                        </p>

                        <h2 className="mt-2 text-2xl font-black text-green-950 sm:text-3xl">
                          We received your SitGuru submission.
                        </h2>

                        <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
                          Your submission is now saved in SitGuru’s admin system
                          for review. We’ll use your details to review program
                          fit, onboarding, documents, and next steps.
                        </p>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-green-200 bg-white px-4 py-3">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                              Status
                            </p>
                            <p className="mt-1 text-sm font-black capitalize text-green-900">
                              {applicationConfirmation.status}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-green-200 bg-white px-4 py-3">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                              Program
                            </p>
                            <p className="mt-1 text-sm font-black text-green-900">
                              {applicationConfirmation.program}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-green-200 bg-white px-4 py-3">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                              Application ID
                            </p>
                            <p className="mt-1 break-all text-xs font-black text-green-900">
                              {applicationConfirmation.id}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-green-200 bg-white p-4">
                          <p className="text-sm font-black text-green-950">
                            What happens next?
                          </p>
                          <div className="mt-3 space-y-2 text-sm font-bold leading-6 text-slate-600">
                            <p>1. SitGuru reviews your submission.</p>
                            <p>
                              2. Qualified applicants may receive onboarding or
                              next-step instructions.
                            </p>
                            <p>
                              3. Approved opportunities may require SitGuru trust
                              and safety review steps before eligible services.
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                          <Link
                            href="/programs"
                            className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
                          >
                            Back to Programs
                          </Link>

                          <button
                            type="button"
                            onClick={resetForAnotherApplication}
                            className="inline-flex items-center justify-center rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
                          >
                            Submit Another
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {errorMessage ? (
                <div
                  id="program-application-error"
                  className="mb-6 rounded-[28px] border border-rose-300 bg-rose-50 p-5 shadow-sm"
                  aria-live="assertive"
                >
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-rose-700 shadow-sm">
                      !
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">
                        Submission not sent
                      </p>
                      <h2 className="mt-1 text-xl font-black text-rose-950">
                        Please fix this before submitting.
                      </h2>
                      <p className="mt-2 text-sm font-bold leading-6 text-rose-700">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {!applicationConfirmation ? (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-amber-800">
                        <Sparkles size={14} />
                        {isSkillBridgeProgram
                          ? "Interest list"
                          : isStudentProgram
                            ? "Start earning"
                            : isAmbassadorProgram
                              ? "Ambassador application"
                              : "Apply today"}
                      </div>

                      <h2 className="mt-4 text-2xl font-black text-green-950 sm:text-3xl">
                        {selectedProgram
                          ? isStudentProgram
                            ? "Apply to start earning extra cash"
                            : isAmbassadorProgram
                              ? "Apply to become a SitGuru Ambassador"
                              : isSkillBridgeProgram
                                ? "Join the SkillBridge Interest / Veterans Pathway"
                                : `Apply for ${selectedProgram.title}`
                          : "Choose a program to start"}
                      </h2>

                      <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                        {selectedProgram
                          ? isStudentProgram
                            ? "This application will be submitted as Student Hire. Pick your services, schedule, and school details so SitGuru can review your fit."
                            : isAmbassadorProgram
                              ? "This application will be submitted as Ambassador Program. Tell us your pet-care background, referral network, and how you want to help SitGuru grow."
                              : isSkillBridgeProgram
                                ? "This will be submitted as SkillBridge Interest / Veterans Pathway."
                                : `This application will be submitted as ${selectedProgram.title}.`
                          : "Pick Student Hire, Veterans Hire, Ambassador Program, or SkillBridge Interest / Veterans Pathway before submitting."}
                      </p>
                    </div>

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-green-50 text-green-800">
                      <ShieldCheck size={26} />
                    </div>
                  </div>

                  <form
                    id="program-application-form"
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-5"
                  >
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-800">
                        Program
                      </label>
                      <select
                        value={formState.program}
                        onChange={(event) =>
                          updateField(
                            "program",
                            event.target.value as ProgramSelection,
                          )
                        }
                        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 ${
                          formState.program
                            ? "border-slate-200"
                            : "border-amber-300 ring-4 ring-amber-100"
                        }`}
                        required
                      >
                        <option value="">Choose your SitGuru program</option>
                        {programOptions.map((program) => (
                          <option key={program.key} value={program.key}>
                            {program.title}
                          </option>
                        ))}
                      </select>

                      {!formState.program ? (
                        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                          Select the exact program before submitting so your
                          application is routed correctly.
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-800">
                          Full name
                        </label>
                        <input
                          type="text"
                          value={formState.fullName}
                          onChange={(event) =>
                            updateField("fullName", event.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                          placeholder="Your full name"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-800">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formState.email}
                          onChange={(event) =>
                            updateField("email", event.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-800">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formState.phone}
                          onChange={(event) =>
                            updateField("phone", event.target.value)
                          }
                          inputMode="tel"
                          maxLength={12}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                          placeholder="555-123-4567"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-800">
                          ZIP code
                        </label>
                        <input
                          type="text"
                          value={formState.zipCode}
                          onChange={(event) =>
                            updateField("zipCode", event.target.value)
                          }
                          inputMode="numeric"
                          maxLength={5}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                          placeholder="18951"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-800">
                          State
                        </label>
                        <input
                          type="text"
                          value={formState.state}
                          onChange={(event) =>
                            updateField("state", event.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                          placeholder="Pennsylvania"
                        />
                      </div>
                    </div>

                    {zipLookupMessage ? (
                      <p
                        className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                          zipLookupStatus === "found"
                            ? "border border-green-200 bg-green-50 text-green-800"
                            : zipLookupStatus === "loading"
                              ? "border border-slate-200 bg-slate-50 text-slate-600"
                              : "border border-amber-200 bg-amber-50 text-amber-800"
                        }`}
                      >
                        {zipLookupMessage}
                      </p>
                    ) : null}

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-800">
                        City
                      </label>
                      <input
                        type="text"
                        value={formState.city}
                        onChange={(event) =>
                          updateField("city", event.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                        placeholder="Your city"
                      />
                    </div>

                    {isStudentProgram ? (
                      <div className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-green-50 p-4">
                        <div className="mb-4">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                            Student details
                          </p>
                          <h3 className="mt-1 text-lg font-black text-green-950">
                            Make money around school, breaks, and summer.
                          </h3>
                          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                            Optional, but helpful. Tell us where you go, when
                            you’re free, and what kind of extra-cash schedule
                            works for you.
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div
                            className="relative"
                            ref={schoolSearchContainerRef}
                          >
                            <label className="mb-2 block text-sm font-black text-green-950">
                              School, college, or program
                            </label>
                            <input
                              type="text"
                              value={formState.schoolName}
                              onChange={(event) => {
                                setSelectedSchoolResultId("");
                                updateField("schoolName", event.target.value);
                                setIsSchoolDropdownOpen(true);
                              }}
                              onFocus={() => {
                                if (
                                  formState.schoolName.trim().length >= 2 ||
                                  schoolSearchResults.length > 0
                                ) {
                                  setIsSchoolDropdownOpen(true);
                                }
                              }}
                              autoComplete="organization"
                              className="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 pr-12 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                              placeholder="Start typing: Penn, Temple, Rutgers..."
                            />

                            {isSchoolSearchLoading ? (
                              <div className="pointer-events-none absolute right-4 top-[43px] h-5 w-5 animate-spin rounded-full border-2 border-green-200 border-t-green-700" />
                            ) : selectedSchoolResultId ? (
                              <CheckCircle2
                                size={20}
                                className="pointer-events-none absolute right-4 top-[43px] text-green-700"
                              />
                            ) : null}

                            {isSchoolDropdownOpen &&
                            (schoolSearchResults.length > 0 ||
                              isSchoolSearchLoading ||
                              schoolSearchMessage) ? (
                              <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-3xl border border-green-200 bg-white p-2 shadow-2xl shadow-slate-900/15">
                                {schoolSearchResults.length > 0 ? (
                                  <div className="space-y-1">
                                    {schoolSearchResults.map((school) => (
                                      <button
                                        key={school.id}
                                        type="button"
                                        onClick={() =>
                                          selectSchoolResult(school)
                                        }
                                        className="w-full rounded-2xl px-4 py-3 text-left transition hover:bg-green-50 focus:bg-green-50 focus:outline-none"
                                      >
                                        <span className="block text-sm font-black text-green-950">
                                          {school.name}
                                        </span>
                                        <span className="mt-1 block text-xs font-bold text-slate-500">
                                          {[school.city, school.state]
                                            .filter(Boolean)
                                            .join(", ")}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                ) : null}

                                {isSchoolSearchLoading ? (
                                  <p className="px-4 py-3 text-xs font-bold text-slate-500">
                                    Searching schools...
                                  </p>
                                ) : null}

                                {schoolSearchMessage &&
                                !isSchoolSearchLoading ? (
                                  <p className="px-4 py-3 text-xs font-bold leading-5 text-amber-800">
                                    {schoolSearchMessage}
                                  </p>
                                ) : null}

                                <div className="mt-2 border-t border-slate-100 px-4 py-3">
                                  <p className="text-xs font-semibold leading-5 text-slate-500">
                                    Can’t find your school? Keep your typed entry
                                    and submit it manually.
                                  </p>
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-black text-green-950">
                              Student status
                            </label>
                            <select
                              value={formState.studentStatus}
                              onChange={(event) =>
                                updateField("studentStatus", event.target.value)
                              }
                              className="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                            >
                              <option value="">Choose status</option>
                              {studentStatusOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="mb-2 block text-sm font-black text-green-950">
                            Graduation year, summer dates, or availability window
                          </label>
                          <input
                            type="text"
                            value={formState.graduationYearOrAvailability}
                            onChange={(event) =>
                              updateField(
                                "graduationYearOrAvailability",
                                event.target.value,
                              )
                            }
                            className="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                            placeholder="Example: Summer 2026, after 3pm, weekends, school breaks, between classes"
                          />
                        </div>

                        <div className="mt-4">
                          <label className="mb-2 block text-sm font-black text-green-950">
                            Student background or transferable experience
                          </label>
                          <textarea
                            value={formState.studentBackground}
                            onChange={(event) =>
                              updateField(
                                "studentBackground",
                                event.target.value,
                              )
                            }
                            rows={4}
                            className="min-h-[110px] w-full resize-y rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                            placeholder="Optional: Share pet care, babysitting, sports, clubs, part-time jobs, volunteering, customer service, leadership, or why your friends should join too."
                          />
                        </div>
                      </div>
                    ) : null}

                    {isAmbassadorProgram ? (
                      <div className="rounded-[28px] border border-green-100 bg-green-50 p-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                            Ambassador details
                          </p>
                          <h3 className="mt-1 text-lg font-black text-green-950">
                            Tell us how you can help SitGuru grow.
                          </h3>
                          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                            This may include Vet Tech, Veterinarian, Trainer,
                            grooming, rescue, shelter, pet-care, social media,
                            community, or referral experience.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-800">
                        {isSkillBridgeProgram
                          ? "Availability or transition timing"
                          : isStudentProgram
                            ? "When can you earn?"
                            : isAmbassadorProgram
                              ? "When can you help refer and support SitGuru?"
                              : "When can you earn?"}
                      </label>
                      <select
                        value={formState.availability}
                        onChange={(event) =>
                          updateField("availability", event.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                        required
                      >
                        <option value="">
                          {isSkillBridgeProgram
                            ? "Choose availability or transition timing"
                            : isStudentProgram
                              ? "Choose when you want extra cash"
                              : isAmbassadorProgram
                                ? "Choose when you can help"
                                : "Choose availability"}
                        </option>
                        {availabilityOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <label className="block text-sm font-black text-slate-800">
                            {isSkillBridgeProgram
                              ? "What areas interest you?"
                              : isStudentProgram
                                ? "How do you want to make money?"
                                : isAmbassadorProgram
                                  ? "How would you like to support SitGuru?"
                                  : "How would you like to earn?"}
                          </label>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Select one or more areas you may be interested in.
                          </p>
                        </div>

                        {formState.servicesInterested.length > 0 ? (
                          <p className="text-xs font-black text-green-800">
                            {formState.servicesInterested.length} selected
                          </p>
                        ) : null}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {serviceOptions.map((service) => {
                          const selected =
                            formState.servicesInterested.includes(service);

                          return (
                            <button
                              key={service}
                              type="button"
                              onClick={() => toggleServiceInterest(service)}
                              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                                selected
                                  ? "border-green-500 bg-green-50 shadow-sm ring-4 ring-green-100"
                                  : "border-slate-200 bg-white hover:border-green-200 hover:bg-green-50/50"
                              }`}
                            >
                              <span
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                  selected
                                    ? "border-green-700 bg-green-700 text-white"
                                    : "border-slate-300 bg-white text-transparent"
                                }`}
                              >
                                <CheckCircle2 size={14} />
                              </span>

                              <span className="text-sm font-black text-slate-800">
                                {service}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {formState.servicesInterested.length === 0 ? (
                        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                          Please select at least one area before submitting.
                        </p>
                      ) : null}
                    </div>

                    {shouldShowMilitaryBackground ? (
                      <div className="rounded-[28px] border border-green-100 bg-green-50 p-4">
                        <label className="mb-2 block text-sm font-black text-green-950">
                          Military-connected background or transferable
                          experience
                        </label>
                        <textarea
                          value={formState.militaryConnectedBackground}
                          onChange={(event) =>
                            updateField(
                              "militaryConnectedBackground",
                              event.target.value,
                            )
                          }
                          rows={4}
                          className="min-h-[110px] w-full resize-y rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                          placeholder="Optional: Share military, spouse, veteran, Guard, reserve, leadership, customer service, pet care, operations, transition timeline, or community experience you’d like us to know about."
                        />
                      </div>
                    ) : null}

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-800">
                        Referral source or partner organization
                      </label>
                      <input
                        type="text"
                        value={formState.referralSource}
                        onChange={(event) =>
                          updateField("referralSource", event.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                        placeholder={
                          isStudentProgram
                            ? "School, friend, teammate, roommate, club, campus group, social media, etc."
                            : isAmbassadorProgram
                              ? "Vet clinic, trainer network, rescue, shelter, grooming shop, social media, community group, etc."
                              : "School, military org, workforce partner, nonprofit, social media, etc."
                        }
                      />
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-green-800 shadow-sm">
                          <FileText size={22} />
                        </div>

                        <div>
                          <label className="block text-sm font-black text-slate-800">
                            Resume
                          </label>
                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                            Upload a resume or share a resume/profile link. PDF,
                            DOC, or DOCX accepted. Max 10MB.
                          </p>
                        </div>
                      </div>

                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-green-200 bg-white px-4 py-5 text-center transition hover:bg-green-50">
                        <Paperclip className="mb-2 text-green-800" size={24} />
                        <span className="text-sm font-black text-green-950">
                          {resumeFile ? resumeFile.name : "Upload resume file"}
                        </span>
                        <span className="mt-1 text-xs font-semibold text-slate-500">
                          Click to choose a PDF, DOC, or DOCX
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="sr-only"
                          onChange={(event) =>
                            handleResumeChange(event.target.files?.[0] || null)
                          }
                        />
                      </label>

                      {resumeFile ? (
                        <button
                          type="button"
                          onClick={() => handleResumeChange(null)}
                          className="mt-3 text-xs font-black text-slate-500 underline transition hover:text-slate-800"
                        >
                          Remove selected resume
                        </button>
                      ) : null}

                      {resumeError ? (
                        <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                          {resumeError}
                        </p>
                      ) : null}

                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-black text-slate-800">
                          Resume or profile link
                        </label>
                        <input
                          type="url"
                          value={formState.resumeLink}
                          onChange={(event) =>
                            updateField("resumeLink", event.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                          placeholder="LinkedIn, portfolio, Google Drive resume link, etc."
                        />
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-green-800 shadow-sm">
                          <UploadCloud size={22} />
                        </div>

                        <div>
                          <label className="block text-sm font-black text-slate-800">
                            Additional documents
                          </label>
                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                            Optional: upload supporting documents such as
                            certifications, training documents, references,
                            student paperwork, military-connected paperwork,
                            pet-care credentials, or program paperwork. PDF,
                            DOC, DOCX, JPG, or PNG accepted. Max 10MB each.
                          </p>
                          <p className="mt-2 text-xs font-bold leading-5 text-amber-800">
                            Please do not upload documents with sensitive
                            information you do not want reviewed. Redact Social
                            Security numbers or unnecessary personal details when
                            possible.
                          </p>
                        </div>
                      </div>

                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-green-200 bg-white px-4 py-5 text-center transition hover:bg-green-50">
                        <UploadCloud className="mb-2 text-green-800" size={24} />
                        <span className="text-sm font-black text-green-950">
                          Upload additional documents
                        </span>
                        <span className="mt-1 text-xs font-semibold text-slate-500">
                          Up to {MAX_ADDITIONAL_DOCUMENTS} files
                        </span>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                          className="sr-only"
                          onChange={(event) =>
                            handleAdditionalDocumentsChange(event.target.files)
                          }
                        />
                      </label>

                      {additionalDocuments.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          {additionalDocuments.map((file, index) => (
                            <div
                              key={`${file.name}-${file.lastModified}-${index}`}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-slate-800">
                                  {file.name}
                                </p>
                                <p className="text-xs font-semibold text-slate-500">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeAdditionalDocument(index)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                                aria-label={`Remove ${file.name}`}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {additionalDocumentError ? (
                        <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                          {additionalDocumentError}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-800">
                        {isSkillBridgeProgram
                          ? "Why are you interested in a future SitGuru SkillBridge pathway?"
                          : isStudentProgram
                            ? "Why is SitGuru a good way for you to make extra cash?"
                            : isAmbassadorProgram
                              ? "Why would you be a strong SitGuru Ambassador?"
                              : "Why would SitGuru be a good way for you to earn extra money?"}
                      </label>
                      <textarea
                        value={formState.experience}
                        onChange={(event) =>
                          updateField("experience", event.target.value)
                        }
                        rows={4}
                        className="min-h-[120px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                        placeholder={
                          isSkillBridgeProgram
                            ? "Tell us about your transition goals, pet care interest, customer service, operations, leadership, or local service experience."
                            : isStudentProgram
                              ? "Tell us why this fits your schedule — after class, between classes, weekends, breaks, summer, pets, extra cash, friends, goals, whatever makes sense."
                              : isAmbassadorProgram
                                ? "Tell us about your pet-care background, local network, referral reach, community involvement, or why Pet Parents and Gurus would trust your recommendation."
                                : "Tell us about your pet care, work, school, military, or community experience."
                        }
                        required
                      />
                    </div>

                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">
                        Independent Contractor & Tax Information
                      </p>

                      <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
                        Gurus provide services as independent contractors. Gurus
                        are responsible for reporting and paying their own
                        federal, state, local, and self-employment taxes.
                        SitGuru or its payment processor may request tax
                        information and may issue applicable tax forms when
                        required by law.
                      </p>
                    </div>

                    <div className="rounded-3xl border border-green-100 bg-green-50 p-4">
                      <label className="flex gap-3">
                        <input
                          type="checkbox"
                          checked={formState.backgroundCheckConsent}
                          onChange={(event) =>
                            updateField(
                              "backgroundCheckConsent",
                              event.target.checked,
                            )
                          }
                          className="mt-1 h-5 w-5 rounded border-slate-300 text-green-700 focus:ring-green-500"
                        />
                        <span>
                          <span className="block text-sm font-black text-green-950">
                            {isAmbassadorProgram
                              ? "I understand SitGuru may review Ambassador applicants before approval, referral reward eligibility, or public recognition."
                              : isSkillBridgeProgram
                                ? "I understand future onboarding or approved opportunities may require SitGuru trust and safety review steps."
                                : "I understand SitGuru trust and safety review steps are part of the approval process."}
                          </span>
                          <span className="mt-1 block text-sm font-semibold leading-6 text-slate-600">
                            SitGuru uses trust and safety review steps to help
                            protect pets, Pet Parents, Gurus, Ambassadors, and
                            the broader SitGuru community.
                          </span>
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-800">
                        Anything else we should know?
                      </label>
                      <textarea
                        value={formState.notes}
                        onChange={(event) =>
                          updateField("notes", event.target.value)
                        }
                        rows={3}
                        className="min-h-[100px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                        placeholder={
                          isStudentProgram
                            ? "Optional: Drop your goals, questions, friend referrals, campus groups, clubs, or anything else."
                            : isAmbassadorProgram
                              ? "Optional: Share goals, referral ideas, pet community connections, social media reach, or questions."
                              : "Optional notes, goals, questions, or details."
                        }
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-800 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting
                        ? "Submitting..."
                        : formState.program
                          ? isStudentProgram
                            ? "Apply to Start Earning"
                            : isAmbassadorProgram
                              ? "Apply to Become an Ambassador"
                              : isSkillBridgeProgram
                                ? "Join SkillBridge Interest / Veterans Pathway"
                                : `Apply to ${getProgramLabel(formState.program)}`
                          : "Choose Program to Apply"}
                      {!isSubmitting ? <ArrowRight size={18} /> : null}
                    </button>

                    <p className="text-center text-xs font-semibold leading-6 text-slate-500">
                      Approved Gurus provide services as independent
                      contractors. Applying or joining an interest list does not
                      guarantee approval, bookings, earnings, commissions,
                      benefits, employment, job placement, referral rewards,
                      SkillBridge participation, or full Guru status. Program
                      participation and future opportunities may depend on
                      eligibility, onboarding, SitGuru trust and safety review
                      steps, availability, performance, trust, customer demand,
                      and SitGuru program needs.
                    </p>
                  </form>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-[28px] border border-[#e3ece5] bg-[#fbfcf9] p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800">
                <WalletCards size={23} />
              </div>
              <h3 className="text-xl font-black text-green-950">
                {isStudentProgram
                  ? "1. Pick your money window"
                  : isAmbassadorProgram
                    ? "1. Tell us your network"
                    : "1. Choose and submit"}
              </h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                {isStudentProgram
                  ? "Tell us when you want to earn: after class, between classes, weekends, breaks, or summer."
                  : isAmbassadorProgram
                    ? "Share your pet-care background, community reach, referral ideas, and how you can help connect trusted Gurus and Pet Parents."
                    : "Choose the exact SitGuru program, then submit your location, availability, experience, resume, optional documents, and areas of interest."}
              </p>
            </div>

            <div className="rounded-[28px] border border-[#e3ece5] bg-[#fbfcf9] p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800">
                <ShieldCheck size={23} />
              </div>
              <h3 className="text-xl font-black text-green-950">
                {isStudentProgram
                  ? "2. Get reviewed and onboarded"
                  : isAmbassadorProgram
                    ? "2. Build trust and awareness"
                    : "2. Review and next steps"}
              </h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                {isStudentProgram
                  ? "SitGuru reviews your application and may share onboarding, profile, and trust and safety next steps before eligible bookings."
                  : isAmbassadorProgram
                    ? "SitGuru reviews Ambassador applicants for community fit, trust, referral alignment, and growth potential."
                    : "SitGuru reviews your submission and may share onboarding, training, SkillBridge-interest updates, or trust and safety next steps."}
              </p>
            </div>

            <div className="rounded-[28px] border border-[#e3ece5] bg-[#fbfcf9] p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800">
                <Trophy size={23} />
              </div>
              <h3 className="text-xl font-black text-green-950">
                {isStudentProgram
                  ? "3. Earn, learn, and tell friends"
                  : isAmbassadorProgram
                    ? "3. Refer, support, and grow"
                    : "3. Grow into more"}
              </h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                {isStudentProgram
                  ? "Build pet care and customer service experience, earn extra cash when booked, and spread Student Hire around campus."
                  : isAmbassadorProgram
                    ? "Approved Ambassadors may refer Gurus and Pet Parents, support local awareness, earn eligible rewards, and be recognized as SitGuru grows."
                    : "Reliable participants may build toward full Guru status, greater commissions, future benefits, or future training pathways as SitGuru grows."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ProgramApplyPage() {
  return (
    <Suspense
      fallback={
        <main
          className={`${openSans.className} min-h-screen bg-[#f9faf5] text-slate-950`}
          style={{ fontWeight: 300 }}
        >
          <div className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center justify-center px-4">
            <div className="rounded-[28px] border border-green-100 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800">
                <Sparkles size={24} />
              </div>
              <p className="text-sm font-black text-green-950">
                Loading SitGuru application...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <ProgramApplyContent />
    </Suspense>
  );
}