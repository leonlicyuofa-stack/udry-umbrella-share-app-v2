
"use client";

import { useEffect } from 'react';
import { App, type PluginListenerHandle } from '@capacitor/app';
import { useRouter } from 'next/navigation';

export const DeepLinkHandler = () => {
  const router = useRouter();

  useEffect(() => {
    let handle: PluginListenerHandle | undefined;

    const setupListener = async () => {
      handle = await App.addListener('appUrlOpen', (event) => {
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
    };

    setupListener();

    return () => {
      handle?.remove();
    };
  }, [router]);

  return null; // This component does not render anything
};
