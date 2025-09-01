
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';

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

// Store services in a memoized object to avoid re-initialization.
let services: FirebaseServices | null = null;

/**
 * Initializes Firebase services using a standard pattern that prevents re-initialization.
 * @returns An object containing the initialized Firebase services, or null if config is missing.
 */
export function initializeFirebaseServices(): FirebaseServices | null {
  if (services) {
    return services;
  }

  if (!isFirebaseConfigValid(firebaseConfig)) {
      console.error("Firebase configuration is missing or invalid. Please check your environment variables.");
      return null;
  }

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const functions = getFunctions(app);

    services = { app, auth, db, functions };
    return services;
  } catch (error) {
    console.error("Error during Firebase service initialization:", error);
    return null;
  }
}
