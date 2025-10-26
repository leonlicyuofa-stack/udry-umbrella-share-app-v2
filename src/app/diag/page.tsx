
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home } from 'lucide-react';
import Link from 'next/link';

export default function SimpleDiagPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/30 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-green-600 flex items-center">
            <CheckCircle className="mr-3 h-6 w-6" />
            Diagnostic Page Loaded Successfully!
          </CardTitle>
          <CardDescription>
            This confirms that the native Android app can load and render web content from the local file system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The original "white screen" issue was caused by the app trying to load from <code className="font-mono bg-muted p-1 rounded-sm">localhost</code>. The issue we just saw was the diagnostic page itself crashing because it tried to use native features like Bluetooth before they were ready.</p>
          <p className="mt-4 font-semibold">This simple page proves the core problem is solved. The next step is to revert our temporary changes and fix the application startup logic.</p>
        </CardContent>
        <CardFooter>
            <Link href="/home" passHref>
                <Button variant="outline">
                    Attempt to Go to Homepage (May not work)
                </Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
