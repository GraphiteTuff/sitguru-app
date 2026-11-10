import { notFound } from "next/navigation";
import ManagerPortalShell from "@/components/manager/ManagerPortalShell";
import CommunityStudioBoard from "@/components/community-studio/CommunityStudioBoard";
import type { CommunityItem, CommunityWorkspace } from "@/lib/community-studio/types";
import { communitySummary } from "@/lib/community-studio/model";

export const dynamic = "force-dynamic";

/** Isolated visual fixture. Real workspace routes always retain their authentication gates. */
export default function CommunityStudioLocalPreview() {
  if (process.env.NODE_ENV !== "development" || process.env.VERCEL || process.env.SITGURU_LOCAL_PREVIEW !== "true") notFound();
  const base: CommunityItem = { id: "local-story-1", kind: "pet_of_week", title: "A little explorer with a very big heart", petName: "Scout", story: "Scout turns every neighborhood walk into an adventure. His favorite stops? The park, a friendly porch, and anywhere his best friends happen to be.", location: "Montgomery County, PA", status: "pending", feedback: "", imageUrl: "/images/portal/intern-dog-leash.jpg", submitterName: "Example intern", createdAt: "2026-11-09T12:00:00Z", updatedAt: "2026-11-09T12:00:00Z", publishAt: "", weekOf: "", contentId: "", taskId: "", canEdit: false, canReview: true, publicConsent: true, socialConsent: false, featuresClientPet: false };
  const items: CommunityItem[] = [base, { ...base, id: "local-story-2", kind: "guru_spotlight", title: "The familiar face behind the happy homecomings", petName: "Example Guru", imageUrl: "", status: "approved", story: "A few extra minutes of play, a thoughtful update, and a caring hand. This month we’re celebrating the small things that make a big difference for our community." }, { ...base, id: "local-story-3", kind: "gallery", title: "A perfect afternoon with the Pack", status: "scheduled", imageUrl: "", publishAt: "2026-11-16T16:00:00Z", story: "Fresh air, new friends, and a well earned break in the shade. A favorite moment from a neighborhood afternoon together." }];
  const workspace: CommunityWorkspace = { items, summary: communitySummary(items), ready: false, error: "", canModerate: true, tasks: [], content: [] };
  return <ManagerPortalShell><CommunityStudioBoard workspace={workspace} preview /></ManagerPortalShell>;
}
