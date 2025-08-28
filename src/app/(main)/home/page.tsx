// src/app/(main)/home/page.tsx
import { MapPageClient } from '@/components/map/map-page-client';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Metadata } from 'next';
import { cn } from '@/lib/utils';

// Metadata for the new logged-in homepage.
export const metadata: Metadata = {
  title: 'Home - U-Dry',
  description: 'Find nearby U-Dry umbrella stalls and check real-time availability.',
};

// This is the new main landing page for authenticated users.
// The ScrollArea component now wraps the content to ensure it is scrollable
// on all devices, especially within the Capacitor webview.
export default function HomePage() {
  return (
    <ScrollArea className="h-full">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <MapPageClient />
      </div>
    </ScrollArea>
  );
}
