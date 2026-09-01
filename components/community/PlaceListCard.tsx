"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BedDouble,
  Beer,
  Coffee,
  Footprints,
  Hospital,
  MapPin,
  PawPrint,
  Phone,
  Stethoscope,
  Store,
  Tent,
  Trees,
  UtensilsCrossed,
  Waves,
  Wine,
} from "lucide-react";
import { placeGlyph, type PlaceGlyph } from "@/lib/community/place-icons";
import {
  amenityStatusLabel,
  claimPlaceHref,
  formatPetFriendlyScore,
  nearbyGurusHref,
  pawCount,
  type PetFriendlyPlace,
  type PlaceCategoryId,
  type PlaceLane,
} from "@/lib/community/places";

const GLYPH_ICON = {
  utensils: UtensilsCrossed,
  coffee: Coffee,
  beer: Beer,
  wine: Wine,
  bed: BedDouble,
  trees: Trees,
  paw: PawPrint,
  waves: Waves,
  tent: Tent,
  stethoscope: Stethoscope,
  hospital: Hospital,
  store: Store,
} satisfies Record<PlaceGlyph, typeof PawPrint>;

function Paws({ score }: { score: number }) {
  const filled = pawCount(score);
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => {
        const on = filled >= index + 1;
        const half = !on && filled >= index + 0.5;
        return (
          <PawPrint
            key={index}
            className={`h-5 w-5 ${
              on || half ? "text-emerald-700" : "text-slate-300"
            } ${half ? "opacity-60" : ""}`}
            fill={on ? "currentColor" : "none"}
          />
        );
      })}
    </span>
  );
}

function knownStatus(value?: string | null) {
  if (!value || value === "Not listed yet") return null;
  return value;
}

function StatusRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  const shown = knownStatus(value);
  if (!shown) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="font-semibold text-slate-600">{label}</span>
      <span className="text-right font-black text-slate-900">{shown}</span>
    </div>
  );
}

function SnapshotBlock({
  title,
  tone = "slate",
  rows,
}: {
  title: string;
  tone?: "slate" | "rose";
  rows: Array<{ label: string; value?: string | null }>;
}) {
  const known = rows.filter((row) => knownStatus(row.value));
  if (!known.length) return null;
  return (
    <div
      className={`mt-4 space-y-1.5 rounded-2xl border px-4 py-3 ${
        tone === "rose"
          ? "border-rose-100 bg-rose-50/70"
          : "border-slate-100 bg-slate-50"
      }`}
    >
      <p
        className={`text-[11px] font-black uppercase tracking-[0.14em] ${
          tone === "rose" ? "text-rose-800" : "text-emerald-800"
        }`}
      >
        {title}
      </p>
      {known.map((row) => (
        <StatusRow key={row.label} label={row.label} value={row.value} />
      ))}
    </div>
  );
}

