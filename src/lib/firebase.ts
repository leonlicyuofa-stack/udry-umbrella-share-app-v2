
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';

// Build the config object from environment variables
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
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

let services: FirebaseServices | null = null;

/**
 * Initializes Firebase services using a singleton pattern. This function can be safely
 * called multiple times, but will only initialize Firebase once.
 * @returns An object containing the initialized Firebase services, or null if config is missing.
 */
export function initializeFirebaseServices(): FirebaseServices | null {
  // If services have already been initialized, return them.
  if (services) {
    return services;
  }
  
  // Validate the config before attempting to initialize
  if (!isFirebaseConfigValid(firebaseConfig)) {
      console.error("Firebase configuration is missing or invalid. Please check your environment variables.");
      return null;
  }


  try {
    // Get the existing app instance or initialize a new one.
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    
    const db = getFirestore(app);
    const auth = getAuth(app);
    const functions = getFunctions(app);

    console.log("Connecting to LIVE Production Firebase services.");

    // Cache the services for subsequent calls.
    services = { app, auth, db, functions };
    return services;
  } catch (error) {
    console.error("Error during Firebase service initialization:", error);
    return null;
  }
}
