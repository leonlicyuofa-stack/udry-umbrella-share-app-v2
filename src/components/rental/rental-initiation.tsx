
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stall } from "@/lib/types";
import { ArrowLeft, MapPin, Umbrella, Loader2, AlertTriangle, LogIn, CheckCircle, Smartphone, Bluetooth, XCircle, BluetoothConnected, BluetoothSearching } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth, useStalls } from "@/contexts/auth-context";

// Bluetooth Constants
const UTEK_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const UTEK_CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";
const GET_UMBRELLA_BASE_PARM = 2000000;

type UnlockState = 'idle' | 'requesting_device' | 'connecting' | 'getting_token' | 'getting_command' | 'sending_command' | 'success' | 'error';

const unlockStateMessages: Record<UnlockState, string> = {
  idle: "Ready to start.",
  requesting_device: "Searching for your machine. Please select it from the Bluetooth pop-up...",
  connecting: "Connecting to machine...",
  getting_token: "Connected. Authenticating with machine...",
  getting_command: "Authenticated. Getting unlock command from server...",
  sending_command: "Sending unlock command to machine...",
  success: "Unlock command sent! Please take your umbrella.",
  error: "An error occurred."
};

interface RentalInitiationProps {
  stall: Stall;
}

export function RentalInitiation({ stall }: RentalInitiationProps) {
  const { user, loading: authLoading, useFirstFreeRental, activeRental, startRental, logMachineEvent } = useAuth();
  const { stalls } = useStalls();
  const router = useRouter();
  const { toast } = useToast();
  
  const [unlockState, setUnlockState] = useState<UnlockState>('idle');
  const [bluetoothError, setBluetoothError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const bluetoothDeviceRef = useRef<BluetoothDevice | null>(null);
  const tokCharacteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  
  const isUnlocking = unlockState !== 'idle' && unlockState !== 'success' && unlockState !== 'error';

  useEffect(() => {
    if (activeRental && !isUnlocking) {
      toast({
        title: "Rental In Progress",
        description: "You already have an active rental. Please end it before starting a new one.",
        variant: "destructive",
      });
      router.replace('/');
    }
  }, [activeRental, isUnlocking, router, toast]);

  const handleGattServerDisconnected = useCallback(() => {
    toast({ variant: "destructive", title: "Bluetooth Disconnected", description: "The device connection was lost." });
    logMachineEvent({ stallId: stall.id, type: 'error', message: 'Bluetooth GATT Server Disconnected during rental process.' });
    tokCharacteristicRef.current = null;
    bluetoothDeviceRef.current = null;
    setUnlockState('idle');
  }, [toast, logMachineEvent, stall.id]);
  
  const handleTokNotification = useCallback(async (event: Event) => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    if (!value) return;

    const decoder = new TextDecoder('utf-8');
    const receivedString = decoder.decode(value).trim();
    console.log(`[U-Dry Rent] Notification Received: "${receivedString}"`);
    logMachineEvent({ stallId: stall.id, type: 'received', message: `Received Signal: "${receivedString}"` });

    if (receivedString.startsWith("TOK:")) {
      const tokenValue = receivedString.substring(4).trim();
      if (/^\d{6}$/.test(tokenValue)) {
        console.log(`[U-Dry Rent] Parsed Token: ${tokenValue}`);
        setUnlockState('getting_command');
        
        try {
          const slotNum = stall.nextActionSlot;
          const parmValue = (GET_UMBRELLA_BASE_PARM + slotNum).toString();
          const cmdType = '1';

          // This part would ideally be a secure server-side call in a real app
          // For this project, we simulate it via an API route for realism.
          const backendResponse = await fetch('/api/admin/unlock-physical-machine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dvid: stall.dvid, tok: tokenValue, parm: parmValue, cmd_type: cmdType }),
          });
          const result = await backendResponse.json();

          if (!backendResponse.ok || !result.success || !result.unlockDataString) {
            const errorMsg = result.message || `Failed to get unlock command.`;
            logMachineEvent({ stallId: stall.id, type: 'error', message: `Vendor API Error on Rent: ${errorMsg}`});
            throw new Error(errorMsg);
          }
          
          setUnlockState('sending_command');
          const commandToSend = `CMD:${result.unlockDataString}\r\n`;
          await tokCharacteristicRef.current?.writeValue(new TextEncoder().encode(commandToSend));
          logMachineEvent({ stallId: stall.id, type: 'sent', message: `Sent Command: "${commandToSend.trim()}" (Get Umbrella)`});

          console.log(`[U-Dry Rent] Unlock command sent to machine.`);
          
          setShowSuccessDialog(true);
          setUnlockState('success');

        } catch (error: any) {
          console.error("[U-Dry Rent] Error during server command fetch or BT write:", error);
          const errorMsg = error.message || "Unknown error during command phase.";
          setBluetoothError(errorMsg);
          setUnlockState('error');
          logMachineEvent({ stallId: stall.id, type: 'error', message: `Failed to get/send command: ${errorMsg}`});
        }
      } else {
         const errorMsg = `Invalid token format received: ${tokenValue}`;
         setBluetoothError(errorMsg);
         setUnlockState('error');
         logMachineEvent({ stallId: stall.id, type: 'error', message: errorMsg });
      }
    } else if (receivedString.startsWith("CMD:")) {
      console.log(`[U-Dry Rent] Machine acknowledged command with: ${receivedString}`);
    } else if (receivedString.startsWith("REPET:")) {
      const errorMsg = "Machine Error: This rental action has already been processed. Please try again or select a different slot if possible.";
      console.error(`[U-Dry Rent] Received REPET error: ${receivedString}`);
      setBluetoothError(errorMsg);
      setUnlockState('error');
      toast({ variant: "destructive", title: "Duplicate Action Error", description: errorMsg, duration: 8000 });
    }
  }, [stall, toast, logMachineEvent]);

  useEffect(() => {
    if (showSuccessDialog) {
      const isFirstRental = user && user.hasHadFirstFreeRental === false;
      const timer = setTimeout(() => {
        if (isFirstRental) {
            useFirstFreeRental();
        }
        startRental({
          stallId: stall.id,
          stallName: stall.name,
          startTime: Date.now(),
          isFree: !!isFirstRental,
        });
        router.push('/');
        setShowSuccessDialog(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog, startRental, router, stall.id, stall.name, user, useFirstFreeRental]);

  const handleUnlock = async () => {
    if (isUnlocking || activeRental) return;
    if (!user) {
       toast({ title: "Authentication Error", description: "You must be logged in to rent.", variant: "destructive" });
       router.push(`/auth/signin?redirect=/rent/${stall.id}`);
       return;
    }
    if (stall.availableUmbrellas <= 0) {
      toast({ title: "No Umbrellas Available", description: "Sorry, there are no umbrellas available at this stall.", variant: "destructive" });
      return;
    }
    if (!user.deposit || user.deposit < 100) {
        toast({ title: "Deposit Required", description: "A HK$100 deposit is required to rent.", variant: "destructive", duration: 7000 });
        router.push('/deposit');
        return;
    }
    const isFirstRental = user.hasHadFirstFreeRental === false;
    if (!isFirstRental && (!user.balance || user.balance <= 0)) {
        toast({ title: "Insufficient Balance", description: "Your spendable balance is HK$0. Please add funds.", variant: "destructive", duration: 7000 });
        router.push('/deposit');
        return;
    }

    if (!navigator.bluetooth) {
      const errorMsg = "Web Bluetooth API not available. Use a compatible browser (e.g., Chrome, Edge) and ensure page is served via HTTPS or localhost.";
      setBluetoothError(errorMsg);
      setUnlockState('error');
      logMachineEvent({ stallId: stall.id, type: 'error', message: errorMsg});
      return;
    }
    
    setBluetoothError(null);
    setUnlockState('requesting_device');
    logMachineEvent({ stallId: stall.id, type: 'info', message: 'User initiated rental. Starting Bluetooth connection...'});

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [UTEK_SERVICE_UUID] },
          { name: stall.btName }
        ],
        optionalServices: [UTEK_SERVICE_UUID]
      });
      bluetoothDeviceRef.current = device;
      device.addEventListener('gattserverdisconnected', handleGattServerDisconnected);
      
      setUnlockState('connecting');
      const server = await device.gatt?.connect();
      if (!server) throw new Error("Failed to connect to GATT server.");
      logMachineEvent({ stallId: stall.id, type: 'info', message: `Connected to device: ${device.name || 'Unknown'}`});

      const service = await server.getPrimaryService(UTEK_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(UTEK_CHARACTERISTIC_UUID);
      tokCharacteristicRef.current = characteristic;
      
      setUnlockState('getting_token');
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleTokNotification);
      
      await characteristic.writeValue(new TextEncoder().encode("TOK\r\n"));
      logMachineEvent({ stallId: stall.id, type: 'sent', message: 'Sent Signal: "TOK\\r\\n"'});

    } catch (error: any) {
      let errorMsg = error.message || "An unknown Bluetooth error occurred.";
      if (error.name === "NotFoundError") errorMsg = "No compatible Bluetooth device found or selection was cancelled.";
      setBluetoothError(errorMsg);
      setUnlockState('error');
      logMachineEvent({ stallId: stall.id, type: 'error', message: `Bluetooth Connection Error: ${errorMsg}`});
    }
  };
  
  const handleDisconnectAndReset = () => {
    const device = bluetoothDeviceRef.current;
    if(device?.gatt?.connected) {
        device.gatt.disconnect();
    }
    tokCharacteristicRef.current = null;
    bluetoothDeviceRef.current = null;
    setUnlockState('idle');
    setBluetoothError(null);
  };
  
  useEffect(() => {
    const device = bluetoothDeviceRef.current;
    const characteristic = tokCharacteristicRef.current;
    return () => {
      if (characteristic) {
        characteristic.removeEventListener('characteristicvaluechanged', handleTokNotification);
      }
       if (device) {
        device.removeEventListener('gattserverdisconnected', handleGattServerDisconnected);
        if (device.gatt?.connected) {
          device.gatt.disconnect();
        }
      }
    };
  }, [handleGattServerDisconnected, handleTokNotification]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading account status...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] py-8 px-4">
        <Card className="w-full max-w-md shadow-xl text-center">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center justify-center">
              <AlertTriangle className="mr-2 h-6 w-6" /> Authentication Required
            </CardTitle>
            <CardDescription>You need to be logged in to rent an umbrella.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="mt-4 w-full">
              <Link href={`/auth/signin?redirect=/rent/${stall.id}`} className="flex items-center">
                <LogIn className="mr-2 h-4 w-4" /> Sign In to Rent
              </Link>
            </Button>
            <Button variant="outline" asChild className="mt-2 w-full">
                <Link href="/">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back to Map
                </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canRent = user.deposit && user.deposit >= 100 && stall.availableUmbrellas > 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-8 px-4">
      <AlertDialog open={showSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <AlertDialogTitle className="flex items-center text-xl text-green-600">
              <CheckCircle className="mr-2 h-8 w-8" />
              Unlock Command Sent!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-center py-4 text-foreground">
              Please take your umbrella. Your rental is starting.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <Link href="/" className="flex items-center text-sm text-primary hover:underline mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Map
          </Link>
          <CardTitle className="text-2xl font-bold text-primary flex items-center">
            <Umbrella className="h-6 w-6 mr-2" /> Rent from {stall.name}
          </CardTitle>
          <CardDescription className="flex items-center">
            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" /> {stall.address}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-4">
            {bluetoothError && (
              <Alert variant="destructive">
                <BluetoothSearching className="h-4 w-4" />
                <AlertTitle>Bluetooth Error</AlertTitle>
                <AlertDescription>{bluetoothError}</AlertDescription>
              </Alert>
            )}

            {!canRent && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4"/>
                    <AlertTitle>Cannot Rent</AlertTitle>
                    <AlertDescription>
                        {stall.availableUmbrellas <= 0 
                            ? "There are no umbrellas available at this stall."
                            : "A HK$100 deposit is required. Please add a deposit from your account page."
                        }
                    </AlertDescription>
                </Alert>
            )}

            {isUnlocking && (
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-3" />
                <p className="text-sm text-primary font-medium">{unlockStateMessages[unlockState]}</p>
              </div>
            )}
            
            {unlockState === 'success' && (
               <div className="text-center p-4 bg-green-100 rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-3" />
                <p className="text-sm text-green-700 font-medium">{unlockStateMessages.success}</p>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold">Availability:</h4>
            <p className={stall.availableUmbrellas > 0 ? "text-green-600" : "text-red-600"}>
              {stall.availableUmbrellas} / {stall.totalUmbrellas} umbrellas available
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Rental Terms:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>Minimum HK$100 refundable security deposit required on account to rent.</li>
              <li>First rental is free!</li>
              <li>After first rental: HK$5 per hour.</li>
              <li>Daily charge capped at HK$25 (for each 24-hour period).</li>
              <li>Return to any U-Dry stall.</li>
              <li>Deposit will be forfeited if umbrella is not returned within 3 days (72 hours).</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex-col space-y-2">
            {!isUnlocking && unlockState !== 'success' && (
              <Button onClick={handleUnlock} disabled={!canRent} className="w-full">
                  <Bluetooth className="mr-2 h-5 w-5" /> Connect & Unlock Umbrella
              </Button>
            )}
             {unlockState === 'error' && (
              <Button onClick={handleDisconnectAndReset} variant="outline" className="w-full">
                  Try Again
              </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
