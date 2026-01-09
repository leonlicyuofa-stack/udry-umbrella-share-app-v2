
// src/contexts/auth-context.tsx
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
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, onSnapshot, updateDoc as firestoreUpdateDoc, query, writeBatch, type Firestore, addDoc, GeoPoint, arrayUnion, orderBy, limit, getDocs, increment } from 'firebase/firestore';
import { initializeFirebaseServices, type FirebaseServices } from '@/lib/firebase';
import type { SignUpFormData, SignInFormData, ChangePasswordFormData, User, Stall, ActiveRental, RentalHistory, RentalLog, MachineLog } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, MailCheck, ShieldAlert, LogOut, ArrowRightCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { httpsCallable } from 'firebase/functions';

// --- IMPORTANT: GRANDFATHER CLAUSE ---
// This date ensures that only users who sign up *after* this feature is deployed
// will be subject to the email verification check. Your existing users will not be affected.
const GRANDFATHER_CLAUSE_TIMESTAMP = 1732492800000; // Corresponds to Nov 25, 2025


interface AuthContextType {
  user: User | null;
  isReady: boolean;
  loading: boolean;
  isVerified: boolean; 
  activeRental: ActiveRental | null;
  isLoadingRental: boolean;
  startRental: (rental: Omit<ActiveRental, 'logs'>) => Promise<void>;
  endRental: (returnedToStallId: string) => Promise<void>;
  signUpWithEmail: (data: SignUpFormData) => Promise<void>;
  signInWithEmail: (data: SignInFormData) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  changeUserPassword: (data: ChangePasswordFormData) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
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

function EmailVerificationPrompt({ onResend, onSignOut, isSending }: { onResend: () => void, onSignOut: () => void, isSending: boolean }) {
  const { user } = useAuth();
  
  return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/30 p-4">
          <Card className="w-full max-w-lg shadow-xl">
              <CardHeader className="text-center">
                  <MailCheck className="mx-auto h-12 w-12 text-primary" />
                  <CardTitle className="mt-4 text-2xl">Please Verify Your Email</CardTitle>
                  <CardDescription>
                      We've sent a verification link to <strong>{user?.email}</strong>. Please check your inbox and spam folder.
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                   <Alert>
                      <ShieldAlert className="h-4 w-4" />
                      <AlertTitle>Why am I seeing this?</AlertTitle>
                      <AlertDescription>
                         To protect your account, email verification is required for all new users before accessing the app.
                      </AlertDescription>
                  </Alert>
                  <p className="text-sm text-center text-muted-foreground">
                      Once your email is verified, click the 'Continue' button below to sign in again with your verified account.
                  </p>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2">
                   <Button onClick={onResend} disabled={isSending} className="w-full sm:w-auto">
                      {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Resend Verification Email
                  </Button>
                  <Button onClick={onSignOut} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
                      <ArrowRightCircle className="mr-2 h-4 w-4" />
                      I've Verified, Continue to Sign-In
                  </Button>
                  <Button variant="outline" onClick={onSignOut} className="w-full sm:w-auto">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                  </Button>
              </CardFooter>
          </Card>
      </div>
  );
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { translate } = useLanguage();
  const [showSignUpSuccess, setShowSignUpSuccess] = useState(false);
  const [activeRental, setActiveRental] = useState<ActiveRental | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);
  const [isFirebaseError, setIsFirebaseError] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  useEffect(() => {
    const services = initializeFirebaseServices();
    if (!services) {
      setIsFirebaseError(true);
      setIsLoading(false);
      return;
    }
    setFirebaseServices(services);
    
    const unsubscribeAuth = onAuthStateChanged(services.auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setFirestoreUser(null);
        setActiveRental(null);
        setIsVerified(false);
        setIsLoading(false); // If no user, we are done loading.
      }
    });

