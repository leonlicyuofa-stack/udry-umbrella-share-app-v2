// src/components/rental/rental-initiation-dialog.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Stall } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle, Umbrella, MapPin, Bluetooth, XCircle, Terminal } from 'lucide-react';
import Link from 'next/link';
import { BleClient, numbersToDataView, dataViewToText } from '@capacitor-community/bluetooth-le/dist/esm';

const UTEK_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const UTEK_CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";
const GET_UMBRELLA_BASE_PARM = 1000000;

type BluetoothState = 'idle' | 'initializing' | 'requesting_device' | 'connecting' | 'getting_token' | 'getting_command' | 'sending_command' | 'success' | 'error';

const bluetoothStateMessages: Record<BluetoothState, string> = {
  idle: "Ready to connect.",
  initializing: "Initializing Bluetooth...",
  requesting_device: "Searching for the machine. Please select the U-Dry device from the system pop-up...",
  connecting: "Connecting to the machine...",
  getting_token: "Connected. Authenticating...",
  getting_command: "Authenticated. Getting unlock command...",
  sending_command: "Sending unlock command to machine...",
  success: "Command sent! Your umbrella should unlock.",
  error: "An error occurred."
};

interface RentalInitiationDialogProps {
  stall: Stall | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function RentalInitiationDialog({ stall, isOpen, onOpenChange }: RentalInitiationDialogProps) {
  const { user, startRental, useFirstFreeRental, logMachineEvent } = useAuth();
  const { toast } = useToast();
  
  const [bluetoothState, setBluetoothState] = useState<BluetoothState>('idle');
  const [bluetoothError, setBluetoothError] = useState<string | null>(null);
  
  const connectedDeviceIdRef = useRef<string | null>(null);
  
  const isProcessing = bluetoothState !== 'idle' && bluetoothState !== 'success' && bluetoothState !== 'error';

  const disconnectFromDevice = useCallback(async () => {
    if (connectedDeviceIdRef.current) {
      try {
        await BleClient.disconnect(connectedDeviceIdRef.current);
      } catch(e) {
        // Ignore errors on disconnect
      }
      connectedDeviceIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setBluetoothState('idle');
      setBluetoothError(null);
      disconnectFromDevice();
    }
  }, [isOpen, disconnectFromDevice]);

  const handleTokNotification = useCallback(async (value: DataView) => {
    const receivedString = dataViewToText(value).trim();
    if (!stall) return;

    logMachineEvent({ stallId: stall.id, type: 'received', message: `Received Signal: "${receivedString}"` });

    if (receivedString.startsWith("TOK:")) {
      const tokenValue = receivedString.substring(4).trim();
      if (/^\d{6}$/.test(tokenValue)) {
        setBluetoothState('getting_command');
        
        try {
          const slotNum = stall.nextActionSlot;
          const parmValue = (GET_UMBRELLA_BASE_PARM + slotNum).toString();
          const cmdType = '0';

          const backendResponse = await fetch('/api/admin/unlock-physical-machine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dvid: stall.dvid, tok: tokenValue, parm: parmValue, cmd_type: cmdType }),
          });
          const result = await backendResponse.json();

          if (!backendResponse.ok || !result.success || !result.unlockDataString) {
            const errorMsg = result.message || `Failed to get unlock command.`;
            logMachineEvent({ stallId: stall.id, type: 'error', message: `Vendor API Error on Rent: ${errorMsg}` });
            throw new Error(errorMsg);
          }
          
          setBluetoothState('sending_command');
          const commandToSend = `CMD:${result.unlockDataString}\r\n`;
          // Convert string to DataView
          const commandDataView = numbersToDataView(commandToSend.split('').map(c => c.charCodeAt(0)));

          await BleClient.write(connectedDeviceIdRef.current!, UTEK_SERVICE_UUID, UTEK_CHARACTERISTIC_UUID, commandDataView);
          logMachineEvent({ stallId: stall.id, type: 'sent', message: `Sent Command: "${commandToSend.trim()}" (Get Umbrella)` });

          const isFree = user?.hasHadFirstFreeRental === false;
          await startRental({ stallId: stall.id, stallName: stall.name, startTime: Date.now(), isFree });
          if(isFree) await useFirstFreeRental();
          
          setBluetoothState('success');
          toast({ title: 'Rental Started!', description: `Your umbrella from ${stall.name} should be released.`});
          onOpenChange(false);

        } catch (error: any) {
          const errorMsg = error.message || "Unknown error during command phase.";
          setBluetoothError(errorMsg);
          setBluetoothState('error');
          logMachineEvent({ stallId: stall.id, type: 'error', message: `Failed to get/send unlock command: ${errorMsg}` });
        }
      } else {
         const errorMsg = `Invalid token format received: ${tokenValue}`;
         setBluetoothError(errorMsg);
         setBluetoothState('error');
         logMachineEvent({ stallId: stall.id, type: 'error', message: errorMsg });
      }
    } else if (receivedString.startsWith("CMD:")) {
      console.log(`Machine acknowledged command with: ${receivedString}`);
    } else if (receivedString.startsWith("REPET:")) {
      const errorMsg = "Machine Error: This rental action has already been processed. Please try again or select a different slot if possible.";
      setBluetoothError(errorMsg);
      setBluetoothState('error');
      toast({ variant: "destructive", title: "Duplicate Action Error", description: errorMsg, duration: 8000 });
    }
  }, [stall, user, startRental, useFirstFreeRental, toast, logMachineEvent, onOpenChange]);

