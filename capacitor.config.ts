
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.udry.app',
  appName: 'udry 共享雨傘 ',
  webDir: 'out',
  server: {
    hostname: 'udry.app',
    allowNavigation: [
      "udry.app",
      "identitytoolkit.googleapis.com",
      "udry-app-dev.web.app",
      "udry-app-dev.firebaseapp.com"
    ]
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
