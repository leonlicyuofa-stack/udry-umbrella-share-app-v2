// src/components/auth/social-login-buttons.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { Loader2 } from "lucide-react";

// The icon components have been removed as requested.

export function SocialLoginButtons() {
  const { loading: authLoading } = useAuth();
  const { translate } = useLanguage();

  // For now, these buttons are non-functional as per our plan.
  const handleGoogleSignIn = () => console.log("Google Sign In clicked - logic to be implemented in Step 2.");
  const handleAppleSignIn = () => console.log("Apple Sign In clicked - logic to be implemented in Step 2.");

  const isLoading = authLoading;

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={true}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Continue with Google
      </Button>
      <Button
        variant="outline"
        className="w-full"
        onClick={handleAppleSignIn}
        disabled={true}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Continue with Apple
      </Button>
    </div>
  );
}
