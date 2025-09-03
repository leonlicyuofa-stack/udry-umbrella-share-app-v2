// This layout is for the store-specific pages like screenshot templates.
// It provides a clean, chromeless canvas without the main app header or navigation.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'U-Dry Store Assets',
  description: 'Preview pages for generating app store materials.',
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
