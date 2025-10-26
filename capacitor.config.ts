
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.udry.app',
  appName: 'udry 共享雨傘 ',
  webDir: 'out',
  // TEMPORARY DIAGNOSTIC CONFIG: This forces the app to load the diagnostic page.
  // We will remove this after debugging.
  server: {
    url: 'file:///android_asset/public/diag.html',
    cleartext: true,
  },
  android: {
    // Explicitly setting webDir here is not valid and was causing build issues.
    // The top-level webDir is sufficient.
  },
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
