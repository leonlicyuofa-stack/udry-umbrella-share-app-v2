
"use client";

import { MainAppChrome } from '@/components/layout/main-app-chrome';

// This layout is for all pages within the (main) route group.
// It wraps the main app pages with the header and rental timer.
// AuthProvider and DeepLinkHandler are now in the root layout.
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("TRACE: src/app/(main)/layout.tsx - MainLayout rendering");
  return (
    <MainAppChrome>
      {children}
    </MainAppChrome>
  );
}
