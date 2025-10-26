"use client";

import { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Loader2, PlayCircle, Radio } from 'lucide-react';
import { initializeFirebaseServices } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function DiagnosticTestPage() {
  const { toast } = useToast();
  const [capacitorStatus, setCapacitorStatus] = useState<'waiting' | 'ready'>('waiting');
  const [firebaseStatus, setFirebaseStatus] = useState<'idle' | 'initializing' | 'success' | 'error'>('idle');
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs once when the component mounts.
    // It sets up a listener for the Capacitor 'appStateChange' event.
    const setupListener = async () => {
      // The 'active' property tells us if the app is in the foreground.
      // Getting this state successfully is a good sign the bridge is alive.
      const initialState = await App.getState();
      if (initialState.isActive) {
        setCapacitorStatus('ready');
      }

      // Add a listener that will also set the status to ready when the app becomes active.
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          setCapacitorStatus('ready');
        }
      });
    };

    // We check for App.getLaunchUrl because this code only works in a native environment.
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        setupListener();
    } else {
        // If not in a native app, just set to ready for browser testing.
        setCapacitorStatus('ready');
    }

  }, []);

  const handleInitializeFirebase = () => {
    setFirebaseStatus('initializing');
    setFirebaseError(null);
    try {
      // This is the function we suspect might be causing the crash
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
            This page tests the interaction between the web view and the native Capacitor layer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test 1: Capacitor Bridge Status</CardTitle>
            </CardHeader>
            <CardContent>
              {capacitorStatus === 'waiting' && (
                <div className="flex items-center text-orange-600">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Waiting for signal from native app...</span>
                </div>
              )}
              {capacitorStatus === 'ready' && (
                <div className="flex items-center text-green-600 font-semibold">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  <span>Capacitor Bridge is Ready!</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test 2: Manual Firebase Initialization</CardTitle>
              <CardDescription>
                Click this button to manually attempt initializing Firebase. This simulates what the app tries to do on startup.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleInitializeFirebase} disabled={capacitorStatus !== 'ready' || firebaseStatus === 'initializing'}>
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
                            <span>Firebase Initialized Successfully. The crash is not caused by this function alone.</span>
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
