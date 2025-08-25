// src/app/diag/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { collection, getDocs, type Firestore } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle, XCircle, ShieldQuestion, Server, UserCheck, Database, Layers } from 'lucide-react';
import Link from 'next/link';
import { initializeFirebaseServices, firebaseConfig } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

type Status = 'pending' | 'success' | 'error';

interface CheckResult {
  status: Status;
  message: string;
}

const StatusIndicator = ({ status, message }: CheckResult) => {
  return (
    <div className="flex items-start">
      <div className="w-8 flex-shrink-0">
        {status === 'pending' && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
        {status === 'error' && <XCircle className="h-5 w-5 text-destructive" />}
      </div>
      <p className={`font-medium ${status === 'error' ? 'text-destructive' : ''} ${status === 'pending' ? 'text-muted-foreground' : ''}`}>
        {message}
      </p>
    </div>
  );
};

export default function DiagPage() {
  const { user, isReady: isAuthReady } = useAuth();
  
  // Granular Firebase Core Checks
  const [firebaseConfigCheck, setFirebaseConfigCheck] = useState<CheckResult>({ status: 'pending', message: '1. Checking for Firebase config variables...' });
  const [firebaseAppCheck, setFirebaseAppCheck] = useState<CheckResult>({ status: 'pending', message: '2. Checking Firebase App initialization...' });
  const [firebaseServicesCheck, setFirebaseServicesCheck] = useState<CheckResult>({ status: 'pending', message: '3. Checking individual Firebase services...' });
  
  const [authCheck, setAuthCheck] = useState<CheckResult>({ status: 'pending', message: 'Checking authentication status...' });
  const [firestoreStallsCheck, setFirestoreStallsCheck] = useState<CheckResult>({ status: 'pending', message: 'Checking public read access for "stalls"...' });
  const [firestoreUsersCheck, setFirestoreUsersCheck] = useState<CheckResult>({ status: 'pending', message: 'Checking admin read access for "users"...' });
  const [functionsCheck, setFunctionsCheck] = useState<CheckResult>({ status: 'pending', message: 'Checking Cloud Functions client initialization...' });

  useEffect(() => {
    const runChecks = async () => {
      // 1. Test Firebase Configuration Presence
      if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.apiKey !== "YOUR_KEY_HERE") {
        setFirebaseConfigCheck({ status: 'success', message: '1. Firebase environment variables are present.' });
      } else {
        setFirebaseConfigCheck({ status: 'error', message: '1. Firebase environment variables are missing or are placeholders. Check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_* keys are set.' });
        setFirebaseAppCheck({ status: 'error', message: '2. Skipped: Config is missing.' });
        setFirebaseServicesCheck({ status: 'error', message: '3. Skipped: Config is missing.' });
        setFirestoreStallsCheck({ status: 'error', message: 'Skipped: Firebase init failed.' });
        setFirestoreUsersCheck({ status: 'error', message: 'Skipped: Firebase init failed.' });
        setFunctionsCheck({ status: 'error', message: 'Skipped: Firebase init failed.' });
        return; // Stop checks if config is missing
      }

      // 2. Test Firebase App Initialization
      let app;
      try {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        if (!app) throw new Error("initializeApp returned null or undefined.");
        setFirebaseAppCheck({ status: 'success', message: '2. Firebase App initialized successfully.' });
      } catch (error: any) {
        setFirebaseAppCheck({ status: 'error', message: `2. Firebase App initialization failed: ${error.message}` });
        setFirebaseServicesCheck({ status: 'error', message: '3. Skipped: App init failed.' });
        setFirestoreStallsCheck({ status: 'error', message: 'Skipped: Firebase init failed.' });
        setFirestoreUsersCheck({ status: 'error', message: 'Skipped: Firebase init failed.' });
        setFunctionsCheck({ status: 'error', message: 'Skipped: Firebase init failed.' });
        return;
      }

      // 3. Test Individual Service Initialization
      let db: Firestore;
      try {
        const auth = getAuth(app);
        const functions = getFunctions(app);
        const services = initializeFirebaseServices(); // This also gets Firestore
        if (!services || !services.db) throw new Error("initializeFirebaseServices returned null or did not contain a db instance.");
        db = services.db;
        setFirebaseServicesCheck({ status: 'success', message: '3. Auth, Firestore, and Functions services initialized.' });
        setFunctionsCheck({ status: 'success', message: 'Cloud Functions client is initialized. Ready to call deployed functions.' });
      } catch (error: any) {
        setFirebaseServicesCheck({ status: 'error', message: `3. Failed to get individual services: ${error.message}` });
        setFirestoreStallsCheck({ status: 'error', message: 'Skipped: Service init failed.' });
        setFirestoreUsersCheck({ status: 'error', message: 'Skipped: Service init failed.' });
        setFunctionsCheck({ status: 'error', message: 'Skipped: Service init failed.' });
        return;
      }

      // 4. Test Firestore Read (Stalls)
      try {
        const stallsCollectionRef = collection(db, 'stalls');
        await getDocs(stallsCollectionRef);
        setFirestoreStallsCheck({ status: 'success', message: 'Successfully connected and read from "stalls" collection (Public Access OK).' });
      } catch (error: any) {
        let errorMessage = `Failed to fetch from "stalls": ${error.message}`;
        if (error.code === 'permission-denied') {
          errorMessage = 'Permission Denied. Public access to "stalls" collection is blocked by security rules.';
        }
        setFirestoreStallsCheck({ status: 'error', message: errorMessage });
      }
      
    };

    runChecks();
  }, []);

  useEffect(() => {
    // Test Authentication
    if (isAuthReady) {
      if (user) {
        setAuthCheck({ status: 'success', message: `Auth is ready. User is signed in as ${user.email}.` });
      } else {
        setAuthCheck({ status: 'success', message: 'Auth is ready. No user is currently signed in.' });
      }
    }
  }, [isAuthReady, user]);

   useEffect(() => {
    // Test Firestore Read (Users - Admin Access)
      const checkUsers = async () => {
        const services = initializeFirebaseServices();
        if (!services) {
            setFirestoreUsersCheck({ status: 'error', message: 'Admin access check skipped: Firebase services not available.' });
            return;
        }

        if (!isAuthReady) {
          setFirestoreUsersCheck({ status: 'pending', message: 'Waiting for auth to be ready...' });
          return;
        }
        if (!user) {
          setFirestoreUsersCheck({ status: 'error', message: 'Admin access check skipped: No user is signed in.' });
          return;
        }
        if (user.email !== 'admin@u-dry.com') {
          setFirestoreUsersCheck({ status: 'success', message: `Test skipped: Signed in as non-admin user (${user.email}). This is expected.` });
          return;
        }
        try {
          const usersCollectionRef = collection(services.db, 'users');
          await getDocs(usersCollectionRef);
          setFirestoreUsersCheck({ status: 'success', message: 'Admin access to "users" collection successful (Security Rules OK).' });
        } catch (error: any) {
          let errorMessage = `Failed to fetch from "users": ${error.message}`;
          if (error.code === 'permission-denied') {
            errorMessage = 'Permission Denied. The admin account is blocked by security rules from reading the "users" collection.';
          }
          setFirestoreUsersCheck({ status: 'error', message: errorMessage });
        }
      };
      
      checkUsers();
    }, [user, isAuthReady]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center">
            <ShieldQuestion className="mr-3 h-8 w-8" />
            Application Diagnostic Panel
          </CardTitle>
          <CardDescription>
            This page performs live checks on critical application systems. Use this to diagnose issues after a crash or before a build.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 border rounded-lg">
            <h2 className="text-lg font-semibold flex items-center"><Server className="mr-2 h-5 w-5"/> Firebase Core</h2>
            <StatusIndicator {...firebaseConfigCheck} />
            <StatusIndicator {...firebaseAppCheck} />
            <StatusIndicator {...firebaseServicesCheck} />
          </div>
          
          <div className="space-y-4 p-4 border rounded-lg">
            <h2 className="text-lg font-semibold flex items-center"><UserCheck className="mr-2 h-5 w-5"/> Authentication</h2>
            <StatusIndicator {...authCheck} />
          </div>
          
          <div className="space-y-4 p-4 border rounded-lg">
            <h2 className="text-lg font-semibold flex items-center"><Database className="mr-2 h-5 w-5"/> Firestore Database</h2>
            <StatusIndicator {...firestoreStallsCheck} />
            <StatusIndicator {...firestoreUsersCheck} />
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Security Rules Note</AlertTitle>
              <AlertDescription>
                This panel tests for two key permissions: public read access for `stalls` (for the map) and admin-only read access for `users` (for the admin panel). Failures here point directly to misconfigured `firestore.rules`.
              </AlertDescription>
            </Alert>
          </div>
           <div className="space-y-4 p-4 border rounded-lg">
            <h2 className="text-lg font-semibold flex items-center"><Layers className="mr-2 h-5 w-5"/> Cloud Functions</h2>
            <StatusIndicator {...functionsCheck} />
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Deployment Note</AlertTitle>
                <AlertDescription>
                    This checks if the client app can connect to the Functions service. It does NOT verify if the functions are successfully deployed. A timeout error during `firebase deploy` points to an issue in `functions/index.js` (often global-scope initializations).
                </AlertDescription>
            </Alert>
           </div>
        </CardContent>
        <CardFooter>
           <Button asChild variant="outline">
              <Link href="/">
                Back to Main Page
              </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
