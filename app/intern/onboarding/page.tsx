import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InternOnboardingForm, {
  internOnboardingNotice,
} from "@/components/internship/InternOnboardingForm";
import { findInternByAccount, getInternOnboarding } from "@/lib/internship/queries";

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
  const params = searchParams ? await searchParams : {};

  return (
    <InternOnboardingForm
      intern={intern}
      onboarding={onboarding}
      notice={internOnboardingNotice(params)}
    />
  );
}
