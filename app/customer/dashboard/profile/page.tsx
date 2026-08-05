"use client";

import Header from "@/components/Header";
import UnifiedProfileSettings from "@/components/profile/UnifiedProfileSettings";

export default function CustomerProfileSettingsPage() {
  return (
    <div className="min-h-screen bg-[#f7fffb]">
      <Header />
      <UnifiedProfileSettings role="parent" />
    </div>
  );
}
