'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

/**
 * A client component that handles user sign-out.
 * On click, it calls the `signOut` function from NextAuth.js and redirects
 * the user to the sign-in page upon successful logout.
 */
export function LogoutButton() {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <Button variant="outline" onClick={handleSignOut}>
      Log Out
    </Button>
  );
}
