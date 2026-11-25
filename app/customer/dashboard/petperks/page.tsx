import Header from "@/components/Header";
import PetPerksInvite from "@/components/rewards/PetPerksInvite";

export default function CustomerPetPerksPage() {
  return (
    <main className="min-h-screen bg-[#F7FFFB] pb-12">
      <Header />
      <PetPerksInvite portal="Pet Parent" />
    </main>
  );
}
