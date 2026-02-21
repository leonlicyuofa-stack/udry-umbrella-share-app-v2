// src/components/auth/social-login-buttons.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { Loader2 } from "lucide-react";
import { useState } from "react";

// Google "G" logo — exact brand colors, required by Google guidelines
function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className="h-4 w-4 mr-2 flex-shrink-0"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

// Apple logo — black, per Apple Human Interface Guidelines
function AppleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 814 1000"
      className="h-4 w-4 mr-2 flex-shrink-0"
      fill="currentColor"
    >
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49.2 189.3-49.2 30.2 0 108.2 2.6 168.3 75.4zm-165.9-151.3c30.8-36.7 52.7-87.5 52.7-138.3 0-7.1-.6-14.3-1.9-20.1-49.9 1.9-109.3 33.3-145.4 75.4-28.2 32.4-55.4 83.2-55.4 134.7 0 8.3 1.3 16.6 1.9 19.2 3.2.6 8.4 1.3 13.6 1.3 44.6 0 100.5-29.5 134.5-72.2z" />
    </svg>
  );
}

export function SocialLoginButtons() {
  const { signInWithGoogle, signInWithApple, loading: authLoading } = useAuth();
  const { translate } = useLanguage();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const isLoading = authLoading || isGoogleLoading || isAppleLoading;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google Sign In failed on page:", error);
      setIsGoogleLoading(false);
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
      {/* Google button — white background, coloured G logo per Google brand guidelines */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        {translate('continue_with_google')}
      </Button>

      {/* Apple button — strictly follows Apple HIG:
          black background, white logo, SF Pro font, 8px radius, 44px height */}
      <button
        onClick={handleAppleSignIn}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          height: '44px',
          backgroundColor: '#000000',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 500,
          letterSpacing: '0.3px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
        }}
      >
        {isAppleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'white' }} />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 814 1000"
            style={{ height: '18px', width: '18px', fill: 'white', flexShrink: 0 }}
          >
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49.2 189.3-49.2 30.2 0 108.2 2.6 168.3 75.4zm-165.9-151.3c30.8-36.7 52.7-87.5 52.7-138.3 0-7.1-.6-14.3-1.9-20.1-49.9 1.9-109.3 33.3-145.4 75.4-28.2 32.4-55.4 83.2-55.4 134.7 0 8.3 1.3 16.6 1.9 19.2 3.2.6 8.4 1.3 13.6 1.3 44.6 0 100.5-29.5 134.5-72.2z" />
          </svg>
        )}
        {translate('continue_with_apple')}
      </button>
    </div>
  );
}
