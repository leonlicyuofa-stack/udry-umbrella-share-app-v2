// src/app/(main)/rent/[stallId]/rent-page-client.tsx
"use client";

import { RentalStallDetails } from '@/components/rental/rental-initiation';
import { useAuth, useStalls } from '@/contexts/auth-context';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Bluetooth, CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import type { Stall } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';

// Constants for the UTEK Bluetooth protocol
const UTEK_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const UTEK_CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";
const RENT_UMBRELLA_BASE_PARM = 2000000;

type BluetoothState = 'idle' | 'requesting' | 'connecting' | 'authenticating' | 'getting_command' | 'sending_command' | 'success' | 'error';

const bluetoothStateMessages: Record<BluetoothState, string> = {
  idle: "Ready to connect.",
  requesting: "Searching for machine. Please select it from the Bluetooth pop-up...",
  connecting: "Connecting to machine...",
  authenticating: "Connected. Authenticating with machine...",
  getting_command: "Authenticated. Getting command from server...",
  sending_command: "Sending unlock command...",
  success: "Unlock command sent! Please take your umbrella.",
  error: "An error occurred."
};

export default function RentPageClient() {
  const { stallId } = useParams<{ stallId: string }>();
  const { toast } = useToast();
  const { user, startRental, logMachineEvent } = useAuth();
  const { stalls, isLoadingStalls } = useStalls(); 
  
  const [stall, setStall] = useState<Stall | null | undefined>(undefined);
  const [bluetoothState, setBluetoothState] = useState<BluetoothState>('idle');
  const [bluetoothError, setBluetoothError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const bluetoothDeviceRef = useRef<BluetoothDevice | null>(null);
  const tokCharacteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const isConnecting = useRef(false);

  useEffect(() => {
    if (!isLoadingStalls) {
      const foundStall = stalls.find(s => s.dvid === stallId);
      setStall(foundStall || null);
    }
  }, [stallId, stalls, isLoadingStalls]);

  const handleGattServerDisconnected = useCallback(() => {
    if (!isConnecting.current) return;
    toast({ variant: "destructive", title: "Bluetooth Disconnected", description: "The device connection was lost." });
    if(stall) logMachineEvent({ stallId: stall.id, type: 'error', message: 'Bluetooth GATT Server Disconnected during rental process.' });
    tokCharacteristicRef.current = null;
    bluetoothDeviceRef.current = null;
    setBluetoothState('idle');
    isConnecting.current = false;
  }, [toast, stall, logMachineEvent]);

  const handleTokNotification = useCallback(async (event: Event) => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    if (!value || !stall) return;

    const decoder = new TextDecoder('utf-8');
    const receivedString = decoder.decode(value).trim();
    console.log(`[U-Dry Rent] Notification Received: "${receivedString}"`);
    logMachineEvent({ stallId: stall.id, type: 'received', message: `Received Signal: "${receivedString}"` });

    if (receivedString.startsWith("TOK:")) {
      const tokenValue = receivedString.substring(4).trim();
      if (/^\d{6}$/.test(tokenValue)) {
        console.log(`[U-Dry Rent] Parsed Token: ${tokenValue}`);
        setBluetoothState('getting_command');
        
        try {
          const slotNum = stall.nextActionSlot;
          const parmValue = (RENT_UMBRELLA_BASE_PARM + slotNum).toString();
          const cmdType = '0';

          const backendResponse = await fetch('/api/admin/unlock-physical-machine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dvid: stall.dvid, tok: tokenValue, parm: parmValue, cmd_type: cmdType }),
          });
          const result = await backendResponse.json();

          if (!backendResponse.ok || !result.success || !result.unlockDataString) {
            const errorMsg = result.message || `Failed to get rental command from server.`;
            logMachineEvent({ stallId: stall.id, type: 'error', message: `Vendor API Error on Rent: ${errorMsg}` });
            throw new Error(errorMsg);
          }
          
          setBluetoothState('sending_command');
          const commandToSend = `CMD:${result.unlockDataString}\r\n`;
          await tokCharacteristicRef.current?.writeValue(new TextEncoder().encode(commandToSend));
          logMachineEvent({ stallId: stall.id, type: 'sent', message: `Sent Command: "${commandToSend.trim()}" (Rent Umbrella)` });
          
          setShowSuccessDialog(true);
          setBluetoothState('success');

        } catch (error: any) {
          console.error("[U-Dry Rent] Error during server command fetch or BT write:", error);
          const errorMsg = error.message || "Unknown error during command phase.";
          setBluetoothError(errorMsg);
          setBluetoothState('error');
          logMachineEvent({ stallId: stall.id, type: 'error', message: `Failed to get/send rental command: ${errorMsg}` });
        }
      } else {
         const errorMsg = `Invalid token format received: ${tokenValue}`;
         setBluetoothError(errorMsg);
         setBluetoothState('error');
         logMachineEvent({ stallId: stall.id, type: 'error', message: errorMsg });
      }
    } else if (receivedString.startsWith("CMD:")) {
      console.log(`[U-Dry Rent] Machine acknowledged command with: ${receivedString}`);
    } else if (receivedString.startsWith("REPET:")) {
      const errorMsg = "Machine Error: This action has already been processed. Please try again or select a different slot if possible.";
      console.error(`[U-Dry Rent] Received REPET error: ${receivedString}`);
      setBluetoothError(errorMsg);
      setBluetoothState('error');
      toast({ variant: "destructive", title: "Duplicate Action Error", description: errorMsg, duration: 8000 });
    }
  }, [stall, toast, logMachineEvent]);

  // This effect handles the successful rental completion after the dialog is shown.
  useEffect(() => {
    if (showSuccessDialog && user && stall) {
      const isFree = user.hasHadFirstFreeRental === false;
      startRental({
        stallId: stall.dvid,
        stallName: stall.name,
        startTime: Date.now(),
        isFree: isFree,
      });

      const timer = setTimeout(() => {
        isConnecting.current = false;
        setShowSuccessDialog(false);
      }, 4000); // Close dialog after 4 seconds

      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog, user, stall, startRental]);

  const handleConnectAndRent = async () => {
    if (isConnecting.current || !stall) return;

    isConnecting.current = true;
    setBluetoothError(null);
    setBluetoothState('requesting');
    logMachineEvent({ stallId: stall.id, type: 'info', message: 'User initiated rental. Starting Bluetooth connection...' });

    try {
      if (!navigator.bluetooth) {
        throw new Error("Web Bluetooth API is not available in this browser.");
      }
      
      const device = await navigator.bluetooth.requestDevice({
        filters: [
            { services: [UTEK_SERVICE_UUID] },
            { name: stall.btName }
        ],
        optionalServices: [UTEK_SERVICE_UUID]
      });

      bluetoothDeviceRef.current = device;
      device.addEventListener('gattserverdisconnected', handleGattServerDisconnected);
      
      setBluetoothState('connecting');
      const server = await device.gatt?.connect();
      if (!server) throw new Error("Failed to connect to GATT server.");
      logMachineEvent({ stallId: stall.id, type: 'info', message: `Connected to device: ${device.name || 'Unknown'}` });

      const service = await server.getPrimaryService(UTEK_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(UTEK_CHARACTERISTIC_UUID);
      tokCharacteristicRef.current = characteristic;
      
      setBluetoothState('authenticating');
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleTokNotification);
      
      await characteristic.writeValue(new TextEncoder().encode("TOK\r\n"));
      logMachineEvent({ stallId: stall.id, type: 'sent', message: 'Sent Signal: "TOK\\r\\n"' });

    } catch (error: any) {
      let friendlyMessage = "Your bluetooth might be off, please check and try again, if the issue persists please contact service support";
      console.error("Bluetooth connection failed:", error.name, error.message);
      
      if (error.name === 'NotFoundError') {
        friendlyMessage = "Could not find the U-Dry machine. Please make sure you are close to it and try again.";
      }
      
      setBluetoothError(friendlyMessage);
      setBluetoothState('error');
      logMachineEvent({ stallId: stall.id, type: 'error', message: `Bluetooth Connection Error: ${error.name} - ${error.message}` });
      isConnecting.current = false;
    }
  };

  useEffect(() => {
    return () => {
      if (bluetoothDeviceRef.current?.gatt?.connected) {
        bluetoothDeviceRef.current.gatt.disconnect();
      }
      isConnecting.current = false;
    };
  }, []);

  if (isLoadingStalls || stall === undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading stall details...</p>
      </div>
    );
  }

  if (!stall) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Stall Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested umbrella stall could not be found or is not deployed.</p>
            <Button asChild variant="link" className="mt-4">
              <Link href="/home" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Map
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProcessing = bluetoothState !== 'idle' && bluetoothState !== 'success' && bluetoothState !== 'error';

  return (
    <>
      <RentalStallDetails 
        stall={stall}
        onConnectClick={handleConnectAndRent}
        isProcessing={isProcessing}
        bluetoothState={bluetoothState}
        bluetoothStateMessage={bluetoothStateMessages[bluetoothState]}
        bluetoothError={bluetoothError}
      />
      <AlertDialog open={showSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <AlertDialogTitle className="flex items-center text-xl text-primary">
              <CheckCircle className="mr-2 h-8 w-8 text-green-500" /> Unlocked!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-center py-4 text-foreground">
              Please take your umbrella from the machine.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
