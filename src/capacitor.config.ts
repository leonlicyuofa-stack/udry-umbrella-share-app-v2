
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.udry.app',
  appName: 'udry 共享雨傘 ',
  webDir: 'out',
  android: {
    allowMixedContent: true,
  },
  ios: {
    appendUserAgent: "Firebase/Auth",
    contentInset: "always",
  },
  server: {
    allowNavigation: [
      "identitytoolkit.googleapis.com",
      "*.stripe.com",
      "udry-app-dev.web.app"
    ]
  },
  plugins: {
    "Capacitor-App": {
      iosScheme: "udry",
      androidScheme: "udry"
    }
  }
};

export default config;

