"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarHeart,
  ClipboardCheck,
  Handshake,
  HeartHandshake,
  Mail,
  MapPin,
  Megaphone,
  PawPrint,
  Phone,
  PlusCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { createLeadEntry } from "./actions";

const relationshipCategories = [
  "Ambassador Lead",
  "Partner Lead",
  "Program Lead",
  "Referral Source",
  "Pet Parent Lead",
  "Guru Lead",
  "General Contact",
];

const leadTypes = [
  "Pet Parent Lead",
  "Guru Lead",
  "Ambassador Lead",
  "Partner Lead",
  "Program Applicant",
  "Referral Source",
  "General Contact",
];

const ambassadorTypes = [
  "Guru Ambassadors",
  "Student Ambassadors",
  "Vet Tech Ambassadors",
  "Veterinarian Ambassadors",
  "Trainer Ambassadors",
  "Groomer Ambassadors",
  "Veteran Ambassadors",
  "Rescue & Shelter Ambassadors",
  "Friends & Family Ambassador",
  "Other",
];

const partnerCategories = [
  "Local Partners",
  "National Partners",
  "Veterinary & Pet Care Partners",
  "Pet Stores & Pet Retail",
  "School & Campus Partners",
  "Community & Nonprofit Partners",
  "Military & Veteran Partners",
  "Business & Brand Partners",
  "Other",
];

const growthChannels = [
  "Ambassador Program",
  "Partner Network",
  "Affiliate Program",
  "PawPerks / Local Awareness",
  "Student Hire Program",
  "Veterans Hire Program",
  "Community Hire Program",
  "Direct Outreach",
  "Friends & Family",
];

const programInterests = [
  "Ambassador Program",
  "Student Hire Program",
  "Veterans Hire Program",
  "Community Hire Program",
  "Programs to Guru Status",
  "Partner Network",
  "Affiliate Program",
  "PawPerks / Local Awareness",
  "Local Awareness",
];

const referralFocuses = [
  "Pet Parents",
  "Gurus",
  "Ambassadors",
  "Partners",
  "Pet Parents, Gurus",
  "Pet Parents, Gurus, Ambassadors",
  "Future Gurus, Ambassadors, Pet Parents",
  "Pet Parents, Local Reach, Brand Visibility",
  "Trust-Building",
];

const campaignSources = [
  "Launch Campaign",
  "Pet Parent Signup Campaign",
  "Guru Signup Campaign",
  "Groomer Ambassador Campaign",
  "Trainer Ambassador Campaign",
  "Vet Tech Ambassador Campaign",
  "Veterinarian Ambassador Campaign",
  "Student Ambassador Campaign",
  "Veteran Ambassador Campaign",
  "Rescue & Shelter Ambassador Campaign",
  "Local Awareness Campaign",
  "Friends & Family Share Campaign",
  "Business & Brand Partner Campaign",
  "PawPerks Referral Campaign",
];

const statuses = [
  "New",
  "Contacted",
  "Warm",
  "Follow-Up",
  "Waiting",
  "Partnered",
  "Needs CEO Review",
  "Needs Follow-Up",
];

const priorityLevels = ["Low", "Medium", "High"];

const petTypes = [
  "Dog",
  "Cat",
  "Bird",
  "Rabbit",
  "Reptile",
  "Fish",
  "Horse",
  "Small Animal",
  "Other",
];

const months = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentYear = new Date().getFullYear();

const petBirthdayYears = [
  "",
  ...Array.from({ length: 31 }, (_, index) => String(currentYear - index)),
];

