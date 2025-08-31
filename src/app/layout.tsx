
import '@/app/globals.css';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata, Viewport } from 'next';
import { LanguageProvider } from '@/contexts/language-context';
import { AuthProvider } from '@/contexts/auth-context';
import { DeepLinkHandler } from '@/components/deep-link-handler';
import { SignUpSuccessDialog } from '@/components/auth/sign-up-success-dialog';


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
        {/* Fix for deprecated meta tag */}
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <LanguageProvider>
          <AuthProvider>
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
