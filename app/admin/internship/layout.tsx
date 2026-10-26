import InternshipAdminBackBar from "@/components/internship/InternshipAdminBackBar";
import WorkspaceLiveSyncMount from "@/components/realtime/WorkspaceLiveSyncMount";

export default function InternshipAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-x-hidden">
      <WorkspaceLiveSyncMount />
      <InternshipAdminBackBar />
      {children}
    </div>
  );
}
