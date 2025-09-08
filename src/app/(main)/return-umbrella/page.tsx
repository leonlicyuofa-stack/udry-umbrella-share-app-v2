
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useStalls } from "@/contexts/stalls-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle, ArrowLeft, Umbrella, TimerIcon, CheckCircle, Bluetooth, QrCode, CameraOff, Info, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Stall } from '@/lib/types';
import { Html5Qrcode } from "html5-qrcode";
import { cn } from "@/lib/utils";
import { BleClient, numbersToDataView, dataViewToText } from '@capacitor-community/bluetooth-le/dist/esm';
import { httpsCallable } from 'firebase/functions';

const QR_READER_REGION_ID = "qr-reader-region-return";
const UTEK_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const UTEK_CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";
const RETURN_UMBRELLA_BASE_PARM = 3000000;
const RETURN_CONFIRMATION_TIMEOUT = 30000; // 30 seconds

type ReturnStep = 'idle' | 'initializing_scanner' | 'scanning' | 'scan_complete_pre_confirmation' | 'connecting';
type BluetoothState = 'idle' | 'initializing' | 'requesting_device' | 'connecting' | 'getting_token' | 'getting_command' | 'sending_command' | 'awaiting_confirmation' | 'success' | 'error';

const getBluetoothStateMessages = (stall: Stall | null): Record<BluetoothState, string> => ({
  idle: "Ready to start.",
  initializing: "Initializing Bluetooth...",
  requesting_device: "Searching for the machine. In the system pop-up, please select the device with the name:",
  connecting: "Connecting to the machine...",
  getting_token: "Connected. Authenticating...",
  getting_command: "Authenticated. Getting return command...",
  sending_command: "Sending return command to machine...",
  awaiting_confirmation: "Command sent. Please place your umbrella in the slot and wait for confirmation...",
  success: "Confirmation received! Your return is complete.",
  error: "An error occurred."
});

