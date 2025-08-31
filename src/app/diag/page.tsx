
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle, XCircle, HardDrive, Database, UserCheck, ArrowRight, Home, Server, Link as LinkIcon } from 'lucide-react';
import { initializeFirebaseServices } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { mockStalls } from '@/lib/mock-data';
import type { Stall } from '@/lib/types';
import { GeoPoint } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


type CheckStatus = 'pending' | 'success' | 'error';

interface CheckResult {
  title: string;
  status: CheckStatus;
  message: string;
}

export default function DiagPage() {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const runChecks = async () => {
      let checks: CheckResult[] = [];

      // 1. Firebase SDK Initialization Check
      const services = initializeFirebaseServices();
      if (services) {
        checks.push({ title: 'Firebase SDK Init', status: 'success', message: 'SDK initialized successfully.' });

        // 2. Firestore Connectivity Check
        try {
          // Attempt to read a known collection (even if it's empty)
          const stallsCollectionRef = collection(services.db, 'stalls');
          await getDocs(stallsCollectionRef);
          checks.push({ title: 'Firestore Connectivity', status: 'success', message: 'Successfully connected to Firestore.' });
        } catch (error: any) {
          let message = `Failed to connect to Firestore: ${error.message}`;
          if (error.code === 'permission-denied') {
            message += " Check your Firestore security rules.";
          }
          checks.push({ title: 'Firestore Connectivity', status: 'error', message });
        }
      } else {
        checks.push({ title: 'Firebase SDK Init', status: 'error', message: 'Failed to initialize. Check .env config.' });
        checks.push({ title: 'Firestore Connectivity', status: 'pending', message: 'Skipped due to SDK init failure.' });
      }

      setResults(checks);
    };

    runChecks();
  }, []);

  const handleSeedData = async () => {
    setIsSeeding(true);
    const services = initializeFirebaseServices();
    if (!services?.db) {
      toast({ variant: "destructive", title: "Error", description: "Firebase is not initialized." });
      setIsSeeding(false);
      return;
    }
    
    try {
      const batch = writeBatch(services.db);
      mockStalls.forEach((stallData) => {
        // Create a Firestore GeoPoint from the mock data
        const locationGeoPoint = new GeoPoint(stallData.location.latitude, stallData.location.longitude);
        const stallDocRef = doc(services.db, "stalls", stallData.dvid);
        
        // Prepare the data, replacing the plain object with the GeoPoint instance
        const dataToSet = {
          ...stallData,
          location: locationGeoPoint,
        };
        
        batch.set(stallDocRef, dataToSet);
      });

      await batch.commit();
      toast({ title: "Success", description: "Mock stall data has been written to your local Firestore emulator." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Seeding Failed", description: error.message });
    } finally {
      setIsSeeding(false);
    }
  };


  const StatusIcon = ({ status }: { status: CheckStatus }) => {
    if (status === 'pending') return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    if (status === 'success') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'error') return <XCircle className="h-5 w-5 text-destructive" />;
    return null;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/30 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center">
            <Server className="mr-3 h-6 w-6" />
            U-Dry Diagnostic Panel
          </CardTitle>
          <CardDescription>
            This page runs tests to check the application's configuration and connectivity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 p-4 border rounded-lg bg-background">
            {results.length === 0 ? (
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Running checks...</span>
              </div>
            ) : (
              results.map((result, index) => (
                <div key={index} className="flex items-start">
                  <StatusIcon status={result.status} />
                  <div className="ml-3">
                    <p className="font-semibold">{result.title}</p>
                    <p className="text-xs text-muted-foreground">{result.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Card className="bg-secondary/50">
            <CardHeader>
                <CardTitle className="text-lg flex items-center">
                    <LinkIcon className="mr-2 h-5 w-5"/>
                    Deep Link Sanity Check
                </CardTitle>
                <CardDescription>
                    This test helps isolate if the app's URL scheme (udry://) is working correctly, independent of Stripe.
                </CardDescription>
            </CardHeader>
            <CardContent>
               <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Instructions</AlertTitle>
                <AlertDescription>
                  Click the button below. If the app closes and re-opens to the homepage, the deep link is working. If you get an error (e.g., "address invalid"), the app is not configured correctly.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
                 <Button asChild>
                    <a href="udry://home">
                        Test udry://home Link
                    </a>
                </Button>
            </CardFooter>
          </Card>


          <Card className="bg-secondary/50">
            <CardHeader>
                <CardTitle className="text-lg flex items-center">
                    <HardDrive className="mr-2 h-5 w-5"/>
                    Emulator Database Setup
                </CardTitle>
                <CardDescription>
                    If your local Firestore database is empty, use this button to populate it with the initial mock stall data. This is only needed once.
                </CardDescription>
            </CardHeader>
            <CardFooter>
                 <Button onClick={handleSeedData} disabled={isSeeding}>
                    {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Database className="mr-2 h-4 w-4"/>}
                    Seed Stall Data
                </Button>
            </CardFooter>
          </Card>
        </CardContent>
         <CardFooter className="flex justify-end">
            <Button asChild variant="outline">
                <Link href="/home">
                    Go to Homepage <Home className="ml-2 h-4 w-4"/>
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    