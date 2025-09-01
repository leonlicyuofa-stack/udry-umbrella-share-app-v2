// src/app/layout.tsx
"use client";

import type { Metadata } from 'next';
import { usePathname } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from '@/contexts/auth-context';
import '@/app/globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/language-context';
import { DeepLinkHandler } from '@/components/deep-link-handler';
import { SignUpSuccessDialog } from '@/components/auth/sign-up-success-dialog';

// This is the new Diagnostic Root Page Component, moved from the deleted app-initializer.tsx
function DiagnosticRootPage() {
  const [logs, setLogs] = useState<string[]>(["Step 0: Diagnostic UI rendered."]);
  
  const addLog = useCallback((message: string) => {
    // This function receives logs from AuthProvider
    setLogs(prevLogs => [...prevLogs, message]);
  }, []);

  return (
    <AuthProvider log={addLog}>
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white p-4">
        <div className="flex flex-col items-center gap-4 w-full max-w-2xl text-center">
          <div className="flex items-center text-xl font-semibold">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400 mr-3" />
            <p className="text-gray-200">Initializing Session...</p>
          </div>
          <p className="text-sm text-gray-400">If the app is stuck here, the last message in the log below indicates the point of failure.</p>
          
          <div className="w-full bg-black rounded-lg border border-gray-700 p-4 mt-4 h-96 overflow-y-auto font-mono text-xs text-left">
            <h2 className="font-bold text-blue-400 mb-2 border-b border-gray-700 pb-1">Startup Progress Log:</h2>
            {logs.map((log, index) => (
              <div key={index} className={`flex items-start whitespace-pre-wrap ${log.includes('CRITICAL') || log.includes('Failure') ? 'text-red-400' : 'text-gray-400'}`}>
                <span className="text-gray-600 mr-2 select-none">{String(index).padStart(2, '0')}.</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}


// This component is now a client component to handle the diagnostic view.
// Metadata can no longer be exported from here.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // If we are on the root path, show the diagnostic UI.
  // This has its own AuthProvider with a real logger.
  if (pathname === '/') {
    return (
       <html lang="en" suppressHydrationWarning>
        <body>
          <LanguageProvider>
             <DiagnosticRootPage />
          </LanguageProvider>
        </body>
      </html>
    )
  }

  // Otherwise, render the normal app structure.
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Metadata can be placed here in a client component */}
        <title>U-Dry - Smart Umbrella Sharing</title>
        <meta name="description" content="Rent and return umbrellas easily with U-Dry. Find nearby smart umbrella stations." />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="U-Dry" />
        <meta name="theme-color" content="#3F51B5" />
      </head>
      <body>
        <LanguageProvider>
           {/* The regular app flow uses an AuthProvider with a no-op logger. */}
            <AuthProvider log={() => { /* No-op for normal operation */ }}>
                <DeepLinkHandler />
                {children}
                <Toaster />
                <SignUpSuccessDialog />
            </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
