
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.udry.app',
  appName: 'udry 共享雨傘 ',
  webDir: 'out',
  android: {
    allowMixedContent: true,
  },
  ios: {
    // Add this block to whitelist the Firebase Auth domain for network requests.
    // This directly configures the native iOS project's Info.plist.
    appendUserAgent: "Firebase/Auth",
    contentInset: "always",
    cordova: {
      preferences: {
        "AllowUntrustedCerts": "true"
      }
    },
    // This is the key change to fix the sign-in issue.
    // It tells iOS it's okay for the app to talk to Google's identity service.
    server: {
      allowNavigation: [
        "identitytoolkit.googleapis.com"
      ]
    }
  },
};

export default config;