export default function PlaceListCard({
  place,
  highlighted,
  onHighlight,
  onSwitchLane,
}: {
  place: PetFriendlyPlace;
  highlighted: boolean;
  onHighlight: () => void;
  onSwitchLane: (lane: PlaceLane, category?: PlaceCategoryId | "") => void;
}) {
  const Icon = GLYPH_ICON[placeGlyph(place.category, place.lane)];
  const claimHref = claimPlaceHref(place);
  const guruHref = nearbyGurusHref(place);
  const knownAmenities = place.amenities.filter((item) => item.status === "yes");

  return (
    <article
      className={`relative rounded-[24px] border bg-white p-4 pr-[5.5rem] shadow-[0_8px_26px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:rounded-[28px] sm:p-5 sm:pr-28 ${
        highlighted
          ? "border-emerald-400 ring-4 ring-emerald-100"
          : "border-slate-200"
      }`}
      onMouseEnter={onHighlight}
      onFocus={onHighlight}
    >
      <div className="absolute top-4 right-4 sm:top-5 sm:right-5">
        <div className="relative h-[4.5rem] w-[4.5rem] overflow-hidden rounded-[22px] bg-white sm:h-24 sm:w-24">
        {place.photoUrl ? (
          <>
            <Image
              src={place.photoUrl}
              alt=""
              fill
              className="object-cover object-center"
              sizes="96px"
            />
            <span className="absolute right-1 bottom-1 flex h-7 w-7 items-center justify-center rounded-xl bg-white/95 text-emerald-800 shadow-sm">
              <Icon className="h-4 w-4" strokeWidth={2.2} />
            </span>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-800">
            <Icon className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={2.1} />
          </div>
        )}
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-black leading-snug text-slate-950 sm:text-xl">
            {place.name}
          </h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-700">
            {place.categoryLabel}
          </span>
          {place.isPartner ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-800">
              SitGuru Partner
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-bold text-emerald-800">
          {[place.city, place.state].filter(Boolean).join(", ") ||
            place.county ||
            "Nearby"}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Paws score={place.petFriendlyScore} />
          <p className="text-base font-black text-slate-950">
            Pet Friendliness {formatPetFriendlyScore(place.petFriendlyScore)} / 5
          </p>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
            {place.petFriendlyLabel}
          </span>
        </div>
        {place.photoUrl && place.photoAttribution ? (
          <p className="mt-1 text-[10px] font-semibold text-slate-400">
            Photo: {place.photoAttribution}
          </p>
        ) : null}
      </div>

      {place.editorialSummary ? (
        <p className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-slate-600">
          {place.editorialSummary}
        </p>
      ) : null}

      {place.reasons.length ? (
        <ul className="mt-3 space-y-1">
          {place.reasons.slice(0, 5).map((reason) => (
            <li
              key={reason}
              className="flex items-start gap-2 text-sm font-semibold text-slate-700"
            >
              <PawPrint className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
              {reason}
            </li>
          ))}
        </ul>
      ) : null}

      {knownAmenities.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {knownAmenities.map((item) => (
            <span
              key={item.id}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800"
            >
              {item.label}
            </span>
          ))}
        </div>
      ) : null}

      {place.stay ? (
        <SnapshotBlock
          title="Stay details pet parents actually need"
          rows={[
            { label: "Pet fee", value: place.stay.petFee },
            { label: "Pets allowed", value: place.stay.petsAllowed },
            { label: "Weight limit", value: place.stay.weightLimit },
            { label: "Breed restrictions", value: place.stay.breedRestrictions },
            { label: "Unattended pets", value: place.stay.unattendedPets },
            {
              label: "Grass / walking area",
              value: amenityStatusLabel(place.stay.grassWalkingArea),
            },
            {
              label: "Dog relief station",
              value: amenityStatusLabel(place.stay.dogReliefStation),
            },
          ]}
        />
      ) : null}

      {place.play ? (
        <SnapshotBlock
          title={place.category === "dog_park" ? "Dog park snapshot" : "Play snapshot"}
          rows={[
            { label: "Fenced", value: amenityStatusLabel(place.play.fenced) },
            {
              label: "Small-dog area",
              value: amenityStatusLabel(place.play.separateSmallDogArea),
            },
            { label: "Water", value: amenityStatusLabel(place.play.water) },
            {
              label: "Waste stations",
              value: amenityStatusLabel(place.play.wasteStations),
            },
            { label: "Shade", value: amenityStatusLabel(place.play.shade) },
            { label: "Hours", value: place.play.hours },
          ]}
        />
      ) : null}

      {place.care ? (
        <SnapshotBlock
          title={place.category === "vet_er" ? "Emergency / ER" : "Veterinary care"}
          tone="rose"
          rows={[
            { label: "Emergency", value: amenityStatusLabel(place.care.emergency) },
            {
              label: "Open 24 hours",
              value: amenityStatusLabel(place.care.open24Hours),
            },
            { label: "Open now", value: amenityStatusLabel(place.care.openNow) },
            { label: "Hours", value: place.care.hours },
            { label: "Walk-ins", value: amenityStatusLabel(place.care.walkIns) },
          ]}
        />
      ) : null}

      {place.upcomingEvent ? (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-800">
            Upcoming pet event
          </p>
          <p className="mt-1 text-sm font-black text-slate-950">
            {place.upcomingEvent.title}
          </p>
          <p className="text-xs font-semibold text-slate-600">
            {place.upcomingEvent.whenLabel}
          </p>
          <Link
            href={place.upcomingEvent.href}
            className="mt-2 inline-flex text-sm font-black text-emerald-800"
          >
            View event
          </Link>
        </div>
      ) : null}

      <p className="mt-3 inline-flex items-start gap-1.5 text-sm font-semibold text-slate-600">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
        <span className="min-w-0 break-words">{place.address || "Address TBA"}</span>
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {place.phone ? (
          <a
            href={`tel:${place.phone.replace(/[^\d+]/g, "")}`}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold ${
              place.category === "vet_er"
                ? "bg-rose-700 text-white"
                : "bg-emerald-700 text-white"
            }`}
          >
            <Phone className="h-4 w-4" />
            Call {place.category === "vet_er" ? "ER" : "now"}
          </a>
        ) : null}
        {place.googleMapsUrl ? (
          <a
            href={place.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold ${
              place.phone
                ? "border border-slate-300 bg-white text-slate-800"
                : "bg-emerald-700 text-white"
            }`}
          >
            Directions
          </a>
        ) : null}
        {place.lane === "stay" ? (
          <Link
            href={guruHref}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800"
          >
            Nearby Gurus
          </Link>
        ) : null}
        {place.lane === "eat" ? (
          <button
            type="button"
            onClick={() => onSwitchLane("play", "dog_park")}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800"
          >
            Nearby dog park
          </button>
        ) : null}
        {place.lane === "play" ? (
          <button
            type="button"
            onClick={() => onSwitchLane("eat", "restaurant")}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800"
          >
            Eat afterward
          </button>
        ) : null}
        {place.lane === "services" &&
        (place.category === "veterinarian" ||
          place.category === "pet_hospital" ||
          place.category === "vet_er") ? (
          <button
            type="button"
            onClick={() => onSwitchLane("stay", "hotel")}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800"
          >
            Nearby pet-friendly stay
          </button>
        ) : null}
        <Link
          href="/petperks"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800"
        >
          PawPerks
        </Link>
        <Link
          href={claimHref}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-900"
        >
          Claim this place
        </Link>
      </div>

      {place.lane === "stay" ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Footprints className="h-3.5 w-3.5" />
          Need someone to check on your dog at dinner? Nearby Gurus can help.
        </p>
      ) : null}
    </article>
  );
}
