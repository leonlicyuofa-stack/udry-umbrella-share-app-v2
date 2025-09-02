
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.udry.app',
  appName: 'udry 共享雨傘 ',
  webDir: 'out',
  // This is the main server configuration for production (iOS and final Android)
  server: {
    hostname: 'udry.app',
    androidScheme: 'https',
    allowNavigation: [
      "udry.app",
      "identitytoolkit.googleapis.com",
      "udry-app-dev.web.app",
      "udry-app-dev.firebaseapp.com"
    ]
  },
  // This setting is crucial for iOS to allow the webview to use the safe area.
  ios: {
    contentInset: 'always'
  },
  // This block contains Android-specific overrides for debugging.
  android: {
    // This server block will override the top-level one ONLY for Android.
    server: {
      // The debugging URL forces the app to load local assets.
      url: 'http://localhost',
      // This allows the app to load from an unencrypted http:// address.
      cleartext: true
    }
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
