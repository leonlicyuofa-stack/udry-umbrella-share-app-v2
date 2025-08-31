
// src/contexts/stalls-context.tsx
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { initializeFirebaseServices } from '@/lib/firebase';
import type { Stall } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';

interface StallsContextType {
  stalls: Stall[];
  isLoadingStalls: boolean;
}

const StallsContext = createContext<StallsContextType | undefined>(undefined);

export function StallsProvider({ children }: { children: ReactNode }) {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [isLoadingStalls, setIsLoadingStalls] = useState(true);
  const { toast } = useToast();
  const services = initializeFirebaseServices();

  useEffect(() => {
    if (!services?.db) {
      setIsLoadingStalls(false);
      // Don't toast here, as AuthProvider will handle the main Firebase connection error.
      return;
    }

    const stallsCollectionRef = collection(services.db, 'stalls');
    const unsubscribeStalls = onSnapshot(stallsCollectionRef, (snapshot) => {
      const stallsData = snapshot.docs.map(doc => ({ ...doc.data(), dvid: doc.id, id: doc.id } as Stall));
      setStalls(stallsData);
      setIsLoadingStalls(false);
    }, (error) => {
      console.error("Error fetching stalls:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load stall locations.' });
      setIsLoadingStalls(false);
    });

    return () => unsubscribeStalls();
  }, [services, toast]);

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
