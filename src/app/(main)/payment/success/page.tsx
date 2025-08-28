
"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Loader2, AlertTriangle, Terminal, RefreshCw, Hourglass } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';

type UpdateStatus = 'idle' | 'processing' | 'success' | 'error';
type DiagnosticStatus = 'initializing' | 'waiting' | 'user_found' | 'timeout';

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

// This is the NEW internal success page. The deep link directs the user here.
// Because this page is inside the (main) layout, the user is guaranteed to be authenticated.
function InternalPaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { firebaseServices, isReady } = useAuth(); // Removed user from here
    
    const [status, setStatus] = useState<UpdateStatus>('idle');
    const [diagnosticStatus, setDiagnosticStatus] = useState<DiagnosticStatus>('initializing');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isFunctionNotFoundError, setIsFunctionNotFoundError] = useState(false);
    const [isSessionExpiredError, setIsSessionExpiredError] = useState(false);
    
    const hasProcessed = useRef(false);
    const retryCount = useRef(0);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const deployCommand = "firebase deploy --only functions";
    const copyDeployCommand = () => {
        navigator.clipboard.writeText(deployCommand).then(() => {
        toast({ title: "Command Copied!", description: "Paste it into your terminal to deploy." });
        }).catch(err => {
        toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy command." });
        });
    };

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const processPayment = async (sessionId: string) => {
        if (!firebaseServices) {
            setErrorMessage("Firebase services are not available for payment processing.");
            setStatus('error');
            return;
        }
        setStatus('processing');
        try {
            const finalizeStripePayment = httpsCallable(firebaseServices.functions, 'finalizeStripePayment');
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
                setTimeout(() => processPayment(sessionId), RETRY_DELAY);
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

    // --- DIAGNOSTIC TEST LOGIC ---
    useEffect(() => {
        if (hasProcessed.current || !firebaseServices) return;

        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
            toast({
                title: "Invalid Access",
                description: "No payment session found.",
                variant: "destructive"
            });
            router.replace('/home');
            return;
        }
        
        setDiagnosticStatus('waiting');
        const startTime = Date.now();
        const TIMEOUT_MS = 15000; // Wait for 15 seconds

        pollingIntervalRef.current = setInterval(() => {
            const currentUser = firebaseServices.auth.currentUser;

            if (currentUser) {
                stopPolling();
                hasProcessed.current = true;
                setDiagnosticStatus('user_found');
                processPayment(sessionId);
            } else if (Date.now() - startTime > TIMEOUT_MS) {
                stopPolling();
                hasProcessed.current = true;
                setDiagnosticStatus('timeout');
                setStatus('error');
                setErrorMessage("Diagnostic Timeout: No user session was restored within 15 seconds. This points to a session persistence issue.");
            }
        }, 500); // Check every 500ms

        return () => stopPolling();

    }, [firebaseServices, router, searchParams, toast]);
    
    // --- RENDER LOGIC ---
    if (diagnosticStatus === 'initializing' || diagnosticStatus === 'waiting' || status === 'processing') {
         return (
            <Card className="w-full max-w-lg text-center shadow-xl">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        {status === 'processing' ? (
                             <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                        ) : (
                             <Hourglass className="h-8 w-8 text-blue-600 animate-spin" />
                        )}
                    </div>
                    <CardTitle className="mt-4 text-2xl font-bold">
                        {status === 'processing' ? "Finalizing Payment" : "Running Diagnostics"}
                    </CardTitle>
                    <CardDescription>
                        {diagnosticStatus === 'waiting' && "Polling for auth state... Please wait."}
                        {status === 'processing' && "Securely updating your account. This may take a moment..."}
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
                            Thank you! Your account has been updated.
                        </CardDescription>
                    </>
                )}
                 {status === 'error' && (
                     <>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <CardTitle className="mt-4 text-2xl font-bold text-destructive">
                            {diagnosticStatus === 'timeout' ? "Diagnostic Test Failed" : "Payment Error"}
                        </CardTitle>
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
                 <Button onClick={() => router.push('/account/balance')} className="w-full">
                    Go to My Wallet <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function InternalPaymentSuccessPage() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] p-4">
             <Suspense fallback={<div className="text-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <InternalPaymentSuccessContent />
            </Suspense>
        </div>
    )
}
