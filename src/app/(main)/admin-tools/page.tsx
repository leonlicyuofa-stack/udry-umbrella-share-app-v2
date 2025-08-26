// src/app/(main)/admin-tools/page.tsx
"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { httpsCallable } from 'firebase/functions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminToolsPage() {
  const { user, firebaseServices } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleMakeAdmin = async () => {
    if (!firebaseServices?.functions || !user?.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'Services not available or user not signed in.' });
      return;
    }
    setIsLoading(true);
    try {
      const setAdminClaimFunction = httpsCallable(firebaseServices.functions, 'setAdminClaim');
      const result = await setAdminClaimFunction({ email: user.email });
      const data = result.data as { success?: boolean; message?: string };

      if (data.success) {
        toast({ title: 'Success', description: data.message });
      } else {
        throw new Error(data.message || 'An unknown error occurred.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Operation Failed', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center">
            <ShieldCheck className="mr-3 h-8 w-8" />
            Admin Tools
          </CardTitle>
          <CardDescription>
            One-time setup actions for administrators.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important: One-Time Setup</AlertTitle>
            <AlertDescription>
              To grant yourself full admin permissions, click the button below. This will set a special 'isAdmin' flag on your user account ({user?.email}). This is a necessary first-time setup step.
            </AlertDescription>
          </Alert>
          <p>
            After clicking, you may need to sign out and sign back in for the new permissions to take full effect.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleMakeAdmin} disabled={isLoading || user?.email !== 'admin@u-dry.com'}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Make Me Admin
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
