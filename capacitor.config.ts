
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.udry.app',
  appName: 'udry 共享雨傘 ',
  webDir: '.next', // Use .next to align with Capacitor's expectation for synced dev assets
  // The server block is removed to prevent loading from a live URL in development.
  // This forces the app to use the local files in the webDir.
  
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
