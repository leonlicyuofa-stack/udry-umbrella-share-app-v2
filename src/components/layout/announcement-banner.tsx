"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AnnouncementBanner() {
  const { firebaseServices } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!firebaseServices?.db) {
      return;
    }

    const settingsDocRef = doc(firebaseServices.db, 'settings', 'global');
    
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const newMessage = data.announcementMessage || null;
        setMessage(newMessage);
      } else {
        setMessage(null);
      }
    }, (error) => {
      console.error("Error fetching announcement message:", error);
      setMessage(null);
    });

    return () => unsubscribe();
  }, [firebaseServices]);

  // Effect to control visibility with a smooth transition
  useEffect(() => {
    if (message && message.trim() !== '') {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [message]);

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-in-out overflow-hidden',
        isVisible ? 'max-h-40' : 'max-h-0'
      )}
    >
      {message && (
        <div className="bg-primary/10 text-primary-foreground p-3">
          <div className="container mx-auto flex items-center justify-center text-center text-sm">
            <Megaphone className="h-5 w-5 mr-3 flex-shrink-0 text-primary" />
            <p className="text-primary font-medium">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
