import InternshipAssignScreen from "@/components/internship/InternshipAssignScreen";

export const dynamic = "force-dynamic";

export default async function TeamAccessPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  return (
    <InternshipAssignScreen
      returnTo="/admin/hr/team-access"
      ok={one(params.ok)}
      error={one(params.error)}
    />
  );
}