const dogBreeds = [
  "Affenpinscher",
  "Afghan Hound",
  "Airedale Terrier",
  "Akita",
  "Alaskan Malamute",
  "American Bulldog",
  "American Eskimo Dog",
  "American Foxhound",
  "American Pit Bull Terrier",
  "American Staffordshire Terrier",
  "Australian Cattle Dog",
  "Australian Shepherd",
  "Basenji",
  "Basset Hound",
  "Beagle",
  "Belgian Malinois",
  "Bernese Mountain Dog",
  "Bichon Frise",
  "Bloodhound",
  "Border Collie",
  "Boston Terrier",
  "Boxer",
  "Boykin Spaniel",
  "Brittany",
  "Bulldog",
  "Bull Terrier",
  "Cane Corso",
  "Catahoula Leopard Dog",
  "Cavalier King Charles Spaniel",
  "Chihuahua",
  "Chinese Crested",
  "Chow Chow",
  "Cockapoo",
  "Cocker Spaniel",
  "Collie",
  "Coonhound",
  "Corgi",
  "Dachshund",
  "Dalmatian",
  "Doberman Pinscher",
  "Dogo Argentino",
  "English Springer Spaniel",
  "French Bulldog",
  "German Shepherd",
  "German Shorthaired Pointer",
  "Giant Schnauzer",
  "Golden Retriever",
  "Goldendoodle",
  "Great Dane",
  "Great Pyrenees",
  "Havanese",
  "Irish Setter",
  "Jack Russell Terrier",
  "Labradoodle",
  "Labrador Retriever",
  "Maltese",
  "Mastiff",
  "Miniature Pinscher",
  "Miniature Schnauzer",
  "Mixed Breed",
  "Newfoundland",
  "Old English Sheepdog",
  "Papillon",
  "Pekingese",
  "Pembroke Welsh Corgi",
  "Pit Bull Mix",
  "Pointer",
  "Pomeranian",
  "Poodle",
  "Portuguese Water Dog",
  "Pug",
  "Rhodesian Ridgeback",
  "Rottweiler",
  "Saint Bernard",
  "Samoyed",
  "Schnauzer",
  "Scottish Terrier",
  "Shar Pei",
  "Shetland Sheepdog",
  "Shiba Inu",
  "Shih Tzu",
  "Siberian Husky",
  "Staffordshire Bull Terrier",
  "Vizsla",
  "Weimaraner",
  "West Highland White Terrier",
  "Whippet",
  "Yorkshire Terrier",
];

const catBreeds = [
  "Abyssinian",
  "American Bobtail",
  "American Curl",
  "American Shorthair",
  "American Wirehair",
  "Balinese",
  "Bengal",
  "Birman",
  "Bombay",
  "British Shorthair",
  "Burmese",
  "Chartreux",
  "Cornish Rex",
  "Devon Rex",
  "Domestic Longhair",
  "Domestic Medium Hair",
  "Domestic Shorthair",
  "Egyptian Mau",
  "Exotic Shorthair",
  "Himalayan",
  "Maine Coon",
  "Manx",
  "Mixed Breed",
  "Norwegian Forest Cat",
  "Ocicat",
  "Oriental Shorthair",
  "Persian",
  "Ragdoll",
  "Russian Blue",
  "Savannah",
  "Scottish Fold",
  "Siamese",
  "Siberian",
  "Sphynx",
  "Tonkinese",
  "Turkish Angora",
  "Turkish Van",
];

const birdBreeds = [
  "African Grey Parrot",
  "Amazon Parrot",
  "Budgie / Parakeet",
  "Canary",
  "Cockatiel",
  "Cockatoo",
  "Conure",
  "Dove",
  "Finch",
  "Lovebird",
  "Macaw",
  "Mixed / Other Bird",
];

const rabbitBreeds = [
  "American Rabbit",
  "Angora",
  "Californian",
  "Dutch",
  "Dwarf Hotot",
  "Flemish Giant",
  "Holland Lop",
  "Lionhead",
  "Mini Lop",
  "Mini Rex",
  "Netherland Dwarf",
  "Rex",
  "Mixed / Other Rabbit",
];

const reptileBreeds = [
  "Bearded Dragon",
  "Boa",
  "Chameleon",
  "Corn Snake",
  "Crested Gecko",
  "Iguana",
  "Leopard Gecko",
  "Python",
  "Tortoise",
  "Turtle",
  "Mixed / Other Reptile",
];

