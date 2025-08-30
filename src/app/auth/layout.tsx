
import type React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { AppLogo } from '@/components/layout/app-logo';
import { AuthProvider } from '@/contexts/auth-context';
import { DeepLinkHandler } from '@/components/deep-link-handler';


// This is a Server Component layout. It handles the static parts of the page.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // This outer div provides a separate layout for the auth pages,
    // ensuring they don't get the main app Header.
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/30 p-4">
      <div className="absolute top-6 left-6">
        <Link href="/" aria-label="U-Dry Home">
           <AppLogo />
        </Link>
      </div>
      <div className="w-full max-w-md">
        {/* AuthProvider is added here to wrap all auth-related pages */}
        <AuthProvider>
          <DeepLinkHandler />
          {/* Suspense boundary is crucial for components that use client-side hooks like useSearchParams */}
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          }>
            {children}
          </Suspense>
        </AuthProvider>
      </div>
    </div>
  );
}
