
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.udry.app',
  appName: 'udry 共享雨傘 ',
  webDir: 'out',
  server: {
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    fitWindows: true
  },
  ios: {
    contentInset: 'always'
  },
  plugins: {
    App: {},
    StatusBar: {
      overlaysWebView: true,
      style: 'light'
    }
  }
};

export default config;
