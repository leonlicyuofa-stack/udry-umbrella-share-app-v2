// src/components/rental/rental-initiation-dialog.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Stall } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle, Umbrella, MapPin, Bluetooth, XCircle, Info, ArrowRight, ServerCrash } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { BleClient, numbersToDataView, dataViewToText, type ScanResult } from '@capacitor-community/bluetooth-le';
import { httpsCallable } from 'firebase/functions';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '@/contexts/language-context';
import imageData from '@/app/lib/placeholder-images.json';


const UTEK_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const UTEK_CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";
const GET_UMBRELLA_BASE_PARM = 2000000;

type BluetoothState = 'idle' | 'initializing' | 'scanning' | 'requesting_device' | 'connecting' | 'getting_token' | 'getting_command' | 'sending_command' | 'awaiting_final_confirmation' | 'success' | 'error';
type ConnectionStep = 'pre_confirmation' | 'connecting' | 'error';

const getBluetoothStateMessages = (stall: Stall | null, translate: (key: string) => string): Record<BluetoothState, string> => ({
  idle: translate('bt_state_idle'),
  initializing: translate('bt_state_initializing'),
  scanning: translate('bt_state_scanning'),
  requesting_device: translate('bt_state_requesting_device'),
  connecting: translate('bt_state_connecting'),
  getting_token: translate('bt_state_getting_token'),
  getting_command: translate('bt_state_getting_command'),
  sending_command: translate('bt_state_sending_command'),
  awaiting_final_confirmation: translate('bt_state_awaiting_confirmation'),
  success: translate('bt_state_success'),
  error: translate('bt_state_error')
});

interface RentalInitiationDialogProps {
  stall: Stall | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function RentalInitiationDialog({ stall, isOpen, onOpenChange }: RentalInitiationDialogProps) {
  const { user, startRental, useFirstFreeRental, logMachineEvent, firebaseServices } = useAuth();
  const { toast } = useToast();
  const { translate } = useLanguage();
  
  const [bluetoothState, setBluetoothState] = useState<BluetoothState>('idle');
  const [bluetoothError, setBluetoothError] = useState<string | null>(null);
  const [connectionStep, setConnectionStep] = useState<ConnectionStep>('pre_confirmation');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showWaitingDialog, setShowWaitingDialog] = useState(false);
  const [showDeviceListDialog, setShowDeviceListDialog] = useState(false);
  const [foundDevices, setFoundDevices] = useState<ScanResult[]>([]);
  
  const connectedDeviceIdRef = useRef<string | null>(null);
  const isIntentionalDisconnect = useRef(false);
  const cmdOkCounter = useRef(0);

  const isProcessing = bluetoothState !== 'idle' && bluetoothState !== 'success' && bluetoothState !== 'error';
  const bluetoothStateMessages = getBluetoothStateMessages(stall, translate);

  const disconnectFromDevice = useCallback(async () => {
    try {
        await BleClient.stopLEScan();
    } catch(e) {
        // Ignore errors if already stopped
    }
    if (connectedDeviceIdRef.current) {
      try {
        await BleClient.disconnect(connectedDeviceIdRef.current);
      } catch(e) {
        // Ignore errors on disconnect
      }
      connectedDeviceIdRef.current = null;
    }
  }, []);

  const resetAllState = useCallback(() => {
    isIntentionalDisconnect.current = true;
    setBluetoothState('idle');
    setBluetoothError(null);
    setConnectionStep('pre_confirmation');
    setShowSuccessDialog(false);
    setShowWaitingDialog(false);
    setShowDeviceListDialog(false);
    setFoundDevices([]);
    disconnectFromDevice();
  }, [disconnectFromDevice]);


  useEffect(() => {
    if (!isOpen) {
      resetAllState();
    }
  }, [isOpen, resetAllState]);

