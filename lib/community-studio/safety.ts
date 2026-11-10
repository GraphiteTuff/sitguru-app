type CommunityEnvironment = {
  VERCEL_ENV?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SITGURU_ISOLATED_BACKEND?: string;
};

export function communityEnvironmentWriteError(env: CommunityEnvironment) {
  if (env.VERCEL_ENV === "production") return "";
  if ((env.NEXT_PUBLIC_SUPABASE_URL || "").includes("mmtjhxnzuglbyumbsjhs")) return "Community writes are disabled: this is the production database. Configure an isolated development project.";
  if (env.SITGURU_ISOLATED_BACKEND !== "true") return "Community writes require an isolated Supabase project and SITGURU_ISOLATED_BACKEND=true.";
  return "";
}
