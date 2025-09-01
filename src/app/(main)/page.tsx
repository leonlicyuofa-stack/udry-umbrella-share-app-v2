// src/app/(main)/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

// This is the new landing page for the (main) authenticated route group.
// Its only job is to redirect to the actual homepage ('/home').
// Because it's inside the (main) group, it is correctly wrapped by AuthProvider.
export default function MainPage() {
  const router = useRouter();
  const { isReady } = useAuth();

  useEffect(() => {
    // We wait for the auth context to be ready, then redirect.
    // This prevents any race conditions.
    if (isReady) {
      router.replace('/home');
    }
  }, [isReady, router]);

  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
