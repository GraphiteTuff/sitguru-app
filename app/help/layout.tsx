import type { Metadata } from "next";
import HelpShell from "@/components/help/HelpShell";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Search SitGuru help for PawReport Live, billing, bookings, accounts, and trust & safety.",
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HelpShell>{children}</HelpShell>;
}
