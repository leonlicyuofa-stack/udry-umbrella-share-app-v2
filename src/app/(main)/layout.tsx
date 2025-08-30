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
    <>
      {/* --- NEW DIAGNOSTIC TEST --- */}
      <div style={{
        backgroundColor: 'red',
        color: 'white',
        padding: '10px',
        textAlign: 'center',
        fontWeight: 'bold',
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        fontSize: '14px'
      }}>
        DIAGNOSTIC: If you see this on the payment success page, the WRONG LAYOUT is being used.
      </div>
      {/* --- END DIAGNOSTIC TEST --- */}
      <MainAppChrome>
        {children}
      </MainAppChrome>
    </>
  );
}
