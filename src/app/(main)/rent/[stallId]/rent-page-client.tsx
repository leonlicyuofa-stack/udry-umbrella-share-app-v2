// src/app/(main)/rent/[stallId]/rent-page-client.tsx
"use client";

import { RentalStallDetails } from '@/components/rental/rental-initiation'; // Renamed for clarity
import { useStalls } from '@/contexts/auth-context';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Stall } from '@/lib/types';
import { ScanAndRentDialog } from '@/components/rental/scan-and-rent-dialog'; // Import the dialog

export default function RentPageClient() {
  const { stallId } = useParams<{ stallId: string }>();
  const { stalls, isLoadingStalls } = useStalls(); 
  const [stall, setStall] = useState<Stall | null | undefined>(undefined);
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false); // State to control the dialog

  useEffect(() => {
    if (!isLoadingStalls) {
      const foundStall = stalls.find(s => s.dvid === stallId);
      setStall(foundStall || null);
    }
  }, [stallId, stalls, isLoadingStalls]);

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

  // The component now renders the stall details and the scan dialog.
  // The RentalStallDetails component's button will open the dialog.
  return (
    <>
      <RentalStallDetails stall={stall} onScanClick={() => setIsScanDialogOpen(true)} />
      <ScanAndRentDialog 
        isOpen={isScanDialogOpen} 
        onOpenChange={setIsScanDialogOpen} 
        stalls={stalls} 
      />
    </>
  );
}
