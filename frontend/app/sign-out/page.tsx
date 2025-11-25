'use client';

import { useClerk } from '@clerk/nextjs';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function SignOutPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    signOut({ redirectUrl: '/sign-in' });
  }, [signOut]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-elite-blue mx-auto" />
        <p className="text-elite-dark dark:text-white text-lg">Signing you out...</p>
      </div>
    </div>
  );
}

