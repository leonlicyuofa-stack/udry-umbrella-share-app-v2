// src/contexts/stalls-context.tsx
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { initializeFirebaseServices } from '@/lib/firebase';
import type { Stall } from "@/lib/types";

interface StallsContextType {
  stalls: Stall[];
  isLoadingStalls: boolean;
}

const StallsContext = createContext<StallsContextType | undefined>(undefined);

export function StallsProvider({ children }: { children: ReactNode }) {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [isLoadingStalls, setIsLoadingStalls] = useState(true);
  const services = initializeFirebaseServices();

  useEffect(() => {
    if (!services?.db) {
      setIsLoadingStalls(false);
      return;
    }

    let unsubscribe: Unsubscribe | null = null;

    // Small delay to allow Firebase Auth to restore session before subscribing.
    // Without this, Stripe redirects can cause a permission error because the Firestore
    // subscription fires before the auth token is available, showing a false error toast.
    const subscriptionTimer = setTimeout(() => {
      const stallsCollectionRef = collection(services.db, 'stalls');
      unsubscribe = onSnapshot(stallsCollectionRef, (snapshot) => {
        const stallsData = snapshot.docs.map(doc => ({ ...doc.data(), dvid: doc.id, id: doc.id } as Stall));
        setStalls(stallsData);
        setIsLoadingStalls(false);
      }, (_error) => {
        // Silently handle — this fires as a false alarm during Stripe redirects
        // before Auth has restored the session. No user-facing toast needed.
        // The console.error was removed to prevent the dev overlay from popping up.
        setIsLoadingStalls(false);
      });
    }, 600);

    return () => {
      clearTimeout(subscriptionTimer);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [services]);

  const value = { stalls, isLoadingStalls };

  return (
    <StallsContext.Provider value={value}>
      {children}
    </StallsContext.Provider>
  );
}

export function useStalls() {
  const context = useContext(StallsContext);
  if (context === undefined) {
    throw new Error('useStalls must be used within a StallsProvider');
  }
  return context;
}
