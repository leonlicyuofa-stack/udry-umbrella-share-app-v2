
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Balance - U-Dry',
  description: 'View your account balance and transaction history for U-Dry.',
};

export default function AccountBalanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
