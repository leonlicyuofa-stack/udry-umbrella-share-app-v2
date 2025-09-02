
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.udry.app',
  appName: 'udry 共享雨傘 ',
  webDir: 'out',
  server: {
    // This is the production server configuration.
    // It will be used by iOS and as a base for Android.
    hostname: 'udry.app',
    allowNavigation: [
      "udry.app",
      "identitytoolkit.googleapis.com",
      "udry-app-dev.web.app",
      "udry-app-dev.firebaseapp.com"
    ]
  },
  android: {
    // This block contains Android-specific overrides.
    // It will be merged with the base configuration only for Android builds.
    server: {
      // The debugging URL forces the app to load local assets.
      url: 'http://localhost',
      // This allows the app to load from an unencrypted http:// address.
      cleartext: true,
      // This configures Android App Links.
      androidScheme: 'https'
    }
  },
  // This new setting is crucial for iOS to allow the webview to use the safe area.
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
