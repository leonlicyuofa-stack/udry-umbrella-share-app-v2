// src/app/(main)/payment/cancel/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CancelPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the deposit page after a few seconds
    const timer = setTimeout(() => {
      router.replace('/deposit');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-secondary/50">
      <Card className="w-full max-w-md shadow-lg text-center">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 rounded-full p-3 w-fit">
            <XCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="mt-4">Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was not completed. You have not been charged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You will be redirected back to the payment page shortly.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" variant="outline">
            <Link href="/deposit">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back Now
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
