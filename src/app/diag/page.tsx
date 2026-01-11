
// src/app/diag/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Loader2, PlayCircle, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Direct imports from Firebase SDK
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInWithRedirect, GoogleAuthProvider, OAuthProvider, type Auth, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';

// Direct import of the configuration and the main app's initialization function
import { firebaseConfig, initializeFirebaseServices } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type TestStatus = 'idle' | 'running' | 'success' | 'error';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export default function DiagnosticPage() {
  const { toast } = useToast();
  
  // Test states
  const [initStatus, setInitStatus] = useState<TestStatus>('idle');
  const [authStatus, setAuthStatus] = useState<TestStatus>('idle');
  const [googleSignInStatus, setGoogleSignInStatus] = useState<TestStatus>('idle');
  const [msSignInStatus, setMsSignInStatus] = useState<TestStatus>('idle');
  
  // New test states
  const [mainAppInitStatus, setMainAppInitStatus] = useState<TestStatus>('idle');
  const [cleanAppInitStatus, setCleanAppInitStatus] = useState<TestStatus>('idle');
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const resetAllTests = () => {
      setInitStatus('idle');
      setAuthStatus('idle');
      setGoogleSignInStatus('idle');
      setMsSignInStatus('idle');
      setMainAppInitStatus('idle');
      setCleanAppInitStatus('idle');
      setErrorMessage(null);
  }

  // --- Test Implementations ---

  const handleTest1 = () => {
    resetAllTests();
    setInitStatus('running');
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
    }
  };

  const handleTest2 = () => {
    setAuthStatus('running');
    if (initStatus !== 'success' || !app) {
       handleTest1();
       if(!getApps().length) {
         const msg = "Test 1 must pass before running Test 2.";
         setAuthStatus('error');
         setErrorMessage(msg);
         return;
       }
       app = getApp();
    }
    
    try {
      auth = initializeAuth(app, {
        persistence: indexedDBLocalPersistence
      });
      if (auth) {
        setAuthStatus('success');
        toast({ title: 'Test 2 Success', description: 'Firebase Auth service retrieved with IndexedDB persistence.' });
      } else {
        throw new Error('initializeAuth returned a nullish value.');
      }
    } catch (error: any) {
      setAuthStatus('error');
      setErrorMessage(`Test 2 Failed: ${error.message}`);
    }
  };

  const runSignInTest = async (provider: GoogleAuthProvider | OAuthProvider, statusSetter: React.Dispatch<React.SetStateAction<TestStatus>>) => {
    statusSetter('running');
    if (authStatus !== 'success') {
       handleTest2();
       if(!getApps().length) {
          const msg = "Test 2 must pass before running this test.";
          statusSetter('error');
          setErrorMessage(msg);
          return;
       }
       auth = getAuth(getApp());
    }

    try {
      await signInWithRedirect(auth!, provider);
      // The browser will navigate away, so success state is not set here.
    } catch (error: any) {
      statusSetter('error');
      setErrorMessage(`Sign-In Failed: ${error.code} - ${error.message}`);
    }
  };

  // --- NEW COMPREHENSIVE TESTS ---

  // Test 4: Use the EXACT same initialization function as the main app
  const handleTest4 = async () => {
      setMainAppInitStatus('running');
      try {
          const services = initializeFirebaseServices();
          if (!services || !services.auth) {
              throw new Error("initializeFirebaseServices() returned null or did not contain an auth instance.");
          }
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(services.auth, provider);
      } catch (error: any) {
          setMainAppInitStatus('error');
          setErrorMessage(`Test 4 Failed: ${error.message}`);
      }
  };

  // Test 5: Create a completely fresh, uniquely named Firebase App instance
  const handleTest5 = async () => {
      setCleanAppInitStatus('running');
      try {
          const cleanApp = initializeApp(firebaseConfig, `clean-test-app-${Date.now()}`);
          const cleanAuth = initializeAuth(cleanApp, { persistence: indexedDBLocalPersistence });
          
          if (!cleanAuth) {
              throw new Error("Clean auth instance could not be created.");
          }

          const provider = new GoogleAuthProvider();
          await signInWithRedirect(cleanAuth, provider);
      } catch (error: any) {
          setCleanAppInitStatus('error');
          setErrorMessage(`Test 5 Failed: ${error.message}`);
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
            Run these tests in order to isolate the authentication failure.
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
                Checks if `firebaseConfig` can connect.
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
                <span>Test 2: Get Auth Service (with IndexedDB)</span>
                 {renderStatus(authStatus)}
              </CardTitle>
               <CardDescription className="text-xs pt-1">
                Checks if the Auth service can be retrieved with Capacitor-safe persistence.
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
                <span>Test 3: Attempt Google Sign-In (Standard)</span>
                {renderStatus(googleSignInStatus)}
              </CardTitle>
               <CardDescription className="text-xs pt-1">
                Attempts the `signInWithRedirect` flow using the auth instance from Test 2.
              </CardDescription>
            </CardHeader>
            <CardFooter>
               <Button onClick={() => runSignInTest(new GoogleAuthProvider(), setGoogleSignInStatus)} disabled={googleSignInStatus === 'running'} size="sm">
                 <PlayCircle className="mr-2 h-4 w-4" /> Run Test 3
              </Button>
            </CardFooter>
          </Card>

           {/* --- NEW TEST CARDS --- */}

           <Card className="border-blue-500 border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Test 4: Use Main App's Initialization</span>
                {renderStatus(mainAppInitStatus)}
              </CardTitle>
               <CardDescription className="text-xs pt-1">
                This test uses the exact same `initializeFirebaseServices()` function that the rest of the app uses. This checks if the problem is in that shared function itself.
              </CardDescription>
            </CardHeader>
            <CardFooter>
               <Button onClick={handleTest4} disabled={mainAppInitStatus === 'running'} size="sm">
                 <PlayCircle className="mr-2 h-4 w-4" /> Run Test 4
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="border-blue-500 border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Test 5: Create a Completely Clean App Instance</span>
                 {renderStatus(cleanAppInitStatus)}
              </CardTitle>
               <CardDescription className="text-xs pt-1">
                This test ignores any existing Firebase app instances and creates a brand new one. If this works, it means the default app instance is getting corrupted.
              </CardDescription>
            </CardHeader>
            <CardFooter>
               <Button onClick={handleTest5} disabled={cleanAppInitStatus === 'running'} size="sm">
                 <PlayCircle className="mr-2 h-4 w-4" /> Run Test 5
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
