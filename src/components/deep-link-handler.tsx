
"use client";

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useRouter } from 'next/navigation';

export const DeepLinkHandler = () => {
  const router = useRouter();

  useEffect(() => {
    // This listener fires when the app is opened from a deep link
    const listener = App.addListener('appUrlOpen', (event) => {
      // Example URL: udry://diag
      const url = new URL(event.url);
      
      // We are interested in the part after the `udry:` scheme.
      // The `hostname` property will give us 'diag'
      const path = url.hostname;

      if (path) {
        // Use the Next.js router to navigate to the correct page
        router.push(`/${path}`);
      }
    });

    return () => {
      listener.remove();
    };
  }, [router]);

  return null; // This component does not render anything
};
