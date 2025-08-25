// src/app/(main)/page.tsx
import { MapPageClient } from '@/components/map/map-page-client';
import type { Metadata } from 'next';

// Since this is the main landing page, we can set metadata here.
export const metadata: Metadata = {
  title: 'Find a Stall - U-Dry',
  description: 'Find nearby U-Dry umbrella stalls and check real-time availability.',
};

// This is the main landing page of the application.
// It is a Server Component that renders the client-side map component.
export default function MainPage() {
  // The py-8 (padding-top/bottom) and px-4 (padding-left/right) classes are added here to fix the layout.
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <MapPageClient />
    </div>
  );
}
