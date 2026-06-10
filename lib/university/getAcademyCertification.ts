import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  AcademyType,
  getAcademyBadgeConfig,
} from "@/lib/university/academyBadges";

export type AcademyCertificationStatus = {
  userId: string;
  academyType: AcademyType;
  isComplete: boolean;
  badgeStatus: string;
  certificateStatus: string;
  issuedAt: string | null;
  label: string;
  shortLabel: string;
  chipLabel: string;
  description: string;
  completedThroughText: string;
  imagePath: string;
};

export function getEmptyAcademyCertificationStatus({
  userId,
  academyType,
}: {
  userId: string;
  academyType: AcademyType;
}): AcademyCertificationStatus {
  const badgeConfig = getAcademyBadgeConfig(academyType);

  return {
    userId,
    academyType,
    isComplete: false,
    badgeStatus: "locked",
    certificateStatus: "not_started",
    issuedAt: null,
    label: badgeConfig.label,
    shortLabel: badgeConfig.shortLabel,
    chipLabel: badgeConfig.chipLabel,
    description: badgeConfig.description,
    completedThroughText: badgeConfig.completedThroughText,
    imagePath: badgeConfig.imagePath,
  };
}

function statusMeansComplete(value?: string | null) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  return [
    "issued",
    "complete",
    "completed",
    "done",
    "approved",
    "certified",
    "graduate",
    "graduated",
  ].includes(normalized);
}

export async function getAcademyCertification({
  userId,
  academyType,
}: {
  userId?: string | null;
  academyType: AcademyType;
}): Promise<AcademyCertificationStatus> {
  const safeUserId = String(userId || "").trim();

  if (!safeUserId) {
    return getEmptyAcademyCertificationStatus({
      userId: "",
      academyType,
    });
  }

  const badgeConfig = getAcademyBadgeConfig(academyType);

  try {
    const { data, error } = await supabaseAdmin
      .from("academy_certifications")
      .select("badge_status, certificate_status, issued_at")
      .eq("user_id", safeUserId)
      .eq("academy_type", academyType)
      .maybeSingle();

    if (error) {
      console.warn(
        `Unable to load ${academyType} academy certification for ${safeUserId}:`,
        error.message,
      );

      return getEmptyAcademyCertificationStatus({
        userId: safeUserId,
        academyType,
      });
    }

    const badgeStatus = String(data?.badge_status || "").trim();
    const certificateStatus = String(data?.certificate_status || "").trim();
    const issuedAt = data?.issued_at ? String(data.issued_at) : null;

    const isComplete = Boolean(
      issuedAt ||
        statusMeansComplete(badgeStatus) ||
        statusMeansComplete(certificateStatus),
    );

    return {
      userId: safeUserId,
      academyType,
      isComplete,
      badgeStatus: badgeStatus || (isComplete ? "issued" : "locked"),
      certificateStatus:
        certificateStatus || (isComplete ? "issued" : "not_started"),
      issuedAt,
      label: badgeConfig.label,
      shortLabel: badgeConfig.shortLabel,
      chipLabel: badgeConfig.chipLabel,
      description: badgeConfig.description,
      completedThroughText: badgeConfig.completedThroughText,
      imagePath: badgeConfig.imagePath,
    };
  } catch (error) {
    console.warn(
      `Unable to load ${academyType} academy certification for ${safeUserId}:`,
      error,
    );

    return getEmptyAcademyCertificationStatus({
      userId: safeUserId,
      academyType,
    });
  }
}

export async function getAcademyCertificationsForUsers({
  userIds,
  academyType,
}: {
  userIds: string[];
  academyType: AcademyType;
}) {
  const safeUserIds = Array.from(
    new Set(
      userIds
        .map((userId) => String(userId || "").trim())
        .filter(Boolean),
    ),
  );

  const certificationMap = new Map<string, AcademyCertificationStatus>();

  safeUserIds.forEach((userId) => {
    certificationMap.set(
      userId,
      getEmptyAcademyCertificationStatus({
        userId,
        academyType,
      }),
    );
  });

  if (!safeUserIds.length) return certificationMap;

  const badgeConfig = getAcademyBadgeConfig(academyType);

  try {
    const { data, error } = await supabaseAdmin
      .from("academy_certifications")
      .select("user_id, badge_status, certificate_status, issued_at")
      .eq("academy_type", academyType)
      .in("user_id", safeUserIds);

    if (error) {
      console.warn(
        `Unable to load ${academyType} academy certifications:`,
        error.message,
      );
      return certificationMap;
    }

    (data || []).forEach((row) => {
      const userId = String(row.user_id || "").trim();

      if (!userId) return;

      const badgeStatus = String(row.badge_status || "").trim();
      const certificateStatus = String(row.certificate_status || "").trim();
      const issuedAt = row.issued_at ? String(row.issued_at) : null;

      const isComplete = Boolean(
        issuedAt ||
          statusMeansComplete(badgeStatus) ||
          statusMeansComplete(certificateStatus),
      );

      certificationMap.set(userId, {
        userId,
        academyType,
        isComplete,
        badgeStatus: badgeStatus || (isComplete ? "issued" : "locked"),
        certificateStatus:
          certificateStatus || (isComplete ? "issued" : "not_started"),
        issuedAt,
        label: badgeConfig.label,
        shortLabel: badgeConfig.shortLabel,
        chipLabel: badgeConfig.chipLabel,
        description: badgeConfig.description,
        completedThroughText: badgeConfig.completedThroughText,
        imagePath: badgeConfig.imagePath,
      });
    });

    return certificationMap;
  } catch (error) {
    console.warn(
      `Unable to load ${academyType} academy certifications:`,
      error,
    );
    return certificationMap;
  }
}