// src/app/diag/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Loader2, PlayCircle, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Direct imports from Firebase SDK
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInWithPopup, signInWithRedirect, GoogleAuthProvider, OAuthProvider, type Auth, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// --- THIS IS THE NEW CONFIGURATION FOR THE TEST PROJECT ---
// IMPORTANT: Please replace the placeholder values with the actual values from your 'udry-app-test-2' project.
const testFirebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_NEW_API_KEY",
  authDomain: "udry-app-test-2.firebaseapp.com",
  projectId: "udry-app-test-2",
  storageBucket: "udry-app-test-2.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_NEW_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_NEW_APP_ID",
  measurementId: "REPLACE_WITH_YOUR_NEW_MEASUREMENT_ID"
};


type TestStatus = 'idle' | 'running' | 'success' | 'error';


export default function DiagnosticPage() {
  const { toast } = useToast();
  
  // Test states
  const [test1Status, setTest1Status] = useState<TestStatus>('idle');
  const [test2Status, setTest2Status] = useState<TestStatus>('idle');
  const [test3Status, setTest3Status] = useState<TestStatus>('idle');
  const [test3bStatus, setTest3bStatus] = useState<TestStatus>('idle');
  const [test4Status, setTest4Status] = useState<TestStatus>('idle');
  const [test5Status, setTest5Status] = useState<TestStatus>('idle');
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const resetAllTests = () => {
      setTest1Status('idle');
      setTest2Status('idle');
      setTest3Status('idle');
      setTest3bStatus('idle');
      setTest4Status('idle');
      setTest5Status('idle');
      setErrorMessage(null);
  }

  // --- Test Implementations ---
  const runSignInTest = async (provider: GoogleAuthProvider | OAuthProvider, statusSetter: React.Dispatch<React.SetStateAction<TestStatus>>) => {
    statusSetter('running');
    setErrorMessage(null);
    try {
      const app = initializeApp(testFirebaseConfig, `diag-test-app-${Date.now()}`);
      const auth = initializeAuth(app, {
        persistence: indexedDBLocalPersistence
      });
      await signInWithRedirect(auth, provider);
      // On success, the browser will navigate away.
    } catch (error: any) {
      statusSetter('error');
      setErrorMessage(`Sign-In Failed: ${error.code} - ${error.message}`);
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
            Comprehensive Auth Diagnostic
          </CardTitle>
          <CardDescription>
            This page now points to the new `udry-app-test-2` project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription>
                Please ensure you have replaced the placeholder values in the `testFirebaseConfig` object in this file (`src/app/diag/page.tsx`) with the actual configuration from your `udry-app-test-2` project before running the tests.
              </AlertDescription>
            </Alert>
          
           <Card className="border-blue-500 border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Test: Attempt Google Sign-In with Redirect</span>
                {renderStatus(test3Status)}
              </CardTitle>
               <CardDescription className="text-xs pt-1">
                This is the main test. It attempts the `signInWithRedirect` flow using the new, clean Firebase project.
              </CardDescription>
            </CardHeader>
            <CardFooter>
               <Button onClick={() => runSignInTest(new GoogleAuthProvider(), setTest3Status)} disabled={test3Status === 'running'} size="sm">
                 <PlayCircle className="mr-2 h-4 w-4" /> Run Test
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
         <CardFooter>
          <Button onClick={resetAllTests} variant="outline">Reset All Tests</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
