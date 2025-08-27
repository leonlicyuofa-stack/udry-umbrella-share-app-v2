import type React from 'react';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLogo } from '@/components/layout/app-logo';
import Link from 'next/link';

// This layout is now ONLY for the EXTERNAL redirect page.
// It ensures it doesn't get the main app header.
export default function ExternalPaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/30 p-4">
       <div className="absolute top-6 left-6">
        <Link href="/" aria-label="U-Dry Home">
           <AppLogo />
        </Link>
      </div>
      <div className="w-full max-w-lg">
        <Suspense fallback={
          <Card className="w-full max-w-lg text-center shadow-xl">
            <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
                <CardTitle className="mt-4 text-2xl font-bold">Loading Payment Status</CardTitle>
                <CardDescription>
                    Please wait while we securely retrieve your payment details...
                </CardDescription>
            </CardHeader>
          </Card>
        }>
            {children}
        </Suspense>
      </div>
    </div>
  );
}
