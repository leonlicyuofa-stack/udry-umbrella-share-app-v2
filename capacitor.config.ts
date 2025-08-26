import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.udry.app',
  appName: 'udry 共享雨傘 ',
  webDir: 'out',
  server: {
    hostname: 'udry-app-dev.firebaseapp.com',
    allowNavigation: [
      "udry-app-dev.firebaseapp.com",
      "identitytoolkit.googleapis.com"
    ],
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
