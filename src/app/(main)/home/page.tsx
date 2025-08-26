// src/app/(main)/home/page.tsx
import { MapPageClient } from '@/components/map/map-page-client';
import type { Metadata } from 'next';

// Metadata for the new logged-in homepage.
export const metadata: Metadata = {
  title: 'Home - U-Dry',
  description: 'Find nearby U-Dry umbrella stalls and check real-time availability.',
};

// This is the new main landing page for authenticated users.
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <MapPageClient />
    </div>
  );
}
