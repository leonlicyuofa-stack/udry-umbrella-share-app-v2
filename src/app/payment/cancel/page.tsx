
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function PaymentCancelPage() {
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        toast({
            title: "Payment Cancelled",
            description: "Your payment process was cancelled. You have not been charged.",
            variant: "destructive"
        });

        const timer = setTimeout(() => {
            router.replace('/deposit');
        }, 3000);

        return () => clearTimeout(timer);
    }, [router, toast]);

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Card className="w-full max-w-md text-center shadow-xl">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <CardTitle className="mt-4 text-2xl font-bold">Payment Cancelled</CardTitle>
                    <CardDescription>
                        Your payment was cancelled. You have not been charged. Redirecting you back to the deposit page.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline">
                        <Link href="/deposit">
                            Go Back to Deposit <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
