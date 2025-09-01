
"use client";

import { MainAppChrome } from '@/components/layout/main-app-chrome';
import { StallsProvider } from '@/contexts/stalls-context';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/contexts/auth-context';
import { DeepLinkHandler } from '@/components/deep-link-handler';
import { Toaster } from '@/components/ui/toaster';
import { SignUpSuccessDialog } from '@/components/auth/sign-up-success-dialog';

// This layout is for all pages within the (main) route group.
// It wraps the main app pages with the header and rental timer.
// AuthProvider and DeepLinkHandler are now in this layout to ensure
// all main app components are correctly wrapped.
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider log={() => { /* No-op for normal operation */ }}>
      <StallsProvider>
        <div className="flex min-h-screen flex-col pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
          <DeepLinkHandler />
          <MainAppChrome>
            {children}
          </MainAppChrome>
          <Toaster />
          <SignUpSuccessDialog />
        </div>
      </StallsProvider>
    </AuthProvider>
  );
}
