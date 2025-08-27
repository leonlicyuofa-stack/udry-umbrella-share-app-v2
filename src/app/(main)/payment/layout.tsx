import type React from 'react';

// This is the new internal layout for the payment success page.
// It will be wrapped by the (main) layout, providing the app header and auth context.
export default function InternalPaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
