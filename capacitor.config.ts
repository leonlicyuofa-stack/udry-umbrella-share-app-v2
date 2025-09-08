
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.udry.app',
  appName: 'udry 共享雨傘 ',
  webDir: 'out',
  // This is the main server configuration for production (iOS and final Android)
  server: {
    // CORRECTED: Pointing to the actual Firebase Hosting URL
    hostname: 'udry-app-dev.web.app',
    androidScheme: 'https',
    allowNavigation: [
      // Keep existing allowNavigation rules
      "udry-app-dev.web.app",
      "udry-app-dev.firebaseapp.com",
      "identitytoolkit.googleapis.com",
    ]
  },
  // This setting is crucial for iOS to allow the webview to use the safe area.
  ios: {
    contentInset: 'always'
  },
  plugins: {
    App: {
      ios: {
        urlScheme: 'udry'
      }
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'light'
    }
  }
};

export default config;
