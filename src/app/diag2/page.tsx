
// src/app/diag2/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
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
    const [step, setStep] = useState<'initial' | 'code_received' | 'token_received' | 'success' | 'error'>('initial');
    const [isLoading, setIsLoading] = useState<'code' | 'token' | 'signin' | null>(null);
    const [error, setError] = useState<any>(null);
    const [user, setUser] = useState<User | null>(null);

    const [authCode, setAuthCode] = useState<string | null>(null);
    const [customToken, setCustomToken] = useState<string | null>(null);

    const [firebaseServices, setFirebaseServices] = useState(initializeFirebaseServices());

    const resetTest = () => {
        setStep('initial');
        setIsLoading(null);
        setError(null);
        setUser(null);
        setAuthCode(null);
        setCustomToken(null);
    };

    const handleStep1_GetAuthCode = useCallback(() => {
        setIsLoading('code');
        setError(null);

        try {
            const client = window.google.accounts.oauth2.initCodeClient({
                client_id: CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                ux_mode: 'popup',
                callback: (response: any) => {
                    if (response.code) {
                        setAuthCode(response.code);
                        setStep('code_received');
                    } else {
                        setError({ step: 1, message: 'Google did not return an authorization code.', details: response.error_description || 'No details provided.' });
                        setStep('error');
                    }
                    setIsLoading(null);
                },
                error_callback: (errorResponse: any) => {
                    setError({ step: 1, message: 'Google Sign-In popup failed.', details: errorResponse.message || 'The popup was closed or an error occurred.'});
                    setStep('error');
                    setIsLoading(null);
                }
            });
            client.requestCode();
        } catch (err: any) {
            setError({ step: 1, message: 'Failed to initialize Google Sign-In client.', details: err.message });
            setStep('error');
            setIsLoading(null);
        }
    }, []);

    const handleStep2_ExchangeCode = async () => {
        if (!authCode || !firebaseServices?.functions) return;
        setIsLoading('token');
        setError(null);

        try {
            const exchangeFunction = httpsCallable(firebaseServices.functions, 'exchangeAuthCodeForToken');
            const result = await exchangeFunction({ code: authCode });
            const data = result.data as { success: boolean; token?: string; message?: string };

            if (!data.success || !data.token) {
                throw new Error(data.message || 'Server failed to exchange code for a token.');
            }

            setCustomToken(data.token);
            setStep('token_received');

        } catch (err: any) {
            console.error("DIAG2 PAGE (Step 2) Error:", err);
            setError({ step: 2, message: err.message, details: err.details || 'Function call failed.' });
            setStep('error');
        } finally {
            setIsLoading(null);
        }
    };

    const handleStep3_SignIn = async () => {
        if (!customToken || !firebaseServices?.auth) return;
        setIsLoading('signin');
        setError(null);

        try {
            const userCredential = await signInWithCustomToken(firebaseServices.auth, customToken);
            setUser(userCredential.user);
            setStep('success');
        } catch (err: any) {
            console.error("DIAG2 PAGE (Step 3) Error:", err);
            setError({ step: 3, message: err.message, details: err.code || 'Custom token sign-in failed.' });
            setStep('error');
        } finally {
            setIsLoading(null);
        }
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-secondary/30 p-4">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">
                        Server-Side Auth Diagnostic (diag2)
                    </CardTitle>
                    <CardDescription>
                        This page tests a 3-step server-side sign-in flow to bypass CORS issues.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertTitle className="font-semibold">Test Instructions</AlertTitle>
                        <AlertDescription>
                            Follow these steps in order. Each successful step enables the next.
                        </AlertDescription>
                    </Alert>

                    {/* Step 1 */}
                    <div className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">1</div>
                            <h3 className="font-semibold">Get Google Auth Code</h3>
                        </div>
                        <Button onClick={handleStep1_GetAuthCode} disabled={isLoading !== null} className="w-full sm:w-auto">
                            {isLoading === 'code' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                            Get Code
                        </Button>
                        {authCode && (
                            <div className="space-y-2 pt-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <Label htmlFor="authCode">Received Authorization Code (truncated):</Label>
                                <Textarea id="authCode" readOnly value={`${authCode.substring(0, 100)}...`} className="h-20 font-mono text-xs bg-muted" />
                            </div>
                        )}
                    </div>

                    {/* Step 2 */}
                    <div className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold ${step === 'code_received' || step === 'token_received' || step === 'success' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
                            <h3 className="font-semibold">Exchange Code for Firebase Token</h3>
                        </div>
                        <Button onClick={handleStep2_ExchangeCode} disabled={step !== 'code_received' || isLoading !== null} className="w-full sm:w-auto">
                            {isLoading === 'token' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                            Exchange Code
                        </Button>
                        {customToken && (
                             <div className="space-y-2 pt-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <Label htmlFor="customToken">Received Firebase Custom Token (truncated):</Label>
                                <Textarea id="customToken" readOnly value={`${customToken.substring(0, 100)}...`} className="h-20 font-mono text-xs bg-muted" />
                            </div>
                        )}
                    </div>

                    {/* Step 3 */}
                    <div className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold ${step === 'token_received' || step === 'success' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>3</div>
                            <h3 className="font-semibold">Sign In with Firebase Token</h3>
                        </div>
                        <Button onClick={handleStep3_SignIn} disabled={step !== 'token_received' || isLoading !== null} className="w-full sm:w-auto">
                            {isLoading === 'signin' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                            Sign In
                        </Button>
                    </div>


                    {step === 'success' && user && (
                        <Alert variant="default" className="bg-green-50 border-green-200">
                            <UserCheck className="h-5 w-5 text-green-600" />
                            <AlertTitle className="text-green-700">SUCCESS!</AlertTitle>
                            <AlertDescription className="text-green-600">
                                Server-side flow completed successfully. The user is now signed in.
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
                                    <p><strong>Details:</strong> {error.details || 'N/A'}</p>
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
