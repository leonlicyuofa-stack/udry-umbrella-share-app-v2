
"use client";

import { MainAppChrome } from '@/components/layout/main-app-chrome';
import { StallsProvider } from '@/contexts/stalls-context';
import { cn } from '@/lib/utils';
import { DeepLinkHandler } from '@/components/deep-link-handler';
import { Toaster } from '@/components/ui/toaster';
import { SignUpSuccessDialog } from '@/components/auth/sign-up-success-dialog';
import { useEffect, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, type StatusBarInfo } from '@capacitor/status-bar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const layoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setAndroidPadding = async () => {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        try {
          const info = await StatusBar.getInfo();
          
          if (layoutRef.current) {
            layoutRef.current.style.paddingTop = `${(info as any).height}px`;
          }
        } catch (e) {
          console.error("Error getting status bar info:", e);
        }
      }
    };

    setAndroidPadding();
  }, []);

  return (
    <StallsProvider>
      <div 
        ref={layoutRef}
        className={cn(
          "min-h-screen flex flex-col",
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
