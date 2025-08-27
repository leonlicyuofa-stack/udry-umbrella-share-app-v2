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
    if (sessionId) {
      // This page is now just a bridge. It immediately redirects to the
      // external success page, which will then trigger the deep link.
      router.replace(`/payment/success?session_id=${sessionId}`);
    } else {
      // If there's no session ID, send to an external cancel page.
      router.replace('/payment/cancel');
    }
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Please Wait</CardTitle>
          <CardDescription>
            Securely connecting to payment services...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">You will be redirected momentarily.</p>
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
