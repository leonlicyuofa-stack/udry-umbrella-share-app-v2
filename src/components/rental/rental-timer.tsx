
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimerIcon, Umbrella, AlertTriangle, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

const CUSTOMER_SERVICE_NUMBER = "1-800-UDRY-HLP"; // Placeholder

export function RentalTimer() {
  const { activeRental, isLoadingRental } = useAuth();
  const router = useRouter();

  const [elapsedTime, setElapsedTime] = useState<string>('');
  const [calculatedCharge, setCalculatedCharge] = useState<number>(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [showMaxChargeMessage, setShowMaxChargeMessage] = useState<boolean>(false);
  const [totalElapsedHoursState, setTotalElapsedHoursState] = useState<number>(0);

  useEffect(() => {
    if (isLoadingRental || !activeRental || !activeRental.startTime) {
      setElapsedTime('');
      setCalculatedCharge(0);
      setWarningMessage(null);
      setShowMaxChargeMessage(false);
      setTotalElapsedHoursState(0);
      return;
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      const startTime = activeRental.startTime;
      if (typeof startTime !== 'number' || isNaN(startTime)) { // Guard against NaN
        return;
      }

      const elapsedMilliseconds = now - startTime;
      
      const totalSeconds = Math.floor(elapsedMilliseconds / 1000);
      const displayHours = Math.floor(totalSeconds / 3600);
      const displayMinutes = Math.floor((totalSeconds % 3600) / 60);
      const displaySeconds = totalSeconds % 60;
      setElapsedTime(
        `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`
      );

      const currentTotalElapsedHours = elapsedMilliseconds / (1000 * 60 * 60);
      setTotalElapsedHoursState(currentTotalElapsedHours);

      let currentCharge = 0;
      let currentWarning: string | null = null;
      let isMaxChargeForCycleReached = false;

      const HOURLY_RATE = 5;
      const DAILY_CAP_CHARGE = 25;
      const HOURS_TO_REACH_DAILY_CAP = 5; // 5 hours * $5/hr = $25 daily cap

      if (activeRental.isFree) {
        currentCharge = 0;
      } else if (currentTotalElapsedHours > 72) {
        currentCharge = 100; // Deposit forfeited
        currentWarning = `Rental exceeded 72 hours. Deposit (HK$100) forfeited. Please return umbrella.`;
        isMaxChargeForCycleReached = false; // No longer relevant
      } else {
        const full24HourCycles = Math.floor(currentTotalElapsedHours / 24);
        currentCharge += full24HourCycles * DAILY_CAP_CHARGE;

        const hoursIntoCurrentCycle = currentTotalElapsedHours % 24;
        let chargeForCurrentCycle = 0;

        if (hoursIntoCurrentCycle > 0) {
            const chargeableHours = Math.ceil(hoursIntoCurrentCycle);
            if (chargeableHours <= HOURS_TO_REACH_DAILY_CAP) {
                chargeForCurrentCycle = chargeableHours * HOURLY_RATE;
            } else {
                chargeForCurrentCycle = DAILY_CAP_CHARGE;
                isMaxChargeForCycleReached = true;
            }
        }
        
        currentCharge += chargeForCurrentCycle;
        
        if (currentTotalElapsedHours >= 36) {
          currentWarning = `Warning: Max rental 72 hours. After 72 hours, deposit will be forfeited. To appeal, call ${CUSTOMER_SERVICE_NUMBER}.`;
        }
      }
      
      setCalculatedCharge(Math.min(currentCharge, 100)); 
      setWarningMessage(currentWarning);
      setShowMaxChargeMessage(isMaxChargeForCycleReached && currentTotalElapsedHours < 72 && !activeRental.isFree);

    }, 1000);

    return () => clearInterval(intervalId);
  }, [activeRental, isLoadingRental]);

  // Stricter check: Do not render anything if there isn't a valid active rental with a start time.
  if (!activeRental || !activeRental.startTime) {
    return null;
  }

  const handleNavigateToReturn = () => {
    router.push('/return-umbrella');
  };

  const isOverdue = totalElapsedHoursState >= 72;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 md:w-96 pointer-events-none">
      <Card className="shadow-xl pointer-events-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4">
          <CardTitle className="text-base font-medium text-primary flex items-center">
            <Umbrella className="h-5 w-5 mr-2" />
            Active Rental
          </CardTitle>
          <Badge variant={isOverdue ? "destructive" : (activeRental.isFree ? "secondary" : "default")} className="text-xs ml-auto whitespace-nowrap">
            {activeRental.isFree ? "Free Rental!" : `HK$${calculatedCharge.toFixed(2)}`}
          </Badge>
        </CardHeader>
        <CardContent className="pt-1 pb-3 px-4 space-y-2">
          <div className="text-sm text-muted-foreground">
            Stall: <span className="font-semibold text-foreground">{activeRental.stallName}</span>
          </div>
          <div className="flex items-center text-2xl font-bold">
            <TimerIcon className="mr-2 h-6 w-6 text-accent" />
            {elapsedTime}
          </div>
          {showMaxChargeMessage && !warningMessage && (
            <p className="text-xs text-primary">Daily charge capped for this 24hr period.</p>
          )}
          {warningMessage && (
            <div className={`mt-2 p-2 rounded-md text-xs ${isOverdue ? 'bg-destructive/20 text-destructive-foreground' : 'bg-amber-500/20 text-amber-700'}`}>
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{warningMessage}</span>
              </div>
              {totalElapsedHoursState >= 36 && !isOverdue && (
                  <div className="mt-1 flex items-center">
                      <Phone className="h-3 w-3 mr-1"/>
                      <span>Call: {CUSTOMER_SERVICE_NUMBER}</span>
                  </div>
              )}
            </div>
          )}
          
        </CardContent>
        <CardFooter className="px-4 pb-3">
          <Button 
              onClick={handleNavigateToReturn} 
              className={`w-full text-accent-foreground ${isOverdue ? 'bg-destructive hover:bg-destructive/90' : 'bg-accent hover:bg-accent/90'}`}
          >
            {isOverdue ? "Return Overdue Umbrella" : "Return Umbrella"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