const smallAnimalBreeds = [
  "Chinchilla",
  "Ferret",
  "Gerbil",
  "Guinea Pig",
  "Hamster",
  "Hedgehog",
  "Mouse",
  "Rat",
  "Sugar Glider",
  "Mixed / Other Small Animal",
];

const zipFallbacks: Record<string, { city: string; state: string }> = {
  "18951": { city: "Quakertown", state: "PA" },
  "18955": { city: "Richlandtown", state: "PA" },
  "18036": { city: "Coopersburg", state: "PA" },
  "18049": { city: "Emmaus", state: "PA" },
  "18015": { city: "Bethlehem", state: "PA" },
  "18103": { city: "Allentown", state: "PA" },
};

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function getBreedOptions(petType: string) {
  if (petType === "Dog") return dogBreeds;
  if (petType === "Cat") return catBreeds;
  if (petType === "Bird") return birdBreeds;
  if (petType === "Rabbit") return rabbitBreeds;
  if (petType === "Reptile") return reptileBreeds;
  if (petType === "Small Animal") return smallAnimalBreeds;
  return ["Mixed Breed", "Unknown", "Other"];
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue || options[0]}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={`${name}-${option}`} value={option}>
            {option || "Select"}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  name,
  placeholder,
  type = "text",
  required = false,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function TextAreaField({
  label,
  name,
  placeholder,
  rows = 4,
}: {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function CheckboxField({ label, name }: { label: string; name: string }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <input
        name={name}
        type="checkbox"
        className="h-5 w-5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
      />
      <span className="text-sm font-bold text-slate-800">{label}</span>
    </label>
  );
}

function QuickTile({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ClipboardCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

function PetInfoCard({
  index,
  petType,
  onPetTypeChange,
}: {
  index: number;
  petType: string;
  onPetTypeChange: (value: string) => void;
}) {
  const breedOptions = getBreedOptions(petType);
  const datalistId = `pet-${index}-breed-options`;

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white">
          <PawPrint className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-950">
            {index === 1 ? "Primary Pet" : `Additional Pet ${index - 1}`}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Optional pet details Danette or Jason can capture if the person wants to share.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <TextField
          label="Pet Name"
          name={`pet_${index}_name`}
          placeholder={index === 1 ? "Bella" : "Optional"}
        />

        <label className="block">
          <span className="text-sm font-bold text-slate-800">Pet Type</span>
          <select
            name={`pet_${index}_type`}
            value={petType}
            onChange={(event) => onPetTypeChange(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          >
            {petTypes.map((type) => (
              <option key={`pet-${index}-${type}`} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-800">Breed Finder</span>
          <input
            name={`pet_${index}_breed`}
            list={datalistId}
            placeholder="Start typing breed..."
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
          <datalist id={datalistId}>
            {breedOptions.map((breed) => (
              <option key={`pet-${index}-${breed}`} value={breed} />
            ))}
          </datalist>
        </label>

        <SelectField
          label="Birthday Month"
          name={`pet_${index}_birthday_month`}
          options={months}
          defaultValue=""
        />

        <SelectField
          label="Birthday Year"
          name={`pet_${index}_birthday_year`}
          options={petBirthdayYears}
          defaultValue=""
        />
      </div>

      <div className="mt-4">
        <TextAreaField
          label="Pet Notes"
          name={`pet_${index}_notes`}
          rows={3}
          placeholder="Temperament, routines, allergies, walking notes, care needs, or anything they want to share."
        />
      </div>
    </div>
  );
}

export default function SalesMarketingLeadEntryPage() {
  const [phone, setPhone] = useState("");
  const [referrerPhone, setReferrerPhone] = useState("");
  const [referredPhone, setReferredPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [marketArea, setMarketArea] = useState("");
  const [zipStatus, setZipStatus] = useState("");
  const [petTypeOne, setPetTypeOne] = useState("Dog");
  const [petTypeTwo, setPetTypeTwo] = useState("Dog");
  const [petTypeThree, setPetTypeThree] = useState("Cat");

  const cleanZip = useMemo(() => zipCode.replace(/\D/g, "").slice(0, 5), [zipCode]);

  useEffect(() => {
    if (cleanZip.length !== 5) {
      setZipStatus("");
      return;
    }

    const fallback = zipFallbacks[cleanZip];

    if (fallback) {
      setCity(fallback.city);
      setStateCode(fallback.state);
      setMarketArea(`${fallback.city}, ${fallback.state}`);
      setZipStatus("City/state filled from SitGuru ZIP fallback.");
      return;
    }

    let isMounted = true;

    async function lookupZip() {
      try {
        setZipStatus("Looking up ZIP code...");

        const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);

        if (!response.ok) {
          if (isMounted) {
            setZipStatus("ZIP lookup unavailable. Enter city/state manually.");
          }
          return;
        }

        const data = await response.json();
        const place = data?.places?.[0];
        const lookupCity = place?.["place name"];
        const lookupState = place?.["state abbreviation"];

        if (isMounted && lookupCity && lookupState) {
          setCity(lookupCity);
          setStateCode(lookupState);
          setMarketArea(`${lookupCity}, ${lookupState}`);
          setZipStatus("City/state auto-filled from ZIP.");
        }
      } catch {
        if (isMounted) {
          setZipStatus("ZIP lookup unavailable. Enter city/state manually.");
        }
      }
    }

    lookupZip();

    return () => {
      isMounted = false;
    };
  }, [cleanZip]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/admin/sales-marketing"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Sales & Marketing
              </Link>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                Lead & Signup Entry
              </div>

              <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Add leads, referrals, signups, pets, and points of contact from the field.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                Jason and Danette can use this tablet-friendly Admin page to enter
                Pet Parent leads, Guru leads, Ambassador leads, partner leads,
                program applicants, referrals, optional pet details, and general
                outreach contacts.
              </p>
            </div>

            <aside className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 lg:w-[22rem]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                    Field workflow
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-emerald-950">
                    Capture first
                  </h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-emerald-900">
                This saves Admin records only. Pet Parents, Gurus, and Ambassadors
                should still complete their own verified signup or application later.
              </p>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickTile
            icon={PawPrint}
            title="Pet Parent Lead"
            description="Capture someone who may need care and optional pet details."
          />
          <QuickTile
            icon={Users}
            title="Guru Lead"
            description="Capture someone who may want to apply as a Guru."
          />
          <QuickTile
            icon={HeartHandshake}
            title="Ambassador Lead"
            description="Capture groomers, trainers, Vet Techs, veterinarians, students, veterans, and advocates."
          />
          <QuickTile
            icon={Handshake}
            title="Partner / Referral"
            description="Capture businesses, schools, apartments, rescue groups, brands, and referral sources."
          />
        </section>

        <form action={createLeadEntry} className="flex flex-col gap-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Step 1
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                What are you entering?
              </h2>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <SelectField
                label="Entry Type"
                name="entry_kind"
                options={["signup_lead", "outreach_contact", "referral"]}
                defaultValue="signup_lead"
              />
              <SelectField
                label="Lead Type"
                name="lead_type"
                options={leadTypes}
                defaultValue="Ambassador Lead"
              />
              <SelectField
                label="Status"
                name="status"
                options={statuses}
                defaultValue="New"
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Step 2
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Contact information
              </h2>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <TextField label="First Name" name="first_name" placeholder="Jane" />
              <TextField label="Last Name" name="last_name" placeholder="Smith" />
              <TextField
                label="Contact Name / Display Name"
                name="contact_name"
                placeholder="Jane at Happy Paws Grooming"
              />
              <TextField
                label="Business / Organization"
                name="business_name"
                placeholder="Happy Paws Grooming"
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
              />
              <TextField
                label="Phone"
                name="phone"
                type="tel"
                placeholder="(555) 555-0101"
                value={phone}
                onChange={(event) => setPhone(formatPhoneNumber(event.target.value))}
                autoComplete="tel"
              />
              <TextField label="Website" name="website_url" placeholder="https://..." />
              <TextField label="Social Handle" name="social_handle" placeholder="@handle" />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <TextField
                label="ZIP Code"
                name="zip_code"
                placeholder="18951"
                value={zipCode}
                onChange={(event) => setZipCode(event.target.value.replace(/\D/g, "").slice(0, 5))}
                autoComplete="postal-code"
              />
              <TextField
                label="City"
                name="city"
                placeholder="Quakertown"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                autoComplete="address-level2"
              />
              <TextField
                label="State"
                name="state"
                placeholder="PA"
                value={stateCode}
                onChange={(event) => setStateCode(event.target.value.toUpperCase().slice(0, 2))}
                autoComplete="address-level1"
              />
              <TextField
                label="Market Area"
                name="market_area"
                placeholder="Local launch market"
                value={marketArea}
                onChange={(event) => setMarketArea(event.target.value)}
              />
            </div>

            {zipStatus ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {zipStatus}
              </div>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Step 3
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                SitGuru classification
              </h2>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SelectField
                label="Relationship Category"
                name="relationship_category"
                options={relationshipCategories}
                defaultValue="Ambassador Lead"
              />
              <SelectField
                label="Ambassador Type"
                name="ambassador_type"
                options={ambassadorTypes}
                defaultValue="Groomer Ambassadors"
              />
              <SelectField
                label="Partner Category"
                name="partner_category"
                options={partnerCategories}
                defaultValue="Veterinary & Pet Care Partners"
              />
              <SelectField
                label="Growth Channel"
                name="growth_channel"
                options={growthChannels}
                defaultValue="Ambassador Program"
              />
              <TextField
                label="Interested As"
                name="interested_as"
                placeholder="Ambassador, Guru, Referral Partner"
              />
              <SelectField
                label="Program Interest"
                name="program_interest"
                options={programInterests}
                defaultValue="Ambassador Program"
              />
              <SelectField
                label="Referral Focus"
                name="referral_focus"
                options={referralFocuses}
                defaultValue="Pet Parents, Gurus, Ambassadors"
              />
              <SelectField
                label="Campaign Source"
                name="campaign_source"
                options={campaignSources}
                defaultValue="Groomer Ambassador Campaign"
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <SelectField
                label="Priority Level"
                name="priority_level"
                options={priorityLevels}
                defaultValue="Medium"
              />
              <SelectField
                label="Referral Potential"
                name="referral_potential"
                options={priorityLevels}
                defaultValue="Medium"
              />
              <TextField
                label="Contact Method"
                name="contact_method"
                placeholder="Instagram DM / phone / email / in person"
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <CheckboxField label="Pet Parent Interest" name="pet_parent_interest" />
              <CheckboxField label="Guru Interest" name="guru_interest" />
              <CheckboxField label="Ambassador Interest" name="ambassador_interest" />
              <CheckboxField label="Partner Interest" name="partner_interest" />
              <CheckboxField label="CEO Priority" name="ceo_priority" />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Step 4
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Pet information, optional
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Capture pet type, breed, and birthday month/year when a Pet Parent
                lead wants to share it. Breed finder updates based on pet type.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <PetInfoCard
                index={1}
                petType={petTypeOne}
                onPetTypeChange={setPetTypeOne}
              />
              <PetInfoCard
                index={2}
                petType={petTypeTwo}
                onPetTypeChange={setPetTypeTwo}
              />
              <PetInfoCard
                index={3}
                petType={petTypeThree}
                onPetTypeChange={setPetTypeThree}
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Step 5
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Referral details, if applicable
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Fill this section when the entry type is referral, or when someone
                is referring another Pet Parent, Guru, Ambassador, or partner.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <TextField label="Referrer Name" name="referrer_name" />
              <TextField label="Referrer Email" name="referrer_email" type="email" />
              <TextField
                label="Referrer Phone"
                name="referrer_phone"
                type="tel"
                value={referrerPhone}
                onChange={(event) => setReferrerPhone(formatPhoneNumber(event.target.value))}
              />
              <TextField
                label="Referrer Type"
                name="referrer_type"
                placeholder="Ambassador / Guru / Pet Parent / Partner"
              />
              <TextField
                label="Referrer Relationship"
                name="referrer_relationship"
                placeholder="Groomer Ambassador / friend / partner"
              />
              <TextField label="Referred First Name" name="referred_first_name" />
              <TextField label="Referred Last Name" name="referred_last_name" />
              <TextField
                label="Referred Full Name"
                name="referred_full_name"
                placeholder="Optional"
              />
              <TextField label="Referred Email" name="referred_email" type="email" />
              <TextField
                label="Referred Phone"
                name="referred_phone"
                type="tel"
                value={referredPhone}
                onChange={(event) => setReferredPhone(formatPhoneNumber(event.target.value))}
              />
              <SelectField
                label="Referred Type"
                name="referred_type"
                options={[
                  "Pet Parent",
                  "Guru",
                  "Ambassador",
                  "Partner",
                  "Program Applicant",
                ]}
                defaultValue="Pet Parent"
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Step 6
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Thank-you and next-step message
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This prepares message tracking in the lead record. Live email/SMS
                sending can be connected after the message workflow is approved.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SelectField
                label="Message Type"
                name="message_type"
                options={[
                  "Pet Parent Lead",
                  "Guru Lead",
                  "Ambassador Lead",
                  "Partner Lead",
                  "Referral",
                  "General Contact",
                ]}
                defaultValue="Ambassador Lead"
              />
              <CheckboxField label="Prepare thank-you email" name="send_thank_you_email" />
              <CheckboxField label="Prepare SMS message" name="prepare_sms_message" />
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-1 h-5 w-5 text-emerald-700" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-extrabold text-emerald-950">
                      Message status
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-900">
                      Saves as ready/not sent first. SMS can be enabled after Twilio approval.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Step 7
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Follow-up and notes
              </h2>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <TextField label="Next Follow-Up" name="next_follow_up" type="date" />
              <TextField label="Last Contacted" name="last_contacted" type="date" />
              <TextField label="Owner Name" name="owner_name" placeholder="Danette" />
              <TextField
                label="Created By Name"
                name="created_by_name"
                placeholder="Jason or Danette"
              />
              <TextField
                label="Created By Email"
                name="created_by_email"
                type="email"
                placeholder="jason@sitguru.com"
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <TextAreaField
                label="Next Action"
                name="next_action"
                placeholder="Send Ambassador Program link, follow up Friday, ask if they want to apply as a Guru..."
              />
              <TextAreaField
                label="Outcome Goal"
                name="outcome_goal"
                placeholder="Convert groomer into Ambassador and possible Guru/referral partner..."
              />
              <TextAreaField
                label="Notes"
                name="notes"
                placeholder="What did they say? What are they interested in? Any details from the conversation?"
              />
              <TextAreaField
                label="CEO Notes / Help Needed"
                name="ceo_notes"
                placeholder="What does Jason need to review, approve, or help with?"
              />
              <TextAreaField
                label="CEO Help"
                name="ceo_help"
                placeholder="Optional outreach-specific CEO support note."
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-emerald-950">
                  Save this field entry
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-900">
                  This will save the record into the selected Admin table. Signup
                  leads can also save optional pet information into the lead pets table.
                </p>
              </div>

              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800"
              >
                Save Lead / Referral
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </section>
        </form>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-3">
            <Link
              href="/admin/sales-marketing/outreach"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              <Handshake className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <p className="mt-3 font-extrabold text-slate-950">View Outreach Log</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                See outreach contacts and partner/Ambassador leads.
              </p>
            </Link>

            <Link
              href="/admin/sales-marketing/ceo-review"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              <ClipboardCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <p className="mt-3 font-extrabold text-slate-950">CEO Review</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Review priority items, blockers, and decisions.
              </p>
            </Link>

            <Link
              href="/admin/sales-marketing/campaigns"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              <Megaphone className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <p className="mt-3 font-extrabold text-slate-950">Campaigns</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Match saved leads to campaign source and growth efforts.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}