  const handleConnectAndRent = async () => {
    if (!stall) return;
    setBluetoothError(null);
    setBluetoothState('initializing');
    logMachineEvent({ stallId: stall.id, type: 'info', message: 'User initiated rental. Starting Bluetooth connection...' });

    try {
      await BleClient.initialize();
      setBluetoothState('requesting_device');
      
      const device = await BleClient.requestDevice({
        services: [UTEK_SERVICE_UUID],
      });

      connectedDeviceIdRef.current = device.deviceId;
      setBluetoothState('connecting');
      
      await BleClient.connect(device.deviceId, (deviceId) => {
        disconnectFromDevice();
        toast({ variant: 'destructive', title: 'Bluetooth Disconnected' });
        setBluetoothState('idle');
      });

      logMachineEvent({ stallId: stall.id, type: 'info', message: `Connected to device: ${device.name || 'Unknown'}` });
      setBluetoothState('getting_token');
      
      await BleClient.startNotifications(
        device.deviceId,
        UTEK_SERVICE_UUID,
        UTEK_CHARACTERISTIC_UUID,
        handleTokNotification
      );

      const commandToSend = "TOK\r\n";
      const commandDataView = numbersToDataView(commandToSend.split('').map(c => c.charCodeAt(0)));
      await BleClient.write(device.deviceId, UTEK_SERVICE_UUID, UTEK_CHARACTERISTIC_UUID, commandDataView);
      
      logMachineEvent({ stallId: stall.id, type: 'sent', message: 'Sent Signal: "TOK\\r\\n"' });
    } catch (error: any) {
      let errorMsg = error.message || "An unknown Bluetooth error occurred.";
       if (error.message && error.message.includes('cancelled')) {
        errorMsg = "Device selection was cancelled.";
      }
      setBluetoothError(errorMsg);
      setBluetoothState('error');
      logMachineEvent({ stallId: stall.id, type: 'error', message: `Bluetooth Connection Error: ${errorMsg}` });
    }
  };

  if (!stall) return null;

  const hasDeposit = user?.deposit && user.deposit >= 100;
  const isFirstRental = user?.hasHadFirstFreeRental === false;
  const hasBalance = user?.balance && user.balance > 0;
  const hasUmbrellas = stall.availableUmbrellas > 0;
  const canRent = hasUmbrellas && hasDeposit && (isFirstRental || hasBalance);

  let cannotRentReason = '';
  if (!user) cannotRentReason = "You must be signed in to rent.";
  else if (!hasUmbrellas) cannotRentReason = "No umbrellas are available at this stall.";
  else if (!hasDeposit) cannotRentReason = "A HK$100 refundable deposit is required to rent.";
  else if (!isFirstRental && !hasBalance) cannotRentReason = "Your account balance is empty. Please add funds to rent.";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center">
            <Umbrella className="h-6 w-6 mr-2" /> Rent from {stall.name}
          </DialogTitle>
          <DialogDescription className="flex items-center pt-2">
            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" /> {stall.address}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {!canRent && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Cannot Rent</AlertTitle>
              <AlertDescription>
                {cannotRentReason} 
                {user && (!hasDeposit || (!isFirstRental && !hasBalance)) && <Button variant="link" className="p-0 h-auto" asChild><Link href="/deposit"> Go to Wallet</Link></Button>}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent className="pt-4 space-y-2">
              <p className="font-semibold">Availability: <span className={hasUmbrellas ? "text-green-600" : "text-destructive"}>{stall.availableUmbrellas} / {stall.totalUmbrellas} available</span></p>
              <Alert>
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle>Rental Terms</AlertTitle>
                 <AlertDescription className="text-xs">
                    {isFirstRental 
                        ? "Your first rental is free!" 
                        : "HK$5/hr, capped at HK$25 per 24-hour period."
                    } Return within 72 hours to avoid forfeiting your deposit.
                 </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {isProcessing && (
             <div className="text-center p-4 bg-primary/10 rounded-lg">
              <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-3" />
              <p className="text-sm text-primary font-medium">{bluetoothStateMessages[bluetoothState]}</p>
            </div>
          )}

          {bluetoothState === 'error' && bluetoothError && (
             <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Connection Failed</AlertTitle>
              <AlertDescription>{bluetoothError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleConnectAndRent} disabled={!canRent || isProcessing} className="w-full">
            {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Bluetooth className="mr-2 h-5 w-5" />}
            {isProcessing ? bluetoothStateMessages[bluetoothState] : "Connect & Rent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
