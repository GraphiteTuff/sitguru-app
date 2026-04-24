import Link from "next/link";
import SitGuruDarkFooter from "@/components/SitGuruDarkFooter";
import SitGuruDarkHeader from "@/components/SitGuruDarkHeader";

type AdminShellProps = {
  children: React.ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] text-white">
      <SitGuruDarkHeader
        dashboardHref="/admin/dashboard"
        links={[
          { href: "/admin/dashboard", label: "Dashboard" },
          { href: "/admin/messages", label: "Messages" },
          { href: "/admin/bookings", label: "Bookings" },
          { href: "/admin/users", label: "Users" },
        ]}
        rightSlot={
          <Link
            href="/logout"
            className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 shadow-[0_10px_25px_rgba(16,185,129,0.22)] transition hover:bg-emerald-300"
          >
            Logout
          </Link>
        }
      />

      <main>{children}</main>

      <SitGuruDarkFooter
        dashboardHref="/admin/dashboard"
        links={[
          { href: "/admin/dashboard", label: "Admin Dashboard" },
          { href: "/admin/messages", label: "Messages" },
          { href: "/admin/bookings", label: "Bookings" },
        ]}
      />
    </div>
  );
}