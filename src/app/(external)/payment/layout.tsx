import type React from 'react';

// This layout was moved from /src/app/payment/layout.tsx
// It now correctly inherits from the new (external) layout.
export default function ExternalPaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
