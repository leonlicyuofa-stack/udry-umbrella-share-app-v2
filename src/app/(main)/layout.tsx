
"use client";

import { MainAppChrome } from '@/components/layout/main-app-chrome';
import { AuthProvider } from '@/contexts/auth-context';
import { DeepLinkHandler } from '@/components/deep-link-handler';
import { SignUpSuccessDialog } from '@/components/auth/sign-up-success-dialog';

// This layout is for all pages within the (main) route group.
// It wraps the main app pages with AuthProvider, DeepLinkHandler, header and rental timer.
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DeepLinkHandler />
      <MainAppChrome>
        {children}
      </MainAppChrome>
      <SignUpSuccessDialog />
    </AuthProvider>
  );
}
