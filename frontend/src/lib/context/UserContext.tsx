"use client";

import { createContext, useContext } from "react";

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  role: {
    name: string; // DB system name, e.g. "SUPER_ADMIN"
    displayName: string; // e.g. "Super Admin"
  };
  emailVerified?: string;
}

interface UserContextValue {
  user: AppUser;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: AppUser;
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
}

export function useUser(): AppUser {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx.user;
}
