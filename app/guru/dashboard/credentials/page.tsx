import GuruTrustCredentialsPanel from "@/components/credentials/GuruTrustCredentialsPanel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Trust & Credentials | SitGuru",
};

export default function GuruCredentialsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <GuruTrustCredentialsPanel />
    </div>
  );
}
