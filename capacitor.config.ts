
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.udry.app',
  appName: 'udry 共享雨傘 ',
  webDir: 'out',
  android: {
    // TEMPORARY DIAGNOSTIC OVERRIDE:
    // This forces the app to load the diagnostic page.
    // We will remove this after debugging.
    launchUrl: 'file:///android_asset/public/diag/index.html',
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
