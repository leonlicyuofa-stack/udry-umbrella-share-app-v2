// src/app/diag/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, UserCheck, ServerCrash } from 'lucide-react';
import Link from 'next/link';

// Direct imports from Firebase SDK for isolated testing
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, getRedirectResult, type User, type Auth } from 'firebase/auth';
import { firebaseConfig } from '@/lib/firebase'; // Using the exact same config

export default function AuthRedirectTestPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no_redirect'>('loading');
  const [result, setResult] = useState<User | null>(null);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    // This effect runs only once when the page loads.
    const checkRedirect = async () => {
      try {
        console.log("DIAG PAGE: Initializing temporary Firebase app for diagnostics...");
        // Initialize a temporary, unique app instance for this test to avoid conflicts
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        const auth = getAuth(app);
        console.log("DIAG PAGE: Calling getRedirectResult...");
        
        const credential = await getRedirectResult(auth);
        
        console.log("DIAG PAGE: getRedirectResult finished. Result:", credential);

        if (credential && credential.user) {
          // Success! We got a user from the redirect.
          setStatus('success');
          setResult(credential.user);
        } else {
          // This means the page loaded, but there was no pending redirect.
          setStatus('no_redirect');
        }
      } catch (err: any) {
        // An error occurred while processing the redirect.
        console.error("DIAG PAGE: Error from getRedirectResult:", err);
        setStatus('error');
        setError({ code: err.code, message: err.message });
      }
    };

    checkRedirect();
  }, []); // Empty dependency array ensures this runs only once.

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/30 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">
            Firebase Redirect Diagnostic
          </CardTitle>
          <CardDescription>
            This page tests if Firebase can successfully process a sign-in redirect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center p-8 space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Checking for redirect result...</p>
            </div>
          )}
          {status === 'no_redirect' && (
            <div className="text-center p-8 space-y-3">
              <UserCheck className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="font-semibold">No Pending Redirect</p>
              <p className="text-sm text-muted-foreground">This page loaded directly. To run the test, you must sign in from the main sign-in page after configuring the redirect URL in your Firebase Console.</p>
            </div>
          )}
          {status === 'success' && result && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 space-y-3 bg-green-50 rounded-lg border border-green-200">
                <UserCheck className="h-12 w-12 text-green-600" />
                <p className="text-lg font-bold text-green-700">SUCCESS!</p>
                <p className="text-sm text-green-600">Firebase successfully received the user credential from the redirect.</p>
              </div>
              <Card>
                <CardHeader><CardTitle className="text-base">User Data Received:</CardTitle></CardHeader>
                <CardContent className="text-xs space-y-1 break-all">
                  <p><strong>UID:</strong> {result.uid}</p>
                  <p><strong>Email:</strong> {result.email}</p>
                  <p><strong>Display Name:</strong> {result.displayName}</p>
                </CardContent>
              </Card>
               <p className="text-center text-xs text-muted-foreground pt-4">This confirms the Firebase redirect works correctly. The login loop issue is therefore located within the application's `AuthProvider` or its routing logic.</p>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 space-y-3 bg-red-50 rounded-lg border border-red-200">
                <ServerCrash className="h-12 w-12 text-destructive" />
                <p className="text-lg font-bold text-destructive">FAILURE</p>
                <p className="text-sm text-destructive">Firebase could NOT process the redirect. The session was likely lost.</p>
              </div>
               <Card>
                <CardHeader><CardTitle className="text-base">Error Details:</CardTitle></CardHeader>
                <CardContent className="text-xs space-y-1 break-all font-mono">
                  <p><strong>Code:</strong> {error?.code || 'N/A'}</p>
                  <p><strong>Message:</strong> {error?.message || 'No error message.'}</p>
                </CardContent>
              </Card>
              <p className="text-center text-xs text-muted-foreground pt-4">This confirms the hypothesis that the authentication data is not surviving the redirect. This is likely due to a misconfiguration in Firebase, the hosting environment, or Capacitor.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
            <Button variant="outline" asChild>
                <Link href="/auth/signin">Go to Sign-In Page</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
