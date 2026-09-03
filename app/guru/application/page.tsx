import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  hasGuruAccessFromSignals,
  isEligibleGuruProfile,
  isGuruRoleValue,
  resolveGuruApplicationPath,
} from "@/lib/auth/guru-access";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    saved?: string;
    submitted?: string;
    message?: string;
    error?: string;
    from?: string;
    reason?: string;
  }>;
};

export default async function GuruApplicationRedirectPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasGuruAccess = false;

  if (user) {
    const [{ data: roleRows }, { data: profile }, { data: guruRow }] =
      await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("role, account_type")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("gurus")
          .select("id, user_id, email, status, application_status, is_bookable, is_active")
          .or(
            user.email
              ? `user_id.eq.${user.id},email.eq.${user.email}`
              : `user_id.eq.${user.id}`,
          )
          .maybeSingle(),
      ]);

    const roles = [
      ...(roleRows || []).map((row) => row.role),
      profile?.role,
      profile?.account_type,
    ];

    hasGuruAccess = hasGuruAccessFromSignals({
      roles,
      hasGuruRole: roles.some((role) => isGuruRoleValue(role)),
      hasEligibleGuruProfile: isEligibleGuruProfile(guruRow),
    });
  }

  redirect(
    resolveGuruApplicationPath({
      hasGuruAccess,
      from: resolvedSearchParams?.from,
      reason: resolvedSearchParams?.reason,
      saved: resolvedSearchParams?.saved,
      submitted: resolvedSearchParams?.submitted,
      message: resolvedSearchParams?.message,
      error: resolvedSearchParams?.error,
    }),
  );
}
