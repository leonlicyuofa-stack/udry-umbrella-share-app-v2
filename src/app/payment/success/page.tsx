
"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Loader2, AlertTriangle, Terminal, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { initializeFirebaseServices, type FirebaseServices } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';

type UpdateStatus = 'idle' | 'processing' | 'success' | 'error';

function PaymentSuccessContent() {
    console.log('[TEST] PaymentSuccessContent component has started rendering.');

    const searchParams = useSearchParams();
    const [status, setStatus] = useState<UpdateStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const hasProcessed = useRef(false);

    useEffect(() => {
        console.log('[TEST] useEffect hook has started.');
        
        if (hasProcessed.current) {
            console.log('[TEST] useEffect hook stopped: hasProcessed is true.');
            return;
        }
        hasProcessed.current = true;

        console.log('[TEST] Attempting to initialize Firebase services...');
        const services = initializeFirebaseServices();

        if (!services) {
            console.error('[TEST] Firebase initialization FAILED. The services object is null.');
            setErrorMessage("TEST LOG: Firebase services failed to initialize.");
            setStatus('error');
            return;
        }
        
        console.log('[TEST] Firebase initialization SUCCEEDED.');

        const sessionId = searchParams.get('session_id');
        const uid = searchParams.get('uid');

        if (!sessionId || !uid) {
            console.error('[TEST] Missing sessionId or uid in URL.');
            setErrorMessage("TEST LOG: Missing session or user info.");
            setStatus('error');
            return;
        }

        console.log(`[TEST] Found sessionId: ${sessionId} and uid: ${uid}. Preparing to call function.`);
        setStatus('processing');
        
        // This is a minimal test call. We don't need the 10-second delay for this test.
        const finalizeStripePayment = httpsCallable(services.functions, 'finalizeStripePayment');
        finalizeStripePayment({ sessionId, uid })
            .then(result => {
                console.log('[TEST] Cloud Function call SUCCEEDED.', result);
                setStatus('success');
            })
            .catch(error => {
                console.error('[TEST] Cloud Function call FAILED.', error);
                setErrorMessage(`TEST LOG: Function call failed: ${error.message}`);
                setStatus('error');
            });

    }, [searchParams]);
    
    // Simplified render for the test
    return (
        <Card className="w-full max-w-lg text-center shadow-xl">
            <CardHeader>
                 <CardTitle className="mt-4 text-2xl font-bold">Running Payment Test...</CardTitle>
                 <CardDescription>Check the Safari Web Inspector Console for logs.</CardDescription>
            </CardHeader>
            <CardContent>
                {status === 'processing' && <Loader2 className="h-8 w-8 animate-spin mx-auto" />}
                {status === 'success' && <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />}
                {status === 'error' && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Test Failed</AlertTitle>
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
             <CardFooter>
                 <Button onClick={() => { window.location.href = `udry://home`; }} className="w-full">
                    Go Back to App
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function PaymentSuccessPage() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] p-4">
             <Suspense fallback={<div className="text-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <PaymentSuccessContent />
            </Suspense>
        </div>
    )
}
