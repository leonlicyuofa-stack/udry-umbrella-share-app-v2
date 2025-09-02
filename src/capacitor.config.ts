
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.udry.app',
  appName: 'udry 共享雨傘 ',
  webDir: 'out',
  server: {
    // This new URL property forces the app to load local assets instead of the live site.
    // This is a temporary change for debugging.
    url: 'http://localhost',
    hostname: 'udry.app',
    // This allows the app to load from an unencrypted http:// address on Android.
    cleartext: true,
    // This configures Android App Links.
    androidScheme: 'https',
    allowNavigation: [
      "udry.app",
      "identitytoolkit.googleapis.com",
      "udry-app-dev.web.app",
      "udry-app-dev.firebaseapp.com"
    ]
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
