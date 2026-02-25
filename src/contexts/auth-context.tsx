
// src/contexts/auth-context.tsx
"use client";

import type React from 'react';
import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
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
  OAuthProvider,
  signInWithPopup,
  signInWithCredential,
  linkWithPopup,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { initializeFirebaseServices, type FirebaseServices } from '@/lib/firebase';
import type {
  SignUpFormData,
  SignInFormData,
  ChangePasswordFormData,
  User,
  ActiveRental,
} from "@/lib/types";
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, MailCheck, ShieldAlert, LogOut, ArrowRightCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { httpsCallable } from 'firebase/functions';
import { Capacitor } from '@capacitor/core';
import { LinkAccountsDialog } from '@/components/auth/link-accounts-dialog';
import { SocialLogin } from '@capgo/capacitor-social-login';
// --- NONCE HELPERS FOR APPLE SIGN IN ---
function generateNonce(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- GRANDFATHER CLAUSE ---
const GRANDFATHER_CLAUSE_TIMESTAMP = 1732492800000; // Nov 25, 2025

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
  logMachineEvent: (logData: { stallId?: string; type: 'sent' | 'received' | 'info' | 'error'; message: string; }) => Promise<void>;
  firebaseServices: FirebaseServices | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function FirebaseConfigurationError() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-10rem)] p-4">
      <Alert variant="destructive" className="max-w-3xl">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Firebase Configuration Error</AlertTitle>
        <AlertDescription>
          <p className="mb-2">The application could not connect to Firebase services.</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Ensure all Firebase config values are correct in <code>src/lib/firebase.ts</code>.</li>
            <li>Restart the dev server or redeploy after any changes.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}

