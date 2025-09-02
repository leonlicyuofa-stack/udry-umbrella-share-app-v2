"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { initializeFirebaseServices } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

type UpdateStatus = 'processing' | 'success' | 'error';

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<UpdateStatus>('processing');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const hasProcessed = useRef(false);

    useEffect(() => {
        if (hasProcessed.current) return;

        const processPayment = async () => {
            hasProcessed.current = true; 
            
            const sessionId = searchParams.get('session_id');
            const uid = searchParams.get('uid');

            if (!sessionId || !uid) {
                setErrorMessage("Session ID or User ID is missing from the URL.");
                setStatus('error');
                return;
            }
            
            const services = initializeFirebaseServices();
            if (!services) {
                setErrorMessage("Could not connect to backend services to finalize payment.");
                setStatus('error');
                return;
            }

            try {
                const finalizeStripePayment = httpsCallable(services.functions, 'finalizeStripePayment');
                const result = await finalizeStripePayment({ sessionId, uid });
                const data = result.data as { success?: boolean; message?: string };

                if (!data.success) {
                    throw new Error(data.message || 'The server reported an error processing the payment.');
                }

                setStatus('success');
                
                // --- NEW CONDITIONAL REDIRECT LOGIC ---
                // This checks if the user agent string does NOT contain "Android".
                // This allows the iOS custom scheme redirect to work, while Android
                // relies on its native App Links to handle returning to the app.
                if (navigator.userAgent && !/android/i.test(navigator.userAgent)) {
                    // This code will now ONLY run for non-Android devices (like iOS).
                    window.location.href = `udry://account/balance`;
                }
                // For Android, we do nothing and let the OS handle the redirect.

            } catch (error: any) {
                console.error("Error finalizing Stripe payment:", error);
                setErrorMessage(error.message || "An unexpected error occurred.");
                setStatus('error');
            }
        };
        
        processPayment();

    }, [searchParams]);

    return (
        <Card className="w-full max-w-lg text-center shadow-xl">
            <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    {status === 'processing' && <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />}
                    {status === 'success' && <CheckCircle className="h-8 w-8 text-green-600" />}
                    {status === 'error' && <AlertTriangle className="h-8 w-8 text-red-600" />}
                </div>
                <CardTitle className="mt-4 text-2xl font-bold">
                    {status === 'processing' && 'Finalizing Payment...'}
                    {status === 'success' && 'Payment Successful!'}
                    {status === 'error' && 'Payment Failed'}
                </CardTitle>
                <CardDescription>
                    {status === 'processing' && 'Please wait while we securely update your account. Do not close this window.'}
                    {status === 'success' && 'Your account has been updated. Please click the button below to return to the app.'}
                    {status === 'error' && 'There was an issue finalizing your payment.'}
                </CardDescription>
            </CardHeader>
            {status === 'error' && (
                <CardContent>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error Details</AlertTitle>
                        <AlertDescription>
                            {errorMessage}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            )}
            <CardFooter>
                 <Button onClick={() => { window.location.href = `udry://account/balance`; }} className="w-full">
                    Go Back to App <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}

// Wrap the client component in Suspense to handle useSearchParams()
export default function PaymentSuccessPage() {
    return (
         <Suspense fallback={<div>Loading...</div>}>
            <PaymentSuccessContent />
         </Suspense>
    )
}
