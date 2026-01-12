
// src/app/diag2/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck, ServerCrash, KeyRound, LogIn } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, type User } from 'firebase/auth';
import { firebaseConfig } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

// Initialize a temporary Firebase app instance for this diagnostic page
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

type Step = 'initial' | 'token_received' | 'success' | 'error';

export default function ManualAuthTestPage() {
  const [step, setStep] = useState<Step>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

  const handleStep1_GetToken = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.idToken) {
        setIdToken(credential.idToken);
        setStep('token_received');
      } else {
        throw new Error("Could not retrieve ID Token from Google credential.");
      }
    } catch (err: any) {
      console.error("DIAG2 PAGE (Step 1) Error:", err);
      setError({ message: `Step 1 Failed: ${err.message}`, code: err.code });
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2_CompleteSignIn = async () => {
    if (!idToken) return;
    setIsLoading(true);
    setError(null);
    try {
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        setUser(userCredential.user);
        setStep('success');
    } catch (err: any) {
        console.error("DIAG2 PAGE (Step 2) Error:", err);
        setError({ message: `Step 2 Failed: ${err.message}`, code: err.code });
        setStep('error');
    } finally {
        setIsLoading(false);
    }
  };

  const resetTest = () => {
    setStep('initial');
    setIsLoading(false);
    setError(null);
    setUser(null);
    setIdToken(null);
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/30 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">
            Manual Sign-In Diagnostic (diag2)
          </CardTitle>
          <CardDescription>
            This page tests a two-step sign-in process to isolate CORS issues.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           
            <Alert variant={step === 'error' ? 'destructive' : 'default'}>
              <AlertTitle className="font-semibold">Test Instructions</AlertTitle>
              <AlertDescription>
                1. Click "Step 1" to open the Google Sign-In popup and get a secure token.
                <br />
                2. After the popup closes, click "Step 2" to complete the sign-in manually.
              </AlertDescription>
            </Alert>
          
            <div className="flex flex-col sm:flex-row gap-4">
                 <Button onClick={handleStep1_GetToken} disabled={isLoading || step !== 'initial'} className="w-full sm:w-1/2">
                    {isLoading && step === 'initial' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                    Step 1: Get Google Token
                </Button>
                <Button onClick={handleStep2_CompleteSignIn} disabled={isLoading || step !== 'token_received'} className="w-full sm:w-1/2">
                    {isLoading && step === 'token_received' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                    Step 2: Complete Sign-In
                </Button>
            </div>

            {step === 'token_received' && idToken && (
                <div className="space-y-2">
                    <Label htmlFor="idToken">Received ID Token (truncated):</Label>
                    <Textarea id="idToken" readOnly value={`${idToken.substring(0, 100)}...`} className="h-24 font-mono text-xs bg-muted" />
                    <p className="text-xs text-green-600">Step 1 Succeeded. Now click Step 2 to continue.</p>
                </div>
            )}

            {step === 'success' && user && (
                <Alert variant="default" className="bg-green-50 border-green-200">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <AlertTitle className="text-green-700">SUCCESS!</AlertTitle>
                    <AlertDescription className="text-green-600">
                        Manual sign-in with credential was successful. This proves the issue is with the automated hand-off between the popup and the main window.
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
                    <AlertTitle>FAILURE</AlertTitle>
                    <AlertDescription>
                        An error occurred. See details below.
                        <div className="mt-2 text-xs font-mono break-all">
                             <p><strong>Code:</strong> {error.code || 'N/A'}</p>
                             <p><strong>Message:</strong> {error.message || 'No error message.'}</p>
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
