// src/components/rental/rental-initiation.tsx - Renamed to RentalStallDetails internally
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stall } from "@/lib/types";
import { ArrowLeft, MapPin, Umbrella, LogIn, AlertTriangle, QrCode } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RentalStallDetailsProps {
  stall: Stall;
  onScanClick: () => void;
}

// This component has been simplified to ONLY display stall information
// and trigger the scan dialog via a callback. All complex logic has been removed.
export function RentalStallDetails({ stall, onScanClick }: RentalStallDetailsProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  if (authLoading) {
    // This is unlikely to be seen as the parent page has a loader, but it's good practice.
    return null; 
  }

  if (!user) {
    // Redirect to sign-in if the user is not authenticated
    router.replace(`/auth/signin?redirect=/rent/${stall.id}`);
    return null;
  }

  const hasDeposit = user.deposit && user.deposit >= 100;
  const isFirstRental = user.hasHadFirstFreeRental === false;
  const hasBalance = user.balance && user.balance > 0;
  const hasUmbrellas = stall.availableUmbrellas > 0;
  
  // Determine if the user can rent based on all conditions
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

        </CardContent>
        <CardFooter className="flex-col space-y-2">
          <Button onClick={onScanClick} disabled={!canRent} className="w-full">
            <QrCode className="mr-2 h-5 w-5" /> Scan & Rent
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
