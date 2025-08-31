
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';

// This configuration is now hardcoded to ensure it works reliably in all environments.
// These are public keys and are safe to be included here. Security is enforced by Firestore rules.
export const firebaseConfig = {
  apiKey: "AIzaSyDk8gmZb-azt0fndBG80zrYXEma7NsUdL0",
  authDomain: "udry-app-dev.firebaseapp.com",
  projectId: "udry-app-dev",
  storageBucket: "udry-app-dev.appspot.com",
  messagingSenderId: "458603936715",
  appId: "1:458603936715:web:8c50687fc1cdcf9c90944e",
  measurementId: "G-X1VP807J0N"
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

  try {
    // Get the existing app instance or initialize a new one.
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    
    const db = getFirestore(app);
    
    // For Capacitor, we use indexedDBLocalPersistence. 
    // This is the most robust option for native apps and helps prevent
    // race conditions during re-authentication on custom protocols like capacitor://
    const auth = initializeAuth(app, {
      persistence: indexedDBLocalPersistence,
    });
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
