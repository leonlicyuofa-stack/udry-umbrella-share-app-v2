
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
        // Example URL: udry://rent/CMYS234400696
        const urlString = event.url;
        console.log(`Deep link received: ${urlString}`);

        try {
          // Replace the custom scheme with a dummy https protocol to allow standard URL parsing.
          // This is a robust way to handle custom schemes.
          const parsableUrl = new URL(urlString.replace(/^udry:\/\//, 'https:\/\/udry.app/'));

          // The pathname will be, e.g., /rent/CMYS234400696
          const finalPath = parsableUrl.pathname;
          
          console.log(`Navigating to internal path: ${finalPath}`);
          router.push(finalPath);
        } catch (error) {
          console.error("Failed to parse deep link URL:", error);
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
