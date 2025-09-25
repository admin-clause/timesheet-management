import { type Session } from "next-auth";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if the user in the session has the ADMIN role.
 * @param session The NextAuth session object.
 * @returns True if the user is an ADMIN, false otherwise.
 */
export const isAdmin = (session: Session | null): boolean => {
  return session?.user?.role === 'ADMIN';
};