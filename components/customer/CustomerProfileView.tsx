import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Lock,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  Shield,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

export type ProfilePet = {
  id: string;
  name: string;
  detail: string;
  photo: string;
};

export type ProfileRole = {
  id: string;
  title: string;
  detail: string;
  active: boolean;
  href: string;
};

const card = "scroll-mt-24 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5";

const AREAS = [
  { href: "#my-profile", label: "My Profile" },
  { href: "#pets", label: "Pets" },
  { href: "#preferences", label: "Preferences" },
  { href: "#security", label: "Security" },
  { href: "#roles", label: "Roles" },
];

export default function CustomerProfileView({
  name,
  email,
  phone,
  place,
  avatarSrc,
  completion,
  pets,
  roles,
  emergency,
  notifications,
  careNotes,
  nextHref,
  bookingReady,
}: {
  name: string;
  email: string;
  phone: string;
  place: string;
  avatarSrc: string;
  completion: number;
  pets: ProfilePet[];
  roles: ProfileRole[];
  emergency: string;
  notifications: { booking: boolean; messages: boolean; offers: boolean };
  careNotes: string;
  nextHref: string;
  bookingReady: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950">My Profile</h1>
        <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
          Your name, photo, and contact details are shared across SitGuru. Pet Parent preferences on this page stay with pet care and do not change a Guru or staff profile.
        </p>
      </div>

      <nav className="sticky top-16 z-20 -mx-1 flex gap-2 overflow-x-auto bg-[#f8fffc]/95 px-1 py-2 backdrop-blur [scrollbar-width:none]" aria-label="Profile sections">
        {AREAS.map((area) => (
          <a key={area.href} href={area.href} className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-emerald-100 bg-white px-3 text-sm font-bold text-[#0D5C3A]">
            {area.label}
          </a>
        ))}
      </nav>

      <section id="my-profile" className={`${card} grid gap-4 lg:grid-cols-[1.3fr_0.7fr]`}>
        <div className="flex gap-4">
          <span className="relative inline-flex h-20 w-20 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-emerald-100">
            <span className="absolute inset-0 bg-white" />
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt="" className="relative z-[1] h-full w-full object-cover object-center" />
            ) : (
              <span className="relative z-[1] m-auto text-lg font-black text-[#0D5C3A]">{name.slice(0, 1)}</span>
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-black text-slate-950">{name}</p>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-[#0D5C3A]">Pet Parent</span>
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-600"><Mail size={14} /> {email}</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-600"><Phone size={14} /> {phone}</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-600"><MapPin size={14} /> {place}</p>
            <Link href="/customer/dashboard/profile/basic-info" className="mt-3 inline-flex min-h-10 items-center rounded-full bg-[#0D5C3A] px-4 text-sm font-bold !text-white">
              Edit shared profile
            </Link>
          </div>
        </div>
        <div className="rounded-3xl bg-[#F0FDF4] p-4">
          <div className="flex items-center justify-between text-sm font-bold text-[#0D5C3A]">
            <span>Profile completeness</span>
            <span>{completion}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-[#0D5C3A]" style={{ width: `${Math.min(100, completion)}%` }} />
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#14532D]">
            {bookingReady
              ? "You can book. Extra household details help your Guru."
              : "Name, care ZIP, and one pet are enough to request care."}
          </p>
          {!bookingReady ? <Link href={nextHref} className="mt-2 inline-flex text-sm font-bold text-[#0D5C3A]">Finish the next step →</Link> : null}
        </div>
      </section>

      <section id="pets" className={card}>
        <SectionTitle title="My Pets & Household" href="/customer/dashboard#new-pet-passport" />
        <p className="mt-1 text-sm font-medium text-slate-500">Pets and emergency contacts belong to this Pet Parent household.</p>
        {pets.length ? (
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {pets.map((pet) => (
              <li key={pet.id} className="overflow-hidden rounded-2xl bg-[#F8FAFC]">
                <span className="relative block h-24 bg-white">
                  <span className="absolute inset-0 bg-white" />
                  {pet.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pet.photo} alt="" className="relative z-[1] h-full w-full object-cover object-center" />
                  ) : (
                    <PawPrint className="relative z-[1] mx-auto mt-8 text-emerald-700" size={22} />
                  )}
                </span>
                <p className="px-2 pt-2 text-sm font-black text-slate-950">{pet.name}</p>
                <p className="px-2 pb-2 text-xs font-medium text-slate-500">{pet.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm font-medium text-slate-500">No pets yet. Add a name and whether they are a dog or cat.</p>
        )}
        <p className="mt-4 text-sm font-semibold text-slate-700">Emergency contact: {emergency}</p>
        <Link href="/customer/dashboard/profile/emergency-contact" className="mt-1 inline-flex text-sm font-bold text-[#0D5C3A]">Edit emergency contact</Link>
      </section>

      <section id="preferences" className={card}>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-[#0D5C3A]" />
          <h2 className="font-black text-slate-950">Preferences</h2>
        </div>
        <p className="mt-1 text-sm font-medium text-slate-500">These choices are for pet care only. They do not change Guru services or staff settings.</p>
        <p className="mt-3 text-sm font-semibold text-slate-700">{careNotes || "Care preferences are not added yet."}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/customer/dashboard/profile/care-notes" className="inline-flex min-h-10 items-center rounded-full border border-emerald-200 px-3 text-sm font-bold text-[#0D5C3A]">Care preferences</Link>
          <Link href="/customer/dashboard/profile/notifications" className="inline-flex min-h-10 items-center rounded-full border border-emerald-200 px-3 text-sm font-bold text-[#0D5C3A]">Notifications</Link>
        </div>
        <ul className="mt-3 space-y-1 text-sm font-semibold text-slate-700">
          <li className="flex items-center gap-2"><Bell size={14} /> Booking updates: {notifications.booking ? "On" : "Off"}</li>
          <li>Messages: {notifications.messages ? "On" : "Off"}</li>
          <li>Email updates: {notifications.offers ? "On" : "Off"}</li>
        </ul>
      </section>

      <section id="security" className={card}>
        <h2 className="flex items-center gap-2 font-black text-slate-950"><Lock size={16} /> Account & Security</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">Sign-in and password belong to the one SitGuru account.</p>
        <Link href="/customer/dashboard/profile/basic-info" className="mt-3 flex min-h-11 items-center justify-between border-b border-slate-100 text-sm font-semibold text-slate-700">
          Name, phone, and photo <ChevronRight size={16} />
        </Link>
        <Link href="/forgot-password" className="flex min-h-11 items-center justify-between text-sm font-semibold text-slate-700">
          Password <ChevronRight size={16} />
        </Link>
      </section>

      <section id="roles" className={card}>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-[#0D5C3A]" />
          <h2 className="font-black text-slate-950">My SitGuru Roles</h2>
        </div>
        <p className="mt-1 text-sm font-medium text-slate-500">Open a portal only when that role is already approved. Asking for access does not grant it.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {roles.map((role) => (
            <li key={role.id}>
              <Link href={role.href} className={`block rounded-2xl border p-3 ${role.active ? "border-emerald-200 bg-[#F0FDF4]" : "border-slate-100 bg-[#F8FAFC]"}`}>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0D5C3A]"><UserRound size={16} /></span>
                <p className="mt-2 font-black text-slate-950">{role.title}</p>
                <p className="text-xs font-medium leading-5 text-slate-500">{role.detail}</p>
                <p className={`mt-2 text-xs font-bold ${role.active ? "text-[#0D5C3A]" : "text-slate-400"}`}>{role.active ? "Open portal" : "Not approved"}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="font-black text-slate-950">{title}</h2>
      <Link href={href} className="text-sm font-bold text-[#0D5C3A]">Edit</Link>
    </div>
  );
}
