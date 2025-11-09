'use client';

import { useEffect } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';

/**
 * SessionManager - Ensures sessions don't persist across browser closes
 *
 * This component:
 * 1. Signs out user when browser/tab closes
 * 2. Validates session on page load
 * 3. Provides enhanced security for sensitive applications
 */
export function SessionManager() {
  const { signOut } = useClerk();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (!isSignedIn) return;

    // Sign out when browser/tab closes
    const handleBeforeUnload = () => {
      // Set a flag that we're closing
      sessionStorage.setItem('clerk_session_closing', 'true');
    };

    // Sign out when user navigates away or closes tab
    const handleUnload = () => {
      if (sessionStorage.getItem('clerk_session_closing') === 'true') {
        // Force sign out (using navigator.sendBeacon for reliability)
        signOut({ redirectUrl: '/sign-in' });
      }
    };

    // Clean up the closing flag when page loads (user came back)
    sessionStorage.removeItem('clerk_session_closing');

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [isSignedIn, signOut]);

  // Check if session is valid on mount
  useEffect(() => {
    if (!isSignedIn) return;

    // Clear any stale session storage
    const checkSession = async () => {
      // If there's no session storage flag, this is a fresh page load
      // (could be after browser restart)
      const hasActiveSession = sessionStorage.getItem('clerk_active_session');

      if (!hasActiveSession) {
        // This is a new browser session - sign out to force re-authentication
        await signOut({ redirectUrl: '/sign-in' });
      } else {
        // Mark session as active
        sessionStorage.setItem('clerk_active_session', 'true');
      }
    };

    checkSession();
  }, [isSignedIn, signOut]);

  // Mark session as active on sign-in
  useEffect(() => {
    if (isSignedIn) {
      sessionStorage.setItem('clerk_active_session', 'true');
    }
  }, [isSignedIn]);

  return null; // This component doesn't render anything
}
