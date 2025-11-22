
"use client";

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, MailCheck, ShieldAlert, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// --- IMPORTANT: GRANDFATHER CLAUSE ---
// This date ensures that only users who sign up *after* this feature is deployed
// will be subject to the email verification check. Your existing users will not be affected.
const GRANDFATHER_CLAUSE_TIMESTAMP = 1732492800000; // Corresponds to Nov 25, 2025

export function EmailVerificationHandler({ children }: { children: React.ReactNode }) {
  const { user, isReady, signOut, sendVerificationEmail } = useAuth();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  // Send email automatically once when the component mounts for a new, unverified user
  useEffect(() => {
    if (user && !user.emailVerified) {
      // Check if this is a new user to avoid sending emails to old, unverified accounts.
      // This is a safety check; the main grandfather clause is the primary gate.
      const creationTime = user.metadata?.creationTime ? new Date(user.metadata.creationTime).getTime() : 0;
      const isNewUser = creationTime >= GRANDFATHER_CLAUSE_TIMESTAMP;
      if (isNewUser) {
        sendVerificationEmail().catch(err => {
          // Errors are already handled by a toast in the context, but we can log here if needed.
          console.error("Initial verification email failed to send:", err);
        });
      }
    }
  }, [user, sendVerificationEmail]); // Dependency array ensures this runs only when the user object changes

  const handleResendEmail = async () => {
    setIsSending(true);
    try {
      await sendVerificationEmail();
      // Success toast is handled within the context function
    } catch (error) {
      // Error is also handled within the context function
    } finally {
      setIsSending(false);
    }
  };

  // While auth state is loading, don't show anything to prevent flashes of content
  if (!isReady) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  // If user is not logged in, just show the app content (which will trigger a redirect to signin)
  if (!user) {
    return <>{children}</>;
  }

  // Check if the user's account was created before our cut-off date
  const creationTime = user.metadata?.creationTime ? new Date(user.metadata.creationTime).getTime() : 0;
  const isExistingUser = creationTime < GRANDFATHER_CLAUSE_TIMESTAMP;

  // If the user's email is verified OR if they are an existing "grandfathered" user, show the app
  if (user.emailVerified || isExistingUser) {
    return <>{children}</>;
  }

  // Otherwise, the user is new and unverified, so show the verification prompt
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
