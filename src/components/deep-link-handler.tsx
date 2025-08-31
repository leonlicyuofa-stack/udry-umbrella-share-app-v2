
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
        // Example URL: udry://payment/success?session_id=cs_test_...
        const url = new URL(event.url);
        
        // This handles cases like udry://home or udry://payment/success
        // It combines the hostname and the pathname correctly.
        // e.g., udry://payment/success -> hostname: 'payment', pathname: '/success' -> /payment/success
        const pathWithSearch = `${url.pathname}${url.search}`;
        const finalPath = `/${url.hostname}${pathWithSearch}`;
        
        console.log(`Deep link received: ${event.url}. Navigating to internal path: ${finalPath}`);
        router.push(finalPath);
      });
    };

    setupListener();

    return () => {
      handle?.remove();
    };
  }, [router]);

  return null; // This component does not render anything
};
