
"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Loader2, AlertTriangle, Terminal, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { initializeFirebaseServices, type FirebaseServices } from '@/lib/firebase'; // Import directly

type UpdateStatus = 'idle' | 'processing' | 'success' | 'error';

function InternalPaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);
    
    const [status, setStatus] = useState<UpdateStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isFunctionNotFoundError, setIsFunctionNotFoundError] = useState(false);
    const [isSessionExpiredError, setIsSessionExpiredError] = useState(false);
    
    const hasProcessed = useRef(false);

    // Initialize Firebase services on component mount
    useEffect(() => {
        const services = initializeFirebaseServices();
        if (services) {
            setFirebaseServices(services);
        } else {
            setErrorMessage("Failed to initialize connection to server.");
            setStatus('error');
        }
    }, []);

    const deployCommand = "firebase deploy --only functions";
    const copyDeployCommand = () => {
        navigator.clipboard.writeText(deployCommand).then(() => {
        toast({ title: "Command Copied!", description: "Paste it into your terminal to deploy." });
        }).catch(err => {
        toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy command." });
        });
    };

    useEffect(() => {
        if (hasProcessed.current || !firebaseServices) return;
        
        const sessionId = searchParams.get('session_id');
        const uid = searchParams.get('uid'); 

        if (!sessionId || !uid) {
            toast({
                title: "Invalid Payment Link",
                description: "Missing session or user information.",
                variant: "destructive"
            });
            router.replace('/home');
            return;
        }
        
        hasProcessed.current = true;
        processPayment(sessionId, uid);

    }, [firebaseServices, router, searchParams, toast]);


    const processPayment = async (sessionId: string, uid: string) => {
        if (!firebaseServices) {
            setErrorMessage("Firebase services are not available for payment processing.");
            setStatus('error');
            return;
        }
        setStatus('processing');
        try {
            const finalizeStripePayment = httpsCallable(firebaseServices.functions, 'finalizeStripePayment');
            
            const result = await finalizeStripePayment({ sessionId, uid });
            const data = result.data as { success: boolean, message: string };
            if (!data.success) throw new Error(data.message || 'Failed to process payment session.');
            
            toast({ title: "Payment Successful!", description: "Your account has been updated." });
            setStatus('success');

        } catch (error: any) {
            const errorMessageText = error.message || "An unknown error occurred.";
            const isNotFound = error.code === 'functions/not-found' || errorMessageText.includes('not found');
            const isFunctionDeploymentError = errorMessageText.includes('does not exist');

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
    };
    
    if (status === 'idle' || status === 'processing') {
         return (
            <Card className="w-full max-w-lg text-center shadow-xl">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                    <CardTitle className="mt-4 text-2xl font-bold">
                        Finalizing Payment
                    </CardTitle>
                    <CardDescription>
                        Securely updating your account. This may take a moment...
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
                            Thank you! Your account has been updated. The app will now reload to show your new balance.
                        </CardDescription>
                    </>
                )}
                 {status === 'error' && (
                     <>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <CardTitle className="mt-4 text-2xl font-bold text-destructive">
                            Payment Error
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
                 <Button onClick={() => {
                     // This deep link will take the user back into the app
                     window.location.href = `udry://account/balance`;
                 }} className="w-full">
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
