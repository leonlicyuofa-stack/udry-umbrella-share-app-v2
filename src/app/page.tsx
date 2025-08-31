// src/app/page.tsx
"use client";

import { Loader2 } from 'lucide-react';

// This is a simple client-side component that shows a loading indicator.
// The AuthProvider will handle redirecting the user away from this page
// to either the sign-in page or the main app.
export default function RootPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading App...</p>
      </div>
    </div>
  );
}
