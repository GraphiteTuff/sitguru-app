import { redirect } from "next/navigation";
import { buildPetParentBookUrl } from "@/lib/booking/pet-parent-booking";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Legacy /bookings/new entry point.
 * Prefer /book/[slug] with express params. Do not touch map routes.
 */
export default async function NewBookingRedirectPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const params = searchParams ? await searchParams : {};
  const slug =
    String(firstParam(params.guru_slug) || firstParam(params.slug) || "").trim();
  const petId = String(firstParam(params.pet_id) || "").trim();
  const zip = String(firstParam(params.zip) || "").trim();
  const service = String(firstParam(params.service) || "").trim();

  if (slug) {
    redirect(
      buildPetParentBookUrl({
        slug,
        petId: petId || null,
        zip: zip || null,
        service: service || null,
        express: true,
      }),
    );
  }

  const search = new URLSearchParams();
  const guru = String(firstParam(params.guru) || firstParam(params.guru_id) || "").trim();
  if (guru) search.set("guru", guru);
  if (zip) search.set("zip", zip);
  const query = search.toString();
  redirect(query ? `/search?${query}` : "/search");
}
