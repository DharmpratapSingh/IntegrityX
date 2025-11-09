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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-white mx-auto" />
        <p className="text-white text-lg">Signing you out...</p>
      </div>
    </div>
  );
}

