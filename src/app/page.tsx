"use client";

import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

// This is the root page of the application.
// Its only job is to show a loading spinner while the AuthProvider
// determines the user's authentication status and performs any necessary redirects.
// The actual redirect logic has been moved into the AuthProvider itself.
export default function RootPage() {
  const { isReady, loading, user } = useAuth();
  
  // No redirect logic here. This page only displays status.
  // The redirect logic is now handled entirely within AuthProvider.
  
  if (!isReady) {
     return (
        <div className="flex flex-col items-center justify-center h-screen bg-red-100">
            <h1 className="text-3xl font-bold text-red-600">TESTING FILE CHANGE</h1>
            <p className="mt-4 text-red-500">If you see this, the file update worked.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