  useEffect(() => {
    if (showSuccessDialog) {
      const timer = setTimeout(() => {
        setShowSuccessDialog(false);
        onOpenChange(false); // Close the main dialog as well
      }, 4000); 

      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog, onOpenChange]);


  const handleTokNotification = useCallback(async (value: DataView) => {
    const receivedString = dataViewToText(value).trim();
    if (!stall || !firebaseServices) return;

    logMachineEvent({ stallId: stall.id, type: 'received', message: `Received Signal: "${receivedString}"` });

    if (receivedString.includes("CMD:OK")) {
        cmdOkCounter.current += 1;
        logMachineEvent({ stallId: stall.id, type: 'info', message: `CMD:OK count is now ${cmdOkCounter.current}` });

        if (cmdOkCounter.current >= 4) {
            logMachineEvent({ stallId: stall.id, type: 'info', message: `Final confirmation 'CMD:OK4' received.` });
            await startRental({ stallId: stall.id, stallName: stall.name, startTime: Date.now(), isFree: false });
            isIntentionalDisconnect.current = true;
            setBluetoothState('success');
            setShowWaitingDialog(false);
            setShowSuccessDialog(true);
        }
        return;
    }

    if (receivedString.startsWith("TOK:")) {
      cmdOkCounter.current = 0;
      const fullToken = receivedString.substring(4).trim();
      if (/^\d{6}$/.test(fullToken)) {
        const tokenValue = fullToken.substring(0, 3);
        setBluetoothState('getting_command');
        
        try {
          const slotNum = stall.nextActionSlot || 1; 
          const parmValue = (GET_UMBRELLA_BASE_PARM + slotNum).toString();
          const cmdType = '1';

          logMachineEvent({ stallId: stall.id, type: 'info', message: `Calling cloud function 'unlockPhysicalMachine' with dvid: ${stall.dvid}, tok: ${tokenValue}, parm: ${parmValue}` });
          const unlockPhysicalMachine = httpsCallable(firebaseServices.functions, 'unlockPhysicalMachine');
          const result = await unlockPhysicalMachine({ dvid: stall.dvid, tok: tokenValue, parm: parmValue, cmd_type: cmdType });
          
          const data = result.data as { success: boolean; unlockDataString?: string; message?: string; };

          if (!data.success || !data.unlockDataString) {
            throw new Error(data.message || `Cloud function failed to return unlock command.`);
          }
          
          logMachineEvent({ stallId: stall.id, type: 'info', message: `Cloud function returned SUCCESS. Command string: "${data.unlockDataString}"` });
          
          setBluetoothState('sending_command');
          const commandToSend = `CMD:${data.unlockDataString}\r\n`;
          const commandDataView = numbersToDataView(commandToSend.split('').map(c => c.charCodeAt(0)));

          logMachineEvent({ stallId: stall.id, type: 'sent', message: `Sending Command: "${commandToSend.trim()}" (Get Umbrella)` });
          await BleClient.writeWithoutResponse(connectedDeviceIdRef.current!, UTEK_SERVICE_UUID, UTEK_CHARACTERISTIC_UUID, commandDataView);
          
          setBluetoothState('awaiting_final_confirmation');
          setShowWaitingDialog(true);
          
        } catch (error: any) {
          const errorMsg = error.message || "Unknown error during command phase.";
          setBluetoothError(errorMsg);
          setBluetoothState('error');
          setConnectionStep('error');
        }
      } else {
         const errorMsg = `Invalid token format received: ${fullToken}`;
         setBluetoothError(errorMsg);
         setBluetoothState('error');
         setConnectionStep('error');
      }
    } else if (receivedString.startsWith("REPET:")) {
      const errorMsg = translate('return_error_repet');
      setBluetoothError(errorMsg);
      setBluetoothState('error');
      setConnectionStep('error');
    }
  }, [stall, firebaseServices, startRental, logMachineEvent, translate]);

  const connectToDevice = async (deviceId: string) => {
    isIntentionalDisconnect.current = false;
    connectedDeviceIdRef.current = deviceId;
    setBluetoothState('connecting');

    await BleClient.connect(deviceId, (dId) => {
      if (isIntentionalDisconnect.current) return;
      disconnectFromDevice();
      toast({ variant: 'destructive', title: 'Bluetooth Disconnected' });
      setBluetoothState('idle');
      setConnectionStep('pre_confirmation');
    });

    await new Promise(resolve => setTimeout(resolve, 300));
    logMachineEvent({ stallId: stall!.id, type: 'info', message: `Connected to device: ${deviceId}` });
    setBluetoothState('getting_token');

    await BleClient.startNotifications(
      deviceId,
      UTEK_SERVICE_UUID,
      UTEK_CHARACTERISTIC_UUID,
      handleTokNotification
    );

    const commandToSend = "TOK\r\n";
    const commandDataView = numbersToDataView(commandToSend.split('').map(c => c.charCodeAt(0)));
    await BleClient.writeWithoutResponse(deviceId, UTEK_SERVICE_UUID, UTEK_CHARACTERISTIC_UUID, commandDataView);
    logMachineEvent({ stallId: stall!.id, type: 'sent', message: 'Sent Signal: "TOK\\r\\n"' });
  };

  const handleConnectAndRent = async () => {
    if (!stall) return;
    setBluetoothError(null);
    setBluetoothState('initializing');
    logMachineEvent({ stallId: stall.id, type: 'info', message: 'User initiated rental. Starting Bluetooth connection...' });

    try {
      await BleClient.initialize();
      setBluetoothState('scanning');

      if (Capacitor.getPlatform() === 'android') {
        setShowDeviceListDialog(true);
        await BleClient.requestLEScan(
          { services: [UTEK_SERVICE_UUID] },
          (result) => {
            if (result.device.name) {
              setFoundDevices((prev) => {
                if (!prev.some((d) => d.device.deviceId === result.device.deviceId)) {
                  return [...prev, result];
                }
                return prev;
              });
            }
          }
        );
        setTimeout(async () => {
            await BleClient.stopLEScan();
        }, 5000);

      } else {
        setBluetoothState('requesting_device');
        const device = await BleClient.requestDevice({ services: [UTEK_SERVICE_UUID] });
        await connectToDevice(device.deviceId);
      }
    } catch (error: any) {
      let errorMsg = error.message || translate('bt_state_error');
       if (error.message && error.message.includes('cancelled')) {
        errorMsg = translate('bt_error_cancelled');
      } else if (error.message && error.message.includes('disabled')) {
        errorMsg = translate('bt_error_disabled');
      }
      setBluetoothError(errorMsg);
      setBluetoothState('error');
      setConnectionStep('error');
    }
  };

  if (!stall) return null;

  const hasDeposit = user?.deposit && user.deposit >= 100;
  const hasBalance = user?.balance && user.balance > 0;
  const hasUmbrellas = stall.availableUmbrellas > 0;
  const canRent = hasUmbrellas && hasDeposit && hasBalance;

  let cannotRentReason = '';
  if (!user) cannotRentReason = translate('rent_dialog_no_user');
  else if (!hasUmbrellas) cannotRentReason = translate('rent_dialog_no_umbrellas');
  else if (!hasDeposit) cannotRentReason = translate('rent_dialog_no_deposit');
  else if (!hasBalance) cannotRentReason = translate('rent_dialog_no_balance');
  
  const renderPreConfirmation = () => (
    <>
        <Alert>
            <AlertTitle>{translate('rent_dialog_connection_instructions_title')}</AlertTitle>
            <AlertDescription></AlertDescription>
        </Alert>

        {Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android' && (
          <div className="mt-4 p-2 bg-secondary rounded-md flex flex-col items-center">
            <p className="text-xs font-semibold mb-2">{translate('rent_dialog_connection_instructions_android')}</p>
            <Image 
              src={imageData.android_ble_instructions.src} 
              alt={imageData.android_ble_instructions.alt}
              width={imageData.android_ble_instructions.width}
              height={imageData.android_ble_instructions.height}
              className="rounded-md border"
              data-ai-hint="bluetooth android"
            />
          </div>
        )}

        {Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios' && (
          <div className="mt-4 p-2 bg-secondary rounded-md flex flex-col items-center">
            <p className="text-xs font-semibold mb-2">{translate('rent_dialog_connection_instructions_ios')}</p>
            <Image 
              src={imageData.ios_ble_instructions.src}
              alt={imageData.ios_ble_instructions.alt}
              width={imageData.ios_ble_instructions.width}
              height={imageData.ios_ble_instructions.height}
              className="rounded-md border"
              data-ai-hint="bluetooth ios"
            />
          </div>
        )}

