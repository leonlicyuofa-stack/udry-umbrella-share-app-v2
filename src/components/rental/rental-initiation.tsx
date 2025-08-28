// src/components/rental/rental-initiation.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stall } from "@/lib/types";
import { ArrowLeft, MapPin, Umbrella, AlertTriangle, Bluetooth, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RentalStallDetailsProps {
  stall: Stall;
  onConnectClick: () => void;
  isProcessing: boolean;
  bluetoothState: string;
  bluetoothStateMessage: string;
  bluetoothError: string | null;
}

export function RentalStallDetails({ 
  stall, 
  onConnectClick, 
  isProcessing,
  bluetoothState,
  bluetoothStateMessage,
  bluetoothError
}: RentalStallDetailsProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  if (authLoading) {
    return null; 
  }

  if (!user) {
    router.replace(`/auth/signin?redirect=/rent/${stall.id}`);
    return null;
  }

  const hasDeposit = user.deposit && user.deposit >= 100;
  const isFirstRental = user.hasHadFirstFreeRental === false;
  const hasBalance = user.balance && user.balance > 0;
  const hasUmbrellas = stall.availableUmbrellas > 0;
  
  const canRent = hasUmbrellas && hasDeposit && (isFirstRental || hasBalance);

  let cannotRentReason = '';
  if (!hasUmbrellas) cannotRentReason = "No umbrellas are available at this stall.";
  else if (!hasDeposit) cannotRentReason = "A HK$100 refundable deposit is required to rent.";
  else if (!isFirstRental && !hasBalance) cannotRentReason = "Your account balance is empty. Please add funds to rent.";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-8 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <Link href="/home" className="flex items-center text-sm text-primary hover:underline mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />Back to Map
          </Link>
          <CardTitle className="text-2xl font-bold text-primary flex items-center">
            <Umbrella className="h-6 w-6 mr-2" /> Rent from {stall.name}
          </CardTitle>
          <CardDescription className="flex items-center">
            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" /> {stall.address}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {!canRent && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Cannot Rent</AlertTitle>
              <AlertDescription>
                {cannotRentReason} 
                {(!hasDeposit || !hasBalance) && <Button variant="link" className="p-0 h-auto" asChild><Link href="/deposit"> Go to Wallet</Link></Button>}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <h4 className="font-semibold">Availability:</h4>
            <p className={hasUmbrellas ? "text-green-600" : "text-destructive"}>
              {stall.availableUmbrellas} / {stall.totalUmbrellas} umbrellas available
            </p>
          </div>

          <Alert>
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Rental Terms</AlertTitle>
             <AlertDescription>
                {isFirstRental 
                    ? "Your first rental is free!" 
                    : "HK$5/hr, capped at HK$25 per 24-hour period."
                } Return within 72 hours to avoid forfeiting your deposit.
             </AlertDescription>
          </Alert>

          {isProcessing && (
             <div className="text-center p-4 bg-primary/10 rounded-lg">
              <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-3" />
              <p className="text-sm text-primary font-medium">{bluetoothStateMessage}</p>
            </div>
          )}

          {bluetoothState === 'error' && bluetoothError && (
             <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Connection Failed</AlertTitle>
              <AlertDescription>{bluetoothError}</AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter className="flex-col space-y-2">
          <Button onClick={onConnectClick} disabled={!canRent || isProcessing} className="w-full">
            {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Bluetooth className="mr-2 h-5 w-5" />}
            {isProcessing ? bluetoothStateMessage : "Connect & Rent"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
