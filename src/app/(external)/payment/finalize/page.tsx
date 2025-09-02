// src/app/(external)/payment/finalize/page.tsx

import { Suspense } from 'react';
import { httpsCallable } from 'firebase/functions';
import { initializeFirebaseServices } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { ClientRedirect } from './client-redirect';

// This is a React Server Component (default in Next.js App Router)
// It will run on the server, call the Cloud Function, and then render the result.
async function finalizePaymentOnServer(sessionId: string | null, uid: string | null): Promise<{ success: boolean; message: string }> {
  if (!sessionId || !uid) {
    return { success: false, message: "Session ID or User ID is missing from the URL." };
  }

  const services = initializeFirebaseServices();
  if (!services) {
    return { success: false, message: "Could not connect to backend services to finalize payment." };
  }

  try {
    const finalizeStripePayment = httpsCallable(services.functions, 'finalizeStripePayment');
    const result = await finalizeStripePayment({ sessionId, uid });
    const data = result.data as { success?: boolean; message?: string };

    if (!data.success) {
      throw new Error(data.message || 'The server reported an error processing the payment.');
    }
    
    return { success: true, message: data.message || "Payment processed successfully." };

  } catch (error: any) {
    console.error("Error finalizing Stripe payment on server:", error);
    return { success: false, message: error.message || "An unexpected error occurred." };
  }
}

// The main page component
export default async function FinalizePaymentPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const sessionId = typeof searchParams.session_id === 'string' ? searchParams.session_id : null;
  const uid = typeof searchParams.uid === 'string' ? searchParams.uid : null;
  
  const result = await finalizePaymentOnServer(sessionId, uid);

  return (
    <Card className="w-full max-w-lg text-center shadow-xl">
      <CardHeader>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          {result.success ? <CheckCircle className="h-8 w-8 text-green-600" /> : <AlertTriangle className="h-8 w-8 text-red-600" />}
        </div>
        <CardTitle className="mt-4 text-2xl font-bold">
          {result.success ? 'Payment Successful!' : 'Payment Failed'}
        </CardTitle>
        <CardDescription>
          {result.success ? 'Your account has been updated. You will be redirected back to the app shortly.' : 'There was an issue finalizing your payment.'}
        </CardDescription>
      </CardHeader>
      {!result.success && (
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription>
              {result.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
      <CardFooter>
        <Button onClick={() => {}} className="w-full" disabled>
          Returning to App <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
      
      {/* This client component handles the redirect after the server logic is done */}
      {result.success && <ClientRedirect />}
    </Card>
  );
}
