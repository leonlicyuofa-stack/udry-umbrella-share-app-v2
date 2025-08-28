
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stall } from "@/lib/types";
import { ArrowLeft, MapPin, Umbrella, Loader2, AlertTriangle, LogIn, CheckCircle, Smartphone, Bluetooth, XCircle, BluetoothConnected, BluetoothSearching, QrCode, Camera } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/auth-context";
import { Html5Qrcode } from "html5-qrcode";
import { cn } from "@/lib/utils";

const QR_READER_REGION_ID_RENT = "qr-reader-region-rent-initiation";
const UTEK_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const UTEK_CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";
const GET_UMBRELLA_BASE_PARM = 2000000;

type RentalStep = 'idle' | 'checking_bluetooth' | 'scanning' | 'connecting' | 'getting_token' | 'getting_command' | 'sending_command' | 'success' | 'error';

const rentalStepMessages: Record<RentalStep, string> = {
  idle: "Ready to start.",
  checking_bluetooth: "Checking Bluetooth status...",
  scanning: "Scanning QR Code...",
  connecting: "Connecting to machine...",
  getting_token: "Connected. Authenticating...",
  getting_command: "Authenticated. Getting unlock command...",
  sending_command: "Sending unlock command...",
  success: "Unlock command sent! Please take your umbrella.",
  error: "An error occurred."
};

interface RentalInitiationProps {
  stall: Stall;
}

