
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add Funds - U-Dry',
  description: 'Add funds to your U-Dry account to rent umbrellas.',
};

// This layout applies to the deposit page and any nested routes if they existed.
// For now, it just passes children through.
export default function DepositLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
