"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  useUserModerationActions,
  type UseUserModerationActionsResult,
  type UserModerationActionsOptions,
} from "@/hooks/useUserModerationActions";
import type { DirectoryUserContext } from "@/lib/admin/user-directory-actions";

const UserDirectoryActionsContext =
  createContext<UseUserModerationActionsResult | null>(null);

export function UserDirectoryActionsProvider({
  selectedUser,
  children,
}: {
  selectedUser?: DirectoryUserContext | null;
  children: ReactNode;
}) {
  const options = useMemo<UserModerationActionsOptions>(
    () => ({ selectedUser: selectedUser || null }),
    [
      selectedUser?.id,
      selectedUser?.email,
      selectedUser?.name,
      selectedUser?.role,
      selectedUser?.source,
    ],
  );

  const value = useUserModerationActions(options);

  return (
    <UserDirectoryActionsContext.Provider value={value}>
      {children}
    </UserDirectoryActionsContext.Provider>
  );
}

export function useUserDirectoryActions() {
  const value = useContext(UserDirectoryActionsContext);
  if (!value) {
    throw new Error(
      "useUserDirectoryActions must be used within UserDirectoryActionsProvider.",
    );
  }
  return value;
}
