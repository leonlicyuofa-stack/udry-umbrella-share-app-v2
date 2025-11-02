"use client";

import { MainAppChrome } from '@/components/layout/main-app-chrome';
import { StallsProvider } from '@/contexts/stalls-context';
import { cn } from '@/lib/utils';
import { DeepLinkHandler } from '@/components/deep-link-handler';
import { Toaster } from '@/components/ui/toaster';
import { SignUpSuccessDialog } from '@/components/auth/sign-up-success-dialog';
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [platform, setPlatform] = useState<string>('web');

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setPlatform(Capacitor.getPlatform());
    }
  }, []);

  return (
    <StallsProvider>
      {/* This container now ONLY provides the safe-area padding for Android. */}
      <div 
        className={cn(
          "min-h-screen flex flex-col",
          // Apply top padding only on Android. iOS handles this with contentInset.
          platform === 'android' && "pt-[env(safe-area-inset-top)]",
          "pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
        )}
      >
        <DeepLinkHandler />
        <MainAppChrome>
          {children}
        </MainAppChrome>
        <Toaster />
        <SignUpSuccessDialog />
      </div>
    </StallsProvider>
  );
}
