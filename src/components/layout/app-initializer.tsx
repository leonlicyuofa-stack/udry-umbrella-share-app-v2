// src/components/layout/app-initializer.tsx
"use client";

import { usePathname } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from '@/contexts/auth-context';
import type React from 'react';

// This is the new Diagnostic Root Page Component, moved from layout.tsx
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

// This component wraps the main application logic and contains the "use client" directive.
export function AppInitializer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If we are on the root path, show the diagnostic UI.
  // The DiagnosticRootPage has its own AuthProvider with a real logger.
  if (pathname === '/') {
    return <DiagnosticRootPage />;
  }

  // Otherwise, render the normal app structure passed in from the layout.
  // This will use the AuthProvider from the layout with the no-op logger.
  return <>{children}</>;
}