function EmailVerificationPrompt({
  onResend,
  onSignOut,
  isSending,
}: {
  onResend: () => void;
  onSignOut: () => void;
  isSending: boolean;
}) {
  const { user } = useAuth();
  const { translate } = useLanguage();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <MailCheck className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="mt-4 text-2xl">{translate('verify_email_title')}</CardTitle>
          <CardDescription>
            {translate('verify_email_description', { email: user?.email || 'your email' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>{translate('verify_email_why_title')}</AlertTitle>
            <AlertDescription>
              {translate('verify_email_why_description')}
            </AlertDescription>
          </Alert>
          <p className="text-sm text-center text-muted-foreground">
            {translate('verify_email_instruction')}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={onResend} disabled={isSending} className="w-full sm:w-auto">
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {translate('verify_email_resend_button')}
          </Button>
          <Button onClick={onSignOut} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
            <ArrowRightCircle className="mr-2 h-4 w-4" />
            {translate('verify_email_continue_button')}
          </Button>
          <Button variant="outline" onClick={onSignOut} className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" />
            {translate('sign_out_button')}
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

  // New state for account linking flow
  const [showLinkAccountsDialog, setShowLinkAccountsDialog] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const previousFirestoreUser = useRef<User | null>(null);

  // ── Firebase init & auth listener ──────────────────────────────────────────
  useEffect(() => {
    const services = initializeFirebaseServices();
    if (!services) {
      setIsFirebaseError(true);
      setIsLoading(false);
      return;
    }
    setFirebaseServices(services);

    // Safety timeout — if onAuthStateChanged doesn't fire within 5 seconds
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    const unsubscribeAuth = onAuthStateChanged(services.auth, (user) => {
      clearTimeout(safetyTimeout);
      setFirebaseUser(user);
      if (!user) {
        setFirestoreUser(null);
        setActiveRental(null);
        setIsVerified(false);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      clearTimeout(safetyTimeout);
    };
  }, []);

  // ── Firestore user doc listener ────────────────────────────────────────────
  useEffect(() => {
    if (!firebaseUser || !firebaseServices) return;

    const userDocRef = doc(firebaseServices.db, 'users', firebaseUser.uid);
    const unsubscribeUserDoc = onSnapshot(userDocRef, async (docSnap) => {
      setIsLoading(false);
      if (!docSnap.exists()) {
        // Create user doc if it doesn't exist (first social login)
        const batch = writeBatch(firebaseServices.db);
        const newUserRef = doc(firebaseServices.db, 'users', firebaseUser.uid);
        batch.set(newUserRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || '',
          balance: 0,
          deposit: 0,
          hasHadFirstFreeRental: false,
          createdAt: serverTimestamp(),
        });
        await batch.commit();
        return;
      }

      const userData = docSnap.data() as User;
      setFirestoreUser(userData);
      setActiveRental(userData.activeRental || null);

      // Account linking detection
      if (previousFirestoreUser.current !== null) {
        const prevProviders = previousFirestoreUser.current?.providerData?.map((p: any) => p.providerId) || [];
        const currentProviders = firebaseUser.providerData?.map(p => p.providerId) || [];
        const hasNewProvider = currentProviders.some(p => !prevProviders.includes(p));
        if (!hasNewProvider && currentProviders.length === 1) {
          const providerId = firebaseUser.providerData[0]?.providerId;
          if (providerId === 'password') {
            setShowLinkAccountsDialog(true);
          }
        }
      }
      previousFirestoreUser.current = userData;

      const creationTime = firebaseUser.metadata?.creationTime
        ? new Date(firebaseUser.metadata.creationTime).getTime()
        : 0;
      const isExistingUser = creationTime < GRANDFATHER_CLAUSE_TIMESTAMP;
      const isSuperAdmin = firebaseUser.email === 'admin@u-dry.com';
      const isUserVerified =
        firebaseUser.emailVerified ||
        isExistingUser ||
        isSuperAdmin ||
        userData?.isManuallyVerified === true;

      setIsVerified(isUserVerified);
    });

    return () => unsubscribeUserDoc();
  }, [firebaseUser, firebaseServices]);
  
  // ── Redirect after login / logout ─────────────────────────────────────────
  const previousFirebaseUserRef = useRef<FirebaseUser | null | undefined>(undefined);

  useEffect(() => {
    if (isLoading) return;

    if (previousFirebaseUserRef.current === undefined) {
      // First run after app loads — just record state, never redirect
      previousFirebaseUserRef.current = firebaseUser;
      return;
    }

    const wasLoggedIn = !!previousFirebaseUserRef.current;
    const isNowLoggedIn = !!firebaseUser;
    previousFirebaseUserRef.current = firebaseUser;

    if (!wasLoggedIn && isNowLoggedIn) {
      // Just logged in → always go home
      router.replace('/home');
    } else if (wasLoggedIn && !isNowLoggedIn) {
      // Just logged out → always go to sign in
      router.replace('/auth/signin');
    }
  }, [firebaseUser, isLoading, router]);

  // ── Auth functions ─────────────────────────────────────────────────────────

  const signUpWithEmail = async ({ name, email, password }: SignUpFormData) => {
    if (!firebaseServices?.auth || !firebaseServices.db) return;
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseServices.auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await sendEmailVerification(userCredential.user);
      toast({ title: translate('auth_success_signup_email') });
    } catch (error: any) {
      const description = error.code === 'auth/email-already-in-use'
        ? translate('auth_error_email_already_in_use')
        : error.message;
      toast({ variant: 'destructive', title: translate('auth_error_signup_email_failed'), description });
      throw error;
    }
  };

  const dismissSignUpSuccess = () => setShowSignUpSuccess(false);

  const signInWithEmail = async ({ email, password }: SignInFormData) => {
    if (!firebaseServices?.auth) return Promise.reject(new Error("Auth service not available."));
    return signInWithEmailAndPassword(firebaseServices.auth, email, password);
  };

  const socialSignIn = async (provider: GoogleAuthProvider | OAuthProvider) => {
    if (!firebaseServices?.auth) {
      throw new Error("Auth service not available.");
    }
    try {
      await signInWithPopup(firebaseServices.auth, provider);
    } catch (error: any) {
      console.error("Social sign-in failed:", error);
      if (
        error.code !== 'auth/popup-closed-by-user' &&
        error.code !== 'auth/cancelled-popup-request'
      ) {
        toast({
          variant: "destructive",
          title: "Sign-In Failed",
          description: `Could not complete sign-in. (${error.code})`,
          duration: 9000,
        });
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (!firebaseServices?.auth) throw new Error("Auth not available");
    try {
      if (Capacitor.isNativePlatform()) {
        await SocialLogin.initialize({ google: { iOSClientId: '458603936715-utr4bvdbhek9jb6ob4ul1dl5n3ojltf1.apps.googleusercontent.com' } });
        const result = await SocialLogin.login({ provider: 'google', options: { scopes: ['profile', 'email'] } });
        const idToken = (result.result as any).idToken ?? (result.result as any).authentication?.idToken;
        if (!idToken) throw new Error('No idToken from Google');
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(firebaseServices.auth, credential);
      } else {
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        await socialSignIn(provider);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Sign-In Failed", description: error.message });
    }
  };

  const signInWithApple = async () => {
    if (!firebaseServices?.auth) throw new Error("Auth not available");
    try {
      if (Capacitor.isNativePlatform()) {
        const rawNonce = generateNonce(32);
        const hashedNonce = await sha256(rawNonce);
        await SocialLogin.initialize({ apple: {} });
        const result = await SocialLogin.login({ provider: 'apple', options: { scopes: ['name', 'email'], nonce: hashedNonce } });
        const idToken = (result.result as any).idToken ?? (result.result as any).identityToken;
        if (!idToken) throw new Error('No idToken from Apple');
        const provider = new OAuthProvider('apple.com');
        const credential = provider.credential({ idToken, rawNonce });
        await signInWithCredential(firebaseServices.auth, credential);
      } else {
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        await socialSignIn(provider);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Apple Sign-In Failed", description: error.message });
    }
  };

  const linkAccount = async (provider: GoogleAuthProvider | OAuthProvider) => {
    if (!firebaseServices?.auth.currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be signed in to link an account.' });
      return;
    }
    setIsLinking(true);
    try {
      await linkWithPopup(firebaseServices.auth.currentUser, provider);
      toast({ title: 'Success', description: 'Your account has been successfully linked.' });
      setShowLinkAccountsDialog(false);
    } catch (error: any) {
      let description = 'An unknown error occurred.';
      if (error.code === 'auth/credential-already-in-use') {
        description = 'This social account is already linked to another U-Dry account. Please sign in with that account instead.';
      } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        description = 'The linking process was cancelled.';
      }
      toast({ variant: 'destructive', title: 'Linking Failed', description });
    } finally {
      setIsLinking(false);
    }
  };

  const linkGoogleAccount = async () => {
    const provider = new GoogleAuthProvider();
    await linkAccount(provider);
  };

  const linkAppleAccount = async () => {
    const provider = new OAuthProvider('apple.com');
    await linkAccount(provider);
  };

  const signOut = async () => {
    if (!firebaseServices?.auth) return;
    try {
      await firebaseSignOut(firebaseServices.auth);
      // No toast here — the redirect to /auth/signin is confirmation enough
    } catch (error: any) {
      toast({ variant: 'destructive', title: translate('auth_error_signout_failed'), description: error.message });
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!firebaseServices?.auth) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication service not available.' });
      throw new Error('Auth service not available.');
    }
    try {
      await sendPasswordResetEmail(firebaseServices.auth, email);
      toast({ title: 'Password Reset Email Sent', description: `If an account exists for ${email}, a reset link has been sent.` });
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
        message = "You've requested too many verification emails recently. Please wait a few minutes.";
      }
      toast({ variant: 'destructive', title: 'Error Sending Email', description: message });
      throw error;
    } finally {
      setIsSendingVerification(false);
    }
  };

  const changeUserPassword = async ({ currentPassword, newPassword }: ChangePasswordFormData) => {
    if (!firebaseServices?.auth.currentUser?.email) throw new Error("Not authenticated.");
    const credential = EmailAuthProvider.credential(firebaseServices.auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(firebaseServices.auth.currentUser, credential);
    await updatePassword(firebaseServices.auth.currentUser, newPassword);
    toast({ title: "Password Updated", description: "Your password has been changed successfully." });
  };

  const addBalance = async (amount: number) => {
    if (!firebaseServices || !firebaseUser) throw new Error("Not authenticated.");
    const userDocRef = doc(firebaseServices.db, 'users', firebaseUser.uid);
    await updateDoc(userDocRef, { balance: increment(amount) });
  };

  const setDeposit = async () => {
    if (!firebaseServices || !firebaseUser) throw new Error("Not authenticated.");
    const userDocRef = doc(firebaseServices.db, 'users', firebaseUser.uid);
    await updateDoc(userDocRef, { deposit: 100 });
  };

  const requestDepositRefund = async () => {
    if (!firebaseServices?.functions) throw new Error("Functions not available.");
    const refundFn = httpsCallable(firebaseServices.functions, 'requestDepositRefund');
    await refundFn();
  };

  const useFirstFreeRental = async () => {
    if (!firebaseServices || !firebaseUser) throw new Error("Not authenticated.");
    const userDocRef = doc(firebaseServices.db, 'users', firebaseUser.uid);
    await updateDoc(userDocRef, { hasHadFirstFreeRental: true });
  };

  const startRental = async (rental: Omit<ActiveRental, 'logs'>) => {
    if (!firebaseServices || !firebaseUser) throw new Error("Not authenticated.");
    const userDocRef = doc(firebaseServices.db, 'users', firebaseUser.uid);
    await updateDoc(userDocRef, { activeRental: { ...rental, logs: [] } });
  };

  const endRental = async (returnedToStallId: string) => {
    if (!firebaseServices || !firebaseUser || !activeRental) throw new Error("No active rental.");
    const endRentalFn = httpsCallable(firebaseServices.functions, 'endRentalTransaction');
    await endRentalFn({ returnedToStallId, activeRentalData: activeRental });
  };

  const logMachineEvent = async ({
    stallId,
    type,
    message,
  }: {
    stallId?: string;
    type: 'sent' | 'received' | 'info' | 'error';
    message: string;
  }) => {
    if (!firebaseServices || !firebaseUser) return;
    const userDocRef = doc(firebaseServices.db, 'users', firebaseUser.uid);
    const newLog = { type, message, timestamp: Date.now() };
    if (activeRental) {
      await updateDoc(userDocRef, { 'activeRental.logs': arrayUnion(newLog) });
    }
  };

  // ── Derived user object ────────────────────────────────────────────────────
  const user: User | null = firebaseUser
    ? { ...firebaseUser, ...firestoreUser, uid: firebaseUser.uid }
    : null;

  const value: AuthContextType = {
    user,
    isReady: !isLoading,
    loading: isLoading,
    isVerified,
    activeRental,
    isLoadingRental: isLoading,
    startRental,
    endRental,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
    changeUserPassword,
    sendPasswordReset,
    sendVerificationEmail,
    addBalance,
    setDeposit,
    requestDepositRefund,
    useFirstFreeRental,
    showSignUpSuccess,
    dismissSignUpSuccess,
    logMachineEvent,
    firebaseServices,
  };

  if (isFirebaseError) return <FirebaseConfigurationError />;

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (user && !isVerified && firestoreUser !== null) {
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
      <LinkAccountsDialog
        isOpen={showLinkAccountsDialog}
        onOpenChange={setShowLinkAccountsDialog}
        onLinkGoogle={linkGoogleAccount}
        onLinkApple={linkAppleAccount}
        isLinking={isLinking}
      />
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
