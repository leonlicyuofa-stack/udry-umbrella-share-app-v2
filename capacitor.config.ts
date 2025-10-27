
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.udry.app',
  appName: 'udry 共享雨傘 ',
  webDir: 'out',
  server: {
    // By setting a hostname, Capacitor knows to treat the url as the main entry point,
    // but it will still load assets relative to the local file system.
    hostname: 'udry.app',
    // TEMPORARY DIAGNOSTIC OVERRIDE:
    // This forces the app to load the diagnostic page.
    url: 'file:///android_asset/public/diag/index.html',
  },
  android: {
    // Android-specific settings can go here if needed.
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