         <p className="text-xs text-center text-muted-foreground pt-2">
            {translate('rent_dialog_agree_terms')}
            <Link href="/account/terms" className="underline hover:text-primary">
                {translate('rent_dialog_terms_link')}
            </Link>.
        </p>
    </>
  );

  const renderConnecting = () => (
    <>
      {isProcessing && bluetoothState !== 'awaiting_final_confirmation' && (
        <div className="text-center p-4 bg-primary/10 rounded-lg">
          <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-3" />
          <p className="text-sm text-primary font-medium">{bluetoothStateMessages[bluetoothState]}</p>
        </div>
      )}
      {connectionStep === 'error' && bluetoothError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>{translate('rent_dialog_connection_failed')}</AlertTitle>
          <AlertDescription>{bluetoothError}</AlertDescription>
        </Alert>
      )}
    </>
  );

  return (
    <>
      <Dialog open={isOpen && !showSuccessDialog && !showWaitingDialog && !showDeviceListDialog} onOpenChange={onOpenChange}>
        <DialogContent className="flex flex-col max-h-[90dvh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold text-primary flex items-center">
              <Umbrella className="h-6 w-6 mr-2" /> {translate('rent_dialog_rent_title_simple')}
            </DialogTitle>
            <DialogDescription className="flex items-center pt-1">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0 text-muted-foreground" /> {stall.name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6 overflow-y-auto flex-1">
            {!canRent && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{translate('rent_dialog_cannot_rent')}</AlertTitle>
                <AlertDescription>
                  {cannotRentReason} 
                  {user && (!hasDeposit || !hasBalance) && <Button variant="link" className="p-0 h-auto" asChild><Link href="/deposit"> {translate('rent_dialog_go_to_wallet')}</Link></Button>}
                </AlertDescription>
              </Alert>
            )}

            {canRent && (
              <Card>
                  <CardContent className="pt-4 space-y-2">
                  <p className="font-semibold">{translate('rent_dialog_availability')} <span className={hasUmbrellas ? "text-green-600" : "text-destructive"}>{translate('rent_dialog_availability_text', { available: stall.availableUmbrellas, total: stall.totalUmbrellas })}</span></p>
                  <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{translate('rent_dialog_terms_title')}</AlertTitle>
                      <AlertDescription className="text-xs">
                          {user?.hasHadFirstFreeRental === false 
                            ? translate('rent_dialog_first_free')
                            : translate('rent_dialog_terms_pricing')
                          } {translate('rent_dialog_terms_return')}
                      </AlertDescription>
                  </Alert>
                  </CardContent>
              </Card>
            )}
          
            {canRent && connectionStep === 'pre_confirmation' && renderPreConfirmation()}
            {canRent && connectionStep !== 'pre_confirmation' && renderConnecting()}
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4 bg-background">
            {canRent && connectionStep === 'pre_confirmation' && (
               <Button onClick={() => {
                  setConnectionStep('connecting');
                  handleConnectAndRent();
               }} disabled={!canRent} className="w-full">
                 {translate('rent_dialog_continue_connection')} <ArrowRight className="ml-2 h-4 w-4"/>
               </Button>
            )}
            {canRent && connectionStep !== 'pre_confirmation' && (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {translate('rent_dialog_cancel')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <AlertDialog open={showWaitingDialog}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <AlertDialogTitle className="flex items-center text-xl text-primary">
              <Umbrella className="mr-2 h-6 w-6" /> {translate('rent_dialog_waiting_title')}
            </AlertDialogTitle>
             <div className="flex flex-col items-center gap-4 py-4">
                <Image
                    src={imageData.rent_step_1.src}
                    alt={imageData.rent_step_1.alt}
                    width={imageData.rent_step_1.width}
                    height={imageData.rent_step_1.height}
                    className="rounded-md border"
                    data-ai-hint="pull remove"
                />
                <Image
                    src={imageData.rent_step_2.src}
                    alt={imageData.rent_step_2.alt}
                    width={imageData.rent_step_2.width}
                    height={imageData.rent_step_2.height}
                    className="rounded-md border"
                    data-ai-hint="pull remove"
                />
            </div>
            <AlertDialogDescription className="text-lg text-center pb-4 text-foreground">
              {translate('rent_dialog_waiting_desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <AlertDialogTitle className="flex items-center text-xl text-primary">
              <Umbrella className="mr-2 h-8 w-8" /> {translate('rent_dialog_success_title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-center py-4 text-foreground">
              {translate('rent_dialog_success_desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeviceListDialog} onOpenChange={setShowDeviceListDialog}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>{translate('rent_dialog_device_list_title')}</AlertDialogTitle>
                  <AlertDialogDescription>{translate('rent_dialog_device_list_desc')}</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="max-h-60 overflow-y-auto space-y-2">
                  {foundDevices.length > 0 ? (
                      foundDevices.map((deviceResult) => (
                          <Button 
                              key={deviceResult.device.deviceId} 
                              variant="outline" 
                              className="w-full justify-start"
                              onClick={async () => {
                                  setShowDeviceListDialog(false);
                                  await BleClient.stopLEScan();
                                  await connectToDevice(deviceResult.device.deviceId);
                              }}
                          >
                            <Bluetooth className="mr-2 h-4 w-4" />
                            {deviceResult.device.name || deviceResult.device.deviceId}
                          </Button>
                      ))
                  ) : (
                      <div className="text-center text-muted-foreground p-4">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        <p>{translate('rent_dialog_scanning')}</p>
                      </div>
                  )}
              </div>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={resetAllState}>{translate('cancel_button')}</AlertDialogCancel>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
