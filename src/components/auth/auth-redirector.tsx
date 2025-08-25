// src/components/auth/auth-redirector.tsx
"use client";

import type React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

// This is a Client Component. Its job is to handle client-side logic.
export function AuthRedirector({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Once auth state is ready and we confirm there IS a user, redirect them away from the auth pages.
    if (isReady && user) {
      const redirectUrl = searchParams.get('redirect') || '/';
      router.replace(redirectUrl);
    }
  }, [user, isReady, router, searchParams]);

  // While checking auth state, or if a redirect is about to happen, show a loader.
  // This prevents the sign-in form from flashing on screen for an already logged-in user.
  if (!isReady || (isReady && user)) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If auth is ready and there's NO user, show the actual sign-in/sign-up form.
  return <>{children}</>;
}
