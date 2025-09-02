// src/app/(main)/payment/success/page.tsx
"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firebaseServices, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const finalizePayment = async () => {
      const sessionId = searchParams.get('session_id');
      const uid = searchParams.get('uid');

      if (!sessionId || !uid) {
        toast({ variant: 'destructive', title: 'Error', description: 'Missing payment information.' });
        router.replace('/home');
        return;
      }

      if (user && user.uid !== uid) {
        toast({ variant: 'destructive', title: 'Error', description: 'User mismatch. Cannot process payment.' });
        router.replace('/home');
        return;
      }

      if (!firebaseServices?.functions) {
        toast({ variant: 'destructive', title: 'Error', description: 'Payment processing service is unavailable.' });
        router.replace('/home');
        return;
      }

      try {
        const finalizeStripePayment = httpsCallable(firebaseServices.functions, 'finalizeStripePayment');
        const result = await finalizeStripePayment({ sessionId, uid });
        const data = result.data as { success: boolean; message?: string };
        
        if (data.success) {
          toast({ title: 'Payment Successful!', description: data.message });
        } else {
          throw new Error(data.message || 'An unknown error occurred.');
        }

      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Payment Finalization Failed', description: error.message });
      } finally {
        // --- RELIABLE REDIRECT ---
        // For iOS (Capacitor), this custom URL scheme will switch back to the app.
        // For web browsers, it does nothing gracefully.
        window.location.href = 'udry://account/balance';

        // As a fallback for browsers where the above doesn't work,
        // we'll redirect to the home page after a short delay.
        setTimeout(() => {
          router.replace('/account/balance');
        }, 1500);
      }
    };

    finalizePayment();
  }, [searchParams, router, firebaseServices, toast, user]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Finalizing your payment, please wait...</p>
    </div>
  );
}


export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <SuccessPageContent />
        </Suspense>
    )
}
