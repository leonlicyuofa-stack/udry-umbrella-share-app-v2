
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { Capacitor } from '@capacitor/core';

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

  const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.apiKey !== "YOUR_KEY_HERE";

  if (!isFirebaseConfigured) {
    console.error("Firebase config is not fully set. Check the firebaseConfig object in firebase.ts");
    return null;
  }

  try {
    // Get the existing app instance or initialize a new one.
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    
    const db = getFirestore(app);
    // This is the crucial change for Capacitor/native environments
    // By explicitly passing the Capacitor platform, we ensure Firebase
    // uses the most robust persistence mechanism for native apps.
    const auth = initializeAuth(app, {
      persistence: indexedDBLocalPersistence,
      platform: Capacitor, // Explicitly provide the Capacitor platform
    });
    const functions = getFunctions(app);

    // Cache the services for subsequent calls.
    services = { app, auth, db, functions };
    return services;
  } catch (error) {
    console.error("Error during Firebase service initialization:", error);
    return null;
  }
}
