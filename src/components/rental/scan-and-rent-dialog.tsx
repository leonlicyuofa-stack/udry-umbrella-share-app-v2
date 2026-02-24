
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Loader2, XCircle, CameraOff, CheckCircle, AlertTriangle, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Html5Qrcode } from "html5-qrcode";
import type { Stall } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera } from '@capacitor/camera';

const QR_READER_REGION_ID_RENT = "qr-reader-region-rent-dialog";

interface ScanAndRentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  stalls: Stall[];
  onStallScanned: (stall: Stall) => void;
}

type ScanState = 'idle' | 'initializing' | 'scanning' | 'complete' | 'error';

const extractDvid = (scannedText: string): string | null => {
    const trimmedText = scannedText.trim();
    try {
        if (trimmedText.startsWith('http')) {
             const url = new URL(trimmedText);
             const pathParts = url.pathname.split('/').filter(part => part.length > 0);
             if (pathParts.length > 0) {
                return pathParts[pathParts.length - 1];
             }
        }
        if (trimmedText.startsWith('udry://rent/')) {
            const url = new URL(trimmedText.replace("udry:/", "https:/"));
            const pathParts = url.pathname.split('/');
            return pathParts[pathParts.length - 1];
        }
        // Fallback for simple ID strings
        if (trimmedText.length > 5 && trimmedText.match(/^[A-Z0-9]+$/)) {
             return trimmedText;
        }
    } catch (error) {
        console.warn("Could not parse scanned text as URL, treating as raw text:", error);
        return trimmedText; // Treat as raw if URL parsing fails
    }
    return null;
};

export function ScanAndRentDialog({ isOpen, onOpenChange, stalls, onStallScanned }: ScanAndRentDialogProps) {
  const { toast } = useToast();
  const { translate } = useLanguage();
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanError, setScanError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const isProcessingScan = useRef(false);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.warn("Scan & Rent Dialog: Failed to stop QR scanner gracefully.", err);
      }
    }
    setHasCameraPermission(null);
  }, []);

  const onScanSuccess = useCallback(async (decodedText: string) => {
    if (isProcessingScan.current) return;
    isProcessingScan.current = true;
    
    await stopScanner();
    
    const dvid = extractDvid(decodedText);
    
    if (!dvid) {
        toast({ variant: "destructive", title: translate('toast_invalid_qr'), description: translate('toast_invalid_qr_desc') });
        setScanState('idle');
        isProcessingScan.current = false;
        return;
    }
    
    const foundStall = stalls.find(s => s.dvid === dvid);
    
    if (foundStall) {
      setScanState('complete');
      toast({ title: translate('toast_stall_identified'), description: translate('toast_stall_identified_desc', { stallName: foundStall.name })});
      onStallScanned(foundStall);
    } else {
      toast({ variant: "destructive", title: translate('toast_stall_not_found'), description: translate('toast_stall_not_found_desc', { dvid }) });
      setScanState('error');
      setScanError(translate('toast_stall_not_found_desc', { dvid }));
      isProcessingScan.current = false;
    }
  }, [stopScanner, stalls, toast, onStallScanned, translate]);


  const startScanner = useCallback(async () => {
    isProcessingScan.current = false;
    setScanError(null);
    setScanState('initializing');
    setHasCameraPermission(null);

    try {
      if (Capacitor.isNativePlatform()) {
        const permStatus = await CapacitorCamera.checkPermissions();
        if (permStatus.camera !== 'granted') {
          const requested = await CapacitorCamera.requestPermissions({ permissions: ['camera'] });
          if (requested.camera !== 'granted') {
            setScanError(translate('report_issue_camera_permission_denied'));
            setScanState('error');
            setHasCameraPermission(false);
            return;
          }
        }
      }

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(QR_READER_REGION_ID_RENT, { verbose: false });
      }
      setScanState('scanning');
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { 
          fps: 24,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        onScanSuccess,
        () => {}
      );
      setHasCameraPermission(true);
    } catch (err: any) {
      let message = translate('report_issue_camera_error_desc_generic');
      if (err?.name === "NotAllowedError" || err?.toString().includes("NotAllowedError")) {
        message = translate('report_issue_camera_permission_denied');
      } else if (err?.name === "NotFoundError" || err?.toString().includes("NotFoundError")) {
        message = translate('report_issue_camera_not_found');
      }
      setScanError(message);
      setScanState('error');
      setHasCameraPermission(false);
    }
  }, [onScanSuccess, translate]);


  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
      setScanState('idle');
      isProcessingScan.current = false;
    }
  }, [isOpen, startScanner, stopScanner]);


  const handleClose = () => {
    stopScanner().then(() => onOpenChange(false));
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center"><QrCode className="mr-2 h-5 w-5"/> {translate('scan_rent_dialog_title')}</DialogTitle>
          <DialogDescription>{translate('scan_rent_dialog_desc')}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div id={QR_READER_REGION_ID_RENT} className={cn("w-full aspect-square bg-black rounded-md", scanState !== 'scanning' && "hidden")} />

          {scanState !== 'scanning' && (
             <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center text-center p-4">
               {scanState === 'initializing' && (
                  <div>
                    <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
                    <p>{translate('scan_rent_dialog_initializing')}</p>
                  </div>
                )}
                {scanState === 'complete' && (
                  <div>
                    <CheckCircle className="h-10 w-10 mx-auto text-green-500 mb-2" />
                    <p>{translate('scan_rent_dialog_success')}</p>
                  </div>
                )}
                {scanState === 'error' && (
                  <Alert variant="destructive">
                    <CameraOff className="h-4 w-4" />
                    <AlertTitle>{translate('scan_rent_dialog_error_title')}</AlertTitle>
                    <AlertDescription>{scanError}</AlertDescription>
                  </Alert>
                )}
                {scanState === 'idle' && (
                  <div className="text-muted-foreground">
                    <p>{translate('scan_rent_dialog_idle')}</p>
                  </div>
                )}
             </div>
          )}
        </div>
        
        <DialogFooter>
          {scanState === 'error' && (
            <Button type="button" variant="outline" onClick={startScanner}>{translate('scan_rent_dialog_try_again')}</Button>
          )}
          <Button type="button" variant="secondary" onClick={handleClose}>{translate('cancel_button')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
