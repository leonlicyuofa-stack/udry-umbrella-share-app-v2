// src/app/(main)/rent/[stallId]/page.tsx
// This page is now a pure Server Component responsible for static generation.
// All client-side logic is handled by RentPageClient.

import RentPageClient from './rent-page-client';
import { mockStalls } from '@/lib/mock-data';

// This function is required for static site generation with dynamic routes.
// It tells Next.js which stall pages to build ahead of time.
export async function generateStaticParams() {
  // We use the dvid from mockStalls as it's the unique identifier used for document IDs.
  // In our firestore setup, the document ID is the dvid.
  // We also filter to only generate pages for stalls that are marked as deployed.
  return mockStalls
    .filter((stall) => stall.isDeployed)
    .map((stall) => ({
      stallId: stall.dvid,
    }));
}


export default function RentPage() {
  // We no longer fetch data here. We simply render the client component
  // which will pull the stall data from its own context and hooks.
  return <RentPageClient />;
}
