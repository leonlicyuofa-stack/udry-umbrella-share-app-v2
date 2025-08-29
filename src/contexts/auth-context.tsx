
"use client";

import type React from 'react';
import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithRedirect,
  OAuthProvider,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, onSnapshot, updateDoc as firestoreUpdateDoc, query, writeBatch, type Firestore, addDoc, GeoPoint, arrayUnion, orderBy, limit, getDocs, increment } from 'firebase/firestore';
import { initializeFirebaseServices, type FirebaseServices } from '@/lib/firebase';
import type { SignUpFormData, SignInFormData, ChangePasswordFormData, User, Stall, ActiveRental, RentalHistory, RentalLog, MachineLog } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  isReady: boolean;
  loading: boolean;
  activeRental: ActiveRental | null;
  isLoadingRental: boolean;
  startRental: (rental: Omit<ActiveRental, 'logs'>) => Promise<void>;
  endRental: (returnedToStallId: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signUpWithEmail: (data: SignUpFormData) => Promise<void>;
  signInWithEmail: (data: SignInFormData) => Promise<void>;
  changeUserPassword: (data: ChangePasswordFormData) => Promise<void>;
  signOut: () => Promise<void>;
  addBalance: (amount: number) => Promise<void>;
  setDeposit: () => Promise<void>;
  useFirstFreeRental: () => Promise<void>;
  showSignUpSuccess: boolean;
  dismissSignUpSuccess: () => void;
  logMachineEvent: (logData: { stallId?: string; type: MachineLog['type']; message: string; }) => Promise<void>;
  firebaseServices: FirebaseServices | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- New Hook specifically for fetching stalls ---
export function useStalls() {
    const [stalls, setStalls] = useState<Stall[]>([]);
    const [isLoadingStalls, setIsLoadingStalls] = useState(true);
    const { toast } = useToast();
    const services = initializeFirebaseServices();

    useEffect(() => {
        if (!services) {
            setIsLoadingStalls(false);
            return;
        }

        const stallsCollectionRef = collection(services.db, 'stalls');
        const unsubscribeStalls = onSnapshot(stallsCollectionRef, (snapshot) => {
            const stallsData = snapshot.docs.map(doc => ({ ...doc.data(), dvid: doc.id, id: doc.id } as Stall));
            setStalls(stallsData);
            setIsLoadingStalls(false);
        }, (error) => {
            console.error("Error fetching stalls:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load stall locations.' });
            setIsLoadingStalls(false);
        });

        return () => unsubscribeStalls();
    }, [services, toast]);

    return { stalls, isLoadingStalls };
}


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
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);
  const [isFirebaseError, setIsFirebaseError] = useState(false);
  const [isJustSignedIn, setIsJustSignedIn] = useState(false);


  useEffect(() => {
    const services = initializeFirebaseServices();
    if (!services) {
      console.error("Auth Context: Firebase services failed to initialize.");
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
  }, [toast]);

  // This new effect handles post-login actions to prevent race conditions.
  useEffect(() => {
    if (isReady && firebaseUser && isJustSignedIn) {
      toast({ title: translate('auth_success_signin_email') });
      router.replace('/home');
      setIsJustSignedIn(false); // Reset the flag
    }
  }, [isReady, firebaseUser, isJustSignedIn, router, toast, translate]);


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

    return () => unsubscribeUserDoc();

  }, [firebaseUser, firebaseServices]);

  if (isFirebaseError) {
    return <FirebaseConfigurationError />;
  }

  const signInWithGoogle = async () => {
    if (!firebaseServices?.auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(firebaseServices.auth, provider);
    } catch (error: any) {
      toast({ variant: 'destructive', title: translate('auth_error_signin_google_failed'), description: error.message });
    }
  };

  const signInWithApple = async () => {
    if (!firebaseServices?.auth) return;
    const provider = new OAuthProvider('apple.com');
    try {
      await signInWithRedirect(firebaseServices.auth, provider);
    } catch (error: any) {
      toast({ variant: 'destructive', title: translate('auth_error_signin_apple_failed'), description: error.message });
    }
  };

  const signUpWithEmail = async ({ name, email, password }: SignUpFormData) => {
    if (!firebaseServices?.auth || !firebaseServices.db) return;
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseServices.auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      toast({ title: translate('auth_success_signup_email') });
    } catch (error: any) {
      toast({ variant: 'destructive', title: translate('auth_error_signup_email_failed'), description: error.message });
      throw error;
    }
  };
  
  const dismissSignUpSuccess = () => setShowSignUpSuccess(false);

  const signInWithEmail = async ({ email, password }: SignInFormData) => {
    if (!firebaseServices?.auth) return;
    try {
      await signInWithEmailAndPassword(firebaseServices.auth, email, password);
      // Set a flag instead of directly calling toast/router
      setIsJustSignedIn(true);
    } catch (error: any) {
      let description = error.message;
      if (error.code === 'auth/invalid-credential') {
        description = translate('auth_error_invalid_credential_desc');
      }
      toast({ variant: 'destructive', title: translate('auth_error_signin_email_failed'), description });
      throw error;
    }
  };

  const signOut = async () => {
    if (!firebaseServices?.auth) return;
    try {
      await firebaseSignOut(firebaseServices.auth);
      router.push('/auth/signin');
      toast({ title: translate('auth_success_signout') });
    } catch (error: any) {
      toast({ variant: 'destructive', title: translate('auth_error_signout_failed'), description: error.message });
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
  
  const useFirstFreeRental = async () => {
      if (!firebaseUser || !firebaseServices?.db) return;
      const userDocRef = doc(firebaseServices.db, 'users', firebaseUser.uid);
      await updateDoc(userDocRef, { hasHadFirstFreeRental: true });
  };
  
  const startRental = async (rental: Omit<ActiveRental, 'logs'>) => {
      if (!firebaseUser || !firebaseServices?.db) return;
      
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
      await batch.commit();
      
      toast({ title: "Rental Started!", description: `You have rented an umbrella from ${rental.stallName}.` });
  };

  const endRental = async (returnedToStallId: string) => {
    console.log("--- [endRental] Function Started ---");
    if (!firebaseUser || !activeRental || !firebaseServices?.db) {
      console.error("[endRental] Pre-condition failed:", { firebaseUser, activeRental, firebaseServices });
      return;
    }
    
    try {
      const userDocRef = doc(firebaseServices.db, 'users', firebaseUser.uid);
      const returnedStallDocRef = doc(firebaseServices.db, 'stalls', returnedToStallId);
      
      const returnedStallSnap = await getDoc(returnedStallDocRef);
      if (!returnedStallSnap.exists()) {
          toast({ variant: "destructive", title: "Return Failed", description: "Could not find the stall to return to." });
          console.error("[endRental] Returned stall document not found:", returnedToStallId);
          return;
      }
      const returnedStall = returnedStallSnap.data() as Stall;
      
      const endTime = Date.now();
      const durationHours = (endTime - activeRental.startTime) / (1000 * 60 * 60);
      
      // Cost calculation logic
      const HOURLY_RATE = 5;
      const DAILY_CAP = 25;
      let calculatedCost = 0;
      if (!activeRental.isFree) {
        if (durationHours > 72) {
          calculatedCost = 100; // Forfeit deposit
        } else {
          const fullDays = Math.floor(durationHours / 24);
          const remainingHours = durationHours % 24;
          calculatedCost = (fullDays * DAILY_CAP) + Math.min(Math.ceil(remainingHours) * HOURLY_RATE, DAILY_CAP);
        }
      }
      const finalCost = Math.min(calculatedCost, 100);

      const newRentalHistoryDocRef = doc(collection(firebaseServices.db, 'rentals'));
      
      const rentalHistory: RentalHistory = {
          rentalId: newRentalHistoryDocRef.id,
          userId: firebaseUser.uid,
          stallId: activeRental.stallId,
          stallName: activeRental.stallName,
          startTime: activeRental.startTime,
          isFree: activeRental.isFree,
          endTime,
          durationHours,
          finalCost,
          returnedToStallId,
          returnedToStallName: returnedStall.name,
          logs: activeRental.logs || [], 
      };

      // --- DIAGNOSTIC LOGGING ---
      console.log("[endRental] Data before commit:", {
        userId: firebaseUser.uid,
        returnedToStallId: returnedToStallId,
        returnedStallName: returnedStall.name,
        durationHours: durationHours,
        finalCost: finalCost,
        isFree: activeRental.isFree,
        rentalHistoryObject: rentalHistory
      });
      
      const batch = writeBatch(firebaseServices.db);
      batch.set(newRentalHistoryDocRef, rentalHistory);
      batch.update(userDocRef, { activeRental: null, balance: increment(-finalCost) }); 
      batch.update(returnedStallDocRef, {
        availableUmbrellas: increment(1),
        nextActionSlot: increment(1)
      });
      
      await batch.commit();
      console.log("--- [endRental] Batch commit successful ---");
    } catch (error) {
      console.error("--- [endRental] CRITICAL ERROR during execution ---", error);
      toast({ variant: "destructive", title: "Return Processing Error", description: "Could not finalize the return. Please contact support." });
    }
  };
  
  const logMachineEvent = async ({ stallId, type, message }: { stallId?: string; type: MachineLog['type']; message: string; }) => {
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
    } else {
        console.log(`[Machine Event Log - No Active Rental] User: ${firebaseUser.uid}, Stall: ${targetStallId}, Type: ${type}, Message: ${message}`);
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
    startRental, endRental, signInWithGoogle, signInWithApple, signUpWithEmail,
    signInWithEmail, signOut, changeUserPassword, addBalance, setDeposit,
    useFirstFreeRental, showSignUpSuccess, dismissSignUpSuccess,
    logMachineEvent,
    firebaseServices,
  };

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
