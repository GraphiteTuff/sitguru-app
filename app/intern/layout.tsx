import InternPortalHeader from "@/components/internship/InternPortalHeader";

export default function InternLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#FAF6EE]">
      <InternPortalHeader />
      {children}
    </div>
  );
}
