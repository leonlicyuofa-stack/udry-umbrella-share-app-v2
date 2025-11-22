
"use client";

import type React from 'react';
import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  type User as FirebaseUser,
  type UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, onSnapshot, updateDoc as firestoreUpdateDoc, query, writeBatch, type Firestore, addDoc, GeoPoint, arrayUnion, orderBy, limit, getDocs, increment } from 'firebase/firestore';
import { initializeFirebaseServices, type FirebaseServices } from '@/lib/firebase';
import type { SignUpFormData, SignInFormData, ChangePasswordFormData, User, Stall, ActiveRental, RentalHistory, RentalLog, MachineLog } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';

interface AuthContextType {
  user: User | null;
  isReady: boolean;
  loading: boolean;
  activeRental: ActiveRental | null;
  isLoadingRental: boolean;
  startRental: (rental: Omit<ActiveRental, 'logs'>) => Promise<void>;
  endRental: (returnedToStallId: string) => Promise<void>;
  signUpWithEmail: (data: SignUpFormData) => Promise<void>;
  signInWithEmail: (data: SignInFormData) => Promise<UserCredential>;
  changeUserPassword: (data: ChangePasswordFormData) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  addBalance: (amount: number) => Promise<void>;
  setDeposit: () => Promise<void>;
  requestDepositRefund: () => Promise<void>;
  useFirstFreeRental: () => Promise<void>;
  showSignUpSuccess: boolean;
  dismissSignUpSuccess: () => void;
  logMachineEvent: (logData: { stallId?: string; type: MachineLog['type']; message: string; }) => Promise<void>;
  firebaseServices: FirebaseServices | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- New Component to show when Firebase fails to initialize ---
function FirebaseConfigurationError() {
  const { translate } = useLanguage();
  return (
    <div className="flex items-center justify-center h-[calc(100vh-10rem)] p-4">
      <Alert variant="destructive" className="max-w-3xl">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Firebase Configuration Error</AlertTitle>
        <AlertDescription>
          <p className="mb-2">The application could not connect to Firebase services. This is usually because the necessary configuration keys are missing or incorrect.</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Action Required:</strong> Please ensure all `NEXT_PUBLIC_FIREBASE_*` variables are correctly set in your environment.</li>
            <li>If the issue persists, ensure all keys are correctly set in your environment.</li>
            <li>You may need to restart the development server or re-deploy for changes to take effect.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { toast } = useToast();
  const { translate } = useLanguage();
  const [showSignUpSuccess, setShowSignUpSuccess] = useState(false);
  const [activeRental, setActiveRental] = useState<ActiveRental | null>(null);
  const [isLoadingRental, setIsLoadingRental] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);
  const [isFirebaseError, setIsFirebaseError] = useState(false);

  useEffect(() => {
    // The 1-second delay for testing the race condition has been removed.
    // The correct initialization method in firebase.ts should solve this permanently.
    const services = initializeFirebaseServices();

    if (!services) {
      setIsFirebaseError(true);
      setIsReady(true);
      setIsLoadingRental(false);
      return;
    }

    setFirebaseServices(services);
    setIsFirebaseError(false);
    
    const unsubscribeAuth = onAuthStateChanged(services.auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setFirestoreUser(null);
        setActiveRental(null);
      }
      setIsReady(true);
    });

    return () => unsubscribeAuth();
  }, []);
  
  // --- REFACTORED REDIRECTION LOGIC ---
  useEffect(() => {
    if (!isReady) {
      return; // Wait until Firebase auth state is confirmed
    }

    const isAuthPage = pathname.startsWith('/auth');
    // Protected pages are anything NOT under /auth, /payment, or /diag
    const isProtectedRoute = !isAuthPage && !pathname.startsWith('/payment') && !pathname.startsWith('/diag');

    if (firebaseUser) {
      // User is LOGGED IN
      if (isAuthPage) {
        // If a logged-in user somehow lands on an auth page (e.g., signin, signup),
        // redirect them to the main app homepage.
        router.replace('/home');
      }
    } else {
      // User is LOGGED OUT
      if (isProtectedRoute) {
        // If a logged-out user tries to access a protected page,
        // redirect them to the sign-in page.
        router.replace('/auth/signin');
      }
    }
  }, [isReady, firebaseUser, pathname, router]);


  useEffect(() => {
    if (!firebaseServices || !firebaseUser) {
      if (!firebaseUser) setIsLoadingRental(false);
      return;
    }

    setIsLoadingRental(true);
    const userDocRef = doc(firebaseServices.db, 'users', firebaseUser.uid);
    const unsubscribeUserDoc = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data() as User;
        setFirestoreUser(userData);
        setActiveRental(userData.activeRental || null);
      } else {
        const newUserDoc: Omit<User, 'uid'> = {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          deposit: 0,
          balance: 0,
          hasHadFirstFreeRental: false,
          createdAt: serverTimestamp(),
          activeRental: null,
          depositPaymentIntentId: null,
        };
        await setDoc(userDocRef, newUserDoc);
        setFirestoreUser({ uid: firebaseUser.uid, ...newUserDoc });
        setActiveRental(null);
        if (!firebaseUser.isAnonymous) {
          setShowSignUpSuccess(true);
        }
      }
      setIsLoadingRental(false);
    });

    return () => {
      unsubscribeUserDoc();
    };

  }, [firebaseUser, firebaseServices]);
  
  if (isFirebaseError) {
    return <FirebaseConfigurationError />;
  }

  const signUpWithEmail = async ({ name, email, password }: SignUpFormData) => {
    if (!firebaseServices?.auth || !firebaseServices.db) return;
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseServices.auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Automatically send the verification email upon successful sign-up
      await sendEmailVerification(userCredential.user);

      toast({ title: translate('auth_success_signup_email') });
    } catch (error: any) {
      toast({ variant: 'destructive', title: translate('auth_error_signup_email_failed'), description: error.message });
      throw error;
    }
  };
  
  const dismissSignUpSuccess = () => setShowSignUpSuccess(false);

  const signInWithEmail = async ({ email, password }: SignInFormData) => {
    if (!firebaseServices?.auth) return Promise.reject(new Error("Auth service not available."));
    return signInWithEmailAndPassword(firebaseServices.auth, email, password);
  };

  const signOut = async () => {
    if (!firebaseServices?.auth) return;
    try {
      await firebaseSignOut(firebaseServices.auth);
      // No need to manage redirect flags, the useEffect will handle it
      toast({ title: translate('auth_success_signout') });
    } catch (error: any) {
      toast({ variant: 'destructive', title: translate('auth_error_signout_failed'), description: error.message });
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!firebaseServices?.auth) {
        toast({ variant: 'destructive', title: 'Error', description: 'Authentication service not available.'});
        throw new Error('Auth service not available.');
    }
    try {
        await sendPasswordResetEmail(firebaseServices.auth, email);
        toast({ title: 'Password Reset Email Sent', description: `If an account exists for ${email}, a password reset link has been sent.`});
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error Sending Reset Email', description: error.message });
        throw error;
    }
  };

  const changeUserPassword = async (data: ChangePasswordFormData) => {
    if (!firebaseUser || !firebaseServices?.auth.currentUser) return;
    if (data.newPassword !== data.confirmNewPassword) {
      toast({ variant: "destructive", title: translate('toast_password_mismatch') });
      throw new Error("Passwords don't match");
    }
    try {
      const credential = EmailAuthProvider.credential(firebaseServices.auth.currentUser.email!, data.currentPassword);
      await reauthenticateWithCredential(firebaseServices.auth.currentUser, credential);
      await updatePassword(firebaseServices.auth.currentUser, data.newPassword);
      toast({ title: translate('toast_password_change_success_title'), description: translate('toast_password_change_success_desc') });
    } catch (error: any) {
      toast({ variant: "destructive", title: translate('toast_password_change_error_title'), description: translate('toast_password_change_error_desc') });
      throw error;
    }
  };
  
  const addBalance = async (amount: number) => {
    if (!firebaseUser || !firebaseServices?.db) return;
    const userDocRef = doc(firebaseServices.db, 'users', firebaseUser.uid);
    await updateDoc(userDocRef, { balance: increment(amount) });
    toast({ title: "Balance Added", description: `HK$${amount.toFixed(2)} was added to your account.` });
  };
  
  const setDeposit = async () => {
    if (!firebaseUser || !firebaseServices?.db) return;
    const userDocRef = doc(firebaseServices.db, 'users', firebaseUser.uid);
    await updateDoc(userDocRef, { deposit: 100 });
    toast({ title: "Deposit Paid", description: "Your HK$100 deposit has been successfully recorded." });
  };

  const requestDepositRefund = async () => {
    if (!firebaseServices?.functions) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot connect to refund service.' });
        throw new Error('Functions service not available');
    }
    try {
        const requestRefundFunction = httpsCallable(firebaseServices.functions, 'requestDepositRefund');
        const result = await requestRefundFunction();
        const data = result.data as { success: boolean, message: string };
        if (data.success) {
            toast({ title: 'Refund Successful', description: data.message });
        } else {
            throw new Error(data.message);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Refund Failed', description: error.message });
        throw error;
    }
  };
  
  const useFirstFreeRental = async () => {
      if (!firebaseUser || !firebaseServices?.db) return;
      const userDocRef = doc(firebaseServices.db, 'users', firebaseUser.uid);
      await updateDoc(userDocRef, { hasHadFirstFreeRental: true });
  };
  
  const startRental = async (rental: Omit<ActiveRental, 'logs'>) => {
      if (!firebaseUser || !firebaseServices?.db) return;
      console.log(`[DIAG_LOG ${new Date().toISOString()}] [AUTH_CONTEXT] startRental: Function called.`);
      
      const userDocRef = doc(firebaseServices.db, 'users', firebaseUser.uid);
      const stallDocRef = doc(firebaseServices.db, 'stalls', rental.stallId);
      
      const stallSnap = await getDoc(stallDocRef);
      if (!stallSnap.exists() || stallSnap.data().availableUmbrellas <= 0) {
          toast({ variant: "destructive", title: "Rental Failed", description: "No umbrellas available at this stall."});
          return;
      }
      
      const newActiveRental: ActiveRental = { ...rental, logs: [] };

      const batch = writeBatch(firebaseServices.db);
      batch.update(userDocRef, { activeRental: newActiveRental });
      batch.update(stallDocRef, {
        availableUmbrellas: increment(-1),
        nextActionSlot: increment(1)
      });

      console.log(`[DIAG_LOG ${new Date().toISOString()}] [AUTH_CONTEXT] startRental: Committing database batch update...`);
      await batch.commit();
      console.log(`[DIAG_LOG ${new Date().toISOString()}] [AUTH_CONTEXT] startRental: Database batch update COMPLETE.`);
      
      toast({ title: "Rental Started!", description: `You have rented an umbrella from ${rental.stallName}.` });
  };

  const endRental = async (returnedToStallId: string) => {
    if (!firebaseUser || !activeRental || !firebaseServices) {
      console.error("[endRental] Pre-condition failed: Missing user, active rental, or Firebase services.");
      return;
    }

    try {
      const endRentalTransaction = httpsCallable(firebaseServices.functions, 'endRentalTransaction');
      const result = await endRentalTransaction({
        returnedToStallId: returnedToStallId,
        activeRentalData: activeRental,
      });
      const data = result.data as { success: boolean; message?: string };

      if (!data.success) {
        throw new Error(data.message || "The server failed to process the return.");
      }
      toast({ title: "Return Successful", description: "Your rental has been completed." });
    } catch (error: any) {
      console.error("--- [endRental] CRITICAL ERROR during Cloud Function call ---", error);
      toast({
        variant: "destructive",
        title: "Return Processing Error",
        description: error.message || "Could not finalize the return. Please contact support."
      });
    }
  };
  
  const logMachineEvent = async ({ stallId, type, message }: { stallId?: string; type: MachineLog['type']; message: string; }) => {
    // DIAGNOSTIC LOG
    console.log(`[DIAG_LOG ${new Date().toISOString()}] [AUTH_CONTEXT] logMachineEvent: Type: ${type}, Message: "${message}"`);
    if (!firebaseUser?.uid || !activeRental || !firebaseServices?.db) {
      if (!firebaseUser?.uid || !firebaseServices?.db) {
        console.warn("Cannot log machine event: no user or no DB service.");
        return;
      }
    }
    const userDocRef = doc(firebaseServices.db, 'users', firebaseUser.uid);
    const newLog: RentalLog = { type, message, timestamp: Date.now() };
    
    const targetStallId = stallId || activeRental?.stallId;
    if (!targetStallId) {
      console.error("LogMachineEvent: stallId is missing and could not be inferred from active rental.");
      return;
    }

    if (activeRental) {
        await updateDoc(userDocRef, { 'activeRental.logs': arrayUnion(newLog) });
    }
  };
  
  const user: User | null = firebaseUser ? {
    ...firebaseUser,
    ...firestoreUser,
    uid: firebaseUser.uid, 
  } : null;

  const value: AuthContextType = {
    user, 
    isReady, 
    loading: !isReady || (!!firebaseUser && !firestoreUser),
    activeRental, 
    isLoadingRental: isLoadingRental || (!!firebaseUser && !firestoreUser),
    startRental, endRental, signUpWithEmail,
    signInWithEmail, signOut, changeUserPassword, sendPasswordReset, addBalance, setDeposit,
    requestDepositRefund,
    useFirstFreeRental, showSignUpSuccess, dismissSignUpSuccess,
    logMachineEvent,
    firebaseServices,
  };

  if (!isReady) {
    // Return a global loading state for the initial app load.
    // This can be a simple spinner or a splash screen component.
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
