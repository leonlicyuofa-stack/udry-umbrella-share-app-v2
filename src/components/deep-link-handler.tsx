
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
        // The goal is to navigate to the in-app page /payment/success
        const url = new URL(event.url);
        
        // The full path including search parameters
        const pathWithSearch = `${url.pathname}${url.search}`;

        if (pathWithSearch) {
          // The hostname from udry://hostname/ is the first part of our path
          const finalPath = `/${url.hostname}${pathWithSearch}`;
          router.push(finalPath);
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
