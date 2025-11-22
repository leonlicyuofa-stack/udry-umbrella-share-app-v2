
"use client";

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, MailCheck, ShieldAlert, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

export function EmailVerificationHandler({ children }: { children: React.ReactNode }) {
  const { user, isReady, signOut, sendVerificationEmail, isVerified } = useAuth();
  const [isSending, setIsSending] = useState(false);

  // Send email automatically once when the component mounts for a new, unverified user
  useEffect(() => {
    if (isReady && user && !isVerified) {
        // Automatically send the email once when the prompt is first shown
        sendVerificationEmail().catch(err => {
            console.error("Initial verification email failed to send:", err);
        });
    }
  }, [isReady, user, isVerified, sendVerificationEmail]);

  const handleResendEmail = async () => {
    setIsSending(true);
    await sendVerificationEmail(); // Errors are handled by toast in context
    setIsSending(false);
  };

  // If auth state is still loading, show nothing to prevent flashes of content.
  if (!isReady) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  // If there's no user, or if the user is verified, show the main app content.
  // The AuthProvider handles redirecting logged-out users away from protected routes.
  if (!user || isVerified) {
    return <>{children}</>;
  }

  // Otherwise, the user is new and unverified, so show the verification prompt.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/30 p-4">
        <Card className="w-full max-w-lg shadow-xl">
            <CardHeader className="text-center">
                <MailCheck className="mx-auto h-12 w-12 text-primary" />
                <CardTitle className="mt-4 text-2xl">Please Verify Your Email</CardTitle>
                <CardDescription>
                    We've sent a verification link to <strong>{user.email}</strong>. Please check your inbox and spam folder.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Alert>
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Why am I seeing this?</AlertTitle>
                    <AlertDescription>
                       To protect your account, email verification is required for all new users before accessing the app.
                    </AlertDescription>
                </Alert>
                <p className="text-sm text-center text-muted-foreground">
                    Once your email is verified, you will be able to access all features. You may need to sign out and sign back in after verifying.
                </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
                 <Button onClick={handleResendEmail} disabled={isSending} className="w-full sm:w-auto">
                    {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Resend Verification Email
                </Button>
                <Button variant="outline" onClick={signOut} className="w-full sm:w-auto">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
