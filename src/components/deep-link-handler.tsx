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
        
        // We want to navigate to the in-app path: /payment/success?session_id=...
        const pathWithSearch = `${url.pathname}${url.search}`;

        // The hostname from udry://hostname/ is the first part of our path
        // e.g. udry://payment/success -> pathname is /success, hostname is 'payment'
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