export default function ReturnUmbrellaPage() {
  const { user, activeRental, endRental, isLoadingRental, logMachineEvent, firebaseServices } = useAuth();
  const { stalls, isLoadingStalls } = useStalls();
  const router = useRouter();
  const { toast } = useToast();

  const [returnStep, setReturnStep] = useState<ReturnStep>('idle');
  const [scannedStall, setScannedStall] = useState<Stall | null>(null);
  const [bluetoothState, setBluetoothState] = useState<BluetoothState>('idle');
  const [bluetoothError, setBluetoothError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<string>('');
  const [qrError, setQrError] = useState<string|null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const connectedDeviceIdRef = useRef<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingScan = useRef(false);
  const isIntentionalDisconnect = useRef(false);
  const confirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const isProcessingBluetooth = bluetoothState !== 'idle' && bluetoothState !== 'success' && bluetoothState !== 'error';
  const bluetoothStateMessages = getBluetoothStateMessages(scannedStall);

  useEffect(() => {
    if (!isLoadingRental && !activeRental && !isProcessingBluetooth) {
      toast({
        title: "No Active Rental",
        description: "You do not have an active rental to return.",
        variant: "destructive",
      });
      router.replace("/home"); 
    }
  }, [activeRental, isLoadingRental, router, toast, isProcessingBluetooth]);

  useEffect(() => {
    if (!activeRental) return;
    const calculateElapsedTime = () => {
      if (!activeRental?.startTime) return;
      const now = Date.now();
      const elapsedMilliseconds = now - activeRental.startTime;
      const hours = Math.floor(elapsedMilliseconds / (1000 * 60 * 60));
      const minutes = Math.floor((elapsedMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsedMilliseconds % (1000 * 60)) / 1000);
      setElapsedTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };
    const intervalId = setInterval(calculateElapsedTime, 1000);
    calculateElapsedTime();
    return () => clearInterval(intervalId);
  }, [activeRental]);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        console.log("Return Page: QR Scanner stopped successfully.");
      } catch (err) {
        console.warn("Return Page: Failed to stop QR scanner gracefully:", err);
      }
    }
    setHasCameraPermission(null);
  }, []);

  const onScanSuccess = useCallback(async (decodedText: string) => {
    if (isProcessingScan.current) return;
    isProcessingScan.current = true;
    
    await stopScanner();

    const trimmedText = decodedText.trim();
    const urlParts = trimmedText.split('/');
    const dvidFromUrl = urlParts[urlParts.length - 1];
    
    const foundStall = stalls.find(s => s.dvid === dvidFromUrl);
    
    if (foundStall) {
      toast({ title: "Stall Identified!", description: `Ready to return to ${foundStall.name}.` });
      setScannedStall(foundStall);
      setReturnStep('scan_complete_pre_confirmation');
    } else {
      toast({ variant: "destructive", title: "Invalid QR Code", description: `Scanned code did not match a known stall. Scanned: ${dvidFromUrl}` });
      setScannedStall(null);
      setReturnStep('idle');
      isProcessingScan.current = false; 
    }
  }, [stopScanner, stalls, toast]);

  const startScanner = useCallback(async () => {
    if (isProcessingScan.current || returnStep === 'scanning') return;
    
    setReturnStep('initializing_scanner');
    setQrError(null);
    isProcessingScan.current = false;
    setHasCameraPermission(null);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setHasCameraPermission(true);
    } catch (err: any) {
        let message = "An error occurred while accessing the camera.";
        if (err.name === "NotAllowedError") {
            message = "Camera permission denied. Please enable camera access in your browser settings.";
        }
        setQrError(message);
        setReturnStep('idle');
        setHasCameraPermission(false);
        return;
    }

    setTimeout(() => {
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode(QR_READER_REGION_ID, { verbose: false });
        }
        setReturnStep('scanning');
        html5QrCodeRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          (errorMessage) => { /* Ignore errors */ }
        ).catch(err => {
          setQrError("Failed to start QR scanner. Please ensure camera permissions are enabled.");
          setReturnStep('idle');
        });
    }, 100);
  }, [onScanSuccess, returnStep]);

  const disconnectFromDevice = useCallback(async () => {
    if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
        confirmationTimeoutRef.current = null;
    }
    if (connectedDeviceIdRef.current) {
      try {
        await BleClient.disconnect(connectedDeviceIdRef.current);
      } catch(e) {
        // Ignore
      }
      connectedDeviceIdRef.current = null;
    }
  }, []);

  const handleTokNotification = useCallback(async (value: DataView) => {
    const receivedString = dataViewToText(value).trim();
    // This is the diagnostic log we added.
    console.log(`[U-Dry Return Debug] Raw data received from machine: "${receivedString}"`);
    if (!scannedStall || !firebaseServices) return;

    logMachineEvent({ stallId: scannedStall.id, type: 'received', message: `Received Signal: "${receivedString}"` });

    if (receivedString.startsWith("TOK:")) {
      const fullToken = receivedString.substring(4).trim();
      if (/^\d{6}$/.test(fullToken)) {
        const tokenValue = fullToken.substring(0, 3); // Use only the first 3 digits
        console.log(`[U-Dry Return] Parsed Token: ${tokenValue}`);
        setBluetoothState('getting_command');
        
        try {
          const slotNum = scannedStall.nextActionSlot || 1;
          const parmValue = (RETURN_UMBRELLA_BASE_PARM + slotNum).toString();
          const cmdType = '1';

          // Use the correct, deployed Cloud Function
          const unlockPhysicalMachine = httpsCallable(firebaseServices.functions, 'unlockPhysicalMachine');
          const result = await unlockPhysicalMachine({ dvid: scannedStall.dvid, tok: tokenValue, parm: parmValue, cmd_type: cmdType });
          const data = result.data as { success: boolean; unlockDataString?: string; message?: string; };

          if (!data.success || !data.unlockDataString) {
            const errorMsg = data.message || `Failed to get return command.`;
            logMachineEvent({ stallId: scannedStall.id, type: 'error', message: `Cloud Function Error on Return: ${errorMsg}` });
            throw new Error(errorMsg);
          }
          
          setBluetoothState('sending_command');
          const commandToSend = `CMD:${data.unlockDataString}\r\n`;
          const commandDataView = numbersToDataView(commandToSend.split('').map(c => c.charCodeAt(0)));
          await BleClient.writeWithoutResponse(connectedDeviceIdRef.current!, UTEK_SERVICE_UUID, UTEK_CHARACTERISTIC_UUID, commandDataView);

          logMachineEvent({ stallId: scannedStall.id, type: 'sent', message: `Sent Command: "${commandToSend.trim()}" (Return Umbrella)` });
          console.log(`[U-Dry Return] Return command sent to machine.`);
          
          setBluetoothState('awaiting_confirmation');

          // Start a timeout to wait for the final confirmation from the machine
          confirmationTimeoutRef.current = setTimeout(() => {
              const errorMsg = "Return confirmation timeout. The machine did not confirm the return. Please check if the umbrella is properly inserted and try again. Your rental is still active.";
              setBluetoothError(errorMsg);
              setBluetoothState('error');
              toast({ variant: "destructive", title: "Return Timed Out", description: errorMsg, duration: 8000 });
          }, RETURN_CONFIRMATION_TIMEOUT);

        } catch (error: any) {
          console.error("[U-Dry Return] Error during server command fetch or BT write:", error);
          const errorMsg = error.message || "Unknown error during command phase.";
          setBluetoothError(errorMsg);
          setBluetoothState('error');
          logMachineEvent({ stallId: scannedStall.id, type: 'error', message: `Failed to get/send return command: ${errorMsg}` });
        }
      } else {
         const errorMsg = `Invalid token format received: The string did not match the expected pattern. Received: "${fullToken}"`;
         setBluetoothError(errorMsg);
         setBluetoothState('error');
         logMachineEvent({ stallId: scannedStall.id, type: 'error', message: errorMsg });
      }
    } else if (receivedString.includes("CMD:OK")) {
        if (confirmationTimeoutRef.current) {
            clearTimeout(confirmationTimeoutRef.current);
            confirmationTimeoutRef.current = null;
        }
        logMachineEvent({ stallId: scannedStall.id, type: 'received', message: `Confirmation received: ${receivedString}` });
        setBluetoothState('success');
        setShowSuccessDialog(true);
    } else if (receivedString.startsWith("REPET:")) {
      const errorMsg = "Machine Error: This return action has already been processed. Please try again or select a different slot if possible.";
      console.error(`[U-Dry Return] Received REPET error: ${receivedString}`);
      setBluetoothError(errorMsg);
      setBluetoothState('error');
      toast({ variant: "destructive", title: "Duplicate Action Error", description: errorMsg, duration: 8000 });
    }
  }, [scannedStall, toast, logMachineEvent, firebaseServices]);

  useEffect(() => {
    if (showSuccessDialog && activeRental && scannedStall) {
      isIntentionalDisconnect.current = true;
      const timer = setTimeout(() => {
        toast({
          title: "Umbrella Return Confirmed!",
          description: `Your umbrella rental has been successfully returned to ${scannedStall.name}.`,
        });
        endRental(scannedStall.id);
        setShowSuccessDialog(false);
        router.push('/home');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog, activeRental, scannedStall, endRental, router, toast]);

  const handleReturnViaBluetooth = async () => {
    if (isProcessingBluetooth || !scannedStall) return;
    isIntentionalDisconnect.current = false;
    setBluetoothError(null);
    setReturnStep('connecting');
    setBluetoothState('initializing');
    logMachineEvent({ stallId: scannedStall.id, type: 'info', message: 'User initiated return. Starting Bluetooth connection...' });

    try {
      await BleClient.initialize();
      setBluetoothState('requesting_device');
      
      const device = await BleClient.requestDevice({
        services: [UTEK_SERVICE_UUID],
      });
      connectedDeviceIdRef.current = device.deviceId;
      
      setBluetoothState('connecting');
      await BleClient.connect(device.deviceId, (deviceId) => {
        if (isIntentionalDisconnect.current) return;
        disconnectFromDevice();
        toast({ variant: "destructive", title: "Bluetooth Disconnected", description: "The device connection was lost." });
        setBluetoothState('idle');
        setReturnStep('scan_complete_pre_confirmation');
      });

      await new Promise(resolve => setTimeout(resolve, 300));

      logMachineEvent({ stallId: scannedStall.id, type: 'info', message: `Connected to device: ${device.name || 'Unknown'}` });

      setBluetoothState('getting_token');
      await BleClient.startNotifications(device.deviceId, UTEK_SERVICE_UUID, UTEK_CHARACTERISTIC_UUID, handleTokNotification);
      
      const commandToSend = "TOK\r\n";
      const commandDataView = numbersToDataView(commandToSend.split('').map(c => c.charCodeAt(0)));
      await BleClient.writeWithoutResponse(device.deviceId, UTEK_SERVICE_UUID, UTEK_CHARACTERISTIC_UUID, commandDataView);

      logMachineEvent({ stallId: scannedStall.id, type: 'sent', message: 'Sent Signal: "TOK\\r\\n"' });
    } catch (error: any) {
      let errorMsg = error.message || "An unknown Bluetooth error occurred.";
      if (error.message && error.message.includes('cancelled')) errorMsg = "No compatible Bluetooth device found or selection was cancelled.";
      setBluetoothError(errorMsg);
      setBluetoothState('error');
      logMachineEvent({ stallId: scannedStall.id, type: 'error', message: `Bluetooth Connection Error: ${errorMsg}` });
    }
  };

  useEffect(() => {
    return () => {
      isIntentionalDisconnect.current = true;
      stopScanner();
      disconnectFromDevice();
    };
  }, [stopScanner, disconnectFromDevice]);

  if (isLoadingRental || isLoadingStalls || !activeRental) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading rental details...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-8 px-4">
       <AlertDialog open={showSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <AlertDialogTitle className="flex items-center text-xl text-primary">
              <Umbrella className="mr-2 h-8 w-8" /> Return Confirmed
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-center py-4 text-foreground">
              Your rental has ended. Thank you for using U-Dry!
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
           <Link href="/home" className="flex items-center text-sm text-primary hover:underline mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Map / Cancel Return
          </Link>
          <CardTitle className="text-2xl font-bold text-primary flex items-center">
            <Umbrella className="h-6 w-6 mr-2" /> Return Umbrella
          </CardTitle>
          <CardDescription>
            Returning umbrella from: <span className="font-semibold">{activeRental.stallName}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-secondary/30 rounded-md text-center">
            <p className="text-sm text-muted-foreground">Time Elapsed:</p>
            <p className="text-2xl font-bold text-accent flex items-center justify-center">
              <TimerIcon className="mr-2 h-6 w-6" /> {elapsedTime}
            </p>
          </div>
          
          <div 
            id={QR_READER_REGION_ID}
            className={cn("w-full aspect-square bg-black rounded-md", returnStep !== 'scanning' && "hidden")}
          />
          
          {returnStep === 'initializing_scanner' && (
            <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
                <p>Requesting camera access...</p>
              </div>
            </div>
          )}

          {qrError && (
             <Alert variant="destructive">
              <CameraOff className="h-4 w-4" />
              <AlertTitle>Camera Error</AlertTitle>
              <AlertDescription>{qrError}</AlertDescription>
            </Alert>
          )}

          {bluetoothError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Bluetooth Error</AlertTitle>
              <AlertDescription>{bluetoothError}</AlertDescription>
            </Alert>
          )}

          {returnStep === 'connecting' && isProcessingBluetooth && (
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-3" />
              <p className="text-sm text-primary font-medium">{bluetoothStateMessages[bluetoothState]}</p>
            </div>
          )}
          
          {bluetoothState === 'success' && (
             <div className="text-center p-4 bg-green-100 rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-3" />
              <p className="text-sm text-green-700 font-medium">{bluetoothStateMessages.success}</p>
            </div>
          )}
          
          {returnStep === 'scan_complete_pre_confirmation' && scannedStall && (
             <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Connection Step</AlertTitle>
                <AlertDescription>
                  Your phone will ask for permission to connect. Please select the device with this exact name:
                  <div className="my-2 p-2 bg-secondary/50 rounded-md font-mono text-3xl text-center text-green-600 font-bold">
                    {scannedStall.btName || "Device Name Not Found"}
                  </div>
                   If you do not see this name, please cancel and try again.
                </AlertDescription>
            </Alert>
          )}
        </CardContent>
         <CardFooter className="flex-col space-y-2">
            {returnStep === 'idle' && (
              <Button onClick={startScanner} className="w-full">
                <QrCode className="mr-2 h-5 w-5" /> Scan Stall to Begin Return
              </Button>
            )}
            {returnStep === 'scanning' && (
              <Button onClick={async () => {
                  await stopScanner();
                  setReturnStep('idle');
              }} variant="outline" className="w-full">
                Cancel Scan
              </Button>
            )}
            {returnStep === 'scan_complete_pre_confirmation' && (
              <>
              <Button onClick={handleReturnViaBluetooth} className="w-full">
                Continue to Return <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={() => {
                  setReturnStep('idle');
                  setScannedStall(null);
                  isProcessingScan.current = false;
                }} variant="outline" className="w-full">
                Scan a Different Stall
              </Button>
              </>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
