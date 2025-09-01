
import type { Metadata } from 'next';
import '@/app/globals.css';
import { LanguageProvider } from '@/contexts/language-context';

// This is a Server Component. It should remain clean and simple.
// AuthProvider and other client-side logic are handled in the (main) layout.
export const metadata: Metadata = {
  title: 'U-Dry - Smart Umbrella Sharing',
  description: 'Rent and return umbrellas easily with U-Dry. Find nearby smart umbrella stations.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="U-Dry" />
        <meta name="theme-color" content="#3F51B5" />
      </head>
      <body>
        <LanguageProvider>
            {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
