"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Loader2, PlayCircle, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Direct imports from Firebase SDK
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, type Auth } from 'firebase/auth';

// Direct import of the configuration we want to test
import { firebaseConfig } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type TestStatus = 'idle' | 'running' | 'success' | 'error';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export default function DiagnosticPage() {
  const { toast } = useToast();
  const [initStatus, setInitStatus] = useState<TestStatus>('idle');
  const [authStatus, setAuthStatus] = useState<TestStatus>('idle');
  const [signInStatus, setSignInStatus] = useState<TestStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTest1 = () => {
    setInitStatus('running');
    setErrorMessage(null);
    try {
      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApp();
      }
      if (app) {
        setInitStatus('success');
        toast({ title: 'Test 1 Success', description: 'Firebase app initialized successfully.' });
      } else {
        throw new Error('initializeApp returned a nullish value.');
      }
    } catch (error: any) {
      setInitStatus('error');
      setErrorMessage(`Test 1 Failed: ${error.message}`);
      toast({ variant: 'destructive', title: 'Test 1 Failed', description: error.message });
    }
  };

  const handleTest2 = () => {
    setAuthStatus('running');
    setErrorMessage(null);
    // Ensure Test 1 has run successfully
    if (initStatus !== 'success' || !app) {
       handleTest1();
       if(!app) {
         const msg = "Test 1 must pass before running Test 2.";
         setAuthStatus('error');
         setErrorMessage(msg);
         toast({ variant: 'destructive', title: 'Prerequisite Failed', description: msg });
         return;
       }
    }
    
    try {
      auth = getAuth(app);
      if (auth) {
        setAuthStatus('success');
        toast({ title: 'Test 2 Success', description: 'Firebase Auth service retrieved successfully.' });
      } else {
        throw new Error('getAuth returned a nullish value.');
      }
    } catch (error: any) {
      setAuthStatus('error');
      setErrorMessage(`Test 2 Failed: ${error.message}`);
      toast({ variant: 'destructive', title: 'Test 2 Failed', description: error.message });
    }
  };

  const handleTest3 = async () => {
    setSignInStatus('running');
    setErrorMessage(null);
    // Ensure Test 2 has run successfully
    if (authStatus !== 'success' || !auth) {
       handleTest2();
       if(!auth) {
        const msg = "Test 2 must pass before running Test 3.";
        setSignInStatus('error');
        setErrorMessage(msg);
        toast({ variant: 'destructive', title: 'Prerequisite Failed', description: msg });
        return;
       }
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setSignInStatus('success');
      toast({ title: 'Test 3 Success!', description: `Successfully signed in as ${result.user.displayName}` });
    } catch (error: any) {
      setSignInStatus('error');
      setErrorMessage(`Test 3 Failed: ${error.code} - ${error.message}`);
      toast({ variant: 'destructive', title: 'Test 3 Failed', description: `${error.code}: ${error.message}` });
    }
  };

  const renderStatus = (status: TestStatus) => {
    if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin text-orange-500" />;
    if (status === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'error') return <AlertTriangle className="h-4 w-4 text-destructive" />;
    return null;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/30 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center">
            <Radio className="mr-3 h-6 w-6" />
            Authentication Diagnostic Page
          </CardTitle>
          <CardDescription>
            Run these tests in order to isolate the Google Sign-In issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Test 1: Initialize Firebase App</span>
                {renderStatus(initStatus)}
              </CardTitle>
              <CardDescription className="text-xs pt-1">
                Checks if the `firebaseConfig` object can connect to Firebase.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={handleTest1} disabled={initStatus === 'running'} size="sm">
                <PlayCircle className="mr-2 h-4 w-4" /> Run Test 1
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Test 2: Get Auth Service</span>
                 {renderStatus(authStatus)}
              </CardTitle>
               <CardDescription className="text-xs pt-1">
                Checks if the Authentication service can be retrieved.
              </CardDescription>
            </CardHeader>
            <CardFooter>
               <Button onClick={handleTest2} disabled={authStatus === 'running'} size="sm">
                 <PlayCircle className="mr-2 h-4 w-4" /> Run Test 2
              </Button>
            </CardFooter>
          </Card>

           <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Test 3: Attempt Google Sign-In</span>
                {renderStatus(signInStatus)}
              </CardTitle>
               <CardDescription className="text-xs pt-1">
                Attempts the `signInWithPopup` flow in isolation.
              </CardDescription>
            </CardHeader>
            <CardFooter>
               <Button onClick={handleTest3} disabled={signInStatus === 'running'} size="sm">
                 <PlayCircle className="mr-2 h-4 w-4" /> Run Test 3
              </Button>
            </CardFooter>
          </Card>
          
          {errorMessage && (
             <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Last Error Received</AlertTitle>
              <AlertDescription className="font-mono text-xs break-all">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
