// src/app/(external)/payment/finalize/client-redirect.tsx
"use client";

import { useEffect } from 'react';

// This is a Client Component responsible only for the redirect.
export function ClientRedirect() {
  useEffect(() => {
    // This logic runs only on the client-side after the server has processed the payment.
    if (navigator.userAgent && !/android/i.test(navigator.userAgent)) {
      // This code will ONLY run for non-Android devices (like iOS).
      // It uses the custom URL scheme to deep link back into the app.
      window.location.href = `udry://account/balance`;
    }
    // For Android, we do nothing. The Android OS's App Links feature
    // will have already intercepted the https://.../payment/finalize URL
    // and opened it in the app, so no client-side redirect is needed.
  }, []);

  // This component renders nothing visible.
  return null;
}
