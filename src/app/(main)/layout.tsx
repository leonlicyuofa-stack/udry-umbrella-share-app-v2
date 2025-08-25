
// src/app/(main)/layout.tsx
"use client";

import { MainAppChrome } from '@/components/layout/main-app-chrome';

// This layout is for all pages within the (main) route group.
// It wraps the main app pages with the header and rental timer.
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <MainAppChrome>
        {children}
      </MainAppChrome>
  );
}
