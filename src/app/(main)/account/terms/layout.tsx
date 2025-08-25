
import type { Metadata } from 'next';

// Note: Translations cannot be used directly in server component metadata
// We use generic titles here and let the page component handle specifics if needed via client-side rendering.

export const metadata: Metadata = {
  title: 'Terms and Conditions - U-Dry', // Generic fallback
  description: 'Read the Terms and Conditions for using the U-Dry service.', // Generic fallback
};

export default function TermsAndConditionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
