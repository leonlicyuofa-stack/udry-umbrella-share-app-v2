import type React from 'react';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// This is a Server Component layout. It handles the static parts of the page.
export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // This outer div provides a separate layout for the payment pages,
    // ensuring they don't get the main app Header.
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-lg">
        {/* Suspense boundary is crucial for components that use client-side hooks like useSearchParams */}
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
