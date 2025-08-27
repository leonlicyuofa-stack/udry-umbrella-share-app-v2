
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CircleDollarSign, AlertTriangle, LogIn, Landmark, Wallet } from 'lucide-react';
import Link from 'next/link'; 
import { useLanguage } from '@/contexts/language-context';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { loadStripe } from '@stripe/stripe-js';
import { Badge } from '@/components/ui/badge';
import { httpsCallable } from 'firebase/functions';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);


export default function DepositPage() {
  const { user, isReady, firebaseServices } = useAuth();
  const { translate } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  
  const [amount, setAmount] = useState('50');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (isReady && !user) {
      router.replace('/auth/signin?redirect=/deposit');
    }
  }, [user, isReady, router]);

  const paymentMethodsRaw = [
    { id: 'stripe', nameKey: 'payment_method_credit_card' },
    { id: 'alipay', nameKey: 'payment_method_alipay' },
    { id: 'payme', nameKey: 'payment_method_payme' },
  ];
  const paymentMethods = paymentMethodsRaw.map(pm => ({...pm, name: translate(pm.nameKey)}));

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{translate('deposit_loading_account')}</p>
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
            <p>{translate('deposit_login_required')}</p>
            <Button asChild className="mt-4">
              <Link href="/auth/signin?redirect=/deposit" className="flex items-center">
                <LogIn className="mr-2 h-4 w-4" /> {translate('login')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePayment = async (paymentAmount: number, paymentType: 'deposit' | 'balance') => {
      if (!selectedMethod || !firebaseServices?.functions) {
          toast({ variant: "destructive", title: 'Error', description: 'Payment services are not available.' });
          return;
      }
      setIsProcessingPayment(true);
      
      try {
          if (selectedMethod === 'stripe') {
              const createStripeCheckoutSession = httpsCallable(firebaseServices.functions, 'createStripeCheckoutSession');
              const result = await createStripeCheckoutSession({ 
                amount: paymentAmount, 
                paymentType
              });
              const data = result.data as { success: boolean, id?: string, message?: string };

              if (!data.success || !data.id) {
                throw new Error(data.message || 'Failed to create Stripe session.');
              }
              const sessionId = data.id;

              const stripe = await stripePromise;
              if (!stripe) throw new Error('Stripe.js has not loaded yet.');

              const { error } = await stripe.redirectToCheckout({ sessionId });
              if (error) throw new Error(error.message);
          } else {
             toast({ title: "Payment Method Not Implemented", description: `The selected method '${selectedMethod}' is not yet fully integrated.` });
             setIsProcessingPayment(false);
          }
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Payment Error', description: error.message });
          setIsProcessingPayment(false);
      }
  };


  const handleDepositPayment = () => handlePayment(100, 'deposit');

  const handleAddBalancePayment = () => {
    const finalAmount = parseFloat(amount === 'custom' ? customAmount : amount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
        toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive"});
        return;
    }
    handlePayment(finalAmount, 'balance');
  };
  
  const hasDeposit = user.deposit && user.deposit >= 100;

  // RENDER DEPOSIT VIEW
  if (!hasDeposit) {
    return (
       <div className="container mx-auto py-8 px-4 max-w-2xl relative">
        <Badge variant="outline" className="absolute top-4 right-4">v6</Badge>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary flex items-center">
              <Landmark className="mr-3 h-8 w-8" />
              {translate('deposit_title_one_time')}
            </CardTitle>
            <CardDescription>
              {translate('deposit_desc_one_time')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{translate('deposit_alert_title')}</AlertTitle>
              <AlertDescription>
                {translate('deposit_alert_desc')}
              </AlertDescription>
            </Alert>
            <div className="text-center p-6 bg-secondary/50 rounded-md">
                <Label className="text-lg text-muted-foreground">{translate('deposit_amount_label_fixed')}</Label>
                <p className="text-5xl font-bold text-primary">HK$100.00</p>
            </div>
             <div className="space-y-4">
              <h3 className="text-lg font-semibold">{translate('deposit_payment_method_label')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paymentMethods.map((method) => {
                  const isComingSoon = method.id === 'payme' || method.id === 'alipay';
                  return (
                    <Button
                      key={method.id}
                      variant={selectedMethod === method.id ? "default" : "outline"}
                      className="h-auto py-4 flex items-center justify-center gap-2"
                      onClick={() => setSelectedMethod(method.id)}
                      disabled={isProcessingPayment || isComingSoon}
                    >
                      <span>{method.name}</span>
                      {isComingSoon && <Badge variant="secondary">Available Soon</Badge>}
                    </Button>
                  )
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleDepositPayment}
              disabled={!selectedMethod || isProcessingPayment}
            >
              {isProcessingPayment && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {translate('deposit_proceed_button')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // RENDER ADD BALANCE VIEW
  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl relative">
      <Badge variant="outline" className="absolute top-4 right-4">v6</Badge>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center">
            <Wallet className="mr-3 h-8 w-8" />
            {translate('add_balance_title')}
          </CardTitle>
          <CardDescription>
            {translate('add_balance_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <Label className="text-lg font-semibold">{translate('add_balance_amount_label')}</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              {['25', '50', '100', 'custom'].map(value => (
                <Button
                  key={value}
                  variant={amount === value ? 'default' : 'outline'}
                  onClick={() => setAmount(value)}
                  className="h-14 text-lg"
                  disabled={isProcessingPayment}
                >
                  {value === 'custom' ? translate('add_balance_custom_amount') : `HK$${value}`}
                </Button>
              ))}
            </div>
             {amount === 'custom' && (
                <div className="mt-4">
                    <Label htmlFor="custom-amount-input">{translate('add_balance_enter_custom_amount')}</Label>
                    <Input
                        id="custom-amount-input"
                        type="number"
                        placeholder="e.g., 30"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="mt-1 h-12 text-lg"
                        min="1"
                        disabled={isProcessingPayment}
                    />
                </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{translate('deposit_payment_method_label')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paymentMethods.map((method) => {
                  const isComingSoon = method.id === 'payme' || method.id === 'alipay';
                  return (
                    <Button
                      key={method.id}
                      variant={selectedMethod === method.id ? "default" : "outline"}
                      className="h-auto py-4 flex items-center justify-center gap-2"
                      onClick={() => setSelectedMethod(method.id)}
                      disabled={isProcessingPayment || isComingSoon}
                    >
                      <span>{method.name}</span>
                      {isComingSoon && <Badge variant="secondary">Available Soon</Badge>}
                    </Button>
                  )
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={handleAddBalancePayment}
            disabled={!selectedMethod || isProcessingPayment || (amount === 'custom' && (!customAmount || parseFloat(customAmount) <= 0))}
          >
            {isProcessingPayment && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {translate('add_balance_proceed_button')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
