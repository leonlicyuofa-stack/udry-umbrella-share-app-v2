
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Return Umbrella - U-Dry',
  description: 'Scan a QR code to return your rented umbrella.',
};

export default function ReturnUmbrellaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
