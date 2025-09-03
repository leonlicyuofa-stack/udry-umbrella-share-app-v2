import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Wallet, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ScreenshotWalletPage() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-secondary/30 p-4">
        <h1 className="text-3xl font-bold text-primary z-10 text-center mb-8">
            Simple & Secure Wallet
        </h1>

      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader>
          <CardTitle>My Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-primary/10 rounded-md">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center"><Wallet className="mr-2 h-4 w-4" /> Spendable Balance</span>
            </div>
            <p className="text-4xl font-bold text-primary mt-1">HK$50.00</p>
          </div>

          <div className="p-4 bg-secondary rounded-md">
             <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center"><Landmark className="mr-2 h-4 w-4" /> Security Deposit</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">HK$100.00</p>
          </div>
          
          <Button className="w-full" size="lg">
            <PlusCircle className="mr-2 h-5 w-5"/> Add Funds
          </Button>

        </CardContent>
      </Card>
      
       <div className="absolute bottom-8 text-center text-xs text-muted-foreground/50">
            <p>Screenshot for U-Dry App Store Listing</p>
        </div>
    </div>
  );
}
