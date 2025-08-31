"use client";

import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

// This is the root page of the application.
// Its only job is to show a loading spinner while the AuthProvider
// determines the user's authentication status and performs any necessary redirects.
// The actual redirect logic has been moved into the AuthProvider itself.
export default function RootPage() {
  const { isReady } = useAuth();

  // If the AuthProvider is not ready yet, we show a loading spinner.
  // Once it is ready, it will either render the children (if logged in)
  // or handle the redirect to the sign-in page on its own.
  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Render nothing here, allowing AuthProvider to show the main app or redirect.
  // This avoids a flash of content before the redirect can occur.
  return null;
}
