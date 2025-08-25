"use client";

import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Gift } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SignUpSuccessDialog() {
  const { showSignUpSuccess, dismissSignUpSuccess } = useAuth();
  const router = useRouter();

  const handleGoToAccount = () => {
    dismissSignUpSuccess();
    router.push('/account/balance');
  };

  return (
    <Dialog open={showSignUpSuccess} onOpenChange={dismissSignUpSuccess}>
      <DialogContent>
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <Gift className="h-16 w-16 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">Welcome Aboard!</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            As a new member, your first umbrella rental is on us! We've added a "First Rental Free" coupon to your account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={dismissSignUpSuccess} className="w-full sm:w-auto">Close</Button>
          <Button onClick={handleGoToAccount} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
            <CheckCircle className="mr-2 h-4 w-4" />
            See My Coupon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
