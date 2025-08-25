
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel - U-Dry',
  description: 'Manage U-Dry stalls and operations.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout will be nested within the RootLayout and MainAppChrome
  // It can be used for admin-specific headers/sidebars if needed later.
  // For now, it just passes children through.
  return <>{children}</>;
}
