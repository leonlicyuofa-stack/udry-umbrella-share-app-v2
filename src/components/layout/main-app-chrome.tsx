// src/components/layout/main-app-chrome.tsx
"use client";

import { Header } from '@/components/layout/header';
import { RentalTimer } from '@/components/rental/rental-timer';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { AnnouncementBanner } from './announcement-banner';

// This is a client component that wraps the main part of the application.
// It ensures that the Header and RentalTimer are only shown on pages
// that are part of the main app experience, not on auth or payment pages.
export function MainAppChrome({ children }: { children: React.ReactNode }) {
  const { isReady } = useAuth();

  return (
    // This div now manages the full-screen flex layout
    <div className="flex flex-1 flex-col min-h-0">
      <Header />
      <AnnouncementBanner />
      <main className={cn("flex-1 overflow-y-auto bg-secondary/30")}>
        {children}
      </main>
      {/* The rental timer will only show up if there is an active rental */}
      {isReady && <RentalTimer />}
    </div>
  );
}
