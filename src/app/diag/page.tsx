
// src/app/diag/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Loader2, PlayCircle, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Direct imports from Firebase SDK
import { initializeApp, getApps, getApp, type FirebaseApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithRedirect, GoogleAuthProvider, OAuthProvider, type Auth, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// --- THIS IS THE NEW CONFIGURATION FOR THE TEST PROJECT ---
const testFirebaseConfig = {
  apiKey: "AIzaSyDFvt0pWwqs78Sm-fzBgQ-tRm5cD8WAStA",
  authDomain: "udry-app-test-2.firebaseapp.com",
  projectId: "udry-app-test-2",
  storageBucket: "udry-app-test-2.firebasestorage.app",
  messagingSenderId: "398109852404",
  appId: "1:398109852404:web:b0ae7ca3be3859414d94a1",
};


type TestStatus = 'idle' | 'running' | 'success' | 'error';


export default function DiagnosticPage() {
  const { toast } = useToast();
  
  // Test states
  const [test1Status, setTest1Status] = useState<TestStatus>('idle');
  const [test2Status, setTest2Status] = useState<TestStatus>('idle');
  const [test3Status, setTest3Status] = useState<TestStatus>('idle');
  const [test3bStatus, setTest3bStatus] = useState<TestStatus>('idle');
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const resetAllTests = () => {
      setTest1Status('idle');
      setTest2Status('idle');
      setTest3Status('idle');
      setTest3bStatus('idle');
      setErrorMessage(null);
  }

  // --- Test Implementations ---
  const runSignInTest = async (providerName: 'google' | 'microsoft', statusSetter: React.Dispatch<React.SetStateAction<TestStatus>>) => {
    statusSetter('running');
    setErrorMessage(null);
    try {
      const appName = `diag-test-app-${providerName}-${Date.now()}`;
      const app = initializeApp(testFirebaseConfig, appName);
      const auth = initializeAuth(app, {
        persistence: indexedDBLocalPersistence
      });
      const provider = providerName === 'google' ? new GoogleAuthProvider() : new OAuthProvider('microsoft.com');

      await signInWithRedirect(auth, provider);
      // On success, the browser will navigate away. We won't see a 'success' status here.
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
            Auth Diagnostic (Now with `udry-app-test-2`)
          </CardTitle>
          <CardDescription>
            This page now points to the new, clean Firebase project to confirm if the issue is project-specific.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           
           <Card className="border-blue-500 border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Test 3: Attempt Google Sign-In with Redirect</span>
                {renderStatus(test3Status)}
              </CardTitle>
               <CardDescription className="text-xs pt-1">
                This test uses the recommended `signInWithRedirect` method with `indexedDB` persistence on the new, clean project.
              </CardDescription>
            </CardHeader>
            <CardFooter>
               <Button onClick={() => runSignInTest('google', setTest3Status)} disabled={test3Status === 'running'} size="sm">
                 <PlayCircle className="mr-2 h-4 w-4" /> Run Google Test
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Test 3b: Attempt Microsoft Sign-In with Redirect</span>
                {renderStatus(test3bStatus)}
              </CardTitle>
               <CardDescription className="text-xs pt-1">
                This confirms if the issue is specific to the Google provider or a general auth problem.
              </CardDescription>
            </CardHeader>
            <CardFooter>
               <Button onClick={() => runSignInTest('microsoft', setTest3bStatus)} disabled={test3bStatus === 'running'} size="sm">
                 <PlayCircle className="mr-2 h-4 w-4" /> Run Microsoft Test
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
