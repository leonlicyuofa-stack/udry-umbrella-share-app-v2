"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, LogIn, Wallet, Landmark, PlusCircle, History, Ticket, Wrench, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AccountBalancePage() {
  const { user, isReady, requestDepositRefund } = useAuth();
  const router = useRouter();
  const { translate } = useLanguage();
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    if (isReady && !user) {
      router.replace('/auth/signin?redirect=/account/balance');
    }
  }, [user, isReady, router]);

  const handleRefund = async () => {
    setIsRefunding(true);
    try {
      await requestDepositRefund();
      // Success toast is handled in AuthContext
    } catch (error) {
      // Error toast is handled in AuthContext
      console.error("Refund request failed on page:", error);
    } finally {
      setIsRefunding(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{translate('balance_loading_details')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center justify-center">
              <AlertTriangle className="mr-2 h-6 w-6" /> {translate('access_denied')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{translate('balance_login_required')}</p>
            <Button asChild className="mt-4">
              <Link href="/auth/signin?redirect=/account/balance" className="flex items-center">
                <LogIn className="mr-2 h-4 w-4" /> {translate('login')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasPaidDeposit = (user.deposit || 0) >= 100;
  const hasActiveRental = !!user.activeRental;
  const hasNegativeBalance = (user.balance || 0) < 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="space-y-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary flex items-center">
              <Wallet className="mr-3 h-8 w-8" />
              {translate('balance_title')}
            </CardTitle>
            <CardDescription>
              {translate('balance_description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="p-6 bg-secondary/30 rounded-md grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Spendable Balance */}
              <div className="text-center">
                <h2 className="text-lg font-semibold text-primary mb-2 flex items-center justify-center">
                  <Wallet className="mr-2 h-5 w-5" /> {translate('balance_spendable_balance_label')}
                </h2>
                <p className="text-4xl font-bold text-primary">HK${(user.balance || 0).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">{translate('balance_spendable_balance_desc')}</p>
              </div>
              {/* Security Deposit */}
              <div className="text-center">
                <h2 className="text-lg font-semibold text-primary mb-2 flex items-center justify-center">
                   <Landmark className="mr-2 h-5 w-5" /> {translate('balance_deposit_label')}
                </h2>
                <p className={`text-4xl font-bold ${user.deposit && user.deposit >= 100 ? 'text-green-600' : 'text-destructive'}`}>
                  HK${(user.deposit || 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{translate('balance_deposit_desc')}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild>
               <Link href="/deposit" className="flex items-center">
                <PlusCircle className="mr-2 h-5 w-5" />
                {hasPaidDeposit ? translate('add_balance_button') : translate('pay_deposit_button')}
               </Link>
              </Button>
              {hasPaidDeposit && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={hasActiveRental || hasNegativeBalance}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Request Deposit Refund
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to refund your deposit?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will refund your HK$100.00 deposit. You will need to pay it again to rent umbrellas in the future. This action cannot be undone. It may take 5-10 business days for the refund to appear on your statement.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRefund} disabled={isRefunding}>
                        {isRefunding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Yes, Refund My Deposit
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            {hasPaidDeposit && (hasActiveRental || hasNegativeBalance) && (
              <p className="text-xs text-destructive text-center">
                {hasActiveRental ? "You cannot refund your deposit while you have an active rental." : null}
                {hasNegativeBalance ? "You must clear your negative balance before refunding your deposit." : null}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Coupons Section */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-primary flex items-center">
              <Ticket className="mr-3 h-6 w-6" />
              My Coupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.hasHadFirstFreeRental === false ? (
              <div className="p-4 border-2 border-dashed border-green-400 rounded-lg bg-green-50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-700">First Rental Free!</h3>
                  <p className="text-sm text-green-600">Your next umbrella rental is on us. This coupon will be applied automatically.</p>
                </div>
                <Ticket className="h-10 w-10 text-green-500 opacity-80" />
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                You have no available coupons at this time.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
