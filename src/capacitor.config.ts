
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
    // This is the crucial line that enables advanced Web APIs like Bluetooth on iOS.
    // It tells the WebView to treat the app's content as a secure, custom protocol.
    iosScheme: 'udry', 
    allowNavigation: [
      "identitytoolkit.googleapis.com",
      "*.stripe.com"
    ]
  },
  plugins: {
    App: {
      iosScheme: "udry",
      androidScheme: "udry"
    }
  }
};

export default config;
