// src/app/diag/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { collection, getDocs, type Firestore, writeBatch, doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle, XCircle, ShieldQuestion, Server, UserCheck, Database, Layers, UploadCloud, UserSearch, Smartphone, Wifi, Bluetooth, Camera } from 'lucide-react';
import Link from 'next/link';
import { initializeFirebaseServices } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { mockStalls } from '@/lib/mock-data';
import { GeoPoint } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';


type Status = 'pending' | 'success' | 'error' | 'untested';

interface CheckResult {
  status: Status;
  message: string;
  data?: any;
}

const StatusIndicator = ({ status, message, data }: CheckResult) => {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-start">
        <div className="w-8 flex-shrink-0 pt-0.5">
          {status === 'pending' && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {status === 'error' && <XCircle className="h-5 w-5 text-destructive" />}
          {status === 'untested' && <ShieldQuestion className="h-5 w-5 text-muted-foreground" />}
        </div>
        <p className={`font-medium ${status === 'error' ? 'text-destructive' : ''} ${status === 'pending' ? 'text-muted-foreground' : ''}`}>
          {message}
        </p>
      </div>
      {data && (
        <pre className="ml-8 mt-1 p-2 bg-muted/50 text-xs rounded-md w-[calc(100%-2rem)] overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default function DiagPage() {
  const { user, isReady: isAuthReady } = useAuth();
  const { toast } = useToast();
  
  const [firebaseCoreCheck, setFirebaseCoreCheck] = useState<CheckResult>({ status: 'pending', message: '1. Checking Firebase core services initialization...' });
  const [authCheck, setAuthCheck] = useState<CheckResult>({ status: 'pending', message: 'Checking authentication status...' });
  const [firestoreStallsCheck, setFirestoreStallsCheck] = useState<CheckResult>({ status: 'pending', message: 'Checking public read access for "stalls"...' });
  const [isSeeding, setIsSeeding] = useState(false);

  // States for admin permission checks
  const [adminRecordCheck, setAdminRecordCheck] = useState<CheckResult>({ status: 'pending', message: '1. Checking for your specific admin record...' });
  const [adminListCheck, setAdminListCheck] = useState<CheckResult>({ status: 'pending', message: '2. Listing all documents in the "admins" collection...' });

  // States for new iOS Readiness checks
  const [isCheckingIos, setIsCheckingIos] = useState(false);
  const [cameraCheck, setCameraCheck] = useState<CheckResult>({ status: 'untested', message: 'Camera API access' });
  const [bluetoothCheck, setBluetoothCheck] = useState<CheckResult>({ status: 'untested', message: 'Bluetooth API access' });
  const [connectivityCheck, setConnectivityCheck] = useState<CheckResult>({ status: 'untested', message: 'External API Connectivity (UTEK)' });

  const handleSeedDatabase = async () => {
    const services = initializeFirebaseServices();
    if (!services) {
      toast({ variant: "destructive", title: "Firebase Not Initialized", description: "Cannot connect to database to seed data." });
      return;
    }
    setIsSeeding(true);
    try {
      const batch = writeBatch(services.db);
      mockStalls.forEach(stallData => {
        const stallDocRef = doc(services.db, 'stalls', stallData.dvid);
        const locationGeoPoint = new GeoPoint(stallData.location.latitude, stallData.location.longitude);
        const dataToSet = { ...stallData, location: locationGeoPoint };
        batch.set(stallDocRef, dataToSet);
      });
      await batch.commit();
      toast({ title: "Database Seeded!", description: `Successfully added ${mockStalls.length} stall documents.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Seeding Failed", description: error.message });
      console.error("Error seeding database:", error);
    } finally {
      setIsSeeding(false);
    }
  };

  const runIosChecks = async () => {
    setIsCheckingIos(true);
    
    // 1. Camera Check
    setCameraCheck({ status: 'pending', message: 'Checking Camera API...'});
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setCameraCheck({ status: 'success', message: 'Camera API (getUserMedia) is available.' });
    } else {
        setCameraCheck({ status: 'error', message: 'Camera API (getUserMedia) is NOT available in this environment.' });
    }

    // 2. Bluetooth Check
    setBluetoothCheck({ status: 'pending', message: 'Checking Bluetooth API...'});
    if (navigator.bluetooth) {
        setBluetoothCheck({ status: 'success', message: 'Web Bluetooth API is available.' });
    } else {
        setBluetoothCheck({ status: 'error', message: 'Web Bluetooth API is NOT available. This is expected in many environments (like non-secure origins or standard iOS WebViews without specific configuration).' });
    }

    // 3. Connectivity Check
    setConnectivityCheck({ status: 'pending', message: 'Checking UTEK API connectivity...'});
    try {
        // We use our own API route as a proxy to avoid CORS issues in the browser.
        const response = await fetch('/api/admin/unlock-physical-machine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true }), // Send a test payload
        });
        if (response.status === 400) { // A 400 Bad Request is a success for this test, as it means our server responded.
             setConnectivityCheck({ status: 'success', message: 'Successfully connected to our server proxy for UTEK API.' });
        } else {
             throw new Error(`Server responded with status: ${response.status}`);
        }
    } catch (error: any) {
        setConnectivityCheck({ status: 'error', message: `Failed to connect to our server proxy for UTEK API: ${error.message}` });
    }

    setIsCheckingIos(false);
  };


  useEffect(() => {
    const runChecks = async () => {
      const services = initializeFirebaseServices();
      
      if (services && services.app && services.auth && services.db && services.functions) {
        setFirebaseCoreCheck({ status: 'success', message: '1. Firebase core services initialized successfully.' });
      } else {
        setFirebaseCoreCheck({ status: 'error', message: '1. Firebase core services failed to initialize. Check your hardcoded configuration in `src/lib/firebase.ts`.' });
        return;
      }
      
      try {
        const stallsCollectionRef = collection(services.db, 'stalls');
        await getDocs(stallsCollectionRef);
        setFirestoreStallsCheck({ status: 'success', message: 'Successfully connected and read from "stalls" collection (Public Access OK).' });
      } catch (error: any) {
        setFirestoreStallsCheck({ status: 'error', message: `Failed to fetch "stalls": ${error.message}` });
      }
    };
    runChecks();
  }, []);

  useEffect(() => {
    if (isAuthReady) {
      if (user) {
        setAuthCheck({ status: 'success', message: `Auth is ready. User is signed in.`, data: { email: user.email, uid: user.uid } });
      } else {
        setAuthCheck({ status: 'success', message: 'Auth is ready. No user is currently signed in.' });
      }
    }
  }, [isAuthReady, user]);

  useEffect(() => {
    const runAdminChecks = async () => {
      const services = initializeFirebaseServices();
      if (!services || !user) {
        setAdminRecordCheck({ status: 'error', message: 'Admin check skipped: No user is signed in.' });
        setAdminListCheck({ status: 'error', message: 'Admin check skipped: No user is signed in.' });
        return;
      }

      setAdminRecordCheck({ status: 'pending', message: '1. Checking for your specific admin record...' });
      setAdminListCheck({ status: 'pending', message: '2. Listing all documents in the "admins" collection...' });

      try {
        const adminDocRef = doc(services.db, 'admins', user.uid);
        const docSnap = await getDoc(adminDocRef);
        if (docSnap.exists()) {
          setAdminRecordCheck({ status: 'success', message: 'SUCCESS: An admin document with your UID exists.', data: docSnap.data() });
        } else {
          setAdminRecordCheck({ status: 'error', message: 'FAILURE: No admin document found with your UID.', data: { "path_checked": `/admins/${user.uid}` } });
        }
      } catch (error: any) {
        setAdminRecordCheck({ status: 'error', message: `Error checking for your admin document: ${error.message}` });
      }

      try {
        const adminsCollectionRef = collection(services.db, 'admins');
        const querySnapshot = await getDocs(adminsCollectionRef);
        const adminDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (adminDocs.length > 0) {
           setAdminListCheck({ status: 'success', message: `SUCCESS: Found ${adminDocs.length} document(s) in the "admins" collection.`, data: adminDocs });
        } else {
           setAdminListCheck({ status: 'error', message: 'FAILURE: The "admins" collection is empty.' });
        }
      } catch (error: any) {
        setAdminListCheck({ status: 'error', message: `Error listing "admins" collection: ${error.message}. This is likely a security rules issue for listing.` });
      }
    };

    if (isAuthReady && user) {
      runAdminChecks();
    }
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
            This page performs live checks on critical application systems to diagnose issues. Run the iOS checks from the simulator/device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-4 p-4 border rounded-lg bg-secondary/30">
            <h2 className="text-lg font-semibold flex items-center"><Smartphone className="mr-2 h-5 w-5 text-accent"/> iOS Readiness Checks</h2>
             <p className="text-sm text-muted-foreground">
               Run these tests from the iOS simulator or a real device to check for native compatibility issues.
             </p>
             <Button onClick={runIosChecks} disabled={isCheckingIos}>
              {isCheckingIos ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Smartphone className="mr-2 h-4 w-4"/>}
               Run iOS Checks
             </Button>
             <Separator />
             <div className="space-y-4">
                <StatusIndicator {...cameraCheck} />
                <StatusIndicator {...bluetoothCheck} />
                <StatusIndicator {...connectivityCheck} />
             </div>
          </div>

          <div className="space-y-4 p-4 border rounded-lg">
            <h2 className="text-lg font-semibold flex items-center"><UserSearch className="mr-2 h-5 w-5 text-accent"/> Admin Permission Checks</h2>
            <p className="text-sm text-muted-foreground">These tests check if your user account has the correct admin permissions according to Firestore.</p>
            <StatusIndicator {...adminRecordCheck} />
            <StatusIndicator {...adminListCheck} />
          </div>

          <div className="space-y-4 p-4 border rounded-lg bg-secondary/30">
            <h2 className="text-lg font-semibold flex items-center"><UploadCloud className="mr-2 h-5 w-5"/> Database Seeding</h2>
             <p className="text-sm text-muted-foreground">
               If the map is empty, click this to populate the 'stalls' collection with initial data.
             </p>
             <Button onClick={handleSeedDatabase} disabled={isSeeding}>
              {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Database className="mr-2 h-4 w-4"/>}
               Seed "stalls" Collection
             </Button>
          </div>

          <div className="space-y-4 p-4 border rounded-lg">
            <h2 className="text-lg font-semibold flex items-center"><Server className="mr-2 h-5 w-5"/> Firebase Core</h2>
            <StatusIndicator {...firebaseCoreCheck} />
          </div>
          
          <div className="space-y-4 p-4 border rounded-lg">
            <h2 className="text-lg font-semibold flex items-center"><UserCheck className="mr-2 h-5 w-5"/> Authentication</h2>
            <StatusIndicator {...authCheck} />
          </div>
          
          <div className="space-y-4 p-4 border rounded-lg">
            <h2 className="text-lg font-semibold flex items-center"><Database className="mr-2 h-5 w-5"/> Firestore Database</h2>
            <StatusIndicator {...firestoreStallsCheck} />
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
