
import type { Metadata } from 'next';
import '@/app/globals.css';
import { Providers } from './providers';

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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="U-Dry" />
        <meta name="theme-color" content="#3F51B5" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
