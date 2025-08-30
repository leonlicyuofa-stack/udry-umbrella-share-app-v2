// src/app/page.tsx
"use client";

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from '@/contexts/auth-context';
import { DeepLinkHandler } from '@/components/deep-link-handler';

// This is the new root page of the application.
// Its only job is to redirect the user to the correct page
// based on their authentication status.
function RootRedirectPageContent() {
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the authentication state is ready.
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

  // Render a loading spinner while the redirect is happening.
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}


// The root page needs its own AuthProvider to check the user's status.
export default function RootPage() {
    return (
        <AuthProvider>
            <DeepLinkHandler />
            <RootRedirectPageContent />
        </AuthProvider>
    )
}
