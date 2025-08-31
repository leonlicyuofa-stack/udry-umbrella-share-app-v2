
"use client";

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// This is the root page of the application.
// Its only job is to redirect the user to the correct page
// based on their authentication status.
function RootRedirectPage() {
  console.log("TRACE: src/app/page.tsx - RootRedirectPage rendering");
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the authentication state is ready.
    if (!isReady) {
      console.log("TRACE: src/app/page.tsx - Auth not ready, waiting.");
      return;
    }

    // If the user is logged in, redirect them to the main map page.
    if (user) {
      console.log("TRACE: src/app/page.tsx - User is logged in. Redirecting to /home");
      router.replace('/home');
    } else {
      // If the user is not logged in, send them to the sign-in page.
      console.log("TRACE: src/app/page.tsx - User is logged out. Redirecting to /auth/signin");
      router.replace('/auth/signin');
    }
  }, [user, isReady, router]);

  // Render a loading spinner while the redirect is happening.
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
