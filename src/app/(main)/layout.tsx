
"use client";

import { MainAppChrome } from '@/components/layout/main-app-chrome';
import { StallsProvider } from '@/contexts/stalls-context';
import { cn } from '@/lib/utils';

// This layout is for all pages within the (main) route group.
// It wraps the main app pages with the header and rental timer.
// AuthProvider and DeepLinkHandler are now in the root layout.
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StallsProvider>
      <div className="flex min-h-screen flex-col pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <MainAppChrome>
          {children}
        </MainAppChrome>
      </div>
    </StallsProvider>
  );
}
