"use client";

import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';

export function DebugStatus() {
  const { activeRental, isLoadingRental } = useAuth();

  if (isLoadingRental) {
    return <Badge variant="outline">Loading...</Badge>;
  }

  return (
    <div className="flex items-center gap-2 border border-yellow-400 bg-yellow-50 text-yellow-800 p-1 rounded-md text-xs">
      <strong>Debug:</strong>
      <span>Rental Status:</span>
      {activeRental ? (
        <Badge variant="destructive">ACTIVE</Badge>
      ) : (
        <Badge variant="secondary">INACTIVE</Badge>
      )}
    </div>
  );
}
