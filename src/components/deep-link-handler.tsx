
"use client";

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { useRouter } from 'next/navigation';

export const DeepLinkHandler = () => {
  const router = useRouter();

  useEffect(() => {
    let handle: PluginListenerHandle | undefined;

    const setupListener = async () => {
      handle = await App.addListener('appUrlOpen', (event) => {
        // Example URL: udry://payment/success?session_id=...
        // Example URL: udry://diag
        const url = new URL(event.url);
        
        // We are interested in the part after the `udry:` scheme.
        // The `hostname` gives the first part (e.g., 'payment' or 'diag')
        // The `pathname` gives the rest (e.g., '/success')
        // The search params gives the query string (e.g., '?session_id=...')
        const path = `${url.hostname}${url.pathname}${url.search}`;

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