    return () => unsubscribeAuth();
  }, []);
  
  useEffect(() => {
    // This is the key change: only run redirection logic AFTER loading is fully complete.
    if (isLoading) {
      return;
    }

    const isAuthPage = pathname.startsWith('/auth');
    const isProtectedRoute = !isAuthPage && !pathname.startsWith('/payment') && !pathname.startsWith('/diag');
    
    if (firebaseUser) {
      // A user is logged in.
      if (isVerified && isAuthPage) {
        router.replace('/home');
      }
    } else {
      // No user is logged in.
      if (isProtectedRoute) {
        router.replace('/auth/signin');
      }
    }
  }, [isLoading, firebaseUser, isVerified, pathname, router]);


  useEffect(() => {
    if (!firebaseServices || !firebaseUser) {
      return;
    }
    
    setIsLoading(true); 

    const userDocRef = doc(firebaseServices.db, 'users', firebaseUser.uid);
    const unsubscribeUserDoc = onSnapshot(userDocRef, async (docSnap) => {
      let userData: User | null = null;
      if (docSnap.exists()) {
        userData = docSnap.data() as User;
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
          isManuallyVerified: false,
        };
        await setDoc(userDocRef, newUserDoc);
        userData = { uid: firebaseUser.uid, ...newUserDoc };
        setFirestoreUser(userData);
        setActiveRental(null);
        if (!firebaseUser.isAnonymous) {
          setShowSignUpSuccess(true);
        }
      }

      const creationTime = firebaseUser.metadata?.creationTime ? new Date(firebaseUser.metadata.creationTime).getTime() : 0;
      const isExistingUser = creationTime < GRANDFATHER_CLAUSE_TIMESTAMP;
      const isSuperAdmin = firebaseUser.email === 'admin@u-dry.com';
      const isUserVerified = firebaseUser.emailVerified || isExistingUser || isSuperAdmin || userData?.isManuallyVerified === true;
      
      setIsVerified(isUserVerified);
      
      setIsLoading(false);
    });

    return () => unsubscribeUserDoc();
  }, [firebaseUser, firebaseServices]);
  
  const signUpWithEmail = async ({ name, email, password }: SignUpFormData) => {
    if (!firebaseServices?.auth || !firebaseServices.db) return;
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseServices.auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await sendEmailVerification(userCredential.user);
      toast({ title: translate('auth_success_signup_email') });
    } catch (error: any) {
      toast({ variant: 'destructive', title: translate('auth_error_signup_email_failed'), description: error.message });
      throw error;
    }
  };

  const socialSignIn = async (provider: GoogleAuthProvider | OAuthProvider) => {
    if (!firebaseServices?.auth) {
      throw new Error("Auth service not available.");
    }
    try {
      await signInWithPopup(firebaseServices.auth, provider);
      toast({ title: "Sign In Successful", description: `Welcome!` });
    } catch (error: any) {
      let title = "Sign-in Failed";
      let description = "An unknown error occurred.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        title = "Sign-in Cancelled";
        description = "The sign-in window was closed before completion.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        title = "Account Exists";
        description = "An account with this email already exists. Please sign in with your original method to link your account.";
      }
      
      toast({ variant: 'destructive', title, description });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return socialSignIn(provider);
  };
  
  const signInWithApple = async () => {
    const provider = new OAuthProvider('apple.com');
    return socialSignIn(provider);
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

  const sendVerificationEmail = async () => {
    if (!firebaseServices?.auth.currentUser) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to send a verification email." });
        throw new Error("User not logged in.");
    }
    setIsSendingVerification(true);
    try {
        await sendEmailVerification(firebaseServices.auth.currentUser);
        toast({ title: "Email Sent!", description: "A new verification link has been sent to your email address." });
    } catch (error: any) {
        let message = "An unknown error occurred.";
        if (error.code === 'auth/too-many-requests') {
            message = "You have requested a verification email too many times recently. Please wait a few minutes before trying again."
        }
        toast({ variant: "destructive", title: "Could Not Send Email", description: message });
        throw error;
    } finally {
        setIsSendingVerification(false);
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
    isReady: !isLoading,
    loading: isLoading,
    isVerified,
    activeRental, 
    isLoadingRental: isLoading,
    startRental, endRental, signUpWithEmail,
    signInWithEmail, signOut, changeUserPassword, sendPasswordReset,
    signInWithGoogle,
    signInWithApple,
    sendVerificationEmail,
    addBalance, setDeposit,
    requestDepositRefund,
    useFirstFreeRental, showSignUpSuccess, dismissSignUpSuccess,
    logMachineEvent,
    firebaseServices,
  };

  if (isFirebaseError) {
    return <FirebaseConfigurationError />;
  }

  if (isLoading) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  if (user && !isVerified) {
    return (
      <AuthContext.Provider value={value}>
        <EmailVerificationPrompt 
          onResend={sendVerificationEmail}
          onSignOut={signOut}
          isSending={isSendingVerification}
        />
      </AuthContext.Provider>
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
