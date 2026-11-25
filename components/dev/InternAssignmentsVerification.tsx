import { notFound } from "next/navigation";
import InternshipGrowthWorkspace from "@/components/internship/InternshipGrowthWorkspace";
import { documentationInternWorkspace } from "@/lib/internship/documentation-fixture";
import type {
  InternshipTask,
  InternshipWorkAttachment,
  InternshipWorkComment,
} from "@/lib/internship/types";

/** Synthetic, read-only data for local visual checks of the actual assignment UI. */
export default function InternAssignmentsVerification() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.VERCEL ||
    process.env.SITGURU_LOCAL_PREVIEW !== "true"
  ) notFound();

  const workspace = documentationInternWorkspace();
  const internId = workspace.intern.id;
  const template = workspace.tasks.find((task) => task.id === "doc-task-01")!;
  const longSubmission = [
    "Trend 1: Everyday adventures with pets",
    "Source: https://example.org/trends/everyday-pet-adventures?campaign=fictional-spring-pet-community-research-and-content-ideas",
    "The post follows a pet through familiar daily routines. A SitGuru version could show a relaxed walk, a favorite toy, and a greeting from a local Guru. The story should make each moment easy to picture and give Pet Parents a friendly reason to join the discussion.",
    "Content idea: A short video with three simple scenes and a final invitation to share a favorite pet routine. Keep the original source in the research notes so the reviewer can compare the idea with the inspiration.",
    "Discussion prompt: What little routine makes your pet's day?",
    "",
    "Trend 2: Cozy pet moments",
    "Source: https://example.org/trends/cozy-pets?campaign=fictional-spring-research-with-a-deliberately-long-reference-link",
    "This example focuses on a quiet afternoon at home. The content idea is a photo sequence with a playful caption and a local care invitation. Include a clear beginning, a small story, and a question that helps the community respond.",
    "Content idea: Pair a cozy pet photo with a short story about their favorite place to rest. Use original, permission-approved images in the finished campaign.",
    "Discussion prompt: Where does your pet choose to curl up?",
    "End of the complete synthetic submission. This last sentence must remain available when the full submission is opened.",
  ].join("\n");
  const longFeedback = [
    "Thank you for putting these ideas together. The everyday-adventure concept gives the audience a familiar story and a clear reason to participate.",
    "Keep the opening focused on the pet and their routine, then bring in the local-care connection naturally. Use the example links to explain the inspiration, and keep the finished captions short enough to read on a phone.",
    "For the cozy-pet idea, choose a single moment and one discussion question. Make the next step obvious while preserving the friendly tone.",
    "End of the complete synthetic feedback. This last sentence must remain available after expanding feedback.",
  ].join("\n\n");
  const reviewed: InternshipTask = {
    ...template,
    id: "fixture-assignment-reviewed",
    title: "Pet Trend Research & Content Ideas",
    dueOn: "2027-01-19",
    status: "approved",
    reviewStage: "ava_approved",
    studentNotes: longSubmission,
    supervisorNotes: longFeedback,
    workUrl: "https://example.org/assignments/pet-trends",
    kpiTier: "",
  };
  const awaiting: InternshipTask = {
    ...template,
    id: "fixture-assignment-awaiting",
    title: "Community Outreach Draft",
    dueOn: "2027-01-22",
    status: "submitted",
    reviewStage: "submitted_to_ava",
    studentNotes: "The draft is ready for review. Please check the introduction and the proposed next step.",
    supervisorNotes: "",
    workUrl: "https://example.org/assignments/community-outreach",
    kpiTier: "",
  };
  const revisions: InternshipTask = {
    ...template,
    id: "fixture-assignment-revisions",
    title: "Local Guru Spotlight",
    dueOn: "2027-01-23",
    status: "revision_requested",
    reviewStage: "changes_requested",
    studentNotes: "A first draft of the local spotlight with a sample caption and photo plan.",
    supervisorNotes: "Please add the service area and a clear booking link before resubmitting.",
    workUrl: "",
    kpiTier: "",
  };
  const comments: InternshipWorkComment[] = [
    ...Array.from({ length: 14 }, (_, index): InternshipWorkComment => ({
      id: `fixture-activity-${index}`,
      internId,
      itemType: "task",
      itemId: reviewed.id,
      authorRole: "supervisor",
      body: index === 0 ? "Assignment created." : "Assignment updated.",
      createdAt: `2027-01-${String(index + 1).padStart(2, "0")}T15:00:00.000Z`,
    })),
    {
      id: "fixture-feedback-intern",
      internId,
      itemType: "task",
      itemId: reviewed.id,
      authorRole: "intern",
      body: "Assignment updated. I added a second discussion prompt and kept the original research links for context.",
      createdAt: "2027-01-18T10:00:00.000Z",
    },
    {
      id: "fixture-feedback-supervisor",
      internId,
      itemType: "task",
      itemId: reviewed.id,
      authorRole: "supervisor",
      body: "The revised prompts are clear. Keep both research references with the submission.",
      createdAt: "2027-01-19T10:00:00.000Z",
    },
  ];
  const attachments: InternshipWorkAttachment[] = Array.from(
    { length: 6 },
    (_, index) => ({
      id: `fixture-file-${index}`,
      internId,
      itemType: "task",
      itemId: reviewed.id,
      fileName: index < 5 ? "Pet Trend Research & Content Ideas.pdf" : "Research screenshots.pdf",
      fileUrl: `https://example.org/files/pet-trend-${index}.pdf`,
      storageBucket: "documentation",
      storagePath: `documentation/pet-trend-${index}.pdf`,
      mimeType: "application/pdf",
      fileSize: 24000 + index * 1000,
      caption: index < 5 ? "Assignment resource" : "Supporting research",
      category: "research",
      contributesToFinal: false,
      uploadedByRole: "supervisor",
      createdAt: `2027-01-${String(index + 10).padStart(2, "0")}T12:00:00.000Z`,
    }),
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-4 bg-[#F4F7FB] p-3 sm:p-6">
      <header className="space-y-1">
        <p className="text-sm font-semibold text-slate-600">Synthetic assignment data · Read-only preview</p>
        <h1 className="text-2xl font-black text-[#0F2744]">Assignments</h1>
        <p className="text-base text-slate-600">Assign work, review submissions, and give feedback.</p>
      </header>
      <InternshipGrowthWorkspace
        data={{ ...workspace, tasks: [reviewed, awaiting, revisions], comments, attachments }}
        mode="supervisor"
        initialTab="tasks"
        embeddedInRecord
        preview
      />
    </main>
  );
}
