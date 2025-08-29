// src/app/(main)/layout.tsx
"use client";

import { MainAppChrome } from '@/components/layout/main-app-chrome';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';


// This layout is for all pages within the (main) route group.
// It wraps the main app pages with the header and rental timer.
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <MainAppChrome>
        {/* --- DIAGNOSTIC TEST --- */}
        <div className="container mx-auto px-4 py-2">
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Diagnostic Alert</AlertTitle>
                <AlertDescription>
                    If you see this on the payment success page in Safari, the wrong layout is being used.
                </AlertDescription>
            </Alert>
        </div>
        {/* --- END DIAGNOSTIC TEST --- */}
        {children}
      </MainAppChrome>
  );
}
