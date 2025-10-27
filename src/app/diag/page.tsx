
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Loader2, PlayCircle, Radio } from 'lucide-react';
import { initializeFirebaseServices } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function DiagnosticTestPage() {
  const { toast } = useToast();
  const [jsStatus, setJsStatus] = useState<'waiting' | 'loaded'>('waiting');
  const [capacitorStatus, setCapacitorStatus] = useState<'untested' | 'ready' | 'unavailable'>('untested');
  const [firebaseStatus, setFirebaseStatus] = useState<'idle' | 'initializing' | 'success' | 'error'>('idle');
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Test 1: Does JavaScript run?
  useEffect(() => {
    // If this runs, JavaScript is executing in the webview.
    setJsStatus('loaded');
  }, []);

  // Test 2: Can we detect the Capacitor environment?
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        setCapacitorStatus('ready');
    } else {
        setCapacitorStatus('unavailable');
    }
  }, []);


  // Test 3: Manual Firebase Initialization
  const handleInitializeFirebase = () => {
    setFirebaseStatus('initializing');
    setFirebaseError(null);
    try {
      const services = initializeFirebaseServices();
      if (services) {
        setFirebaseStatus('success');
        toast({ title: 'Success', description: 'Firebase services initialized without crashing.' });
      } else {
        throw new Error('Initialization returned null. Check Firebase config.');
      }
    } catch (error: any) {
      setFirebaseStatus('error');
      setFirebaseError(error.message);
      toast({ variant: 'destructive', title: 'Initialization Failed', description: error.message });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/30 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center">
            <Radio className="mr-3 h-6 w-6" />
            U-Dry Startup Diagnostic Panel
          </CardTitle>
          <CardDescription>
            This page runs a series of tests to diagnose app startup issues.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <Card>
            <CardHeader><CardTitle className="text-lg">Test 1: Web View & JavaScript</CardTitle></CardHeader>
            <CardContent>
              {jsStatus === 'waiting' && (
                <div className="flex items-center text-orange-600">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Waiting for JavaScript to execute...</span>
                </div>
              )}
              {jsStatus === 'loaded' && (
                <div className="flex items-center text-green-600 font-semibold">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  <span>Success! The web view is running JavaScript.</span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle className="text-lg">Test 2: Capacitor Bridge</CardTitle></CardHeader>
            <CardContent>
              {capacitorStatus === 'untested' && (
                <div className="flex items-center text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Checking for native environment...</span>
                </div>
              )}
               {capacitorStatus === 'ready' && (
                <div className="flex items-center text-green-600 font-semibold">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  <span>Success! App is running in a native Capacitor container.</span>
                </div>
              )}
               {capacitorStatus === 'unavailable' && (
                <div className="flex items-center text-orange-600">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  <span>Note: Not running in a native Capacitor container (this is expected in a browser).</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test 3: Manual Firebase Initialization</CardTitle>
              <CardDescription>
                Click this button to manually attempt initializing Firebase services.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleInitializeFirebase} disabled={jsStatus !== 'loaded' || firebaseStatus === 'initializing'}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Attempt to Initialize Firebase
                </Button>
                <div className="mt-4 p-2 bg-muted rounded-md text-sm min-h-[50px]">
                    {firebaseStatus === 'initializing' && (
                         <div className="flex items-center text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Initializing...</span>
                        </div>
                    )}
                     {firebaseStatus === 'success' && (
                         <div className="flex items-center text-green-600 font-semibold">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span>Firebase Initialized Successfully on demand.</span>
                        </div>
                    )}
                     {firebaseStatus === 'error' && (
                         <div className="flex items-start text-destructive font-semibold">
                            <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
                            <div>
                                <p>Firebase Initialization FAILED:</p>
                                <p className="font-mono text-xs mt-1">{firebaseError}</p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
  );
}
