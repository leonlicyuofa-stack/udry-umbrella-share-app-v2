
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

/**
 * Initializes Firebase services using a standard pattern that prevents re-initialization.
 * This function now accepts a logger for debugging the startup process.
 * @returns An object containing the initialized Firebase services, or null if config is missing.
 */
export function initializeFirebaseServices(addDiagnosticLog: (message: string) => void): FirebaseServices | null {
  addDiagnosticLog("1. Entered initializeFirebaseServices function.");

  if (!isFirebaseConfigValid(firebaseConfig)) {
      const errorMessage = "2. Firebase configuration is missing or invalid. Check environment variables.";
      addDiagnosticLog(errorMessage);
      console.error(errorMessage);
      return null;
  }
  addDiagnosticLog("2. Firebase config is valid.");

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    addDiagnosticLog("3. Firebase app object retrieved or initialized.");

    const auth = getAuth(app);
    addDiagnosticLog("4. Got Auth service.");

    const db = getFirestore(app);
    addDiagnosticLog("5. Got Firestore service.");

    const functions = getFunctions(app);
    addDiagnosticLog("6. Got Functions service.");

    return { app, auth, db, functions };
  } catch (error: any) {
    const errorMessage = `CRITICAL ERROR during Firebase service initialization: ${error.message}`;
    addDiagnosticLog(errorMessage);
    console.error(errorMessage, error);
    return null;
  }
}
