
import type { Metadata } from 'next';
import { useLanguage } from '@/contexts/language-context'; // Import useLanguage

// Note: Cannot use useLanguage directly here for metadata as it's a server component context
// We'll set generic titles and allow the page to set more specific ones if needed.

export const metadata: Metadata = {
  title: 'Profile Settings - U-Dry', // Generic title
  description: 'Manage your U-Dry account settings.', // Generic description
};

export default function AccountSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
