
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface LinkAccountsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLinkGoogle: () => void;
  onLinkApple: () => void;
  isLinking: boolean;
}

// A simple component for the Google icon
const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
        <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 261.8S111.8 11.6 244 11.6c70.3 0 129.2 28.2 173.4 72.8l-63.1 61.9C333.1 126.9 292.2 104 244 104c-81.8 0-148.5 66.7-148.5 148.5s66.7 148.5 148.5 148.5c87.3 0 127.3-37.2 132.3-86H244v-75.5h236.1c2.4 12.7 3.9 26.1 3.9 40.8z"></path>
    </svg>
);

// A simple component for the Apple icon
const AppleIcon = () => (
    <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
        <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C39.2 141.1 0 183.2 0 245.4c0 45.7 30.2 74.8 61.5 99.8C92.8 369.3 123.9 387 156.4 387c26.7 0 49.4-14.5 67.6-14.5 17.7 0 38.3 12.5 64.1 12.5 34.6 0 63.3-20.1 82.6-54.2-20.1-15.1-34.6-37.2-34.6-63.3zM256 64C229.3 64 208 85.3 208 112c0 2.5.2 4.9.6 7.3C215.1 113.1 236.4 104 256 104c26.7 0 48 21.3 48 48s-21.3 48-48 48c-19.6 0-40.9-8.9-47.4-15.3.3-2.4.5-4.8.5-7.3 0-26.7-21.3-48-48-48s-48 21.3-48 48c0 2.5.2 4.9.6 7.3-6.5 6.4-27.8 15.3-47.4 15.3-26.7 0-48-21.3-48-48s21.3-48 48-48c19.6 0 40.9 8.9 47.4 15.3-.4-2.4-.6-4.9-.6-7.3 0-26.7 21.3-48 48-48s48 21.3 48 48z"></path>
    </svg>
);

export function LinkAccountsDialog({ isOpen, onOpenChange, onLinkGoogle, onLinkApple, isLinking }: LinkAccountsDialogProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <ShieldCheck className="h-16 w-16 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">Secure Your Account</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            For easier access to your funds in the future, we recommend linking a social account. This helps ensure you always sign in to the same wallet.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
            <Button
                variant="outline"
                className="w-full"
                onClick={onLinkGoogle}
                disabled={isLinking}
            >
                {isLinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Link with Google
            </Button>
            <Button
                variant="outline"
                className="w-full"
                onClick={onLinkApple}
                disabled={isLinking}
            >
                {isLinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AppleIcon />}
                Link with Apple
            </Button>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto" disabled={isLinking}>Maybe Later</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
