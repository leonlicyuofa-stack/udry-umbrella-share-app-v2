// src/app/page.tsx
"use client";

import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// This component is now a diagnostic dashboard to track the app's startup process.
export default function RootPage() {
  const { diagnosticLog } = useAuth(); // Get the diagnostic log from the AuthContext

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-center">
            <Loader2 className="mr-3 h-6 w-6 animate-spin text-primary" />
            Initializing Session...
          </CardTitle>
          <CardDescription>
            The application is starting. Please wait.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-semibold mb-2">Startup Progress:</p>
          <ScrollArea className="h-48 w-full rounded-md border bg-muted p-2">
            <div className="p-2">
              {diagnosticLog.length === 0 ? (
                <p className="text-xs text-muted-foreground">Waiting for logs...</p>
              ) : (
                <ul className="space-y-1.5">
                  {diagnosticLog.map((log, index) => (
                    <li key={index} className="text-xs font-mono text-foreground">
                      <span className="text-primary mr-2">{`[${index + 1}]`}</span>{log}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
