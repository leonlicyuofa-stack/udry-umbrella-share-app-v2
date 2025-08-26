
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

// --- START: COMPREHENSIVE DIAGNOSTIC TEST ---
// This block runs immediately when the file is imported on the client-side.
// It is independent of React hooks and will log directly to the browser console.
(function runDiagnostics() {
    // This function will be called on the client side when the app starts
    // and will log diagnostics to the browser console.
    if (typeof window === 'undefined') return; // Don't run on the server

    setTimeout(() => {
        const styleSuccess = "color: green; font-weight: bold;";
        const styleFailure = "color: red; font-weight: bold;";
        const styleInfo = "color: blue; font-weight: bold;";

        console.log(`%c--- STARTING FIREBASE CLIENT DIAGNOSTICS ---`, styleInfo);

        // Test 1: Check for Environment Variables
        const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.apiKey !== "YOUR_KEY_HERE";
        if (isFirebaseConfigured) {
            console.log("%c[DIAGNOSTIC] PASSED: Firebase config variables are present.", styleSuccess);
        } else {
            console.error("%c[DIAGNOSTIC] FAILED: Firebase config is not fully set in environment variables (check .env file).", styleFailure);
            console.log('Current Config:', firebaseConfig);
            return; // Stop if config is missing
        }

        // Test 2: Attempt to Initialize Firebase App
        let app;
        try {
            app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
            if (!app) throw new Error("initializeApp() did not return a valid app object.");
            console.log(`%c[DIAGNOSTIC] PASSED: Firebase App initialized successfully for project: ${app.options.projectId}`, styleSuccess);
        } catch (error: any) {
            console.error("%c[DIAGNOSTIC] FAILED: Firebase App initialization failed.", styleFailure, error.message);
            return; // Stop if app fails to initialize
        }

        // Test 3: Attempt to get individual services
        try {
            const auth = getAuth(app);
            const db = getFirestore(app);
            const functions = getFunctions(app);
            if (!auth || !db || !functions) throw new Error("One or more services (Auth, Firestore, Functions) returned null or undefined.");
            console.log("%c[DIAGNOSTIC] PASSED: Successfully got references to Auth, Firestore, and Functions services.", styleSuccess);
        } catch (error: any) {
            console.error("%c[DIAGNOSTIC] FAILED: Could not get individual Firebase services.", styleFailure, error.message);
            return;
        }
        
        console.log(`%c--- FIREBASE CLIENT DIAGNOSTICS COMPLETE ---`, styleInfo);
    }, 0);
})();
// --- END: COMPREHENSIVE DIAGNOSTIC TEST ---


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
    // The diagnostic test above will have already logged a detailed error.
    return null;
  }

  try {
    // Get the existing app instance or initialize a new one.
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    
    const db = getFirestore(app);
    // This is the crucial change for Capacitor/native environments
    const auth = initializeAuth(app, {
      persistence: indexedDBLocalPersistence
    });
    const functions = getFunctions(app);

    // Cache the services for subsequent calls.
    services = { app, auth, db, functions };
    return services;
  } catch (error) {
    // The diagnostic test above will have already logged a detailed error.
    return null;
  }
}
