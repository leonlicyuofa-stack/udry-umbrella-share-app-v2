
// src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

// This is the root page for the entire application.
// It is now correctly wrapped by the AuthProvider in the root layout.
// Its sole purpose is to redirect the user to the correct starting page.
export default function RootPage() {
  const router = useRouter();
  const { isReady, user } = useAuth();

  useEffect(() => {
    // The redirect logic has been moved to AuthProvider to handle all cases globally.
    // This component now just shows a loading spinner while AuthProvider makes the decision.
    if (isReady) {
      // If for some reason the redirect in AuthProvider didn't fire,
      // this provides a fallback.
      if (user) {
        router.replace('/home');
      } else {
        router.replace('/auth/signin');
      }
    }
  }, [isReady, user, router]);

  // Render a loading spinner while the auth check and redirect are in progress.
  // This is what the user will see for a brief moment.
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
