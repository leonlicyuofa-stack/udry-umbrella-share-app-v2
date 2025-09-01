// src/app/(main)/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

// This is the new root page for the main application section.
// It is correctly wrapped by the AuthProvider in the (main)/layout.tsx file.
// Its sole purpose is to redirect the user to the correct starting page.
export default function MainPage() {
  const router = useRouter();
  const { isReady, user } = useAuth();

  useEffect(() => {
    // Wait until the auth state is fully determined.
    if (isReady) {
       // All users inside the (main) group should be authenticated.
       // The primary landing page for an authenticated user is /home.
       router.replace('/home');
    }
  }, [isReady, router]);

  // Render a loading spinner while the auth check and redirect are in progress.
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
