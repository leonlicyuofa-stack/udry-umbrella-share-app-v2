
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Loader2, XCircle, CameraOff, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Html5Qrcode } from "html5-qrcode";
import type { Stall } from '@/lib/types';
import { cn } from '@/lib/utils';

const QR_READER_REGION_ID_RENT = "qr-reader-region-rent-dialog";

interface ScanAndRentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  stalls: Stall[];
}

type ScanState = 'idle' | 'initializing' | 'scanning' | 'complete' | 'error';

const extractDvid = (scannedText: string): string | null => {
    const trimmedText = scannedText.trim();
    try {
        if (trimmedText.startsWith('com.udry.app://')) {
            const url = new URL(trimmedText);
            const pathParts = url.pathname.split('/');
            if (pathParts.length > 1 && pathParts[1] === 'rent') {
                return pathParts[pathParts.length - 1];
            }
        }
        
        if (trimmedText.startsWith('http')) {
             const url = new URL(trimmedText);
             const pathParts = url.pathname.split('/');
             return pathParts[pathParts.length - 1];
        }
        
        return trimmedText;

    } catch (error) {
        console.error("Error parsing scanned text:", error);
        return null;
    }
};


export function ScanAndRentDialog({ isOpen, onOpenChange, stalls }: ScanAndRentDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannedStallIdRef = useRef<string | null>(null);
  
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanError, setScanError] = useState<string | null>(null);
  
  const isProcessingScan = useRef(false);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        console.log("Scan & Rent Dialog: QR Scanner stopped successfully.");
      } catch (err) {
        console.warn("Scan & Rent Dialog: Failed to stop QR scanner gracefully.", err);
      }
    }
  }, []);

  const onScanSuccess = useCallback(async (decodedText: string) => {
    if (isProcessingScan.current) return;
    isProcessingScan.current = true;
    
    await stopScanner();
    
    const dvid = extractDvid(decodedText);
    
    if (!dvid) {
        toast({ variant: "destructive", title: "Invalid QR Code", description: `Could not understand the scanned code.` });
        setScanState('idle');
        isProcessingScan.current = false;
        return;
    }
    
    const foundStall = stalls.find(s => s.dvid === dvid);
    
    if (foundStall) {
      scannedStallIdRef.current = foundStall.id;
      setScanState('complete');
    } else {
      toast({ variant: "destructive", title: "Invalid QR Code", description: `Scanned code did not match a known stall. Scanned DVID: ${dvid}` });
      setScanState('idle'); 
      isProcessingScan.current = false;
    }
  }, [stopScanner, stalls, toast]);

  useEffect(() => {
    if (scanState === 'complete' && scannedStallIdRef.current) {
      const stallId = scannedStallIdRef.current;
      const stall = stalls.find(s => s.id === stallId);
      const navTimer = setTimeout(() => {
        toast({ title: "Stall Found!", description: `Redirecting to rental page for ${stall?.name || 'the selected stall'}`});
        router.push(`/rent/${stallId}`);
        onOpenChange(false);
      }, 50);
      return () => clearTimeout(navTimer);
    }
  }, [scanState, router, toast, onOpenChange, stalls]);

  useEffect(() => {
    if (isOpen) {
      isProcessingScan.current = false;
      scannedStallIdRef.current = null;
      setScanError(null);
      setScanState('initializing');

      const initTimer = setTimeout(() => {
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode(QR_READER_REGION_ID_RENT, { verbose: false });
        }
        setScanState('scanning');
        html5QrCodeRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          () => { /* Ignore non-match errors */ }
        ).catch(err => {
          setScanError("Failed to start QR scanner. Please ensure camera permissions are enabled for this site.");
          setScanState('error');
        });
      }, 100);

      return () => clearTimeout(initTimer);
    } else {
      stopScanner();
      setScanState('idle');
    }
  }, [isOpen, onScanSuccess, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            stopScanner().then(() => onOpenChange(false));
        } else {
            onOpenChange(true);
        }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <QrCode className="mr-2 h-5 w-5"/> Scan to Rent
          </DialogTitle>
          <DialogDescription>
            Point your camera at the QR code on any U-Dry machine to begin the rental process.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div 
            id={QR_READER_REGION_ID_RENT}
            className={cn(
                "w-full aspect-square bg-black rounded-md", 
                scanState !== 'scanning' && "hidden"
            )}
          />

          {scanState !== 'scanning' && (
             <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center text-center p-4">
               {scanState === 'initializing' && (
                  <div>
                    <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
                    <p>Starting Camera...</p>
                  </div>
                )}
                {scanState === 'complete' && (
                  <div>
                    <CheckCircle className="h-10 w-10 mx-auto text-green-500 mb-2" />
                    <p>Scan successful, redirecting...</p>
                  </div>
                )}
                {scanState === 'error' && (
                  <Alert variant="destructive">
                    <CameraOff className="h-4 w-4" />
                    <AlertTitle>Camera Error</AlertTitle>
                    <AlertDescription>{scanError}</AlertDescription>
                  </Alert>
                )}
             </div>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
