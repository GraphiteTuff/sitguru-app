import InternshipAdminBackBar from "@/components/internship/InternshipAdminBackBar";

export default function InternshipAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-x-hidden">
      <InternshipAdminBackBar />
      {children}
    </div>
  );
}
