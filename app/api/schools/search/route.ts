import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type CollegeScorecardSchool = {
  id?: number;
  "school.name"?: string;
  "school.city"?: string;
  "school.state"?: string;
  "school.school_url"?: string;
};

type SchoolSearchResult = {
  id: string;
  name: string;
  city: string;
  state: string;
  website: string | null;
  label: string;
};

const COLLEGE_SCORECARD_API_URL =
  "https://api.data.gov/ed/collegescorecard/v1/schools";

const fallbackSchools: SchoolSearchResult[] = [
  {
    id: "fallback-penn-state",
    name: "Penn State University",
    city: "University Park",
    state: "PA",
    website: "https://www.psu.edu",
    label: "Penn State University — University Park, PA",
  },
  {
    id: "fallback-university-of-pennsylvania",
    name: "University of Pennsylvania",
    city: "Philadelphia",
    state: "PA",
    website: "https://www.upenn.edu",
    label: "University of Pennsylvania — Philadelphia, PA",
  },
  {
    id: "fallback-pennsylvania-college-of-technology",
    name: "Pennsylvania College of Technology",
    city: "Williamsport",
    state: "PA",
    website: "https://www.pct.edu",
    label: "Pennsylvania College of Technology — Williamsport, PA",
  },
  {
    id: "fallback-temple-university",
    name: "Temple University",
    city: "Philadelphia",
    state: "PA",
    website: "https://www.temple.edu",
    label: "Temple University — Philadelphia, PA",
  },
  {
    id: "fallback-drexel-university",
    name: "Drexel University",
    city: "Philadelphia",
    state: "PA",
    website: "https://drexel.edu",
    label: "Drexel University — Philadelphia, PA",
  },
  {
    id: "fallback-rowan-university",
    name: "Rowan University",
    city: "Glassboro",
    state: "NJ",
    website: "https://www.rowan.edu",
    label: "Rowan University — Glassboro, NJ",
  },
  {
    id: "fallback-rutgers-university",
    name: "Rutgers University",
    city: "New Brunswick",
    state: "NJ",
    website: "https://www.rutgers.edu",
    label: "Rutgers University — New Brunswick, NJ",
  },
  {
    id: "fallback-bucks-county-community-college",
    name: "Bucks County Community College",
    city: "Newtown",
    state: "PA",
    website: "https://www.bucks.edu",
    label: "Bucks County Community College — Newtown, PA",
  },
  {
    id: "fallback-northampton-community-college",
    name: "Northampton Community College",
    city: "Bethlehem",
    state: "PA",
    website: "https://www.northampton.edu",
    label: "Northampton Community College — Bethlehem, PA",
  },
  {
    id: "fallback-camden-county-college",
    name: "Camden County College",
    city: "Blackwood",
    state: "NJ",
    website: "https://www.camdencc.edu",
    label: "Camden County College — Blackwood, NJ",
  },
];

function normalizeSearchTerm(value: string | null) {
  return (value || "")
    .trim()
    .replace(/[^\w\s.'&-]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function normalizeSchoolUrl(value: string | undefined) {
  if (!value) return null;

  const cleaned = value.trim();

  if (!cleaned) return null;

  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return cleaned;
  }

  return `https://${cleaned}`;
}

function mapSchoolResult(
  school: CollegeScorecardSchool,
): SchoolSearchResult | null {
  const name = String(school["school.name"] || "").trim();
  const city = String(school["school.city"] || "").trim();
  const state = String(school["school.state"] || "").trim();

  if (!name) return null;

  const id = school.id ? String(school.id) : `${name}-${city}-${state}`;

  return {
    id,
    name,
    city,
    state,
    website: normalizeSchoolUrl(school["school.school_url"]),
    label: [name, city && state ? `${city}, ${state}` : city || state]
      .filter(Boolean)
      .join(" — "),
  };
}

function getFallbackResults(query: string) {
  const normalizedQuery = query.toLowerCase();

  return fallbackSchools
    .filter((school) => {
      const searchable =
        `${school.name} ${school.city} ${school.state}`.toLowerCase();

      return searchable.includes(normalizedQuery);
    })
    .slice(0, 8);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = normalizeSearchTerm(searchParams.get("q"));

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        schools: [],
        source: "none",
      });
    }

    const apiKey =
      process.env.COLLEGE_SCORECARD_API_KEY ||
      process.env.DATA_GOV_API_KEY ||
      "DEMO_KEY";

    const apiUrl = new URL(COLLEGE_SCORECARD_API_URL);

    apiUrl.searchParams.set("api_key", apiKey);
    apiUrl.searchParams.set("school.name", query);
    apiUrl.searchParams.set(
      "fields",
      "id,school.name,school.city,school.state,school.school_url",
    );
    apiUrl.searchParams.set("per_page", "10");
    apiUrl.searchParams.set("page", "0");
    apiUrl.searchParams.set("sort", "school.name:asc");

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 60 * 60 * 24,
      },
    });

    if (!response.ok) {
      const fallbackResults = getFallbackResults(query);

      return NextResponse.json({
        success: true,
        schools: fallbackResults,
        source: "fallback",
        warning:
          "College Scorecard search is temporarily unavailable. Showing fallback matches.",
      });
    }

    const payload = await response.json();

    const schools = Array.isArray(payload?.results)
      ? payload.results
          .map((school: CollegeScorecardSchool) => mapSchoolResult(school))
          .filter(Boolean)
      : [];

    return NextResponse.json({
      success: true,
      schools,
      source: "college_scorecard",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "School search is unavailable right now.";

    return NextResponse.json(
      {
        success: false,
        error: message,
        schools: [],
      },
      { status: 500 },
    );
  }
}