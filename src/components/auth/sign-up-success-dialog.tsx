"use client";

import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Umbrella, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SignUpSuccessDialog() {
  const { showSignUpSuccess, dismissSignUpSuccess } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    dismissSignUpSuccess();
    router.push('/home');
  };

  return (
    <Dialog open={showSignUpSuccess} onOpenChange={dismissSignUpSuccess}>
      <DialogContent>
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <Umbrella className="h-16 w-16 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">Welcome to U-Dry!</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            We're here to help keep you dry on rainy days. Find an umbrella whenever you need one!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={dismissSignUpSuccess} className="w-full sm:w-auto">Close</Button>
          <Button onClick={handleGetStarted} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
