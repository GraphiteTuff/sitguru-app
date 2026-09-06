import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { internSchoolEmphasis } from "@/lib/internship/intern-tools";
import type { InternshipIntern, InternshipWorkspaceData } from "@/lib/internship/types";

function firstIp(value: string) {
  return value.split(",")[0]?.trim() || "";
}

function jwtClaim(token: string, key: string) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1] || "", "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    return String(payload[key] || "").trim();
  } catch {
    return "";
  }
}

export async function internOnboardingAudit() {
  const headerStore = await headers();
  const ip = firstIp(
    headerStore.get("x-forwarded-for") ||
      headerStore.get("x-real-ip") ||
      headerStore.get("cf-connecting-ip") ||
      "",
  );
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const bearer = (headerStore.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const token = session?.access_token || bearer;
  const sessionId =
    jwtClaim(token, "session_id") ||
    jwtClaim(token, "sessionId") ||
    jwtClaim(token, "sid") ||
    [jwtClaim(token, "sub"), jwtClaim(token, "iat")].filter(Boolean).join(":");
  const platform =
    headerStore.get("x-sitguru-platform") ||
    internOnboardingClientFromUserAgent(headerStore.get("user-agent") || "");
  return {
    ip,
    sessionId: [platform, sessionId].filter(Boolean).join(":"),
  };
}

function internOnboardingClientFromUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios-web";
  if (/android/.test(ua)) return "android-web";
  if (/mobile|opera mini|fennec/.test(ua)) return "mobile-web";
  return "desktop-web";
}

export function internOnboardingIdentitySnapshot(
  intern: Pick<InternshipIntern, "fullName" | "email" | "studentEmail" | "academicProgram">,
  workspace?: Pick<InternshipWorkspaceData, "university" | "campus" | "intern" | "cohort"> | null,
) {
  const school = internSchoolEmphasis({
    university: workspace?.university,
    campus: workspace?.campus,
    intern: workspace?.intern || intern,
    cohort: workspace?.cohort,
  });
  return {
    intern_name_snapshot: intern.fullName,
    intern_university_snapshot: school.school || "SitGuru intern",
    intern_program_snapshot: school.program || intern.academicProgram || "",
    intern_email_snapshot: intern.email || intern.studentEmail || "",
  };
}
