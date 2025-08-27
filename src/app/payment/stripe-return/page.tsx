"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

function StripeReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const appUrl = `udry://payment/success?session_id=${sessionId}`;

    if (sessionId) {
      // Attempt to redirect to the custom URL scheme.
      window.location.href = appUrl;
      
      // Fallback for browsers/environments where direct redirect might fail
      // Pushing to a known page within the app after a delay.
      setTimeout(() => {
        router.push('/home'); 
      }, 1500);

    } else {
      // If there's no session ID, just go home.
      router.push('/home');
    }
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Finalizing Payment</CardTitle>
          <CardDescription>
            Returning you to the app...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">If the app does not open automatically, please open it manually.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StripeReturnPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <StripeReturnContent />
        </Suspense>
    )
}
