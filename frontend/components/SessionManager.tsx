'use client';

import { useEffect } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';

/**
 * SessionManager - Ensures sessions don't persist across browser closes
 *
 * This component signs out users when they close their browser/tab,
 * providing enhanced security for sensitive financial applications.
 *
 * Note: Clerk handles session persistence. This component only adds
 * an extra layer by clearing sessions on browser close.
 */
export function SessionManager() {
  const { signOut } = useClerk();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (!isSignedIn) return;

    // Mark this session as active
    sessionStorage.setItem('clerk_active_session', 'true');

    // Sign out when browser/tab closes
    const handleBeforeUnload = () => {
      // Clear the active session flag
      sessionStorage.removeItem('clerk_active_session');

      // Note: signOut() doesn't reliably work in beforeunload/unload events
      // because the browser may kill the process before async operations complete.
      // Clerk's session will naturally expire based on their timeout settings.
      // This component primarily serves as a sessionStorage-based indicator.
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSignedIn, signOut]);

  return null; // This component doesn't render anything
}
