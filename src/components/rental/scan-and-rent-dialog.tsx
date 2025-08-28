
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

// This function now correctly extracts the DVID from a variety of potential QR code formats.
const extractDvid = (scannedText: string): string | null => {
    const trimmedText = scannedText.trim();
    try {
        // Handle full URLs (e.g., https://ttj.mjyun.com/..../CMYS234400696)
        if (trimmedText.startsWith('http')) {
             const url = new URL(trimmedText);
             // Get the last part of the path, which is usually the ID.
             const pathParts = url.pathname.split('/').filter(part => part.length > 0);
             if (pathParts.length > 0) {
                return pathParts[pathParts.length - 1];
             }
        }
        // Handle custom deep links (e.g., udry://rent/MK001)
        if (trimmedText.startsWith('udry://rent/')) {
            const url = new URL(trimmedText.replace("udry:/", "https:/")); // URL needs a valid protocol scheme
            const pathParts = url.pathname.split('/');
            return pathParts[pathParts.length - 1];
        }
        
        // Fallback for raw DVID scans (e.g., just "CMYS234400696")
        // A basic check to see if it looks like one of our IDs.
        if (trimmedText.length > 5 && trimmedText.match(/^[A-Z0-9]+$/)) {
             return trimmedText;
        }

    } catch (error) {
        console.warn("Could not parse scanned text as URL, treating as raw text:", error);
        // If all else fails, return the trimmed text as is.
        return trimmedText;
    }
    return null; // Return null if no valid format is found
};


export function ScanAndRentDialog({ isOpen, onOpenChange, stalls }: ScanAndRentDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanError, setScanError] = useState<string | null>(null);
  
  const isProcessingScan = useRef(false);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
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
      setScanState('complete');
      toast({ title: "Stall Found!", description: `Redirecting to rental page for ${foundStall.name}`});
      // Correctly navigate to the dynamic route for the found stall
      router.push(`/rent/${foundStall.dvid}`);
      onOpenChange(false);
    } else {
      toast({ variant: "destructive", title: "Stall Not Found", description: `Scanned code did not match a known stall. Scanned ID: ${dvid}` });
      setScanState('error');
      setScanError(`No stall found with the ID "${dvid}". Please scan a valid U-Dry QR code.`);
      isProcessingScan.current = false;
    }
  }, [stopScanner, stalls, toast, router, onOpenChange]);


  useEffect(() => {
    if (isOpen) {
      isProcessingScan.current = false;
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


  const handleClose = () => {
    stopScanner().then(() => onOpenChange(false));
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center"><QrCode className="mr-2 h-5 w-5"/> Scan to Rent</DialogTitle>
          <DialogDescription>Point your camera at the QR code on any U-Dry machine to begin.</DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div id={QR_READER_REGION_ID_RENT} className={cn("w-full aspect-square bg-black rounded-md", scanState !== 'scanning' && "hidden")} />

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
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Scan Failed</AlertTitle>
                    <AlertDescription>{scanError}</AlertDescription>
                  </Alert>
                )}
                {scanState === 'idle' && (
                  <div className="text-muted-foreground">
                    <p>Scanner is idle.</p>
                  </div>
                )}
             </div>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