export function RentalInitiation({ stall }: RentalInitiationProps) {
  const { user, loading: authLoading, useFirstFreeRental, activeRental, startRental, logMachineEvent } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [rentalStep, setRentalStep] = useState<RentalStep>('idle');
  const [stepError, setStepError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const bluetoothDeviceRef = useRef<BluetoothDevice | null>(null);
  const tokCharacteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingScan = useRef(false);
  
  const isProcessing = rentalStep !== 'idle' && rentalStep !== 'success' && rentalStep !== 'error';

  useEffect(() => {
    if (activeRental && !isProcessing) {
      toast({ title: "Rental In Progress", description: "You already have an active rental.", variant: "destructive" });
      router.replace('/home');
    }
  }, [activeRental, isProcessing, router, toast]);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.warn("Failed to stop QR scanner gracefully:", err);
      }
    }
  }, []);

  const resetState = useCallback(() => {
    stopScanner();
    const device = bluetoothDeviceRef.current;
    if(device?.gatt?.connected) device.gatt.disconnect();
    tokCharacteristicRef.current = null;
    bluetoothDeviceRef.current = null;
    setRentalStep('idle');
    setStepError(null);
  }, [stopScanner]);

  const onScanSuccess = useCallback(async (decodedText: string) => {
    if (isProcessingScan.current) return;
    isProcessingScan.current = true;
    await stopScanner();

    const urlParts = decodedText.trim().split('/');
    const dvidFromUrl = urlParts[urlParts.length - 1];

    if (dvidFromUrl !== stall.dvid) {
      setStepError(`Incorrect stall. You scanned a machine with ID ${dvidFromUrl}, but you need to scan the one for ${stall.name}.`);
      setRentalStep('error');
      isProcessingScan.current = false;
      return;
    }
    
    setRentalStep('connecting');
    logMachineEvent({ stallId: stall.id, type: 'info', message: 'QR scan matched. Starting Bluetooth connection...'});

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [UTEK_SERVICE_UUID] }, { name: stall.btName }],
        optionalServices: [UTEK_SERVICE_UUID]
      });
      bluetoothDeviceRef.current = device;
      device.addEventListener('gattserverdisconnected', () => {
        setStepError("Bluetooth device disconnected unexpectedly.");
        setRentalStep('error');
      });
      
      const server = await device.gatt?.connect();
      if (!server) throw new Error("Failed to connect to GATT server.");
      logMachineEvent({ stallId: stall.id, type: 'info', message: `Connected to device: ${device.name || 'Unknown'}`});

      const service = await server.getPrimaryService(UTEK_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(UTEK_CHARACTERISTIC_UUID);
      tokCharacteristicRef.current = characteristic;
      
      setRentalStep('getting_token');
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleTokNotification);
      
      await characteristic.writeValue(new TextEncoder().encode("TOK\r\n"));
      logMachineEvent({ stallId: stall.id, type: 'sent', message: 'Sent Signal: "TOK\\r\\n"'});

    } catch (error: any) {
      let errorMsg = error.message || "An unknown Bluetooth error occurred.";
      if (error.name === "NotFoundError") errorMsg = "No compatible Bluetooth device found or selection was cancelled.";
      setStepError(errorMsg);
      setRentalStep('error');
      logMachineEvent({ stallId: stall.id, type: 'error', message: `Bluetooth Connection Error: ${errorMsg}`});
    }

  }, [stopScanner, stall, logMachineEvent]);

  const startScanAndRentProcess = async () => {
    if (isProcessing || activeRental) return;
    setStepError(null);

    // --- Pre-flight Checks ---
    if (!user) { router.push(`/auth/signin?redirect=/rent/${stall.id}`); return; }
    if (stall.availableUmbrellas <= 0) { toast({ title: "No Umbrellas Available", variant: "destructive" }); return; }
    if (!user.deposit || user.deposit < 100) { toast({ title: "Deposit Required", description: "A HK$100 deposit is required.", variant: "destructive" }); router.push('/deposit'); return; }
    const isFirstRental = user.hasHadFirstFreeRental === false;
    if (!isFirstRental && (!user.balance || user.balance <= 0)) { toast({ title: "Insufficient Balance", description: "Please add funds to your account.", variant: "destructive" }); router.push('/deposit'); return; }

    // --- Step 1: Check Bluetooth API and Availability ---
    setRentalStep('checking_bluetooth');
    if (!navigator.bluetooth) {
      setStepError("Web Bluetooth API not available. Use a compatible browser (e.g., Chrome) and ensure the page is served securely.");
      setRentalStep('error');
      return;
    }

    try {
        const isBluetoothAvailable = await navigator.bluetooth.getAvailability();
        if (!isBluetoothAvailable) {
            setStepError("Bluetooth is turned off. Please turn on Bluetooth in your device settings to connect to the machine.");
            setRentalStep('error');
            return;
        }
    } catch (error) {
        setStepError("Could not check Bluetooth status. Please ensure permissions are granted.");
        setRentalStep('error');
        return;
    }


    // --- Step 2: Start Camera Scan ---
    setRentalStep('scanning');
    isProcessingScan.current = false;
    
    setTimeout(() => {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(QR_READER_REGION_ID_RENT, { verbose: false });
      }
      html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => { /* Ignore errors */ }
      ).catch(err => {
        setStepError("Failed to start QR scanner. Please ensure camera permissions are enabled.");
        setRentalStep('error');
      });
    }, 100);
  };
  
  const handleTokNotification = useCallback(async (event: Event) => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    if (!value) return;

    const decoder = new TextDecoder('utf-8');
    const receivedString = decoder.decode(value).trim();
    logMachineEvent({ stallId: stall.id, type: 'received', message: `Received Signal: "${receivedString}"` });

    if (receivedString.startsWith("TOK:")) {
      const tokenValue = receivedString.substring(4).trim();
      if (/^\d{6}$/.test(tokenValue)) {
        setRentalStep('getting_command');
        try {
          const slotNum = stall.nextActionSlot;
          const parmValue = (GET_UMBRELLA_BASE_PARM + slotNum).toString();
          const cmdType = '1';
          const backendResponse = await fetch('/api/admin/unlock-physical-machine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dvid: stall.dvid, tok: tokenValue, parm: parmValue, cmd_type: cmdType }),
          });
          const result = await backendResponse.json();
          if (!backendResponse.ok || !result.success || !result.unlockDataString) throw new Error(result.message || `Failed to get unlock command.`);
          
          setRentalStep('sending_command');
          const commandToSend = `CMD:${result.unlockDataString}\r\n`;
          await tokCharacteristicRef.current?.writeValue(new TextEncoder().encode(commandToSend));
          logMachineEvent({ stallId: stall.id, type: 'sent', message: `Sent Command: "${commandToSend.trim()}" (Get Umbrella)`});
          
          setShowSuccessDialog(true);
          setRentalStep('success');
        } catch (error: any) {
          setStepError(error.message || "Unknown error during command phase.");
          setRentalStep('error');
          logMachineEvent({ stallId: stall.id, type: 'error', message: `Failed to get/send command: ${error.message}`});
        }
      } else {
         setStepError(`Invalid token format received: ${tokenValue}`);
         setRentalStep('error');
      }
    } else if (receivedString.startsWith("REPET:")) {
      const errorMsg = "Machine Error: This action has already been processed. Please try again.";
      setStepError(errorMsg);
      setRentalStep('error');
      toast({ variant: "destructive", title: "Duplicate Action Error", description: errorMsg, duration: 8000 });
    }
  }, [stall, toast, logMachineEvent]);

  useEffect(() => {
    if (showSuccessDialog) {
      const isFirstRental = user && user.hasHadFirstFreeRental === false;
      const timer = setTimeout(() => {
        if (isFirstRental) useFirstFreeRental();
        startRental({ stallId: stall.id, stallName: stall.name, startTime: Date.now(), isFree: !!isFirstRental });
        router.push('/home');
        setShowSuccessDialog(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog, startRental, router, stall, user, useFirstFreeRental]);

  useEffect(() => { return () => { stopScanner() }}, [stopScanner]);

  if (authLoading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Loading account status...</p>
    </div>
  );

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] py-8 px-4">
      <Card className="w-full max-w-md shadow-xl text-center">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center justify-center"><AlertTriangle className="mr-2 h-6 w-6" /> Authentication Required</CardTitle>
          <CardDescription>You need to be logged in to rent an umbrella.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="mt-4 w-full"><Link href={`/auth/signin?redirect=/rent/${stall.id}`} className="flex items-center"><LogIn className="mr-2 h-4 w-4" /> Sign In to Rent</Link></Button>
          <Button variant="outline" asChild className="mt-2 w-full"><Link href="/home"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Map</Link></Button>
        </CardContent>
      </Card>
    </div>
  );

  const canRent = user.deposit && user.deposit >= 100 && stall.availableUmbrellas > 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-8 px-4">
      <AlertDialog open={showSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <AlertDialogTitle className="flex items-center text-xl text-green-600"><CheckCircle className="mr-2 h-8 w-8" /> Unlock Command Sent!</AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-center py-4 text-foreground">Please take your umbrella. Your rental is starting.</AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <Link href="/home" className="flex items-center text-sm text-primary hover:underline mb-4"><ArrowLeft className="h-4 w-4 mr-1" />Back to Map</Link>
          <CardTitle className="text-2xl font-bold text-primary flex items-center"><Umbrella className="h-6 w-6 mr-2" /> Rent from {stall.name}</CardTitle>
          <CardDescription className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-muted-foreground" /> {stall.address}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-4">
            {stepError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{stepError}</AlertDescription>
              </Alert>
            )}

            {!canRent && rentalStep === 'idle' && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4"/>
                    <AlertTitle>Cannot Rent</AlertTitle>
                    <AlertDescription>{stall.availableUmbrellas <= 0 ? "No umbrellas available at this stall." : "A HK$100 deposit is required."}</AlertDescription>
                </Alert>
            )}

            {isProcessing && (
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-3" />
                <p className="text-sm text-primary font-medium">{rentalStepMessages[rentalStep]}</p>
              </div>
            )}
          </div>
          
          <div id={QR_READER_REGION_ID_RENT} className={cn("w-full aspect-square bg-black rounded-md", rentalStep !== 'scanning' && "hidden")} />

          {rentalStep === 'idle' && (
            <div>
              <h4 className="font-semibold">Availability:</h4>
              <p className={stall.availableUmbrellas > 0 ? "text-green-600" : "text-red-600"}>{stall.availableUmbrellas} / {stall.totalUmbrellas} umbrellas available</p>
            </div>
          )}

        </CardContent>
        <CardFooter className="flex-col space-y-2">
            {rentalStep === 'idle' && (
              <Button onClick={startScanAndRentProcess} disabled={!canRent} className="w-full">
                  <QrCode className="mr-2 h-5 w-5" /> Scan QR Code to Rent
              </Button>
            )}
             {rentalStep === 'error' && (
              <Button onClick={resetState} variant="outline" className="w-full">Try Again</Button>
            )}
             {rentalStep === 'scanning' && (
              <Button onClick={resetState} variant="destructive" className="w-full">Cancel Scan</Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
