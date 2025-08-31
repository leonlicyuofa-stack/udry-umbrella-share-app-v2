
"use client";

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// This is the root page of the application.
// Its only job is to redirect the user to the correct page
// based on their authentication status, after ensuring auth is ready.
function RootRedirectPage() {
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the authentication state is confirmed via isReady.
    // This prevents a race condition where the redirect happens
    // before Firebase has initialized.
    if (!isReady) {
      return;
    }

    // If the user is logged in, redirect them to the main map page.
    if (user) {
      router.replace('/home');
    } else {
      // If the user is not logged in, send them to the sign-in page.
      router.replace('/auth/signin');
    }
  }, [user, isReady, router]);

  // Render a loading spinner while the authentication check is happening.
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

// The root page now relies on the root AuthProvider from layout.tsx.
export default function RootPage() {
    return <RootRedirectPage />;
}
