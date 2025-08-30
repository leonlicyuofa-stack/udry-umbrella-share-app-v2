
import '@/app/globals.css';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata, Viewport } from 'next';
import { LanguageProvider } from '@/contexts/language-context';

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <div className="flex min-h-screen flex-col">
            {children}
          </div>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
