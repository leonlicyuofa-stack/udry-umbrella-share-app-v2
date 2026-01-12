
// src/app/diag2/page.tsx
"use client";

import { useState, useEffect, useCallback, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck, ServerCrash, KeyRound, LogIn, CheckCircle } from 'lucide-react';
import { initializeFirebaseServices } from '@/lib/firebase';
import { signInWithCustomToken, type User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

declare global {
    interface Window {
        google: any;
    }
}

const CLIENT_ID = "458603936715-14i9hj110pmnr1m3mmnrsnrhctun3i9d.apps.googleusercontent.com";


export default function ManualServerAuthTestPage() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState<'initial' | 'code_received' | 'token_received' | 'success' | 'error'>('initial');
    const [isLoading, setIsLoading] = useState<'code' | 'token' | 'signin' | null>(null);
    const [error, setError] = useState<any>(null);
    const [user, setUser] = useState<User | null>(null);

    const [authCode, setAuthCode] = useState<string | null>(null);
    const [customToken, setCustomToken] = useState<string | null>(null);

    const [firebaseServices, setFirebaseServices] = useState(initializeFirebaseServices());

    const resetTest = () => {
        // Navigate to the same page without query params to clear them
        window.location.href = window.location.pathname;
    };

    const handleStep1_GetAuthCode = useCallback(() => {
        setIsLoading('code');
        setError(null);

        try {
            const client = window.google.accounts.oauth2.initCodeClient({
                client_id: CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                ux_mode: 'redirect', // CHANGED to redirect
                // redirect_uri is not needed here as it defaults to the current page
            });
            client.requestCode();
        } catch (err: any) {
            setError({ step: 1, message: 'Failed to initialize Google Sign-In client.', details: err.message });
            setStep('error');
            setIsLoading(null);
        }
    }, []);

    const runServerAuthFlow = useCallback(async (code: string) => {
        if (!firebaseServices?.functions) {
            setError({ step: 2, message: 'Firebase Functions service is not available.' });
            setStep('error');
            return;
        }

        // --- Step 2: Exchange Code ---
        setIsLoading('token');
        setError(null);
        let receivedToken: string | null = null;
        try {
            const exchangeFunction = httpsCallable(firebaseServices.functions, 'exchangeAuthCodeForToken');
            const result = await exchangeFunction({ code });
            const data = result.data as { success: boolean; token?: string; message?: string };

            if (!data.success || !data.token) {
                throw new Error(data.message || 'Server failed to exchange code for a token.');
            }

            setCustomToken(data.token);
            setStep('token_received');
            receivedToken = data.token;
        } catch (err: any) {
            console.error("DIAG2 PAGE (Step 2) Error:", err);
            setError({ step: 2, message: err.message, details: err.details || 'Function call failed.' });
            setStep('error');
            setIsLoading(null);
            return;
        }
        setIsLoading(null);

        // --- Step 3: Sign In with Token ---
        if (!receivedToken || !firebaseServices.auth) {
            setError({ step: 3, message: 'Cannot sign in without a custom token or auth service.' });
            setStep('error');
            return;
        }
        setIsLoading('signin');
        try {
            const userCredential = await signInWithCustomToken(firebaseServices.auth, receivedToken);
            setUser(userCredential.user);
            setStep('success');
        } catch (err: any) {
            console.error("DIAG2 PAGE (Step 3) Error:", err);
            setError({ step: 3, message: err.message, details: err.code || 'Custom token sign-in failed.' });
            setStep('error');
        } finally {
            setIsLoading(null);
        }
    }, [firebaseServices]);

    useEffect(() => {
        const codeFromUrl = searchParams.get('code');
        if (codeFromUrl && !authCode) { // Only run if we have a new code
            setAuthCode(codeFromUrl);
            setStep('code_received');
            runServerAuthFlow(codeFromUrl);
        }
    }, [searchParams, runServerAuthFlow, authCode]);


    return (
        <div className="flex items-center justify-center min-h-screen bg-secondary/30 p-4">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">
                        Server-Side Auth Diagnostic (diag2 - Redirect Flow)
                    </CardTitle>
                    <CardDescription>
                        This page tests the `redirect` flow. It will navigate away to Google and then return here to automatically complete the process.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertTitle className="font-semibold">Test Instructions</AlertTitle>
                        <AlertDescription>
                           Click the button below to start. The page will redirect to Google, then automatically come back here to finish.
                        </AlertDescription>
                    </Alert>

                    {/* Step 1 */}
                    <div className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold ${step === 'initial' ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-primary text-primary-foreground'}`}>1</div>
                            <h3 className="font-semibold">Start Google Sign-In</h3>
                        </div>
                        <Button onClick={handleStep1_GetAuthCode} disabled={isLoading !== null || step !== 'initial'} className="w-full sm:w-auto">
                            {isLoading === 'code' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                            Start Sign-In
                        </Button>
                         {authCode && (
                            <div className="space-y-2 pt-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <p className="text-sm">Step 1 Complete: Authorization code received from Google redirect.</p>
                            </div>
                        )}
                    </div>
                    
                     {/* Loading/Progress indicator */}
                    {(isLoading === 'token' || isLoading === 'signin') && (
                        <div className="p-4 flex items-center justify-center gap-3 text-primary">
                           <Loader2 className="h-6 w-6 animate-spin" />
                           <p className="font-semibold">
                             {isLoading === 'token' ? 'Step 2: Exchanging code...' : 'Step 3: Signing in...'}
                           </p>
                        </div>
                    )}


                    {step === 'success' && user && (
                        <Alert variant="default" className="bg-green-50 border-green-200">
                            <UserCheck className="h-5 w-5 text-green-600" />
                            <AlertTitle className="text-green-700">SUCCESS!</AlertTitle>
                            <AlertDescription className="text-green-600">
                                Redirect flow completed successfully. The user is now signed in.
                                <div className="mt-2 text-xs font-mono break-all">
                                    <p><strong>Email:</strong> {user.email}</p>
                                    <p><strong>UID:</strong> {user.uid}</p>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {step === 'error' && error && (
                        <Alert variant="destructive">
                            <ServerCrash className="h-5 w-5" />
                            <AlertTitle>FAILURE (Step {error.step})</AlertTitle>
                            <AlertDescription>
                                An error occurred. See details below.
                                <div className="mt-2 text-xs font-mono break-all">
                                    <p><strong>Message:</strong> {error.message || 'No error message.'}</p>
                                    <p><strong>Details:</strong> {JSON.stringify(error.details) || 'N/A'}</p>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={resetTest}>Reset Test</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

