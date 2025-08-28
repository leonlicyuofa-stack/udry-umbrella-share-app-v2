// src/components/layout/main-app-chrome.tsx
"use client";

import { Header } from '@/components/layout/header';
import { RentalTimer } from '@/components/rental/rental-timer';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

// This is a client component that wraps the main part of the application.
// It ensures that the Header and RentalTimer are only shown on pages
// that are part of the main app experience, not on auth or payment pages.
export function MainAppChrome({ children }: { children: React.ReactNode }) {
  const { isReady } = useAuth();

  return (
    <>
      <Header />
      <main className={cn("flex-1 overflow-y-auto")}>
        {children}
      </main>
      {/* The rental timer will only show up if there is an active rental */}
      {isReady && <RentalTimer />}
    </>
  );
}
