// src/components/auth/social-login-buttons.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function SocialLoginButtons() {
  const { signInWithGoogle, signInWithApple, loading: authLoading } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const isLoading = authLoading || isGoogleLoading || isAppleLoading;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      // On success, the AuthProvider's onAuthStateChanged handles the redirect.
    } catch (error) {
      // Error is handled by a toast in the socialSignIn function.
      console.error("Google Sign In failed on page:", error);
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    try {
      await signInWithApple();
    } catch (error) {
      console.error("Apple Sign In failed on page:", error);
    } finally {
      setIsAppleLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Continue with Google
      </Button>
      <Button
        variant="outline"
        className="w-full"
        onClick={handleAppleSignIn}
        disabled={isLoading}
      >
        {isAppleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Continue with Apple
      </Button>
    </div>
  );
}

    