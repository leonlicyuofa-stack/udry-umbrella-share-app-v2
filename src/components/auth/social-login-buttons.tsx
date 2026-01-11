
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

  // The main loading state now also includes the initial auth check from the context.
  const isLoading = authLoading || isGoogleLoading || isAppleLoading;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // The redirect will navigate the user away. The page will reload upon their return.
      await signInWithGoogle();
    } catch (error) {
      // The error toast is now handled within the socialSignIn function in the context.
      console.error("Google Sign In failed on page:", error);
      setIsGoogleLoading(false); // Only reset loading state on error, as success navigates away.
    }
  };
  
  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    try {
      await signInWithApple();
    } catch (error) {
      console.error("Apple Sign In failed on page:", error);
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
