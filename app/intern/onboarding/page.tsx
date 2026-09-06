import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InternOnboardingForm, {
  internOnboardingNotice,
} from "@/components/internship/InternOnboardingForm";
import { internSchoolEmphasis } from "@/lib/internship/intern-tools";
import { findInternByAccount, getInternOnboarding, getInternWorkspace } from "@/lib/internship/queries";

export const dynamic = "force-dynamic";

export default async function InternOnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/intern/login?next=/intern/onboarding");

  const intern = await findInternByAccount({
    userId: user.id,
    email: user.email,
  });
  if (!intern) redirect("/intern/login");

  const onboarding = await getInternOnboarding(intern.id);
  const workspace = await getInternWorkspace(intern.id);
  const school = internSchoolEmphasis({
    university: workspace?.university,
    campus: workspace?.campus,
    intern,
    cohort: workspace?.cohort,
  });
  const params = searchParams ? await searchParams : {};

  return (
    <InternOnboardingForm
      intern={intern}
      onboarding={onboarding}
      school={school.school}
      program={school.program}
      notice={internOnboardingNotice(params)}
    />
  );
}
