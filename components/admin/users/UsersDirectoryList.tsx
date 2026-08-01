import UserDirectoryCard from "@/components/admin/users/UserDirectoryCard";
import type { DirectoryUser } from "@/lib/admin/users/types";

export default function UsersDirectoryList({
  users,
}: {
  users: DirectoryUser[];
}) {
  if (!users.length) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[#d7e4da] bg-white p-10 text-center">
        <h3 className="text-xl font-black text-slate-950">No users found</h3>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Try a different search, role, status, or source filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <UserDirectoryCard
          key={`${user.source}-${user.id}-${user.email}`}
          user={user}
        />
      ))}
    </div>
  );
}
