export default function InternLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#FAF6EE]">{children}</div>
  );
}
