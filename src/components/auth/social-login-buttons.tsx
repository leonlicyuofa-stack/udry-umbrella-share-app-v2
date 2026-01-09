// src/components/auth/social-login-buttons.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { Loader2 } from "lucide-react";

// Inline SVG for Google Icon
const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
    <path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C43.021 36.251 46 30.655 46 24c0-1.341-.138-2.65-.389-3.917z"></path>
  </svg>
);

// Inline SVG for Apple Icon
const AppleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
    <path fill="currentColor" d="M16.213 16.221c.361.504.628 1.154.782 1.905a.78.78 0 0 1-.782.884c-.168 0-.343-.013-.526-.026a4.234 4.234 0 0 1-1.46-.354c-.662-.26-1.28-.532-1.93-.532s-1.25.272-1.892.532a4.873 4.873 0 0 1-1.472.354c-.184.013-.36.026-.527.026a.78.78 0 0 1-.782-.884c.154-.751.42-1.401.782-1.905.36-.504.793-.972 1.28-1.347a5.53 5.53 0 0 0-2.31-4.328c-.812-1.265-.116-2.98.927-3.79a3.81 3.81 0 0 1 2.38-.632c.644 0 1.288.26 1.83.518.542.26 1.14.519 1.768.519.628 0 1.226-.26 1.768-.519a4.02 4.02 0 0 1 1.83-.518c1.026 0 2.053.48 2.65 1.373-.014 0-.48 1.054-1.374 2.227a5.53 5.53 0 0 0-2.31 4.328c.486.375.92.843 1.28 1.347zM14.6 4.19c.732-1.112 1.3-2.348 1.093-3.69-1.026.066-2.12.72-2.852 1.83z"></path>
  </svg>
);

export function SocialLoginButtons() {
  const { loading: authLoading } = useAuth();
  const { translate } = useLanguage();

  // For Step 1, these buttons are intentionally non-functional.
  const handleGoogleSignIn = () => console.log("Google Sign In clicked - logic not implemented yet.");
  const handleAppleSignIn = () => console.log("Apple Sign In clicked - logic not implemented yet.");

  const isLoading = authLoading;

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={true} // Disabled for Step 1
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        {translate('continue_with_google')}
      </Button>
      <Button
        variant="outline"
        className="w-full"
        onClick={handleAppleSignIn}
        disabled={true} // Disabled for Step 1
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <AppleIcon />
        )}
        {translate('continue_with_apple')}
      </Button>
    </div>
  );
}
