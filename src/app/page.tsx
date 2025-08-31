
"use client";

import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

// This is the root page of the application.
// Its only job is to show a loading spinner while the AuthProvider
// determines the user's authentication status and performs any necessary redirects.
// The actual redirect logic has been moved into the AuthProvider itself to fix the redirect loop.
export default function RootPage() {
  const { isReady } = useAuth();

  // The AuthProvider will handle redirecting the user.
  // We just need to show a loading state until that happens.
  // This prevents the page from trying to render content before the auth state is known.
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
