
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator, browserLocalPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, type Functions, connectFunctionsEmulator } from 'firebase/functions';

// Build the config object from environment variables
export const firebaseConfig = {
  apiKey: "AIzaSyDk8gmZb-azt0fndBG80zrYXEma7NsUdL0",
  authDomain: "udry-app-dev.firebaseapp.com",
  projectId: "udry-app-dev",
  storageBucket: "udry-app-dev.appspot.com",
  messagingSenderId: "458603936715",
  appId: "1:458603936715:web:8c50687fc1cdcf9c90944e",
  measurementId: "G-X1VP807J0N"
};

// Function to check if the config is valid
const isFirebaseConfigValid = (config: typeof firebaseConfig): boolean => {
    return Object.values(config).every(value => value && !value.includes('YOUR_'));
};


export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  functions: Functions;
}

/**
 * Initializes Firebase services using a standard pattern that prevents re-initialization.
 * @returns An object containing the initialized Firebase services, or null if config is missing.
 */
export function initializeFirebaseServices(): FirebaseServices | null {
  if (!isFirebaseConfigValid(firebaseConfig)) {
      console.error("[U-Dry Diag] Firebase configuration is missing or invalid. Please check your environment variables.");
      return null;
  }

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    // Use initializeAuth with browserLocalPersistence for Capacitor compatibility
    const auth = initializeAuth(app, { persistence: browserLocalPersistence });
    const db = getFirestore(app);
    const functions = getFunctions(app);
    return { app, auth, db, functions };
  } catch (error: any) {
    console.error(`[U-Dry Diag] CRITICAL ERROR during Firebase service initialization: ${error.message}`, error);
    return null;
  }
}
