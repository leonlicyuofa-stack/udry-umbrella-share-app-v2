"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Loader2, AlertTriangle, Terminal, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { httpsCallable } from 'firebase/functions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type UpdateStatus = 'idle' | 'processing' | 'success' | 'error';

// --- Polling Configuration ---
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

export default function PaymentSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { firebaseServices, isReady, user } = useAuth();
    const [status, setStatus] = useState<UpdateStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isFunctionNotFoundError, setIsFunctionNotFoundError] = useState(false);
    const [isSessionExpiredError, setIsSessionExpiredError] = useState(false);
    const deployCommand = "firebase deploy --only functions";
    
    const hasProcessed = useRef(false);
    const retryCount = useRef(0);

    const copyDeployCommand = () => {
        navigator.clipboard.writeText(deployCommand).then(() => {
        toast({ title: "Command Copied!", description: "Paste it into your terminal to deploy." });
        }).catch(err => {
        toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy command." });
        });
    };

    useEffect(() => {
        const sessionId = searchParams.get('session_id');

        if (!isReady) return;
        
        if (isReady && !user) {
            setErrorMessage("You must be signed in to finalize a payment.");
            setStatus('error');
            return;
        }

        if (user && !hasProcessed.current) {
            hasProcessed.current = true;

            if (!sessionId) {
                toast({
                    title: "Invalid Access",
                    description: "This page was accessed without a valid payment session.",
                    variant: "destructive"
                });
                router.replace('/');
                return;
            }

            const processPaymentWithRetries = async (sessionId: string) => {
                setStatus('processing');
                
                try {
                    if (!firebaseServices?.functions) {
                        throw new Error("Firebase services are not available. Cannot finalize payment.");
                    }
                    
                    const finalizeStripePayment = httpsCallable(firebaseServices.functions, 'finalizeStripePayment');
                    const result = await finalizeStripePayment({ sessionId });

                    const data = result.data as { success: boolean, message: string };

                    if (!data.success) {
                        // This will be caught by the outer catch block
                        throw new Error(data.message || 'Failed to process payment session.');
                    }
                    
                    toast({
                        title: "Payment Successful!",
                        description: "Your account has been updated.",
                    });
                    setStatus('success');

                } catch (error: any) {
                    const errorMessageText = error.message || "An unknown error occurred.";
                    console.error("Error calling finalizeStripePayment function:", error);

                    // --- Improved Error Detection ---
                    const isNotFound = error.code === 'functions/not-found' || errorMessageText.toLowerCase().includes('not found');
                    const isFunctionDeploymentError = errorMessageText.includes('does not exist');

                    // Retry logic: Only retry if it's a "session not found" error, but NOT a function deployment error.
                    if (isNotFound && !isFunctionDeploymentError && retryCount.current < MAX_RETRIES) {
                        retryCount.current++;
                        console.log(`Stripe session not found. Retrying in ${RETRY_DELAY / 1000}s... (Attempt ${retryCount.current}/${MAX_RETRIES})`);
                        setTimeout(() => processPaymentWithRetries(sessionId), RETRY_DELAY);
                    } else {
                        // --- Handle terminal errors or max retries exceeded ---
                        if (isFunctionDeploymentError) {
                            setErrorMessage("The server-side payment function has not been deployed yet.");
                            setIsFunctionNotFoundError(true);
                        } else if (isNotFound) {
                            setErrorMessage("This payment link has expired or has already been used. Each payment attempt generates a new, one-time use link.");
                            setIsSessionExpiredError(true);
                        } else if (error.code === 'functions/unauthenticated' || error.code === 'functions/permission-denied') {
                             setErrorMessage("Authentication error. You don't have permission to perform this action. Please sign in again.");
                        } else {
                            setErrorMessage(errorMessageText);
                        }
                        
                        setStatus('error');
                        toast({
                            title: "Payment Processing Error",
                            description: "There was an issue updating your account. Please contact support if you believe you were charged.",
                            variant: "destructive",
                            duration: 8000
                        });
                    }
                }
            };
            
            // Initial call
            processPaymentWithRetries(sessionId);
        }
    }, [isReady, user, router, searchParams, toast, firebaseServices]);

    useEffect(() => {
        if (status === 'success') {
            const timer = setTimeout(() => {
                router.replace('/account/balance');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [status, router]);
    
    if (status === 'processing' || status === 'idle') {
         return (
            <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
                 <Card className="w-full max-w-lg text-center shadow-xl">
                    <CardHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                        </div>
                        <CardTitle className="mt-4 text-2xl font-bold">Processing Payment</CardTitle>
                        <CardDescription>
                            Securely finalizing your transaction and updating your account. Please wait, this may take a moment...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
         );
    }
    
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Card className="w-full max-w-lg text-center shadow-xl">
                <CardHeader>
                    {status === 'success' && (
                         <>
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <CardTitle className="mt-4 text-2xl font-bold">Payment Successful!</CardTitle>
                            <CardDescription>
                                Thank you! Your account has been updated. You will be redirected shortly.
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
                                To complete payments, the server-side logic must be deployed. Open a terminal in your project's root directory and run this command:
                                <div className="mt-2 p-2 bg-secondary/50 rounded-md font-mono text-sm flex justify-between items-center">
                                    <code>{deployCommand}</code>
                                    <Button variant="outline" size="sm" onClick={copyDeployCommand}>Copy</Button>
                                </div>
                                After deployment, try the payment process again.
                            </AlertDescription>
                        </Alert>
                     )}
                     {isSessionExpiredError && (
                         <Alert className="text-left">
                            <RefreshCw className="h-4 w-4"/>
                            <AlertTitle>Expired Payment Session</AlertTitle>
                            <AlertDescription>
                                This can happen if you refresh the success page or reuse an old link. Please start a new payment from the deposit page.
                            </AlertDescription>
                        </Alert>
                     )}

                    {status === 'success' && (
                        <Button asChild>
                            <Link href="/account/balance">
                                Go to My Account <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                    {status === 'error' && (
                         <Button asChild>
                            <Link href="/deposit">
                                Start a New Payment <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
