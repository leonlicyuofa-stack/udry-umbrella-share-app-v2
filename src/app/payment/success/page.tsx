"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Loader2, AlertTriangle, Terminal, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { initializeFirebaseServices } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

type UpdateStatus = 'idle' | 'processing' | 'success' | 'error';

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const [status, setStatus] = useState<UpdateStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isFunctionNotFoundError, setIsFunctionNotFoundError] = useState(false);
    const [isSessionExpiredError, setIsSessionExpiredError] = useState(false);
    
    const hasProcessed = useRef(false);
    const retryCount = useRef(0);

    const deployCommand = "firebase deploy --only functions";
    const copyDeployCommand = () => {
        navigator.clipboard.writeText(deployCommand).then(() => {
        toast({ title: "Command Copied!", description: "Paste it into your terminal to deploy." });
        }).catch(err => {
        toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy command." });
        });
    };

    const handleRedirectToApp = () => {
        const sessionId = searchParams.get('session_id');
        // This is the deep link that tells the native app to open.
        // It brings the session ID along so the app can verify if needed.
        window.location.href = `udry://payment/success?session_id=${sessionId}`;
        
        // This is a fallback for desktop browsers where the deep link won't work.
        // It will navigate to the homepage after a short delay.
        setTimeout(() => {
            router.push('/home');
        }, 1000);
    };

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const services = initializeFirebaseServices();

        if (!services) {
             setErrorMessage("Could not initialize Firebase services. Please try again later.");
             setStatus('error');
             return;
        }
        
        // We need to make sure a user is signed in on this web page
        // before we can finalize the payment on their behalf.
        const unsubscribe = onAuthStateChanged(services.auth, (user) => {
            if (user) {
                // Once we have a user, proceed with finalization.
                if (hasProcessed.current) return;
                hasProcessed.current = true;

                if (!sessionId) {
                    toast({
                        title: "Invalid Access",
                        description: "No payment session found.",
                        variant: "destructive"
                    });
                    router.replace('/home');
                    return;
                }

                const processPaymentWithRetries = async (sessionId: string) => {
                    setStatus('processing');
                    try {
                        const finalizeStripePayment = httpsCallable(services.functions, 'finalizeStripePayment');
                        const result = await finalizeStripePayment({ sessionId });
                        const data = result.data as { success: boolean, message: string };
                        if (!data.success) throw new Error(data.message || 'Failed to process payment session.');
                        
                        toast({ title: "Payment Successful!", description: "Your account has been updated." });
                        setStatus('success');

                    } catch (error: any) {
                        const errorMessageText = error.message || "An unknown error occurred.";
                        const isNotFound = error.code === 'functions/not-found' || errorMessageText.includes('not found');
                        const isFunctionDeploymentError = errorMessageText.includes('does not exist');

                        if (isNotFound && !isFunctionDeploymentError && retryCount.current < MAX_RETRIES) {
                            retryCount.current++;
                            setTimeout(() => processPaymentWithRetries(sessionId), RETRY_DELAY);
                        } else {
                            if (isFunctionDeploymentError) {
                                setErrorMessage("The server-side payment function has not been deployed yet.");
                                setIsFunctionNotFoundError(true);
                            } else if (isNotFound) {
                                setErrorMessage("This payment link has expired or has already been used.");
                                setIsSessionExpiredError(true);
                            } else {
                                setErrorMessage(errorMessageText);
                            }
                            setStatus('error');
                            toast({ title: "Payment Processing Error", description: "There was an issue updating your account.", variant: "destructive", duration: 8000 });
                        }
                    }
                };
                processPaymentWithRetries(sessionId);
            } else {
                // If no user is signed in on the web page, we can't finalize.
                // This can happen due to browser privacy settings.
                setErrorMessage("You must be signed in to finalize a payment. Please open the app and sign in.");
                setStatus('error');
            }
        });
        
        return () => unsubscribe();

    }, [router, searchParams, toast]);
    
    if (status === 'processing' || status === 'idle') {
         return (
            <Card className="w-full max-w-lg text-center shadow-xl">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                    <CardTitle className="mt-4 text-2xl font-bold">Processing Payment</CardTitle>
                    <CardDescription>
                        Securely finalizing your transaction. This may take a moment...
                    </CardDescription>
                </CardHeader>
            </Card>
         );
    }
    
    return (
        <Card className="w-full max-w-lg text-center shadow-xl">
            <CardHeader>
                {status === 'success' && (
                     <>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="mt-4 text-2xl font-bold">Payment Successful!</CardTitle>
                        <CardDescription>
                            Thank you! Your account has been updated. Click the button below to return to the app.
                        </CardDescription>
                    </>
                )}
                 {status === 'error' && (
                     <>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <CardTitle className="mt-4 text-2xl font-bold text-destructive">Payment Error</CardTitle>
                        <CardDescription>
                            {isFunctionNotFoundError ? "Could not connect to the server-side payment service." : errorMessage}
                        </CardDescription>
                    </>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                 {isFunctionNotFoundError && (
                    <Alert className="text-left">
                        <Terminal className="h-4 w-4"/>
                        <AlertTitle>Action Required: Deploy Server Functions</AlertTitle>
                        <AlertDescription>
                            To complete payments, the server-side logic must be deployed. Open a terminal and run:
                            <div className="mt-2 p-2 bg-secondary/50 rounded-md font-mono text-sm flex justify-between items-center">
                                <code>{deployCommand}</code>
                                <Button variant="outline" size="sm" onClick={copyDeployCommand}>Copy</Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                 )}
                 {isSessionExpiredError && (
                     <Alert className="text-left">
                        <RefreshCw className="h-4 w-4"/>
                        <AlertTitle>Expired Payment Session</AlertTitle>
                        <AlertDescription>
                            Please start a new payment from the deposit page in the app.
                        </AlertDescription>
                    </Alert>
                 )}
            </CardContent>
            <CardFooter>
                 {status === 'success' && (
                    <Button onClick={handleRedirectToApp} className="w-full">
                        Return to App <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
                {status === 'error' && (
                     <Button onClick={handleRedirectToApp} className="w-full">
                        Return to App <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}


export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div className="text-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PaymentSuccessContent />
        </Suspense>
    )
}
