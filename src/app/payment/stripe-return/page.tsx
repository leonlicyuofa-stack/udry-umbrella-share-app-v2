"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

// This component now runs in the temporary browser after Stripe redirects.
// Its ONLY job is to trigger the deep link to re-open the main app.
function StripeReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { translate } = useLanguage();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // This is the deep link that tells the native app to open to a specific page.
      // It passes the session ID along.
      window.location.href = `udry://payment/success?session_id=${sessionId}`;
    } else {
      // If there's no session ID, send to an external cancel page.
      router.replace('/payment/cancel');
    }
  }, [searchParams, router]);

  return (
    <Card className="w-full max-w-lg text-center shadow-xl">
      <CardHeader>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="mt-4 text-2xl font-bold">Payment Authorized!</CardTitle>
        <CardDescription>
          Finalizing payment... Returning you to the U-Dry app now.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
        <p className="text-xs text-muted-foreground mt-4">
          If you are not automatically returned to the app, please switch back manually.
        </p>
      </CardContent>
    </Card>
  );
}

// The page component wraps the client component in Suspense
export default function StripeReturnPage() {
    return (
        <Suspense fallback={<div className="text-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <StripeReturnContent />
        </Suspense>
    )
}
