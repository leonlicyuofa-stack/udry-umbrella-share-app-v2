import type { Metadata, Viewport } from 'next';
import { AppInitializer } from '@/components/layout/app-initializer';
import '@/app/globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/language-context';
import { AuthProvider } from '@/contexts/auth-context';
import { DeepLinkHandler } from '@/components/deep-link-handler';
import { SignUpSuccessDialog } from '@/components/auth/sign-up-success-dialog';

// This is now a Server Component, so metadata can be exported.
export const metadata: Metadata = {
  title: 'U-Dry - Smart Umbrella Sharing',
  description: 'Rent and return umbrellas easily with U-Dry. Find nearby smart umbrella stations.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'U-Dry',
  },
};

export const viewport: Viewport = {
  themeColor: '#3F51B5',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <LanguageProvider>
          {/* AppInitializer now contains the "use client" logic and diagnostic view */}
          <AppInitializer>
            {children}
          </AppInitializer>
        </LanguageProvider>
      </body>
    </html>
  );
}
